export const API_BASE_URL = 'https://api.olmoscrm.uz/api/v1';
export const DEV_API_BASE_URL = 'https://api.olmoscrm.uz/api/v1';

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ACCESS_TOKEN_EXPIRY: 'access_token_expiry',
  REFRESH_TOKEN_EXPIRY: 'refresh_token_expiry',
  USER: 'user',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  WORKSPACES: '/workspaces',
  WORKSPACE: '/workspace',
} as const;

export const QUERY_KEYS = {
  WORKSPACES: ['workspaces'],
  WORKSPACE: (id: string) => ['workspace', id],
  LEADS: (boardId: string, page: number) => ['leads', boardId, page],
  LEADS_INFINITE: (workspaceId: string, boardId: string) => ['leads', 'infinite', workspaceId, boardId],
} as const;