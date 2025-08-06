export interface User {
  id: string;
  username: string;
  fullName: string;
  authorities: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface Workspace {
  id: string;
  name: string;
  boards: Board[];
}

export interface Board {
  id: string;
  name: string;
  leads: Lead[];
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  disease: string;
  note: string;
  date: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface CreateWorkspaceRequest {
  name: string;
}

export interface CreateBoardRequest {
  name: string;
  workspaceId: string;
}

export interface CreateLeadRequest {
  name: string;
  phone: string;
  disease: string;
  note: string;
  boardId: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  success: boolean;
  allElements: number;
  allPages: number;
}

export interface ApiError {
  message: string;
  status: number;
}