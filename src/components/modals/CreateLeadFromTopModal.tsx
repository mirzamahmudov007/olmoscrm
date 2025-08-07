import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, User, Phone, FileText, MessageSquare, ChevronDown } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { CreateLeadRequest, Workspace } from '../../types';
import { handleApiError } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';

interface CreateLeadFromTopModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspace: Workspace;
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
}) => {
  const queryClient = useQueryClient();
  const [isBoardDropdownOpen, setIsBoardDropdownOpen] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<{ id: string; name: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<CreateLeadFormData>();

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBoardDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  const handleBoardSelect = (board: { id: string; name: string }) => {
    setSelectedBoard(board);
    setValue('boardId', board.id);
    setIsBoardDropdownOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Lead Qo'shish</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Board Selection */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              List
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsBoardDropdownOpen(!isBoardDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <span className={selectedBoard ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedBoard ? selectedBoard.name : 'Board tanlang'}
                </span>
                <ChevronDown size={16} className="text-gray-400" />
              </button>
              
              {isBoardDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {workspace.boards.map((board) => (
                    <button
                      key={board.id}
                      type="button"
                      onClick={() => handleBoardSelect(board)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      {board.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.boardId && (
              <p className="mt-1 text-sm text-red-600">{errors.boardId.message}</p>
            )}
          </div>

          {/* F.I.O va Telefon raqami bir qatorda */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <User className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
              <Input
                label="F.I.O"
                placeholder="To'liq ism familiya"
                className="pl-10"
                error={errors.name?.message}
                {...register('name', { 
                  required: 'F.I.O kiritish majburiy',
                  minLength: {
                    value: 2,
                    message: 'F.I.O kamida 2 ta harf bo\'lishi kerak'
                  }
                })}
              />
            </div>

            <div className="relative">
              <Phone className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
              <Input
                label="Telefon raqami"
                placeholder="901234567 yoki 998901234567"
                className="pl-10"
                error={errors.phone?.message}
                {...register('phone', { 
                  required: 'Telefon raqami kiritish majburiy',
                  pattern: {
                    value: /^(998)?[0-9]{9}$/,
                    message: 'To\'g\'ri telefon raqamini kiriting'
                  }
                })}
              />
            </div>
          </div>

          {/* Kasallik */}
          <div className="relative">
            <FileText className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
            <Input
              label="Kasallik"
              placeholder="Kasallik yoki muammo haqida"
              className="pl-10"
              {...register('disease')}
            />
          </div>

          {/* Note - Kattaroq maydon */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batafsil
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <textarea
                {...register('note')}
                placeholder="Batafsil ma'lumotlar, qo'shimcha izohlar..."
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                style={{ minHeight: '120px' }}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
            >
              Bekor qilish
            </Button>
            <Button
              type="submit"
              isLoading={createLeadMutation.isPending}
            >
              Lead Qo'shish
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}; 