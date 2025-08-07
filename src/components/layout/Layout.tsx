import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { LogOut, User } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm flex-shrink-0 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">O</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  OlmosCRM
                </h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-gray-100 rounded-lg px-3 py-2">
                <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <User size={12} className="text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.fullName}</span>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-gray-600 hover:text-gray-800 hover:bg-gray-100"
              >
                <LogOut size={16} className="mr-2" />
                Chiqish
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 px-4 py-6 overflow-hidden">
        {children}
      </main>
    </div>
  );
};