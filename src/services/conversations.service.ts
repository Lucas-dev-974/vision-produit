import { httpClient } from './http-client';
import type { ChatMessage, ConversationListItem } from '../entities';

export interface CreateConversationBody {
  producerId?: string;
  buyerId?: string;
}

export const conversationsService = {
  listMine: () => httpClient.get<ConversationListItem[]>('/conversations'),

  create: (body: CreateConversationBody) =>
    httpClient.post<ConversationListItem>('/conversations', body),

  listMessages: (conversationId: string, o?: { before?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (o?.before) q.set('before', o.before);
    if (o?.limit != null) q.set('limit', String(o.limit));
    const qs = q.toString();
    return httpClient.get<ChatMessage[]>(
      `/conversations/${conversationId}/messages${qs ? `?${qs}` : ''}`,
    );
  },

  postMessage: (conversationId: string, content: string) =>
    httpClient.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content }),

  markRead: (conversationId: string) =>
    httpClient.post<void>(`/conversations/${conversationId}/read`, {}),
};
