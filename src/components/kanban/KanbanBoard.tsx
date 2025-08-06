import React from 'react';
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
import { Workspace, Lead } from '../../types';
import { BoardColumnWithPagination } from './BoardColumnWithPagination';
import { LeadCard } from './LeadCard';

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
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if we're moving between boards
    const activeBoard = findBoardByLeadId(activeId);
    const overBoard = findBoardById(overId) || findBoardByLeadId(overId);

    if (!activeBoard || !overBoard || activeBoard.id === overBoard.id) {
      return;
    }

    const updatedWorkspace = { ...workspace };
    const activeBoardIndex = updatedWorkspace.boards.findIndex(b => b.id === activeBoard.id);
    const overBoardIndex = updatedWorkspace.boards.findIndex(b => b.id === overBoard.id);

    const activeLead = activeBoard.leads.find(l => l.id === activeId);
    if (!activeLead) return;

    // Remove lead from active board
    updatedWorkspace.boards[activeBoardIndex].leads = activeBoard.leads.filter(
      l => l.id !== activeId
    );

    // Add lead to over board
    updatedWorkspace.boards[overBoardIndex].leads = [
      ...overBoard.leads,
      { ...activeLead, sortOrder: overBoard.leads.length }
    ];

    onUpdateWorkspace(updatedWorkspace);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveLead(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeBoard = findBoardByLeadId(activeId);
    const overBoard = findBoardByLeadId(overId);

    if (!activeBoard || !overBoard || activeBoard.id !== overBoard.id) {
      return;
    }

    const updatedWorkspace = { ...workspace };
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
    }
  };

  const findLeadById = (id: string): Lead | null => {
    for (const board of workspace.boards) {
      const lead = board.leads.find(l => l.id === id);
      if (lead) return lead;
    }
    return null;
  };

  const findBoardByLeadId = (leadId: string) => {
    return workspace.boards.find(board =>
      board.leads.some(lead => lead.id === leadId)
    );
  };

  const findBoardById = (boardId: string) => {
    return workspace.boards.find(board => board.id === boardId);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6 h-[calc(100vh-200px)]">
        {workspace.boards.map((board) => (
          <div key={board.id} className="w-80 flex-shrink-0 h-full">
            <BoardColumnWithPagination board={board} workspaceId={workspace.id} />
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeId && activeLead ? (
          <LeadCard lead={activeLead} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};