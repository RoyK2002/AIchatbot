import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useChatStore = create(
  persist(
    (set) => ({
      messages: [],
      isOpen: false,
      isMinimized: false,
      isLoading: false,
      addMessage: (content, role, error = false) =>
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
      setLoading: (loading) => set({ isLoading: loading }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({ messages: state.messages }),
    }
  )
);
