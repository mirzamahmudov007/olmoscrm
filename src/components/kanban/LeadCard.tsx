import React, { useState, useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Calendar, FileText, GripVertical, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Lead } from '../../types';

interface LeadCardProps {
  lead: Lead;
  isMoving?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, isMoving = false }) => {
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
  } = useSortable({ id: lead.id });

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.startsWith('998')) {
      return `+${phone}`;
    }
    return `+998${phone}`;
  };

  const handleEdit = () => {
    setShowEditModal(true);
    setShowMenu(false);
  };

  const handleDelete = () => {
    // Delete logic
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transform transition-all duration-200 ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : ''
      } ${isMoving ? 'opacity-30 pointer-events-none' : ''}`}
    >
      <Card className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300 ${isMoving ? 'bg-gray-100' : ''}`}>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-900 text-sm leading-tight">
              {editedLead.name}
            </h4>
            <div className="flex items-center space-x-1">
            <div
              {...attributes}
              {...listeners}
                className="text-gray-400 hover:text-gray-600 cursor-grab p-1"
            >
              <GripVertical size={16} />
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                  disabled={isMoving}
                >
                  <MoreVertical size={16} />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                    <button
                      onClick={handleEdit}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <Edit size={14} />
                      <span>O'zgartirish</span>
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                    >
                      <Trash2 size={14} />
                      <span>O'chirish</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Phone size={12} className="text-blue-500" />
              <span className="font-mono">{formatPhone(editedLead.phone)}</span>
            </div>

            {editedLead.disease.trim() && (
              <div className="flex items-start space-x-2 text-xs text-gray-600">
                <FileText size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{editedLead.disease}</span>
              </div>
            )}

            {editedLead.note.trim() && (
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-700 leading-relaxed">
                  {editedLead.note}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar size={12} />
              <span>{formatDate(editedLead.createdAt)}</span>
            </div>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-700">
                {editedLead.name.charAt(0)}
              </span>
            </div>
          </div>

          {/* Loading indicator */}
          {isMoving && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-blue-600 font-medium">Ko'chirilmoqda...</span>
              </div>
            </div>
          )}
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