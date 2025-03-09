import { create } from 'zustand';

interface User {
  id: string;
  username: string;
}

interface Cursor {
  x: number;
  y: number;
}

interface ActiveUser extends User {
  cursor: Cursor | null;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  type: 'document' | 'whiteboard';
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  _id: string;
  title: string;
  type: 'document' | 'whiteboard';
  content: any;
  owner: {
    id: string;
    username: string;
  };
  collaborators: Array<{
    user: {
      id: string;
      username: string;
    };
    role: 'editor' | 'viewer';
  }>;
  createdAt: string;
  updatedAt: string;
}

interface DocumentState {
  documents: Document[];
  currentDocument: Document | null;
  activeUsers: ActiveUser[];
  version: number;
  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (document: Document | null) => void;
  updateContent: (content: string) => void;
  setActiveUsers: (users: ActiveUser[]) => void;
  updateUserCursor: (userId: string, cursor: Cursor) => void;
  removeUser: (userId: string) => void;
  incrementVersion: () => void;
  createDocument: (type: Document['type'], title: string) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  currentDocument: null,
  activeUsers: [],
  version: 0,
  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (document) => set({ currentDocument: document }),
  updateContent: (content) =>
    set((state) => ({
      currentDocument: state.currentDocument
        ? {
            ...state.currentDocument,
            content,
            updatedAt: new Date(),
          }
        : null,
      documents: state.documents.map((doc) =>
        doc.id === state.currentDocument?.id
          ? { ...doc, content, updatedAt: new Date() }
          : doc
      ),
    })),
  setActiveUsers: (users) => set({ activeUsers: users }),
  updateUserCursor: (userId, cursor) =>
    set((state) => ({
      activeUsers: state.activeUsers.map((user) =>
        user.id === userId ? { ...user, cursor } : user
      ),
    })),
  removeUser: (userId) =>
    set((state) => ({
      activeUsers: state.activeUsers.filter((user) => user.id !== userId),
    })),
  incrementVersion: () => set((state) => ({ version: state.version + 1 })),
  createDocument: (type, title) => {
    const newDocument: Document = {
      id: Math.random().toString(36).substring(7),
      title,
      content: '',
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    set((state) => ({
      documents: [...state.documents, newDocument],
      currentDocument: newDocument,
    }));
  },
})); 