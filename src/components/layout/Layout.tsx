import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, User, Building2, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm flex-shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    OlmosCRM
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1">Lead Boshqaruvi</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-2 border border-blue-100">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                  <User size={14} className="text-white" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-semibold text-gray-800">{user?.fullName}</span>
                  <p className="text-xs text-gray-500">{user?.username}</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              >
                <LogOut size={16} className="mr-2" />
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
};