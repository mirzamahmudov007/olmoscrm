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
  rectIntersection,
  MeasuringStrategy,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Workspace, Lead } from '../../types';
import { BoardColumnWithPagination } from './BoardColumnWithPagination';
import { LeadCard } from './LeadCard';
import { EditBoardModal } from '../modals/EditBoardModal';
import { EditLeadModal } from '../modals/EditLeadModal';
import { DeleteLeadModal } from '../modals/DeleteLeadModal';
import { workspaceService } from '../../services/workspaceService';
import { handleApiError } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface KanbanBoardProps {
  workspace: Workspace;
  onUpdateWorkspace: (updatedWorkspace: Workspace) => void;
  onOpenCreateLeadModal?: (boardId: string) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  workspace,
  onUpdateWorkspace,
  onOpenCreateLeadModal,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [tempWorkspace, setTempWorkspace] = useState<Workspace | null>(null);
  const [affectedBoardIds, setAffectedBoardIds] = useState<string[]>([]);
  const [overBoardId, setOverBoardId] = useState<string | null>(null);
  
  // Optimistic updates uchun yangi state'lar
  const [optimisticUpdates, setOptimisticUpdates] = useState<{
    [boardId: string]: {
      leads: Lead[];
      isUpdating: boolean;
      timestamp: number;
    }
  }>({});
  
  // Modal states
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [showDeleteBoardModal, setShowDeleteBoardModal] = useState(false);
  const [showEditLeadModal, setShowEditLeadModal] = useState(false);
  const [showDeleteLeadModal, setShowDeleteLeadModal] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<any>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const queryClient = useQueryClient();
  
  // Board'larni refetch qilish va leads'ni olish uchun ref'lar
  const boardRefs = useRef<{ [key: string]: { refetch: () => void; getLeads: () => Lead[] } }>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Kamroq masofa
        tolerance: 5, // Optimal tolerantlik
        delay: 50, // 50ms delay
      },
    })
  );

  // Optimistic update'ni tozalash
  const clearOptimisticUpdate = (boardId: string) => {
    setOptimisticUpdates(prev => {
      const newUpdates = { ...prev };
      delete newUpdates[boardId];
      return newUpdates;
    });
  };

  // Optimistic update'ni qo'shish
  const addOptimisticUpdate = (boardId: string, leads: Lead[]) => {
    setOptimisticUpdates(prev => ({
      ...prev,
      [boardId]: {
        leads,
        isUpdating: true,
        timestamp: Date.now()
      }
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = active.id as string;
    setActiveId(activeId);

    console.log('🚀 Drag start - activeId:', activeId);

    // Find the active lead
    const lead = findLeadById(activeId);
    setActiveLead(lead);
    
    if (lead) {
      console.log('✅ Drag start - lead found:', lead.name);
    } else {
      console.log('❌ Drag start - lead not found for activeId:', activeId);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) {
      setOverBoardId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    console.log('TEST: DragOver - activeId:', activeId, 'overId:', overId);

    // Lead'ni qaysi board'da ekanligini aniqlash - asosiy workspace'dan
    const activeBoard = findBoardByLeadIdFromWorkspace(activeId, workspace);
    
    // Over element board yoki lead ekanligini aniqlash
    let overBoard = findBoardByIdFromWorkspace(overId, workspace);
    let isOverBoard = true; // overId board ID ekanligini belgilash
    
    if (!overBoard) {
      // Agar overId board emas bo'lsa, u lead bo'lishi mumkin
      const overLeadBoard = findBoardByLeadIdFromWorkspace(overId, workspace);
      if (overLeadBoard) {
        overBoard = overLeadBoard;
        isOverBoard = false; // overId lead ID ekanligini belgilash
      }
    }
    
    // overBoardId'ni yangilash
    if (overBoard) {
      setOverBoardId(overBoard.id);
    } else {
      setOverBoardId(null);
    }

    console.log('TEST: DragOver - activeBoard:', activeBoard?.name, 'overBoard:', overBoard?.name, 'isOverBoard:', isOverBoard);

    if (!activeBoard || !overBoard) {
      console.log('TEST: DragOver - Board not found');
      return;
    }
    
    // Agar lead o'z board'ida bo'lsa va overId ham lead bo'lsa, skip qilish
    if (activeBoard.id === overBoard.id && !isOverBoard) {
      console.log('TEST: DragOver - Same board, same lead, skipping');
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

    // BoardRefs'dan leads'ni olish
    const activeBoardRef = boardRefs.current[activeBoard.id];
    const overBoardRef = boardRefs.current[overBoard.id];

    if (!activeBoardRef || !overBoardRef) {
      console.log('TEST: Board refs not found');
      return;
    }

    const activeBoardLeads = activeBoardRef.getLeads();
    const overBoardLeads = overBoardRef.getLeads();

    console.log('TEST: Current boards found:', {
      activeBoard: activeBoard.name,
      overBoard: overBoard.name,
      activeBoardLeads: activeBoardLeads.length,
      overBoardLeads: overBoardLeads.length,
      isOverBoard
    });

    const activeLead = activeBoardLeads.find(l => l.id === activeId);
    if (!activeLead) {
      console.log('TEST: Active lead not found in activeBoard');
      return;
    }

    console.log('TEST: Active lead found:', activeLead.name);

    // Remove lead from active board
    updatedWorkspace.boards[activeBoardIndex].leads = activeBoardLeads.filter(
      (l: any) => l.id !== activeId
    );

    // Add lead to over board
    const newSortOrder = overBoardLeads.length;
    updatedWorkspace.boards[overBoardIndex].leads = [
      ...overBoardLeads,
      { ...activeLead, sortOrder: newSortOrder }
    ];

    console.log('🔄 Temporary workspace updated - lead moved from', activeBoard.name, 'to', overBoard.name);
    
    console.log('TEST: Lead operation completed:', {
      removedFrom: activeBoard.name,
      addedTo: overBoard.name,
      newSortOrder,
      isOverBoard
    });

    console.log('TEST: Lead moved in tempWorkspace:', {
      from: activeBoard.name,
      to: overBoard.name,
      newSortOrder,
      overBoardNewLeadsCount: updatedWorkspace.boards[overBoardIndex]?.leads?.length || 0,
      isOverBoard
    });

    // Temporary workspace'ni saqlash
    setTempWorkspace(updatedWorkspace);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);
    setOverBoardId(null); // Drag tugaganda overBoardId'ni tozalash

    console.log('TEST: Drag end - active:', active.id, 'over:', over?.id);

    if (!over) {
      setTempWorkspace(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Active board'ni aniqlash - tempWorkspace'da lead allaqachon ko'chirilgan bo'lishi mumkin
    let activeBoard = findBoardByLeadIdFromWorkspace(activeId, workspace);
    
    // Agar asosiy workspace'da topilmasa, tempWorkspace'dan qidirish
    if (!activeBoard && tempWorkspace) {
      activeBoard = findBoardByLeadIdFromWorkspace(activeId, tempWorkspace);
    }
    
    // MUHIM: Agar tempWorkspace mavjud bo'lsa, activeBoard'ni tempWorkspace'dan olish kerak
    // chunki lead allaqachon ko'chirilgan bo'lishi mumkin
    if (tempWorkspace) {
      const tempActiveBoard = findBoardByLeadIdFromWorkspace(activeId, tempWorkspace);
      if (tempActiveBoard) {
        activeBoard = tempActiveBoard;
        console.log('TEST: Active board updated from tempWorkspace:', tempActiveBoard.name);
      }
    }
    
    // Debug uchun log
    console.log('TEST: Active board search:', {
      activeId,
      foundInWorkspace: !!findBoardByLeadIdFromWorkspace(activeId, workspace),
      foundInTempWorkspace: tempWorkspace ? !!findBoardByLeadIdFromWorkspace(activeId, tempWorkspace) : false,
      activeBoardName: activeBoard?.name,
      tempWorkspaceExists: !!tempWorkspace
    });
    
    // Over board'ni tempWorkspace yoki asosiy workspace'dan topish
    const currentWorkspace = tempWorkspace || workspace;
    let overBoard = findBoardByIdFromWorkspace(overId, currentWorkspace);
    let isOverBoard = true; // overId board ID ekanligini belgilash
    
    if (!overBoard) {
      const overLeadBoard = findBoardByLeadIdFromWorkspace(overId, currentWorkspace);
      if (overLeadBoard) {
        overBoard = overLeadBoard;
        isOverBoard = false; // overId lead ID ekanligini belgilash
      }
    }
    
    console.log('TEST: Over board found:', {
      overId,
      overBoardName: overBoard?.name,
      overBoardLeadsCount: overBoard?.leads?.length || 0,
      isOverBoard
    });
    
    // Debug uchun log
    console.log('TEST: Over board search:', {
      overId,
      foundAsBoard: !!findBoardByIdFromWorkspace(overId, currentWorkspace),
      foundAsLead: !!findBoardByLeadIdFromWorkspace(overId, currentWorkspace),
      overBoardName: overBoard?.name,
      currentWorkspaceType: tempWorkspace ? 'tempWorkspace' : 'workspace',
      isOverBoard
    });

    console.log('TEST: Found boards - active:', activeBoard?.name, 'over:', overBoard?.name);
    console.log('TEST: Board IDs - active:', activeBoard?.id, 'over:', overBoard?.id);
    console.log('TEST: tempWorkspace exists:', !!tempWorkspace);
    console.log('TEST: Board comparison - activeBoard.id !== overBoard.id:', activeBoard?.id !== overBoard?.id);
    console.log('TEST: isOverBoard:', isOverBoard);

    if (!activeBoard || !overBoard) {
      console.log('TEST: Board not found - activeBoard:', !!activeBoard, 'overBoard:', !!overBoard);
      setTempWorkspace(null);
      return;
    }

        // Agar lead boshqa board'ga ko'chirilgan bo'lsa
    if (activeBoard.id !== overBoard.id) {
      console.log('TEST: Moving between boards - from:', activeBoard.name, 'to:', overBoard.name);
      console.log('TEST: Board IDs comparison:', { activeBoardId: activeBoard.id, overBoardId: overBoard.id });
      console.log('TEST: Will call handleMoveLeadBetweenBoards');
      
      // Drop position'ni hisoblash
      const dropPosition = !isOverBoard ? 0 : 0; // Hozircha faqat oxiriga qo'yish
      
      // Lead'ni ko'chirish
      console.log('TEST: About to call handleMoveLeadBetweenBoards with:', {
        leadId: activeId,
        oldBoardId: activeBoard.id,
        newBoardId: overBoard.id,
        dropPosition
      });
      await handleMoveLeadBetweenBoards(activeId, activeBoard.id, overBoard.id, dropPosition);
      setTempWorkspace(null);
      return;
    }
    
    // Agar overId board ID bo'lsa va lead o'z board'ida bo'lsa, uni board'ga ko'chirish
    if (isOverBoard && activeBoard.id === overBoard.id) {
      console.log('TEST: Dropping lead onto board - from:', activeBoard.name, 'to:', overBoard.name);
      
      // Lead'ni ko'chirish (o'z board'iga)
      console.log('TEST: About to call handleMoveLeadBetweenBoards for same board with:', {
        leadId: activeId,
        oldBoardId: activeBoard.id,
        newBoardId: overBoard.id
      });
      await handleMoveLeadBetweenBoards(activeId, activeBoard.id, overBoard.id);
      setTempWorkspace(null);
      return;
    }
    
    // Agar overId lead ID bo'lsa va lead boshqa board'ga ko'chirilgan bo'lsa
    if (!isOverBoard && activeBoard.id !== overBoard.id) {
      console.log('TEST: Dropping lead onto another lead in different board - from:', activeBoard.name, 'to:', overBoard.name);
      
      // Drop position'ni hisoblash - lead ustiga tushgan
      const dropPosition = 0; // Lead ustiga tushgan, shuning uchun 0 position
      
      // Lead'ni ko'chirish
      console.log('TEST: About to call handleMoveLeadBetweenBoards for lead-to-lead with:', {
        leadId: activeId,
        oldBoardId: activeBoard.id,
        newBoardId: overBoard.id,
        dropPosition
      });
      await handleMoveLeadBetweenBoards(activeId, activeBoard.id, overBoard.id, dropPosition);
      setTempWorkspace(null);
      return;
    }
    
    // Agar overId lead ID bo'lsa va lead o'z board'ida bo'lsa, lekin boshqa lead'ning ustiga tashlangan bo'lsa
    if (!isOverBoard && activeBoard.id === overBoard.id) {
      console.log('TEST: Dropping lead onto another lead in same board - from:', activeBoard.name, 'to:', overBoard.name);
      
      // Temporary workspace'ni asosiy workspace'ga o'tkazish
      if (tempWorkspace) {
        onUpdateWorkspace(tempWorkspace);
      }
      
      // Lead'ni ko'chirish (o'z board'iga)
      console.log('TEST: About to call handleMoveLeadBetweenBoards for same board lead-to-lead with:', {
        leadId: activeId,
        oldBoardId: activeBoard.id,
        newBoardId: overBoard.id
      });
      await handleMoveLeadBetweenBoards(activeId, activeBoard.id, overBoard.id);
      setTempWorkspace(null);
      return;
    }

    // Agar lead o'z board'ida joylashuvi o'zgartirilgan bo'lsa
    console.log('TEST: Moving within same board');
    console.log('TEST: Same board check - activeBoard:', activeBoard.name, 'overBoard:', overBoard.name);
    console.log('TEST: This should not happen for different boards');
    console.log('TEST: isOverBoard:', isOverBoard);
    console.log('TEST: This case is for same board position changes only');
    console.log('TEST: This should only happen when no other conditions are met');
    
    const updatedWorkspace = { ...currentWorkspace };
    const boardIndex = updatedWorkspace.boards.findIndex(b => b.id === activeBoard.id);
    
    // currentWorkspace'dan board'ni olish
    const currentBoard = currentWorkspace.boards.find(b => b.id === activeBoard.id);
    if (!currentBoard) {
      console.log('TEST: Current board not found');
      setTempWorkspace(null);
      return;
    }
    
    const oldIndex = currentBoard.leads?.findIndex(l => l.id === activeId) || -1;
    const newIndex = isOverBoard ? -1 : (currentBoard.leads?.findIndex(l => l.id === overId) || -1);

    console.log('TEST: Index calculation:', { oldIndex, newIndex, activeId, overId, isOverBoard });
    console.log('TEST: This should only happen for same board position changes');

    if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1 && (currentBoard.leads || []).length > 0) {
      console.log('TEST: Moving lead within same board - oldIndex:', oldIndex, 'newIndex:', newIndex);
      
      updatedWorkspace.boards[boardIndex].leads = arrayMove(
        currentBoard.leads || [],
        oldIndex,
        newIndex
      ).map((lead, index) => ({ ...lead, sortOrder: index }));

      onUpdateWorkspace(updatedWorkspace);
      
      // API orqali sortOrder'ni yangilash
      try {
        await workspaceService.moveLead(activeId, overBoard.id, newIndex, oldIndex);
        
        // Faqat joriy board uchun invalidate
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.LEADS_INFINITE(workspace.id, overBoard.id),
          exact: true,
          refetchType: 'all'
        });
      } catch (error) {
        const apiError = handleApiError(error);
        toast.error(apiError.message);
      }
    } else {
      console.log('TEST: No position change or lead not found in board');
      console.log('TEST: oldIndex:', oldIndex, 'newIndex:', newIndex);
      console.log('TEST: isOverBoard:', isOverBoard);
      console.log('TEST: This case should not happen for cross-board moves');
    }

    setTempWorkspace(null);
  };

  const handleMoveLeadBetweenBoards = async (
    leadId: string,
    oldBoardId: string,
    newBoardId: string,
    dropPosition?: number
  ) => {
    console.log('TEST: handleMoveLeadBetweenBoards called with:', { leadId, oldBoardId, newBoardId });
    
    // Optimistic updates uchun state'lar
    setAffectedBoardIds([oldBoardId, newBoardId]);
    
    try {
      console.log('TEST: Starting API call preparation');
      
      // MUHIM: Ma'lumotlarni asosiy workspace'dan olish
      if (!workspace || !workspace.boards) {
        console.log('TEST: Workspace or workspace.boards is undefined');
        return;
      }
      
      const oldBoard = workspace.boards.find(b => b.id === oldBoardId);
      const newBoard = workspace.boards.find(b => b.id === newBoardId);
      
      // BoardRefs'dan lead'ni qidirish
      let lead = null;
      for (const boardId in boardRefs.current) {
        const boardRef = boardRefs.current[boardId];
        if (boardRef && boardRef.getLeads) {
          const leads = boardRef.getLeads();
          const foundLead = leads.find((l: any) => l.id === leadId);
          if (foundLead) {
            lead = foundLead;
            break;
          }
        }
      }

      // BoardRefs'dan leads count'larni olish
      const oldBoardLeadsCount = boardRefs.current[oldBoardId]?.getLeads()?.length || 0;
      const newBoardLeadsCount = boardRefs.current[newBoardId]?.getLeads()?.length || 0;
      
      console.log('TEST: Found boards and lead:', {
        oldBoard: oldBoard?.name,
        newBoard: newBoard?.name,
        lead: lead?.name,
        oldBoardLeads: oldBoardLeadsCount,
        newBoardLeads: newBoardLeadsCount
      });

      if (!newBoard || !oldBoard || !lead) {
        console.log('TEST: Board yoki lead topilmadi:', { oldBoard: oldBoard?.name, newBoard: newBoard?.name, lead: lead?.name });
        return;
      }

      // Yangi sort order'ni hisoblash
      let finalNewSortOrder = newBoardLeadsCount; // Default: oxiriga
      
      // Agar drop position berilgan bo'lsa, uni ishlatish
      if (dropPosition !== undefined && dropPosition >= 0 && dropPosition <= newBoardLeadsCount) {
        finalNewSortOrder = dropPosition;
      }
      
      console.log('📊 Sort order calculation:', { 
        tempWorkspace: !!tempWorkspace, 
        newBoardLeads: newBoardLeadsCount,
        finalNewSortOrder,
        tempWorkspaceNewBoardLeads: tempWorkspace ? tempWorkspace.boards.find(b => b.id === newBoardId)?.leads?.length : 'N/A'
      });
      
      // BoardRefs'dan oldSortOrder'ni hisoblash
      const oldBoardLeads = boardRefs.current[oldBoardId]?.getLeads() || [];
      const oldSortOrder = oldBoardLeads.findIndex((l: any) => l.id === leadId);
      if (oldSortOrder === -1) {
        console.log('❌ Lead eski board\'da topilmadi');
        return;
      }

      // OPTIMISTIC UPDATE: UI'ni darhol yangilash
      console.log('🎯 Optimistic update boshlandi...');
      
      // Agar lead o'z board'iga ko'chirilayotgan bo'lsa, optimistic update'ni o'tkazib yuboramiz
      if (oldBoardId === newBoardId) {
        console.log('🔄 Lead o\'z board\'iga ko\'chirilmoqda, optimistic update o\'tkazib yuboriladi');
      } else {
        // Eski board'dan lead'ni olib tashlash
        const oldBoardOptimisticLeads = oldBoardLeads.filter((l: any) => l.id !== leadId);
        addOptimisticUpdate(oldBoardId, oldBoardOptimisticLeads);
        
        // Yangi board'ga lead'ni qo'shish
        const newBoardOptimisticLeads = [...(boardRefs.current[newBoardId]?.getLeads() || [])];
        newBoardOptimisticLeads.splice(finalNewSortOrder, 0, { ...lead, sortOrder: finalNewSortOrder });
        addOptimisticUpdate(newBoardId, newBoardOptimisticLeads);
      }

      // Lead ko'chirish log'i
      console.log(`🚀 Lead "${lead.name}" ko'chirilmoqda: ${oldBoard.name} → ${newBoard.name}`);
      console.log(`📊 Sort orders: old=${oldSortOrder}, new=${finalNewSortOrder}`);

      // API orqali lead'ni ko'chirish
      console.log('📡 PUT request yuborilmoqda...');
      const apiResponse = await workspaceService.moveLead(leadId, newBoardId, finalNewSortOrder, oldSortOrder);
      console.log('✅ PUT request muvaffaqiyatli bajarildi!');
      console.log('📡 API Response:', apiResponse);
      
      toast.success('Lead muvaffaqiyatli ko\'chirildi!');

      // Optimized cache invalidate - faqat cache tozalash
      console.log('🔄 Optimized cache invalidate boshlandi...');

      // Faqat kerakli board'lar uchun cache tozalash
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.LEADS_INFINITE(workspace.id, oldBoardId),
        exact: true
      });
      
      queryClient.removeQueries({
        queryKey: QUERY_KEYS.LEADS_INFINITE(workspace.id, newBoardId),
        exact: true
      });

      console.log('✅ Cache tozalandi, avtomatik refetch bo\'ladi');

      // Optimistic update'ni tozalash (API muvaffaqiyatli bo'lgandan keyin)
      setTimeout(() => {
        clearOptimisticUpdate(oldBoardId);
        clearOptimisticUpdate(newBoardId);
        console.log('🧹 Optimistic updates tozalandi');
      }, 1000); // 1 soniya keyin tozalash
      
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
      console.error('❌ Lead ko\'chirishda xatolik:', error);
      
      // Xatolik bo'lsa optimistic update'larni tozalash
      clearOptimisticUpdate(oldBoardId);
      clearOptimisticUpdate(newBoardId);
    } finally {
      console.log('🧹 Cleaning up after lead move');
      // Temporary workspace'ni tozalash
      setTempWorkspace(null);
      setAffectedBoardIds([]);
      console.log('🧹 Cleanup completed');
    }
  };

  // Board edit/delete handlers
  const handleOpenEditBoardModal = (board: any) => {
    setSelectedBoard(board);
    setShowEditBoardModal(true);
  };

  const handleOpenDeleteBoardModal = (board: any) => {
    setSelectedBoard(board);
    setShowDeleteBoardModal(true);
  };

  // Lead edit/delete handlers
  const handleOpenEditLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setShowEditLeadModal(true);
  };

  const handleOpenDeleteLeadModal = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDeleteLeadModal(true);
  };

  // Delete board mutation
  const deleteBoardMutation = async (boardId: string) => {
    try {
      await workspaceService.deleteBoard(boardId);
      
      // Workspace'ni invalidate qilish
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACE(workspace.id) });
      
      toast.success('Board muvaffaqiyatli o\'chirildi! 🗑️');
      setShowDeleteBoardModal(false);
      setSelectedBoard(null);
    } catch (error) {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    }
  };

  const findLeadById = (id: string): Lead | null => {
    console.log('🔍 findLeadById - searching for leadId:', id);
    console.log('🔍 boardRefs keys:', Object.keys(boardRefs.current));
    
    // BoardRefs'dan lead'ni qidirish
    for (const boardId in boardRefs.current) {
      const boardRef = boardRefs.current[boardId];
      console.log('🔍 checking boardId:', boardId, 'boardRef exists:', !!boardRef);
      
      if (boardRef && boardRef.getLeads) {
        const leads = boardRef.getLeads();
        console.log('🔍 boardId:', boardId, 'leads count:', leads.length);
        console.log('🔍 leads IDs:', leads.map(l => l.id));
        
        const lead = leads.find(l => l.id === id);
        if (lead) {
          console.log('✅ Lead found in boardId:', boardId, 'lead name:', lead.name);
          return lead;
        }
      }
    }
    
    console.log('❌ Lead not found in any boardRefs');
    return null;
  };

  const findBoardByLeadId = (leadId: string) => {
    // BoardRefs'dan lead'ni qidirish
    for (const boardId in boardRefs.current) {
      const boardRef = boardRefs.current[boardId];
      if (boardRef && boardRef.getLeads) {
        const leads = boardRef.getLeads();
        const hasLead = leads.some(lead => lead.id === leadId);
        if (hasLead) {
          // Board'ni workspace'dan topish
          const currentWorkspace = tempWorkspace || workspace;
          return currentWorkspace.boards?.find(b => b.id === boardId) || null;
        }
      }
    }
    return null;
  };

  const findBoardById = (boardId: string) => {
    if (!currentWorkspace || !currentWorkspace.boards) {
      return null;
    }
    
    const board = currentWorkspace.boards.find(board => board.id === boardId);
    return board;
  };

  // Asosiy workspace'dan board'ni topish
  const findBoardByIdFromWorkspace = (boardId: string, targetWorkspace: Workspace) => {
    if (!targetWorkspace || !targetWorkspace.boards) {
      return null;
    }
    
    const board = targetWorkspace.boards.find(board => board.id === boardId);
    return board;
  };

  // Asosiy workspace'dan lead bo'yicha board'ni topish
  const findBoardByLeadIdFromWorkspace = (leadId: string, targetWorkspace: Workspace) => {
    // BoardRefs'dan lead'ni qidirish
    for (const boardId in boardRefs.current) {
      const boardRef = boardRefs.current[boardId];
      if (boardRef && boardRef.getLeads) {
        const leads = boardRef.getLeads();
        const hasLead = leads.some(lead => lead.id === leadId);
        if (hasLead) {
          // Board'ni targetWorkspace'dan topish
          return targetWorkspace.boards?.find(b => b.id === boardId) || null;
        }
      }
    }
    return null;
  };

  // Temporary workspace yoki asosiy workspace'ni ishlatish
  const currentWorkspace = tempWorkspace || workspace;

  return (
    <div className="h-full w-full">
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always
          }
        }}
      >
        <div className="flex gap-2 md:gap-3 overflow-x-auto h-full w-full px-2 md:px-3">
          {currentWorkspace?.boards?.map((board, index) => {
            // Optimistic update ma'lumotlarini olish
            const optimisticUpdate = optimisticUpdates[board.id];
            const optimisticLeads = optimisticUpdate?.leads;
            const isOptimisticUpdate = optimisticUpdate?.isUpdating || false;
            
            return (
              <div key={board.id} className="w-64 md:w-72 lg:w-80 flex-shrink-0 h-full min-w-64 md:min-w-72 lg:min-w-80">
                <BoardColumnWithPagination 
                  board={board} 
                  workspaceId={workspace.id}
                  onRefetch={(refetch, getLeads) => {
                    boardRefs.current[board.id] = { refetch, getLeads };
                  }}
                  boardIndex={index}
                  onOpenCreateLeadModal={onOpenCreateLeadModal}
                  onOpenEditBoardModal={handleOpenEditBoardModal}
                  onOpenDeleteBoardModal={handleOpenDeleteBoardModal}
                  onOpenEditLeadModal={handleOpenEditLeadModal}
                  onOpenDeleteLeadModal={handleOpenDeleteLeadModal}
                  isDragOverBoard={overBoardId === board.id}
                  optimisticLeads={optimisticLeads}
                  isOptimisticUpdate={isOptimisticUpdate}
                />
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeId && activeLead ? (
            <div className="transform rotate-2 scale-110 shadow-2xl border-2 border-blue-300 bg-white rounded-lg">
              <LeadCard 
                lead={activeLead} 
                onOpenEditLeadModal={handleOpenEditLeadModal}
                onOpenDeleteLeadModal={handleOpenDeleteLeadModal} 
              />
            </div>
          ) : null}
        </DragOverlay>

        {/* Global Loading Overlay - olib tashlandi */}
        {/* {Object.keys(optimisticUpdates).length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-20 backdrop-blur-sm flex items-center justify-center z-40 pointer-events-none">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center space-x-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Lead ko'chirilmoqda...</span>
            </div>
          </div>
        )} */}
      </DndContext>

      {/* Edit Board Modal */}
      <EditBoardModal
        isOpen={showEditBoardModal}
        onClose={() => {
          setShowEditBoardModal(false);
          setSelectedBoard(null);
        }}
        board={selectedBoard}
        workspaceId={workspace.id}
      />

      {/* Edit Lead Modal */}
      <EditLeadModal
        isOpen={showEditLeadModal}
        onClose={() => {
          setShowEditLeadModal(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        workspaceId={workspace.id}
      />

      {/* Delete Lead Modal */}
      <DeleteLeadModal
        isOpen={showDeleteLeadModal}
        onClose={() => {
          setShowDeleteLeadModal(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
        workspaceId={workspace.id}
      />

      {/* Delete Board Confirmation Modal */}
      {showDeleteBoardModal && selectedBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Board'ni O'chirish
                </h3>
                <p className="text-gray-600">
                  "<strong>{selectedBoard.name}</strong>" board'ini o'chirishni xohlaysizmi?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Bu amalni qaytarib bo'lmaydi va barcha lead'lar o'chiriladi!
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={() => deleteBoardMutation(selectedBoard.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 size={16} className="mr-2" />
                  O'chirish
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteBoardModal(false);
                    setSelectedBoard(null);
                  }}
                  className="flex-1"
                >
                  Bekor qilish
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};