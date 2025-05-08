export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  error?: boolean;
}

export interface ChatState {
  messages: Message[];
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  addMessage: (content: string, role: 'user' | 'assistant', error?: boolean) => void;
  toggleOpen: () => void;
  toggleMinimize: () => void;
  setLoading: (loading: boolean) => void;
}