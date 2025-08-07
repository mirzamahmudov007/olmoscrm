import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Users } from 'lucide-react';
import { Board } from '../../types';
import { LeadCard } from './LeadCard';
import { Button } from '../ui/Button';
import { CreateLeadModal } from '../modals/CreateLeadModal';

interface BoardColumnProps {
  board: Board;
  workspaceId: string;
}

export const BoardColumn: React.FC<BoardColumnProps> = ({ board, workspaceId }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  const { setNodeRef } = useDroppable({
    id: board.id,
  });

  const leadIds = board.leads.map((lead) => lead.id);

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

  return (
          <div className={`bg-white rounded-xl border-2 ${getColumnColor(board.name)} shadow-sm min-h-[500px] flex flex-col`}>
              <div className={`p-3 border-b border-opacity-20 ${getHeaderColor(board.name)} rounded-t-xl`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold tesxt-sm">{board.name}</h3>
            <div className="flex items-center space-x-1">
              <Users size={14} />
              <span className="text-sm font-medium">{board.leads.length}</span>
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
        className="flex-1 p-4 space-y-3 overflow-y-auto"
      >
        <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
          {board.leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>

        {board.leads.length === 0 && (
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