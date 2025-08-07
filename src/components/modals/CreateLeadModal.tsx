import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CreateLeadRequest } from '../../types';
import { handleApiError } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
  workspaceId: string;
}

interface CreateLeadFormData {
  name: string;
  phone: string;
  disease: string;
  note: string;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  isOpen,
  onClose,
  boardId,
  workspaceId,
}) => {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateLeadFormData>();

  const createLeadMutation = useMutation({
    mutationFn: (data: CreateLeadRequest) => workspaceService.createLead(data),
    onSuccess: () => {
      // Faqat kerakli board uchun invalidate qilish
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.LEADS_INFINITE(workspaceId, boardId),
        exact: true
      });
      toast.success('Lead muvaffaqiyatli qo\'shildi!');
      reset();
      onClose();
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const onSubmit = (data: CreateLeadFormData) => {
    createLeadMutation.mutate({
      ...data,
      boardId,
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md bg-white shadow-2xl">
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
            {/* F.I.O va Telefon raqami bir qatorda */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  F.I.O
                </label>
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

            {/* Note */}
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