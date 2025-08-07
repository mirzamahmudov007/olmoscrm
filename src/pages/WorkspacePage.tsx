import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, BarChart3, RefreshCw, UserPlus } from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import { Layout } from '../components/layout/Layout';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CreateLeadFromTopModal } from '../components/modals/CreateLeadFromTopModal';
import { QUERY_KEYS, ROUTES } from '../config/constants';
import { handleApiError } from '../services/api';
import { Workspace } from '../types';

export const WorkspacePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showCreateBoardForm, setShowCreateBoardForm] = useState(false);
  const [showCreateLeadModal, setShowCreateLeadModal] = useState(false);
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

  // Workspace'ni qayta yuklash funksiyasi (faqat kerak bo'lganda)
  const handleRefreshWorkspace = async () => {
    try {
      await refetch();
      toast.success('Workspace yangilandi!');
    } catch (error) {
      toast.error('Workspace yangilashda xatolik yuz berdi');
    }
  };

  // Faqat kerakli board'larni refetch qilish
  const handleRefreshAllBoards = async () => {
    if (!workspace) return;
    
    try {
      // Faqat kerakli board'lar uchun query'larni invalidate qilish
      // Hozircha barcha board'lar, lekin kelajakda faqat o'zgargan board'lar uchun
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
      <div className="h-[calc(100vh-120px)] flex flex-col px-2 md:px-4">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(ROUTES.WORKSPACES)}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <ArrowLeft size={18} className="mr-2" />
                Orqaga
              </Button>
              <div className="border-l border-gray-300 h-8"></div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Lead'larni boshqarish va kuzatish
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshWorkspace}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  title="Workspace yangilash"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Yangilash
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshAllBoards}
                  className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
                  title="Barcha board'larni yangilash"
                >
                  <RefreshCw size={16} className="mr-2" />
                  Board'lar
                </Button>
              </div>
              
              <div className="border-l border-gray-300 h-8"></div>
              
              <div className="flex items-center space-x-2">
                <Button
                  onClick={() => setShowCreateLeadModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <UserPlus size={16} className="mr-2" />
                  Lead Qo'shish
                </Button>
                <Button
                  onClick={() => setShowCreateBoardForm(true)}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus size={16} className="mr-2" />
                  Yangi Board
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Create Board Form */}
        {showCreateBoardForm && (
          <Card className="mb-6 flex-shrink-0 border-2 border-dashed border-green-200 bg-green-50/30">
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Plus size={20} className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Yangi Board Yaratish</h3>
              </div>
              <div className="flex gap-4">
                <Input
                  placeholder="Board nomi (masalan: 'Yangi Lead\'lar', 'Jarayonda')"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  className="flex-1"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  isLoading={createBoardMutation.isPending}
                  disabled={!newBoardName.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Yaratish
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateBoardForm(false);
                    setNewBoardName('');
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Bekor qilish
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          {workspace.boards.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Card className="text-center py-16 max-w-md bg-white/80 backdrop-blur-sm">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Board'lar topilmadi</h3>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  Lead'larni boshqarish uchun birinchi board'ingizni yarating. 
                  Har bir board lead'ning turli bosqichlarini ifodalaydi.
                </p>
                <Button 
                  onClick={() => setShowCreateBoardForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Plus size={16} className="mr-2" />
                  Birinchi Board Yaratish
                </Button>
              </Card>
            </div>
          ) : (
            <div className="h-full w-full">
              <KanbanBoard 
                workspace={workspace} 
                onUpdateWorkspace={handleUpdateWorkspace}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Lead From Top Modal */}
      <CreateLeadFromTopModal
        isOpen={showCreateLeadModal}
        onClose={() => setShowCreateLeadModal(false)}
        workspace={workspace}
      />
    </Layout>
  );
};