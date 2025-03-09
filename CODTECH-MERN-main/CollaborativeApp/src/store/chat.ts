import { create } from 'zustand';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
  };
  createdAt: Date;
}

interface ChatState {
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
})); 