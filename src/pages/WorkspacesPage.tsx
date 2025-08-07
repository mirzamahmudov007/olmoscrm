import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Plus, Folder, ArrowRight } from 'lucide-react';
import { workspaceService } from '../services/workspaceService';
import { Layout } from '../components/layout/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { QUERY_KEYS, ROUTES } from '../config/constants';
import { handleApiError } from '../services/api';
import { Workspace } from '../types';

export const WorkspacesPage: React.FC = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: workspacesResponse, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.WORKSPACES,
    queryFn: () => workspaceService.getWorkspaces(1, 20),
  });

  const createWorkspaceMutation = useMutation({
    mutationFn: workspaceService.createWorkspace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES });
      toast.success('Workspace created successfully!');
      setNewWorkspaceName('');
      setShowCreateForm(false);
    },
    onError: (error) => {
      const apiError = handleApiError(error);
      toast.error(apiError.message);
    },
  });

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    createWorkspaceMutation.mutate({ name: newWorkspaceName.trim() });
  };

  const handleWorkspaceClick = (workspace: Workspace) => {
    navigate(`${ROUTES.WORKSPACE}/${workspace.id}`);
  };

  const workspaces = workspacesResponse?.data || [];



  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    const apiError = handleApiError(error);
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{apiError.message}</p>
        </div>
      </Layout>
    );
  }

  // Agar workspace'lar bo'sh bo'lsa va loading tugagan bo'lsa, WorkspacesPage ni ko'rsatish
  if (!isLoading && workspaces.length === 0) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
              <p className="text-gray-600 mt-2">
                Create your first workspace to get started
              </p>
            </div>
            
            <Button
              onClick={() => setShowCreateForm(true)}
              className="shadow-lg"
            >
              <Plus size={16} className="mr-2" />
              New Workspace
            </Button>
          </div>

          {showCreateForm && (
            <Card variant="glass">
              <form onSubmit={handleCreateWorkspace} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Workspace</h3>
                <div className="flex gap-4">
                  <Input
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="Enter workspace name"
                    className="flex-1"
                  />
                  <Button type="submit" isLoading={createWorkspaceMutation.isPending}>
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first workspace to start managing boards and leads
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus size={16} className="mr-2" />
              Create Workspace
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
            <p className="text-gray-600 mt-2">
              Select a workspace to manage your boards and leads
            </p>
          </div>
          
          <Button
            onClick={() => setShowCreateForm(true)}
            className="shadow-lg"
          >
            <Plus size={16} className="mr-2" />
            New Workspace
          </Button>
        </div>

        {showCreateForm && (
          <Card variant="glass">
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Workspace</h3>
              <div className="flex gap-4">
                <Input
                  placeholder="Workspace name"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  isLoading={createWorkspaceMutation.isPending}
                  disabled={!newWorkspaceName.trim()}
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewWorkspaceName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {workspaces.length === 0 ? (
          <Card className="text-center py-12">
            <Folder size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workspaces found</h3>
            <p className="text-gray-600 mb-6">Create your first workspace to get started</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus size={16} className="mr-2" />
              Create Workspace
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.id}
                className="cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                onClick={() => handleWorkspaceClick(workspace)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Folder className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {workspace.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {workspace.boards?.length || 0} boards
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};