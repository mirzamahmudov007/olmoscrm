import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { X, Save, User, Phone, FileText, MessageSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { workspaceService } from '../../services/workspaceService';
import { Lead } from '../../types';
import { handleApiError } from '../../services/api';
import { QUERY_KEYS } from '../../config/constants';

interface EditLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  workspaceId: string;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({
  isOpen,
  onClose,
  lead,
  workspaceId
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    disease: '',
    note: '',
    boardId: ''
  });
  const queryClient = useQueryClient();

  // Form data'ni lead o'zgartirilganda yangilash
  React.useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        phone: lead.phone || '',
        disease: lead.disease || '',
        note: lead.note || '',
        boardId: lead.boardId || '' // Lead'ning joriy board ID'sini qo'shamiz
      });
    }
  }, [lead]);

  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: any }) =>
      workspaceService.updateLead(leadId, data),
    onMutate: async ({ leadId, data }) => {
      // Optimistic update uchun eski data'ni saqlash
      const previousData = queryClient.getQueryData(QUERY_KEYS.LEADS_INFINITE(workspaceId, ''));
      
      // Optimistic update - barcha board'lardagi lead'larni yangilash
      queryClient.setQueryData(QUERY_KEYS.LEADS_INFINITE(workspaceId, ''), (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((lead: Lead) => 
              lead.id === leadId 
                ? { ...lead, ...data }
                : lead
            )
          }))
        };
      });
      
      return { previousData };
    },
    onSuccess: (data, variables) => {
      toast.success('Lead muvaffaqiyatli yangilandi! ✨');
      onClose();
      
      // Cache'ni invalidate qilish - faqat kerakli board'lar uchun
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.LEADS_INFINITE(workspaceId, ''),
        exact: false 
      });
      
      // Workspace cache'ni ham invalidate qilish
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.WORKSPACE(workspaceId),
        exact: true 
      });
    },
    onError: (error, variables, context) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
      
      // Xatolik bo'lsa, eski data'ni qaytarish
      if (context?.previousData) {
        queryClient.setQueryData(
          QUERY_KEYS.LEADS_INFINITE(workspaceId, ''),
          context.previousData
        );
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    // API'ga yuboriladigan data'ni tayyorlash - boardId ham qo'shamiz
    const updateData = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      disease: formData.disease.trim(),
      note: formData.note.trim(),
      boardId: formData.boardId // Lead'ning joriy board ID'sini qo'shamiz
    };

    updateLeadMutation.mutate({
      leadId: lead.id,
      data: updateData
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !lead) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Lead Tahrirlash</h3>
                <p className="text-sm text-gray-500">Ma'lumotlarni yangilang</p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ism */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User size={14} className="inline mr-1" />
                Ism
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Mijoz ismi"
                required
                disabled={updateLeadMutation.isPending}
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone size={14} className="inline mr-1" />
                Telefon raqami
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+998 XX XXX XX XX"
                required
                disabled={updateLeadMutation.isPending}
              />
            </div>

            {/* Kasallik */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText size={14} className="inline mr-1" />
                Kasallik tashxisi
              </label>
              <Input
                type="text"
                value={formData.disease}
                onChange={(e) => handleInputChange('disease', e.target.value)}
                placeholder="Kasallik tashxisi"
                disabled={updateLeadMutation.isPending}
              />
            </div>

            {/* Board ID - yashirilgan, avtomatik olinadi */}
            <input
              type="hidden"
              value={formData.boardId}
            />

            {/* Izoh */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare size={14} className="inline mr-1" />
                Izoh
              </label>
              <textarea
                value={formData.note}
                onChange={(e) => handleInputChange('note', e.target.value)}
                placeholder="Qo'shimcha ma'lumotlar..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={updateLeadMutation.isPending}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                isLoading={updateLeadMutation.isPending}
                disabled={!formData.name.trim() || !formData.phone.trim() || updateLeadMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save size={16} className="mr-2" />
                {updateLeadMutation.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={updateLeadMutation.isPending}
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