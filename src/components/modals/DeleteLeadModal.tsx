import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, Trash2, AlertTriangle, User } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { workspaceService } from '../../services/workspaceService';
import { Lead } from '../../types';
import { handleApiError } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';

interface DeleteLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  workspaceId: string;
}

export const DeleteLeadModal: React.FC<DeleteLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  workspaceId
}) => {
  const queryClient = useQueryClient();

  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) => workspaceService.deleteLead(leadId),
    onSuccess: () => {
      toast.success('Lead muvaffaqiyatli o\'chirildi! 🗑️');
      onClose();
      
      // Cache'ni invalidate qilish
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LEADS_INFINITE(workspaceId, '') });
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const handleDelete = () => {
    if (!lead) return;
    deleteLeadMutation.mutate(lead.id);
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lead O'chirish</h3>
                <p className="text-sm text-gray-500">Bu amalni qaytarib bo'lmaydi</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="w-8 h-8 p-0 hover:bg-gray-100"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Content */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={24} className="text-red-600" />
            </div>
            
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              "{lead.name}" lead'ini o'chirishni xohlaysizmi?
            </h4>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Ism:</strong> {lead.name}</p>
                <p><strong>Telefon:</strong> {lead.phone}</p>
                {lead.disease && <p><strong>Kasallik:</strong> {lead.disease}</p>}
                {lead.note && <p><strong>Izoh:</strong> {lead.note}</p>}
              </div>
            </div>
            
            <p className="text-sm text-red-600 font-medium">
              ⚠️ Bu amalni qaytarib bo'lmaydi va barcha ma'lumotlar yo'qoladi!
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleDelete}
              isLoading={deleteLeadMutation.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 size={16} className="mr-2" />
              {deleteLeadMutation.isPending ? 'O\'chirilmoqda...' : 'O\'chirish'}
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
            >
              Bekor qilish
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}; 