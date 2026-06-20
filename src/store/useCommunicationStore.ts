import { create } from 'zustand';
import type { ActionCard } from '../types';

interface CommunicationState {
  selectedCards: ActionCard[];
  activeCategoryId: string | null;
  isAuthenticated: boolean;
  addCard: (card: ActionCard) => void;
  removeLastCard: () => void;
  clearPhrase: () => void;
  setActiveCategoryId: (categoryId: string | null) => void;
  login: (token: string) => void;
  logout: () => void;
}

export const useCommunicationStore = create<CommunicationState>((set) => ({
  selectedCards: [],
  activeCategoryId: null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  
  addCard: (card) => set((state) => ({ 
    selectedCards: [...state.selectedCards, card] 
  })),
  
  removeLastCard: () => set((state) => ({
    selectedCards: state.selectedCards.slice(0, -1)
  })),
  
  clearPhrase: () => set({ 
    selectedCards: [] 
  }),
  
  setActiveCategoryId: (categoryId) => set({ 
    activeCategoryId: categoryId 
  }),
  
  login: (token) => {
    localStorage.setItem('auth_token', token);
    set({ isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ isAuthenticated: false });
  }
}));
