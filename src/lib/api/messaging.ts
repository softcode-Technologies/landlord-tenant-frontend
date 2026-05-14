import apiClient from "./client"
import type { Conversation, Message } from "@/lib/types"

export const messagingApi = {
  getConversations: () => apiClient.get<Conversation[]>("/conversations"),

  createConversation: (data: {
    recipientUserId: string
    propertyId?: string
    body: string
  }) => apiClient.post<Conversation>("/conversations", data),

  getMessages: (conversationId: string) =>
    apiClient.get<Message[]>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, body: string) =>
    apiClient.post<Message>(`/conversations/${conversationId}/messages`, { body }),

  deleteMessage: (conversationId: string, msgId: string) =>
    apiClient.delete(`/conversations/${conversationId}/messages/${msgId}`),
}
