import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ChatState, Message } from '../types/chat';

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      isMinimized: false,
      isLoading: false,
      addMessage: (content: string, role: 'user' | 'assistant', error = false) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: crypto.randomUUID(),
              content,
              role,
              timestamp: new Date(),
              error,
            },
          ],
        })),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen, isMinimized: false })),
      toggleMinimize: () => set((state) => ({ isMinimized: !state.isMinimized })),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);