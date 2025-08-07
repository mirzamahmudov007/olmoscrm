import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, User, Phone, FileText, MessageSquare } from 'lucide-react';
import { workspaceService } from '../../services/workspaceService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
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
      toast.success('Lead created successfully!');
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
      <Card className="w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Add New Lead</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
            <Input
              label="Full Name"
              placeholder="Enter lead's full name"
              className="pl-10"
              error={errors.name?.message}
              {...register('name', { 
                required: 'Name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters'
                }
              })}
            />
          </div>

          <div className="relative">
            <Phone className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
            <Input
              label="Phone Number"
              placeholder="901234567 or 998901234567"
              className="pl-10"
              error={errors.phone?.message}
              {...register('phone', { 
                required: 'Phone number is required',
                pattern: {
                  value: /^(998)?[0-9]{9}$/,
                  message: 'Please enter a valid Uzbek phone number'
                }
              })}
            />
          </div>

          <div className="relative">
            <FileText className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
            <Input
              label="Disease/Condition"
              placeholder="Enter medical condition or concern"
              className="pl-10"
              {...register('disease')}
            />
          </div>

          <div className="relative">
            <MessageSquare className="absolute left-3 top-8 h-4 w-4 text-gray-400" />
            <Input
              label="Notes"
              placeholder="Additional notes or comments"
              className="pl-10"
              {...register('note')}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createLeadMutation.isPending}
            >
              Create Lead
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};