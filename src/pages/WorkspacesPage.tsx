import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Folder, ArrowRight, Users, BarChart3, Sparkles, Building2, TrendingUp, Edit3, Trash2, X, Save, AlertTriangle } from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { CreateWorkspaceModal } from '../components/modals/CreateWorkspaceModal';
import { QUERY_KEYS, ROUTES } from '../config/constants';
import { handleApiError } from '../services/api';
import { Workspace } from '../types';

export const WorkspacesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [editWorkspaceName, setEditWorkspaceName] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workspacesResponse, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.WORKSPACES,
    queryFn: () => workspaceService.getWorkspaces(1, 20),
    staleTime: 5 * 60 * 1000, // 5 daqiqa cache
    gcTime: 10 * 60 * 1000, // 10 daqiqa garbage collection
    refetchOnMount: false, // Mount'da refetch qilmaslik
    refetchOnWindowFocus: false, // Window focus'da refetch qilmaslik
    refetchOnReconnect: false, // Reconnect'da refetch qilmaslik
  });

  const updateWorkspaceMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => 
      workspaceService.updateWorkspace(id, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES });
      toast.success('Ish maydoni muvaffaqiyatli yangilandi! ✨');
      setShowEditForm(false);
      setSelectedWorkspace(null);
      setEditWorkspaceName('');
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const deleteWorkspaceMutation = useMutation({
    mutationFn: workspaceService.deleteWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES });
      toast.success('Ish maydoni muvaffaqiyatli o\'chirildi! 🗑️');
      setShowDeleteConfirm(false);
      setSelectedWorkspace(null);
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const handleEditWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editWorkspaceName.trim() || !selectedWorkspace) return;
    
    updateWorkspaceMutation.mutate({ 
      id: selectedWorkspace.id, 
      name: editWorkspaceName.trim() 
    });
  };

  const handleDeleteWorkspace = () => {
    if (!selectedWorkspace) return;
    
    deleteWorkspaceMutation.mutate(selectedWorkspace.id);
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    navigate(`${ROUTES.WORKSPACE}/${workspace.id}`);
  };

  const openEditForm = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setEditWorkspaceName(workspace.name);
    setShowEditForm(true);
  };

  const openDeleteConfirm = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setShowDeleteConfirm(true);
  };

  const workspaces = workspacesResponse?.data || [];

  // Gradient ranglar ro'yxati
  const gradientColors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-cyan-600',
    'from-violet-500 to-purple-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
  ];

  // Loading state'ni ko'rsatmaslik, optimistic UI ishlatish
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="lg" />
            <p className="mt-4 text-gray-600 text-lg">Ish maydonlari yuklanmoqda...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    const apiError = handleApiError(error);
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <BarChart3 size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Xatolik yuz berdi</h3>
            <p className="text-red-600 text-lg mb-4">{apiError.message}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Qayta urinish
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Agar workspace'lar bo'sh bo'lsa
  if (!isLoading && workspaces.length === 0) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Building2 size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                OlmosCRM'ga Xush Kelibsiz! 🎉
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Lead'laringizni boshqarish va mijozlar bilan ishlash uchun birinchi ish maydoningizni yarating
              </p>
            </div>

            {/* Empty State */}
            <div className="text-center">
              <Card className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm border-2 border-dashed border-gray-200">
                <div className="py-16">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8">
                    <Folder size={48} className="text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Hali ish maydonlari yo'q
                  </h3>
                  <p className="text-gray-600 text-lg mb-8 leading-relaxed max-w-md mx-auto">
                    Birinchi ish maydoningizni yarating va lead'laringizni boshqarishni boshlang. 
                    Har bir ish maydoni o'z board'lari va lead'lariga ega bo'ladi.
                  </p>
                  <Button 
                    onClick={() => setShowCreateModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg"
                    size="lg"
                  >
                    <Plus size={20} className="mr-3" />
                    Birinchi Ish Maydonini Yaratish
                  </Button>
                </div>
              </Card>
            </div>

            {/* Features */}
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Kanban Board</h4>
                <p className="text-gray-600">Lead'larni drag & drop orqali boshqaring</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Lead Boshqaruvi</h4>
                <p className="text-gray-600">Mijoz ma'lumotlarini to'liq boshqaring</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp size={24} className="text-white" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Real-time</h4>
                <p className="text-gray-600">Zamonaviy va tezkor yangilanishlar</p>
              </div>
            </div>
          </div>
        </div>

        {/* Create Workspace Modal */}
        <CreateWorkspaceModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-120px)] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          

          {/* Action Button */}
          <div className="text-end mb-8">
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg"
              size="lg"
            >
              <Plus size={20} className="mr-3" />
              Yangi Ish Maydoni
            </Button>
          </div>

          {/* Workspaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {workspaces.map((workspace, index) => {
              const gradientColor = gradientColors[index % gradientColors.length];
              const totalLeads = workspace.boards?.reduce((acc, board) => acc + (board.leads?.length || 0), 0) || 0;
              
              return (
                <Card
                  key={workspace.id}
                  className="cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 group bg-white/80 backdrop-blur-sm border-2 hover:border-blue-200 relative"
                  onClick={() => handleWorkspaceClick(workspace)}
                >
                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(workspace);
                      }}
                    >
                      <Edit3 size={14} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0 bg-white/90 hover:bg-red-50 text-gray-600 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm(workspace);
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${gradientColor} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Folder className="w-8 h-8 text-white" />
                      </div>
                      <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-300" />
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {workspace.name}
                      </h3>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <BarChart3 size={16} />
                            <span>{workspace.boards?.length || 0} ta board</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users size={16} />
                            <span>{totalLeads} ta lead</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-500">
                          Boshqarish uchun bosing
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

         
        </div>
      </div>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Edit Modal */}
      {showEditForm && selectedWorkspace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Ish Maydonini Tahrirlash</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowEditForm(false);
                    setSelectedWorkspace(null);
                    setEditWorkspaceName('');
                  }}
                  className="w-8 h-8 p-0"
                >
                  <X size={16} />
                </Button>
              </div>
              
              <form onSubmit={handleEditWorkspace} className="space-y-4">
                <Input
                  label="Ish maydoni nomi"
                  placeholder="Yangi nomni kiriting..."
                  value={editWorkspaceName}
                  onChange={(e) => setEditWorkspaceName(e.target.value)}
                  autoFocus
                />
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    isLoading={updateWorkspaceMutation.isPending}
                    disabled={!editWorkspaceName.trim() || editWorkspaceName === selectedWorkspace.name}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save size={16} className="mr-2" />
                    {updateWorkspaceMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowEditForm(false);
                      setSelectedWorkspace(null);
                      setEditWorkspaceName('');
                    }}
                    className="flex-1"
                  >
                    Bekor qilish
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedWorkspace && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} className="text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Ish Maydonini O'chirish
                </h3>
                <p className="text-gray-600">
                  "<strong>{selectedWorkspace.name}</strong>" ish maydonini o'chirishni xohlaysizmi?
                </p>
                <p className="text-sm text-red-600 mt-2">
                  Bu amalni qaytarib bo'lmaydi va barcha board'lar va lead'lar o'chiriladi!
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleDeleteWorkspace}
                  isLoading={deleteWorkspaceMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 size={16} className="mr-2" />
                  {deleteWorkspaceMutation.isPending ? 'O\'chirilmoqda...' : 'O\'chirish'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedWorkspace(null);
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
    </Layout>
  );
};