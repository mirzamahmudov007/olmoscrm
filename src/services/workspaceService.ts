import { api, devApi } from './api';
import { 
  Workspace, 
  PaginatedResponse, 
  CreateWorkspaceRequest,
  CreateBoardRequest,
  CreateLeadRequest,
  Lead 
} from '../types';

export const workspaceService = {
  async getWorkspaces(page = 1, size = 10): Promise<PaginatedResponse<Workspace>> {
    const response = await api.get<PaginatedResponse<Workspace>>(
      `/workspace?page=${page}&size=${size}`
    );
    return response.data;
  },

  async getWorkspaceById(id: string): Promise<Workspace> {
    const response = await api.get<Workspace>(`/workspace/${id}`);
    return response.data;
  },

  async createWorkspace(data: CreateWorkspaceRequest): Promise<void> {
    await devApi.post('/workspace', data);
  },

  async createBoard(data: CreateBoardRequest): Promise<void> {
    await devApi.post('/board', data);
  },

  async createLead(data: CreateLeadRequest): Promise<void> {
    await devApi.post('/lead', data);
  },

  async getLeadsByBoard(
    boardId: string, 
    page = 1, 
    size = 10
  ): Promise<PaginatedResponse<Lead>> {
    const response = await api.get<PaginatedResponse<Lead>>(
      `/lead/${boardId}?page=${page}&size=${size}&boardId=${boardId}`
    );
    return response.data;
  },

  // Infinite query uchun yangi method
  async getLeadsByBoardInfinite(
    boardId: string,
    pageParam: number = 1,
    size = 10
  ): Promise<PaginatedResponse<Lead>> {
    const response = await api.get<PaginatedResponse<Lead>>(
      `/lead/${boardId}?page=${pageParam}&size=${size}&boardId=${boardId}`
    );
    return response.data;
  },
};