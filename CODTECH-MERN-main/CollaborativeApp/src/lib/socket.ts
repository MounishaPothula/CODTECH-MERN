import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';
import { useDocumentStore } from '../store/document';
import { useChatStore } from '../store/chat';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
  };
  createdAt: Date;
}

interface User {
  id: string;
  username: string;
  cursor: { x: number; y: number } | null;
}

class SocketService {
  private socket: Socket | null = null;
  private documentId: string | null = null;

  connect() {
    if (this.socket) return;

    this.socket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    const token = useAuthStore.getState().token;

    if (token) {
      this.socket.emit('authenticate', { token });
    }

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('auth-error', (error: string) => {
      console.error('Authentication error:', error);
      useAuthStore.getState().logout();
    });

    this.socket.on('users-updated', (users: User[]) => {
      useDocumentStore.getState().setActiveUsers(users);
    });

    this.socket.on('content-update', (content: string) => {
      if (content !== useDocumentStore.getState().currentDocument?.content) {
        useDocumentStore.getState().updateContent(content);
      }
    });

    this.socket.on('cursor-update', (data: { userId: string; x: number; y: number }) => {
      // Handle cursor updates from other users
      console.log('Cursor update:', data);
    });

    this.socket.on('user-disconnected', (userId: string) => {
      useDocumentStore.getState().removeUser(userId);
    });

    this.socket.on('chat-message', (message: Message) => {
      useChatStore.getState().addMessage(message);
    });

    this.socket.on('document-state', ({ content, version }: { content: string; version: number }) => {
      useDocumentStore.getState().updateContent(content);
      useDocumentStore.getState().version = version;
    });
  }

  joinDocument(documentId: string) {
    if (!this.socket) return;
    this.documentId = documentId;
    this.socket.emit('join-document', documentId);
    useChatStore.getState().clearMessages();
  }

  updateContent(content: string) {
    if (!this.socket || !this.documentId) return;
    this.socket.emit('content-update', {
      documentId: this.documentId,
      content,
    });
  }

  updateCursor(x: number, y: number) {
    if (!this.socket || !this.documentId) return;
    this.socket.emit('cursor-update', {
      documentId: this.documentId,
      x,
      y,
    });
  }

  sendMessage(content: string) {
    if (!this.socket || !this.documentId) return;
    this.socket.emit('chat-message', {
      documentId: this.documentId,
      content,
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.documentId = null;
  }
}

export const socketService = new SocketService();