export interface ConversationPeer {
  id: string;
  email: string;
  companyName: string | null;
  role: 'producer' | 'buyer' | 'admin';
}

export interface ConversationListItem {
  id: string;
  peer: ConversationPeer;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
}
