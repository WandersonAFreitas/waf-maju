import { create } from 'zustand';
import type { ActionCard } from '../types';

export interface Profile {
  id: string;
  name: string;
}

interface CommunicationState {
  selectedCards: ActionCard[];
  activeCategoryId: string | null;
  isAuthenticated: boolean;
  speechRate: number;
  currentProfileId: string;
  profiles: Profile[];
  addCard: (card: ActionCard) => void;
  addTypedChar: (char: string) => void;
  removeLastCard: () => void;
  clearPhrase: () => void;
  setActiveCategoryId: (categoryId: string | null) => void;
  setSpeechRate: (rate: number) => void;
  login: (token: string) => void;
  logout: () => void;
  setProfileId: (id: string) => void;
  createProfile: (name: string) => void;
  deleteProfile: (id: string) => void;
  renameProfile: (id: string, name: string) => void;
}

const initialProfileId = localStorage.getItem('current_profile_id') || 'default';
const initialProfiles = JSON.parse(
  localStorage.getItem('profiles') || '[{"id":"default","name":"PADRÃO"}]'
);

export const useCommunicationStore = create<CommunicationState>((set) => ({
  selectedCards: [],
  activeCategoryId: null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  currentProfileId: initialProfileId,
  profiles: initialProfiles,
  speechRate: parseFloat(localStorage.getItem('speech_rate_' + initialProfileId) || '0.85'),
  
  addCard: (card) => set((state) => ({ 
    selectedCards: [...state.selectedCards, card] 
  })),
  
  addTypedChar: (char) => set((state) => {
    const list = [...state.selectedCards];
    if (list.length > 0 && list[list.length - 1].imageSource === 'Keyboard') {
      const last = { ...list[list.length - 1] };
      last.label = last.label + char;
      list[list.length - 1] = last;
    } else {
      list.push({
        label: char,
        imageSource: 'Keyboard',
        order: Date.now()
      });
    }
    return { selectedCards: list };
  }),
  
  removeLastCard: () => set((state) => {
    const list = [...state.selectedCards];
    if (list.length === 0) return { selectedCards: list };
    
    const last = { ...list[list.length - 1] };
    if (last.imageSource === 'Keyboard') {
      if (last.label.length > 1) {
        last.label = last.label.slice(0, -1);
        list[list.length - 1] = last;
      } else {
        list.pop();
      }
    } else {
      list.pop();
    }
    return { selectedCards: list };
  }),
  
  clearPhrase: () => set({ 
    selectedCards: [] 
  }),
  
  setActiveCategoryId: (categoryId) => set({ 
    activeCategoryId: categoryId 
  }),
  
  setSpeechRate: (rate) => set((state) => {
    localStorage.setItem('speech_rate_' + state.currentProfileId, rate.toString());
    return { speechRate: rate };
  }),
  
  login: (token) => {
    localStorage.setItem('auth_token', token);
    set({ isAuthenticated: true });
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
    set({ isAuthenticated: false });
  },

  setProfileId: (id) => set(() => {
    localStorage.setItem('current_profile_id', id);
    const rate = parseFloat(localStorage.getItem('speech_rate_' + id) || '0.85');
    return {
      currentProfileId: id,
      speechRate: rate,
      selectedCards: [],
      activeCategoryId: null
    };
  }),

  createProfile: (name) => set((state) => {
    const newId = 'profile_' + Date.now();
    const newProfile = { id: newId, name: name.trim().toUpperCase() };
    const newList = [...state.profiles, newProfile];
    localStorage.setItem('profiles', JSON.stringify(newList));
    return { profiles: newList };
  }),

  deleteProfile: (id) => set((state) => {
    if (id === 'default' || state.profiles.length <= 1) return {};
    const newList = state.profiles.filter(p => p.id !== id);
    localStorage.setItem('profiles', JSON.stringify(newList));
    
    if (state.currentProfileId === id) {
      localStorage.setItem('current_profile_id', 'default');
      const rate = parseFloat(localStorage.getItem('speech_rate_default') || '0.85');
      return {
        profiles: newList,
        currentProfileId: 'default',
        speechRate: rate,
        selectedCards: [],
        activeCategoryId: null
      };
    }
    return { profiles: newList };
  }),

  renameProfile: (id, name) => set((state) => {
    const newList = state.profiles.map(p => p.id === id ? { ...p, name: name.trim().toUpperCase() } : p);
    localStorage.setItem('profiles', JSON.stringify(newList));
    return { profiles: newList };
  })
}));
