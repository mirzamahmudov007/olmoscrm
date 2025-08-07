import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, Plus, Building2 } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { QUERY_KEYS } from '../../config/constants';
import { handleApiError } from '../../services/api';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [workspaceName, setWorkspaceName] = useState('');
  const queryClient = useQueryClient();

  const createWorkspaceMutation = useMutation({
    mutationFn: workspaceService.createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES });
      toast.success('Ish maydoni muvaffaqiyatli yaratildi! 🎉');
      setWorkspaceName('');
      onClose();
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) return;
    
    createWorkspaceMutation.mutate({ name: workspaceName.trim() });
  };

  const handleClose = () => {
    setWorkspaceName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Yangi Ish Maydoni</h3>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
            
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Ish maydonini kiriting"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-base"
                autoFocus
              />
              
            </div>

          

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                isLoading={createWorkspaceMutation.isPending}
                disabled={!workspaceName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus size={16} className="mr-2" />
                {createWorkspaceMutation.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
              >
                Bekor qilish
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}; 