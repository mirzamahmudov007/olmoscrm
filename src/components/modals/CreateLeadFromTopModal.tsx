import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { AutoComplete } from '../ui/AutoComplete';
import { CreateLeadRequest, Workspace } from '../../types';
import { handleApiError } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';

interface CreateLeadFromTopModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
  selectedBoardId?: string; // Yangi prop - avtomatik tanlangan board
}

interface CreateLeadFormData {
  boardId: string;
  name: string;
  phone: string;
  disease: string;
  note: string;
}

export const CreateLeadFromTopModal: React.FC<CreateLeadFromTopModalProps> = ({
  isOpen,
  onClose,
  workspace,
  selectedBoardId,
}) => {
  const queryClient = useQueryClient();
  const [selectedBoard, setSelectedBoard] = useState<{ id: string; name: string } | null>(null);
  
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<CreateLeadFormData>();

  // selectedBoardId o'zgartirilganda avtomatik tanlash
  useEffect(() => {
    if (selectedBoardId && workspace.boards) {
      const board = workspace.boards.find(b => b.id === selectedBoardId);
      if (board) {
        setSelectedBoard({ id: board.id, name: board.name });
        setValue('boardId', board.id);
      }
    }
  }, [selectedBoardId, workspace.boards, setValue]);

  // Modal ochilganda form'ni tozalash
  useEffect(() => {
    if (isOpen) {
      reset();
      if (selectedBoardId && workspace.boards) {
        const board = workspace.boards.find(b => b.id === selectedBoardId);
        if (board) {
          setSelectedBoard({ id: board.id, name: board.name });
          setValue('boardId', board.id);
        } else {
          setSelectedBoard(null);
        }
      } else {
        setSelectedBoard(null);
      }
    }
  }, [isOpen, selectedBoardId, workspace.boards, setValue, reset]);

  const createLeadMutation = useMutation({
    mutationFn: (data: CreateLeadRequest) => workspaceService.createLead(data),
    onSuccess: (_, variables) => {
      // Faqat kerakli board uchun invalidate qilish
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.LEADS_INFINITE(workspace.id, variables.boardId),
        exact: true
      });
      toast.success('Lead muvaffaqiyatli qo\'shildi!');
      reset();
      setSelectedBoard(null);
      onClose();
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const onSubmit = (data: CreateLeadFormData) => {
    if (!selectedBoard) {
      toast.error('Iltimos, board tanlang');
      return;
    }
    
    createLeadMutation.mutate({
      ...data,
      boardId: selectedBoard.id,
    });
  };

  const handleClose = () => {
    reset();
    setSelectedBoard(null);
    onClose();
  };

  const handleBoardSelect = (board: { id: string; name: string } | null) => {
    setSelectedBoard(board);
    if (board) {
      setValue('boardId', board.id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Lead Qo'shish</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Board Selection with AutoComplete */}
            <AutoComplete
              options={workspace.boards.map(board => ({ id: board.id, name: board.name }))}
              value={selectedBoard}
              onChange={handleBoardSelect}
              placeholder="Board nomini yozing yoki tanlang..."
              label="List"
              error={!selectedBoard && errors.boardId?.message ? errors.boardId.message : undefined}
            />

            {/* F.I.O va Telefon raqami bir qatorda */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  F.I.O
                </label>
                <div className="relative">
                  <input
                    {...register('name', { 
                      required: 'F.I.O kiritish majburiy',
                      minLength: {
                        value: 2,
                        message: 'F.I.O kamida 2 ta harf bo\'lishi kerak'
                      }
                    })}
                    placeholder="To'liq ism familiya"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefon raqami
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                    +998
                  </div>
                  <input
                    {...register('phone', { 
                      required: 'Telefon raqami kiritish majburiy',
                      pattern: {
                        value: /^[0-9]{9}$/,
                        message: 'To\'g\'ri telefon raqamini kiriting (9 ta raqam)'
                      }
                    })}
                    placeholder="901234567"
                    className="w-full pl-12 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Kasallik */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kasallik
              </label>
              <input
                {...register('disease')}
                placeholder="Kasallik yoki muammo haqida"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Note - Kattaroq maydon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batafsil
              </label>
              <textarea
                {...register('note')}
                placeholder="Batafsil ma'lumotlar, qo'shimcha izohlar..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
                rows={3}
                style={{ minHeight: '100px' }}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                className="px-6 py-2.5"
              >
                Bekor qilish
              </Button>
              <Button
                type="submit"
                isLoading={createLeadMutation.isPending}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {createLeadMutation.isPending ? 'Qo\'shilmoqda...' : 'Lead Qo\'shish'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}; 