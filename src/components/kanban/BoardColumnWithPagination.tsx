import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus, Users, Loader2 } from 'lucide-react';
import { Board } from '../../types';
import { LeadCard } from './LeadCard';
import { Button } from '../ui/Button';
import { CreateLeadModal } from '../modals/CreateLeadModal';
import { workspaceService } from '../../services/workspaceService';
import { QUERY_KEYS } from '../../config/constants';

interface BoardColumnWithPaginationProps {
  board: Board;
  workspaceId: string;
}

export const BoardColumnWithPagination: React.FC<BoardColumnWithPaginationProps> = ({ 
  board, 
  workspaceId 
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { setNodeRef } = useDroppable({
    id: board.id,
  });

  // Infinite query for leads
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery({
    queryKey: [...QUERY_KEYS.LEADS(board.id, 1), 'infinite'],
    queryFn: ({ pageParam = 1 }) => 
      workspaceService.getLeadsByBoardInfinite(board.id, pageParam, 10),
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      console.log('getNextPageParam:', { currentPage, allPages: lastPage.allPages, hasNext: currentPage < lastPage.allPages });
      return currentPage < lastPage.allPages ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Flatten all leads from all pages
  const allLeads = data?.pages.flatMap(page => page.data) || [];
  const leadIds = allLeads.map((lead) => lead.id);

  // Debug info
  console.log('BoardColumn Debug:', {
    boardId: board.id,
    boardName: board.name,
    allLeads: allLeads.length,
    pages: data?.pages.length,
    hasNextPage,
    isFetchingNextPage,
    totalPages: data?.pages[data.pages.length - 1]?.allPages
  });

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

  if (isLoading) {
    return (
      <div className={`bg-white rounded-xl border-2 ${getColumnColor(board.name)} shadow-sm h-full flex flex-col`}>
        <div className={`p-4 border-b border-opacity-20 ${getHeaderColor(board.name)} rounded-t-xl flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-sm">{board.name}</h3>
              <div className="flex items-center space-x-1">
                <Users size={14} />
                <span className="text-sm font-medium">...</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl border-2 ${getColumnColor(board.name)} shadow-sm h-full flex flex-col`}>
        <div className={`p-4 border-b border-opacity-20 ${getHeaderColor(board.name)} rounded-t-xl flex-shrink-0`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h3 className="font-semibold text-sm">{board.name}</h3>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 flex items-center justify-center">
          <p className="text-red-500 text-sm">Error loading leads</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border-2 ${getColumnColor(board.name)} shadow-sm h-full flex flex-col`}>
      <div className={`p-4 border-b border-opacity-20 ${getHeaderColor(board.name)} rounded-t-xl flex-shrink-0`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-sm">{board.name}</h3>
            <div className="flex items-center space-x-1">
              <Users size={14} />
              <span className="text-sm font-medium">{allLeads.length}</span>
              {data?.pages[data.pages.length - 1]?.allPages && (
                <span className="text-xs text-gray-500">
                  / {data.pages[data.pages.length - 1].allPages * 10}
                </span>
              )}
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateModal(true)}
            className="p-1 hover:bg-white/50"
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className="flex-1 p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
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
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {allLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
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

        {allLeads.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No leads yet</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowCreateModal(true)}
              className="mt-2"
            >
              <Plus size={14} className="mr-1" />
              Add lead
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
    </div>
  );
}; 