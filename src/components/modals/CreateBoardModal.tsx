import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, Plus, BarChart3 } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { QUERY_KEYS } from '../../config/constants';
import { handleApiError } from '../../services/api';
import { Workspace } from '../../types';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
}

export const CreateBoardModal: React.FC<CreateBoardModalProps> = ({
  isOpen,
  onClose,
  workspace,
}) => {
  const [boardName, setBoardName] = useState('');
  const queryClient = useQueryClient();

  const createBoardMutation = useMutation({
    mutationFn: workspaceService.createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACE(workspace.id) });
      toast.success('Board muvaffaqiyatli yaratildi! 🎉');
      setBoardName('');
      onClose();
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    
    createBoardMutation.mutate({
      name: boardName.trim(),
      workspaceId: workspace.id,
    });
  };

  const handleClose = () => {
    setBoardName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Yangi Board</h3>
                <p className="text-sm text-gray-600">{workspace.name} ish maydonida</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="w-8 h-8 p-0 hover:bg-gray-100"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Board nomi
              </label>
              <Input
                placeholder="Board nomini kiriting"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                autoFocus
                className="text-base py-3"
              />
             
            </div>

       

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                isLoading={createBoardMutation.isPending}
                disabled={!boardName.trim()}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus size={16} className="mr-2" />
                {createBoardMutation.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
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