import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Phone, Calendar, FileText, GripVertical } from 'lucide-react';
import { Card } from '../ui/Card';
import { Lead } from '../../types';

interface LeadCardProps {
  lead: Lead;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transform transition-all duration-200 ${
        isDragging ? 'opacity-50 rotate-3 scale-105' : ''
      }`}
    >
      <Card className="cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-blue-300">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <h4 className="font-semibold text-gray-900 text-sm leading-tight">
              {lead.name}
            </h4>
            <div
              {...attributes}
              {...listeners}
              className="text-gray-400 hover:text-gray-600 cursor-grab"
            >
              <GripVertical size={16} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Phone size={12} className="text-blue-500" />
              <span className="font-mono">{formatPhone(lead.phone)}</span>
            </div>

            {lead.disease.trim() && (
              <div className="flex items-start space-x-2 text-xs text-gray-600">
                <FileText size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{lead.disease}</span>
              </div>
            )}

            {lead.note.trim() && (
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-700 leading-relaxed">
                  {lead.note}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar size={12} />
              <span>{formatDate(lead.createdAt)}</span>
            </div>
            <div className="w-6 h-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-semibold text-blue-700">
                {lead.name.charAt(0)}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};