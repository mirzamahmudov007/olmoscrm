import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, FileText, GripVertical, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Lead } from '../../types';

interface LeadCardProps {
  lead: Lead;
  onOpenDeleteLeadModal?: (lead: Lead) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onOpenDeleteLeadModal }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editedLead, setEditedLead] = useState(lead);
  const menuRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: lead.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });



  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Click outside handler for menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatPhone = (phone: string) => {
    if (!phone || !phone.trim()) {
      return 'Telefon kiritilmagan';
    }
    
    const cleanPhone = phone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('998') && cleanPhone.length >= 12) {
      return `+${cleanPhone}`;
    }
    
    if (cleanPhone.length >= 9) {
      return `+998${cleanPhone}`;
    }
    
    return phone; // Agar format to'g'ri bo'lmasa, asl holatda qoldirish
  };

  const handleEdit = () => {
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleDelete = () => {
    onOpenDeleteLeadModal ? onOpenDeleteLeadModal(lead) : console.log('Delete lead');
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        zIndex: isDragging ? 9999 : 'auto',
        position: isDragging ? 'relative' : 'static',
      }}
      className={`transform transition-all duration-200 ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <Card 
                  className={`hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300 ${isDragging ? 'bg-gray-50 shadow-md border-gray-300' : ''} p-3 min-h-[120px]`} 
        style={{ 
          cursor: 'default',
        }}
        role="article"
        aria-label={`${editedLead.name} lead karti`}
      >
        {/* Drop zone indicator */}
        <div className="absolute inset-0 pointer-events-none bg-transparent hover:bg-blue-50/20 transition-colors duration-200" />
        <div className="relative z-10">
          {/* Lead content */}
          <div className="space-y-2 flex-1">
            {/* FIO va actions */}
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mr-2 break-words">
                {editedLead.name || 'Ism kiritilmagan'}
              </h4>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <button
                  {...attributes}
                  {...listeners}
                  className="text-gray-400 hover:text-gray-600 cursor-grab p-1.5 rounded hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 active:cursor-grabbing disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ touchAction: 'none' }}
                  aria-label={`${editedLead.name} lead'ni sudrab o'tkazish`}
                  title="Sudrab o'tkazish uchun ushlab turib bosing"
                      disabled={isDragging}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      // Keyboard orqali drag'ni boshlash
                      const rect = e.currentTarget.getBoundingClientRect();
                      const event = new MouseEvent('mousedown', {
                        bubbles: true,
                        cancelable: true,
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2,
                      });
                      e.currentTarget.dispatchEvent(event);
                    }
                  }}
                >
                  <GripVertical size={16} />
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="text-gray-400 hover:text-gray-600 p-0.5"
                    disabled={isDragging}
                  >
                    <MoreVertical size={14} />
                  </button> 
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={handleEdit}
                        className="w-full px-2 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center space-x-1.5"
                      >
                        <Edit size={12} />
                        <span>O'zgartirish</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="w-full px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50 flex items-center space-x-1.5"
                      >
                        <Trash2 size={12} />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kasallik tashxisi */}
            {editedLead.disease && editedLead.disease.trim() && (
              <div className="flex items-start space-x-1.5 text-xs text-gray-600 min-h-[16px]">
                <FileText size={11} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed font-medium break-words">
                  {editedLead.disease}
                </span>
              </div>
            )}

            {/* Telefon raqami */}
            <div className="flex items-center space-x-1.5 text-xs text-gray-600 min-h-[16px]">
              <Phone size={11} className="text-blue-500 flex-shrink-0" />
              <span className="font-mono break-all">
                {formatPhone(editedLead.phone)}
              </span>
            </div>

            {/* Izoh - faqat qisqa */}
            {editedLead.note && editedLead.note.trim() && (
              <div className="bg-gray-50 rounded p-1.5 min-h-[32px]">
                <p className="text-xs text-gray-700 leading-relaxed line-clamp-2 break-words">
                  {editedLead.note}
                </p>
              </div>
            )}
          </div>

          {/* Loading indicator - o'chirildi */}
        </div>
      </Card>

      {/* Edit Lead Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Lead ma'lumotlarini o'zgartirish</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ism</label>
                <input
                  type="text"
                  value={editedLead.name}
                  onChange={(e) => setEditedLead({...editedLead, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="text"
                  value={editedLead.phone}
                  onChange={(e) => setEditedLead({...editedLead, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kasallik</label>
                <input
                  type="text"
                  value={editedLead.disease}
                  onChange={(e) => setEditedLead({...editedLead, disease: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Izoh</label>
                <textarea
                  value={editedLead.note}
                  onChange={(e) => setEditedLead({...editedLead, note: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditedLead(lead);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  // Save logic
                  setShowEditModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};