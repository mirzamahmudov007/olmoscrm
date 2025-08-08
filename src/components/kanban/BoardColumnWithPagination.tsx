import React, { useState, useEffect, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus, Users, Loader2, MoreVertical, Edit, Trash2, Calendar, Phone, RefreshCw } from 'lucide-react';
import { Board } from '../../types';
import { LeadCard } from './LeadCard';
import { Button } from '../ui/Button';
import { CreateLeadModal } from '../modals/CreateLeadModal';
import { workspaceService } from '../../services/workspaceService';
import { QUERY_KEYS } from '../../config/constants';

interface BoardColumnWithPaginationProps {
  board: Board;
  workspaceId: string;
  onRefetch?: (refetch: () => void, getLeads: () => any[]) => void;
  boardIndex?: number;
  onOpenCreateLeadModal?: (boardId: string) => void;
  onOpenEditBoardModal?: (board: Board) => void;
  onOpenDeleteBoardModal?: (board: Board) => void;
  onOpenDeleteLeadModal?: (lead: any) => void;
}

export const BoardColumnWithPagination: React.FC<BoardColumnWithPaginationProps> = ({ 
  board, 
  workspaceId,
  onRefetch,
  boardIndex = 0,
  onOpenCreateLeadModal,
  onOpenEditBoardModal,
  onOpenDeleteBoardModal,
  onOpenDeleteLeadModal
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [newBoardName, setNewBoardName] = useState(board.name);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { setNodeRef, isOver } = useDroppable({
    id: board.id,
    data: {
      type: 'board',
      board: board,
    },
    disabled: false, // Drop zone har doim faol
  });
  
  // Debug uchun isOver o'zgarishini kuzatish
  React.useEffect(() => {
    if (isOver) {
      console.log('🎯 Board isOver changed to true:', board.name);
    } else {
      console.log('🎯 Board isOver changed to false:', board.name);
    }
  }, [isOver, board.name]);

  // Click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Infinite query for leads - optimized
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: QUERY_KEYS.LEADS_INFINITE(workspaceId, board.id),
    queryFn: ({ pageParam = 1 }) => 
      workspaceService.getLeadsByBoardInfinite(board.id, pageParam, 10),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      return currentPage < lastPage.allPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 30000, // 30 soniya cache
    gcTime: 5 * 60 * 1000, // 5 daqiqa cache
    refetchOnMount: false, // Mount'da refetch qilmaslik
    refetchOnWindowFocus: false, // Window focus'da refetch qilmaslik
    refetchOnReconnect: false, // Reconnect'da refetch qilmaslik
  });

  // Flatten all leads from all pages
  const allLeads = data?.pages.flatMap(page => page.data) || [];
  const leadIds = allLeads.map((lead) => lead.id);

  // onRefetch prop'iga refetch funksiyasini o'tkazish
  React.useEffect(() => {
    if (onRefetch) {
      console.log(`📋 Board "${board.name}" onRefetch callback registered`);
      onRefetch(
        async () => {
          console.log(`🔄 Board "${board.name}" refetch boshlandi...`);
          const result = await refetch();
          console.log(`✅ Board "${board.name}" refetch tugadi:`, result.data?.pages?.length, 'pages');
          return result;
        },
        () => {
          console.log(`📋 Board "${board.name}" getLeads called, leads count:`, allLeads.length);
          return allLeads;
        }
      );
    }
  }, [onRefetch, refetch, allLeads]);

  // Query data o'zgarishini kuzatish va avtomatik yangilash
  React.useEffect(() => {
    console.log(`📊 Board "${board.name}" query data o'zgarishi:`, data?.pages?.length, 'pages', 'leads:', allLeads.length);
  }, [data, board.name]);

  // Lead ko'chirilganda avtomatik refetch - o'chirildi
  // React.useEffect(() => {
  //   if (isMovingLead && movingLeadId) {
  //     console.log(`🔄 Board "${board.name}" - lead ko'chirilganda avtomatik refetch`);
  //     refetch();
  //   }
  // }, [isMovingLead, movingLeadId, board.name, refetch]);

  const getColumnColor = (boardName: string) => {
    const colors = {
      'Rad javob berildi': 'border-green-200 bg-green-50',
      "Bog'lana olmadik": 'border-orange-200 bg-orange-50',
      'Uchrashuv belgilandi': 'border-blue-200 bg-blue-50',
      'Xizmat ko\'rsatildi': 'border-purple-200 bg-purple-50',
      'Qayta bog\'lanish kerak': 'border-yellow-200 bg-yellow-50',
      'Aloqa o\'rnatilmogda': 'border-red-200 bg-red-50',
    };

    return colors[boardName as keyof typeof colors] || 'border-gray-200 bg-gray-50';
  };

  const getHeaderColor = (boardName: string) => {
    const colors = {
      'Rad javob berildi': 'text-green-700 bg-green-100',
      "Bog'lana olmadik": 'text-orange-700 bg-orange-100',
      'Uchrashuv belgilandi': 'text-blue-700 bg-blue-100',
      'Xizmat ko\'rsatildi': 'text-purple-700 bg-purple-100',
      'Qayta bog\'lanish kerak': 'text-yellow-700 bg-yellow-100',
      'Aloqa o\'rnatilmogda': 'text-red-700 bg-red-100',
    };

    return colors[boardName as keyof typeof colors] || 'text-gray-700 bg-gray-100';
  };

  // Drag over visual feedback - optimized
  const getDragOverStyles = () => {
    if (isOver) {
      return 'ring-2 ring-blue-400 ring-opacity-50 bg-blue-5  0/20 shadow-md border-blue-300';
    }
    return '';
  };

  // Loading state'ni ko'rsatmaslik, optimistic UI ishlatish
  const displayLeads = isLoading ? [] : allLeads;

  // Error state'da ham board ko'rsatish, lekin error message qo'shish
  const hasError = !!error;

  return (
    <div 
      ref={setNodeRef}
      className={`bg-white rounded-xl border-2 ${getColumnColor(board.name)} shadow-sm h-full flex flex-col transition-all duration-200 ${getDragOverStyles()}`}
              style={{
          transform: isOver ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.2s ease-in-out',
          zIndex: isOver ? 10 : 1
        }}  
      role="region"
      aria-label={`${board.name} board - lead'larni tashlash uchun`}
      aria-dropped={isOver ? 'true' : 'false'}
    >
              <div className={`p-3 border-b border-opacity-20 ${getHeaderColor(board.name)} rounded-t-xl flex-shrink-0`}>
          <div className="flex items-center justify-betwee  n">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-sm">
                {boardIndex + 1}. {board.name}
              </h3>
              <div className="flex items-center space-x-1">
                <Users size={14} />
                <span className="text-sm font-medium">{displayLeads.length}</span>
                {data?.pages[data.pages.length - 1]?.allPages && (
                  <span className="text-xs text-gray-500">
                    / {data.pages[data.pages.length - 1].allPages * 10}
                  </span>
                )}
                {hasError && (
                  <span className="text-xs text-red-500 ml-1" title="Xatolik yuz berdi">
                    ⚠️
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => refetch()}
                className="p-1 hover:bg-white/50"
                title="Refresh board"
              >
                <RefreshCw size={16} />
              </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenCreateLeadModal ? onOpenCreateLeadModal(board.id) : setShowCreateModal(true)}
              className="p-1 hover:bg-white/50"
            >
              <Plus size={16} />
            </Button>
            <div className="relative" ref={menuRef}>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-white/50"
              >
                <MoreVertical size={16} />
              </Button>
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                  <button
                    onClick={() => {
                      onOpenEditBoardModal ? onOpenEditBoardModal(board) : setShowEditModal(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Edit size={14} />
                    <span>O'zgartirish</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenDeleteBoardModal ? onOpenDeleteBoardModal(board) : console.log('Delete board');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                  >
                    <Trash2 size={14} />
                    <span>O'chirish</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex-1 p-3 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        onScroll={(e) => {
          const target = e.currentTarget;
          const { scrollTop, scrollHeight, clientHeight } = target;
          const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
          
          if (isNearBottom && hasNextPage && !isFetchingNextPage) {
            console.log('Manual scroll trigger - loading next page');
            fetchNextPage();
          }
        }}
      >
        <SortableContext items={displayLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {displayLeads.map((lead) => (
            <LeadCard 
              key={lead.id} 
              lead={lead}
              onOpenDeleteLeadModal={onOpenDeleteLeadModal}
            />
          ))}
        </SortableContext>

        {isFetchingNextPage && (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        )}

        {hasNextPage && !isFetchingNextPage && (
          <div className="text-center py-2 text-xs text-gray-500">
            Scroll down to load more...
          </div>
        )}

        {displayLeads.length === 0 && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Lead'lar yo'q</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenCreateLeadModal ? onOpenCreateLeadModal(board.id) : setShowCreateModal(true)}
              className="mt-2"
            >
              <Plus size={14} className="mr-1" />
              Lead qo'shish
            </Button>
          </div>
        )}
      </div>

      <CreateLeadModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        boardId={board.id}
        workspaceId={workspaceId}
      />

      {/* Edit Board Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Board nomini o'zgartirish</h3>
            <input
              type="text"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Board nomi"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowEditModal(false);
                  setNewBoardName(board.name);
                }}
              >
                Bekor qilish
              </Button>
              <Button
                onClick={() => {
                  // Update board name logic
                  setShowEditModal(false);
                }}
              >
                Saqlash
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 