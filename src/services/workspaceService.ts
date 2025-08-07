import { api, devApi } from './api';
import { 
  Workspace, 
  PaginatedResponse, 
  CreateWorkspaceRequest,
  CreateBoardRequest,
  CreateLeadRequest,
  Lead,
  Board
} from '../types';

// Edit workspace uchun interface
export interface UpdateWorkspaceRequest {
  name: string;
}

// Edit board uchun interface
export interface UpdateBoardRequest {
  name: string;
}

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

  // Workspace'ning board'larini alohida olish
  async getWorkspaceBoards(workspaceId: string): Promise<Board[]> {
    const response = await api.get<Board[]>(`/workspace/${workspaceId}/boards`);
    return response.data;
  },

  async createWorkspace(data: CreateWorkspaceRequest): Promise<void> {
    await devApi.post('/workspace', data);
  },

  // Workspace'ni tahrirlash
  async updateWorkspace(id: string, data: UpdateWorkspaceRequest): Promise<void> {
    await devApi.put(`/workspace/${id}`, data);
  },

  // Workspace'ni o'chirish
  async deleteWorkspace(id: string): Promise<void> {
    await devApi.delete(`/workspace/${id}`);
  },

  async createBoard(data: CreateBoardRequest): Promise<void> {
    await devApi.post('/board', data);
  },

  // Board'ni tahrirlash
  async updateBoard(boardId: string, data: UpdateBoardRequest): Promise<void> {
    await devApi.put(`/board/${boardId}`, data);
  },

  // Board'ni o'chirish
  async deleteBoard(boardId: string): Promise<void> {
    await devApi.delete(`/board/${boardId}`);
  },

  async createLead(data: CreateLeadRequest): Promise<void> {
    await devApi.post('/lead', data);
  },

  // Lead'ni tahrirlash
  async updateLead(leadId: string, data: any): Promise<void> {
    await devApi.put(`/lead/${leadId}`, data);
  },

  // Lead'ni o'chirish
  async deleteLead(leadId: string): Promise<void> {
    await devApi.delete(`/lead/${leadId}`);
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

  // Lead ko'chirish funksiyasi
  async moveLead(
    leadId: string,
    newBoardId: string,
    newSortOrder: number,
    oldSortOrder: number
  ): Promise<void> {
    const response = await api.put(`/lead/move/${leadId}`, {
      boardId: newBoardId,
      newSortOrder,
      oldSortOrder
    });
    
    // Response'ni log qilish
    console.log('📡 Move lead API response:', response.data);
    return response.data;
  },
};