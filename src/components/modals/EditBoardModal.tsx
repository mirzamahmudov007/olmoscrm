import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, BarChart3 } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { handleApiError } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';
import { Board } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface EditBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  board: Board | null;
  workspaceId: string;
}

export const EditBoardModal: React.FC<EditBoardModalProps> = ({
  isOpen,
  onClose,
  board,
  workspaceId,
}) => {
  const [boardName, setBoardName] = useState('');
  const queryClient = useQueryClient();

  const updateBoardMutation = useMutation({
    mutationFn: (data: { boardId: string; name: string }) =>
      workspaceService.updateBoard(data.boardId, { name: data.name }),
    onSuccess: () => {
      toast.success('Board muvaffaqiyatli yangilandi! ✨');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACE(workspaceId) });
      onClose();
      setBoardName('');
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !boardName.trim()) return;

    updateBoardMutation.mutate({
      boardId: board.id,
      name: boardName.trim(),
    });
  };

  const handleOpen = () => {
    if (board) {
      setBoardName(board.name);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Board'ni Tahrirlash
                </h3>
                <p className="text-sm text-gray-600">
                  Board nomini o'zgartiring
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-2">
                Board Nomi
              </label>
              <input
                type="text"
                id="boardName"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Board nomini kiriting..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={updateBoardMutation.isPending || !boardName.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateBoardMutation.isPending ? 'Yangilanmoqda...' : 'Yangilash'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
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