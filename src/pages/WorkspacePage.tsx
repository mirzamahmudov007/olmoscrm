import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, BarChart3, RefreshCw } from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import { Layout } from '../components/layout/Layout';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QUERY_KEYS, ROUTES } from '../config/constants';
import { handleApiError } from '../services/api';
import { Workspace } from '../types';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showCreateBoardForm, setShowCreateBoardForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

  const { data: workspace, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.WORKSPACE(id!),
    queryFn: () => workspaceService.getWorkspaceById(id!),
    enabled: !!id,
  });

  const createBoardMutation = useMutation({
    mutationFn: workspaceService.createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACE(id!) });
      toast.success('Board created successfully!');
      setNewBoardName('');
      setShowCreateBoardForm(false);
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim() || !id) return;
    
    createBoardMutation.mutate({ 
      name: newBoardName.trim(), 
      workspaceId: id 
    });
  };

  const handleUpdateWorkspace = (updatedWorkspace: Workspace) => {
    // Optimistic update - UI'ni darhol yangilash
    queryClient.setQueryData(QUERY_KEYS.WORKSPACE(id!), updatedWorkspace);
  };

  // Workspace'ni qayta yuklash funksiyasi
  const handleRefreshWorkspace = async () => {
    try {
      await refetch();
      toast.success('Workspace yangilandi!');
    } catch (error) {
      toast.error('Workspace yangilashda xatolik yuz berdi');
    }
  };

  // Barcha board'larni refetch qilish
  const handleRefreshAllBoards = async () => {
    if (!workspace) return;
    
    try {
      // Barcha board'lar uchun query'larni invalidate qilish
      const boardQueries = workspace.boards.map(board => 
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.LEADS_INFINITE(workspace.id, board.id),
          exact: true
        })
      );
      
      await Promise.all(boardQueries);
      toast.success('Barcha board\'lar yangilandi!');
    } catch (error) {
      toast.error('Board\'larni yangilashda xatolik yuz berdi');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    const apiError = handleApiError(error);
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{apiError.message}</p>
          <Button 
            onClick={() => navigate(ROUTES.WORKSPACES)}
            className="mt-4"
          >
            Back to Workspaces
          </Button>
        </div>
      </Layout>
    );
  }

  if (!workspace) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">Workspace not found</p>
          <Button 
            onClick={() => navigate(ROUTES.WORKSPACES)}
            className="mt-4"
          >
            Back to Workspaces
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="h-[calc(100vh-120px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(ROUTES.WORKSPACES)}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
              <p className="text-gray-600 mt-1">
                Manage your leads across different stages
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshWorkspace}
              className="text-gray-600 hover:text-gray-800"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshAllBoards}
              className="text-gray-600 hover:text-gray-800"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh Boards
            </Button>
          <Button
            onClick={() => setShowCreateBoardForm(true)}
            className="shadow-lg"
          >
            <Plus size={16} className="mr-2" />
            New Board
          </Button>
          </div>
        </div>

        {/* Create Board Form */}
        {showCreateBoardForm && (
          <Card variant="glass" className="mb-6 flex-shrink-0">
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Board</h3>
              <div className="flex gap-4">
                <Input
                  placeholder="Board name (e.g., 'New Leads', 'In Progress')"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  isLoading={createBoardMutation.isPending}
                  disabled={!newBoardName.trim()}
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateBoardForm(false);
                    setNewBoardName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          {workspace.boards.length === 0 ? (
            <Card className="text-center py-12 h-full flex items-center justify-center">
              <div>
                <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No boards found</h3>
                <p className="text-gray-600 mb-6">Create your first board to start managing leads</p>
                <Button onClick={() => setShowCreateBoardForm(true)}>
                  <Plus size={16} className="mr-2" />
                  Create Board
                </Button>
              </div>
            </Card>
          ) : (
            <KanbanBoard 
              workspace={workspace} 
              onUpdateWorkspace={handleUpdateWorkspace}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};