import React, { useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Workspace, Lead } from '../../types';
import { BoardColumnWithPagination } from './BoardColumnWithPagination';
import { LeadCard } from './LeadCard';
import { workspaceService } from '../../services/workspaceService';
import { handleApiError } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface KanbanBoardProps {
  workspace: Workspace;
  onUpdateWorkspace: (updatedWorkspace: Workspace) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  workspace,
  onUpdateWorkspace,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isMovingLead, setIsMovingLead] = useState(false);
  const [tempWorkspace, setTempWorkspace] = useState<Workspace | null>(null);
  const [movingLeadId, setMovingLeadId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Board'larni refetch qilish uchun ref'lar
  const boardRefs = useRef<{ [key: string]: { refetch: () => void } }>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find the active lead
    const lead = findLeadById(active.id as string);
    setActiveLead(lead);
    
    console.log('TEST: Drag start - lead:', lead?.name);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('TEST: DragOver - activeId:', activeId, 'overId:', overId);

    // Lead'ni qaysi board'da ekanligini aniqlash - asosiy workspace'dan
    const activeBoard = findBoardByLeadIdFromWorkspace(activeId, workspace);
    
    // Over element board yoki lead ekanligini aniqlash
    let overBoard = findBoardByIdFromWorkspace(overId, workspace);
    if (!overBoard) {
      // Agar overId board emas bo'lsa, u lead bo'lishi mumkin
      const overLeadBoard = findBoardByLeadIdFromWorkspace(overId, workspace);
      if (overLeadBoard) {
        overBoard = overLeadBoard;
      }
    }

    console.log('TEST: DragOver - activeBoard:', activeBoard?.name, 'overBoard:', overBoard?.name);

    if (!activeBoard || !overBoard || activeBoard.id === overBoard.id) {
      console.log('TEST: DragOver - Skipping (same board or not found)');
      return;
    }

    // Temporary workspace yaratish - tempWorkspace yoki workspace'dan boshlash
    const currentWorkspace = tempWorkspace || workspace;
    const updatedWorkspace = { ...currentWorkspace };
    const activeBoardIndex = updatedWorkspace.boards.findIndex(b => b.id === activeBoard.id);
    const overBoardIndex = updatedWorkspace.boards.findIndex(b => b.id === overBoard.id);

    if (activeBoardIndex === -1 || overBoardIndex === -1) {
      return;
    }

    const activeLead = activeBoard.leads.find(l => l.id === activeId);
    if (!activeLead) {
      return;
    }

    // Remove lead from active board
    updatedWorkspace.boards[activeBoardIndex].leads = activeBoard.leads.filter(
      l => l.id !== activeId
    );

    // Add lead to over board
    updatedWorkspace.boards[overBoardIndex].leads = [
      ...overBoard.leads,
      { ...activeLead, sortOrder: overBoard.leads.length }
    ];

    // Temporary workspace'ni saqlash
    setTempWorkspace(updatedWorkspace);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);

    console.log('TEST: Drag end - active:', active.id, 'over:', over?.id);

    if (!over) {
      setTempWorkspace(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Over element board yoki lead ekanligini aniqlash - asosiy workspace'dan
    let overBoard = findBoardByIdFromWorkspace(overId, workspace);
    if (!overBoard) {
      const overLeadBoard = findBoardByLeadIdFromWorkspace(overId, workspace);
      if (overLeadBoard) {
        overBoard = overLeadBoard;
      }
    }

    // Active board'ni topish - tempWorkspace mavjud bo'lsa, asosiy workspace'dan olish
    let activeBoard;
    if (tempWorkspace) {
      // tempWorkspace mavjud bo'lsa, lead'ning asl joylashuvini aniqlash uchun
      // asosiy workspace'dan qidiramiz, chunki tempWorkspace'da lead allaqachon ko'chirilgan
      activeBoard = findBoardByLeadIdFromWorkspace(activeId, workspace);
      console.log('TEST: tempWorkspace mavjud, asosiy workspace\'dan activeBoard qidirildi:', activeBoard?.name);
    } else {
      // tempWorkspace yo'q bo'lsa, currentWorkspace'dan qidiramiz
      activeBoard = findBoardByLeadId(activeId);
      console.log('TEST: tempWorkspace yo\'q, currentWorkspace\'dan activeBoard qidirildi:', activeBoard?.name);
    }

    console.log('TEST: Found boards - active:', activeBoard?.name, 'over:', overBoard?.name);
    console.log('TEST: Board IDs - active:', activeBoard?.id, 'over:', overBoard?.id);
    console.log('TEST: tempWorkspace exists:', !!tempWorkspace);

    if (!activeBoard || !overBoard) {
      console.log('TEST: Board not found');
      setTempWorkspace(null);
      return;
    }

    // Agar lead boshqa board'ga ko'chirilgan bo'lsa
    if (activeBoard.id !== overBoard.id) {
      console.log('TEST: Moving between boards - from:', activeBoard.name, 'to:', overBoard.name);
      
      // Temporary workspace'ni asosiy workspace'ga o'tkazish
      if (tempWorkspace) {
        onUpdateWorkspace(tempWorkspace);
      }
      
      // Lead'ni ko'chirish
      await handleMoveLeadBetweenBoards(activeId, activeBoard.id, overBoard.id);
      setTempWorkspace(null);
      return;
    }

    // Agar lead o'z board'ida joylashuvi o'zgartirilgan bo'lsa
    console.log('TEST: Moving within same board');
    const currentWorkspace = tempWorkspace || workspace;
    const updatedWorkspace = { ...currentWorkspace };
    const boardIndex = updatedWorkspace.boards.findIndex(b => b.id === activeBoard.id);
    
    const oldIndex = activeBoard.leads.findIndex(l => l.id === activeId);
    const newIndex = activeBoard.leads.findIndex(l => l.id === overId);

    if (oldIndex !== newIndex) {
      updatedWorkspace.boards[boardIndex].leads = arrayMove(
        activeBoard.leads,
        oldIndex,
        newIndex
      ).map((lead, index) => ({ ...lead, sortOrder: index }));

      onUpdateWorkspace(updatedWorkspace);
      
      // API orqali sortOrder'ni yangilash
      try {
        await workspaceService.moveLead(activeId, overBoard.id, newIndex, oldIndex);
      } catch (error) {
        const apiError = handleApiError(error);
        toast.error(apiError.message);
      }
    }

    setTempWorkspace(null);
  };

  const handleMoveLeadBetweenBoards = async (
    leadId: string,
    oldBoardId: string,
    newBoardId: string
  ) => {
    if (isMovingLead) return;
    
    setIsMovingLead(true);
    setMovingLeadId(leadId);
    
    try {
      // tempWorkspace yoki asosiy workspace'dan ma'lumotlarni olish
      const currentWorkspace = tempWorkspace || workspace;
      const newBoard = currentWorkspace.boards.find(b => b.id === newBoardId);
      const oldBoard = currentWorkspace.boards.find(b => b.id === oldBoardId);
      const lead = currentWorkspace.boards
        .flatMap(board => board.leads)
        .find(l => l.id === leadId);

      if (!newBoard || !oldBoard || !lead) {
        return;
      }

      const newSortOrder = newBoard.leads.length;
      const oldSortOrder = oldBoard.leads.findIndex(l => l.id === leadId) || 0;

      // Lead ko'chirish log'i
      console.log(`🚀 Lead "${lead.name}" ko'chirilmoqda: ${oldBoard.name} → ${newBoard.name}`);

      // API orqali lead'ni ko'chirish
      console.log('📡 PUT request yuborilmoqda...');
      await workspaceService.moveLead(leadId, newBoardId, newSortOrder, oldSortOrder);
      console.log('✅ PUT request muvaffaqiyatli bajarildi!');
      
      toast.success('Lead muvaffaqiyatli ko\'chirildi!');

      // Board'larni avtomatik refetch qilish - yangilangan metod
      console.log('🔄 Board\'larni yangilash boshlandi...');
      console.log('📋 refetchBoardsWithAPI chaqirilmoqda...');
      try {
        await refetchBoardsWithAPI(oldBoardId, newBoardId);
        console.log('✅ refetchBoardsWithAPI muvaffaqiyatli bajarildi!');
      } catch (error) {
        console.error('❌ refetchBoardsWithAPI xatoligi:', error);
      }
      
      // Temporary workspace'ni tozalash
      setTempWorkspace(null);
      
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
      
      // Temporary workspace'ni tozalash
      setTempWorkspace(null);
    } finally {
      setIsMovingLead(false);
      setMovingLeadId(null);
    }
  };

  // Board'larni API orqali yangilash funksiyasi - yangi metod
  const refetchBoardsWithAPI = async (oldBoardId: string, newBoardId: string) => {
    try {
      console.log('🔄 PUT request dan keyin board\'larni yangilash:', oldBoardId, '→', newBoardId);
      console.log('📋 refetchBoardsWithAPI funksiyasi boshlandi...');
      
      // API orqali board'larni yangilash - qo'shimcha API murojaat
      console.log('📡 API orqali board\'larni yangilash boshlandi...');
      
      const promises = [];
      
      // Eski board'ni API orqali yangilash
      console.log('📡 Eski board API murojaat:', oldBoardId);
      promises.push(
        workspaceService.getLeadsByBoardInfinite(oldBoardId, 1, 10)
      );
      
      // Yangi board'ni API orqali yangilash
      console.log('📡 Yangi board API murojaat:', newBoardId);
      promises.push(
        workspaceService.getLeadsByBoardInfinite(newBoardId, 1, 10)
      );

      console.log('📡 API murojaatlar yuborilmoqda...');
      const [oldBoardData, newBoardData] = await Promise.all(promises);
      
      console.log('📊 Eski board ma\'lumotlari:', oldBoardData);
      console.log('📊 Yangi board ma\'lumotlari:', newBoardData);
      console.log('✅ API orqali board\'lar yangilandi!');
      
      // Board'larni avtomatik refetch qilish (refresh button'lar avtomatik ishlaydi)
      if (boardRefs.current[oldBoardId]) {
        console.log('🔄 Eski board refresh button avtomatik ishlaydi:', oldBoardId);
        boardRefs.current[oldBoardId].refetch();
      }
      
      if (boardRefs.current[newBoardId]) {
        console.log('🔄 Yangi board refresh button avtomatik ishlaydi:', newBoardId);
        boardRefs.current[newBoardId].refetch();
      }

      // Infinite query uchun to'g'ri cache yangilash
      // Eski board'ni invalidate qilish
      await queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.LEADS_INFINITE(workspace.id, oldBoardId),
        exact: true
      });
      
      // Yangi board'ni invalidate qilish
      await queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.LEADS_INFINITE(workspace.id, newBoardId),
        exact: true
      });

      console.log('✅ Board\'lar muvaffaqiyatli yangilandi!');
      console.log('🔄 UI invalidate qilindi');
      
    } catch (error) {
      console.error('❌ Board\'larni yangilashda xatolik:', error);
    }
  };

  const findLeadById = (id: string): Lead | null => {
    const currentWorkspace = tempWorkspace || workspace;
    
    for (const board of currentWorkspace.boards) {
      const lead = board.leads.find(l => l.id === id);
      if (lead) {
        return lead;
      }
    }
    return null;
  };

  const findBoardByLeadId = (leadId: string) => {
    const currentWorkspace = tempWorkspace || workspace;
    
    for (const board of currentWorkspace.boards) {
      const hasLead = board.leads.some(lead => lead.id === leadId);
      if (hasLead) {
        return board;
      }
    }
    return null;
  };

  const findBoardById = (boardId: string) => {
    const currentWorkspace = tempWorkspace || workspace;
    
    const board = currentWorkspace.boards.find(board => board.id === boardId);
    return board;
  };

  // Asosiy workspace'dan board'ni topish
  const findBoardByIdFromWorkspace = (boardId: string, targetWorkspace: Workspace) => {
    const board = targetWorkspace.boards.find(board => board.id === boardId);
    return board;
  };

  // Asosiy workspace'dan lead bo'yicha board'ni topish
  const findBoardByLeadIdFromWorkspace = (leadId: string, targetWorkspace: Workspace) => {
    for (const board of targetWorkspace.boards) {
      const hasLead = board.leads.some(lead => lead.id === leadId);
      if (hasLead) {
        return board;
      }
    }
    return null;
  };

  // Temporary workspace yoki asosiy workspace'ni ishlatish
  const currentWorkspace = tempWorkspace || workspace;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-200px)]">
        {currentWorkspace.boards.map((board) => (
          <div key={board.id} className="w-80 flex-shrink-0 h-full">
            <BoardColumnWithPagination 
              board={board} 
              workspaceId={currentWorkspace.id}
              isMovingLead={isMovingLead}
              movingLeadId={movingLeadId}
              onRefetch={(refetch) => {
                boardRefs.current[board.id] = { refetch };
              }}
            />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeId && activeLead ? (
          <LeadCard lead={activeLead} />
        ) : null}
      </DragOverlay>

      {/* Global Loading Overlay */}
      {isMovingLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <LoadingSpinner size="md" />
            <span className="text-lg font-medium">Lead ko'chirilmoqda...</span>
          </div>
        </div>
      )}
    </DndContext>
  );
};