import { create } from 'zustand';
import type { ActionCard, UserProfile } from '../types';
import { db, seedProfile } from '../data/db';

interface CommunicationState {
  selectedCards: ActionCard[];
  activeCategoryId: string | null;
  isAuthenticated: boolean;
  speechRate: number;
  currentProfileId: string;
  currentProfile: UserProfile | null;
  profiles: UserProfile[];
  addCard: (card: ActionCard) => void;
  addTypedChar: (char: string) => void;
  removeLastCard: () => void;
  clearPhrase: () => void;
  setActiveCategoryId: (categoryId: string | null) => void;
  setSpeechRate: (rate: number) => void;
  login: (token: string) => void;
  logout: () => void;
  setProfileId: (id: string) => void;
  loadProfiles: () => Promise<void>;
  switchProfile: (profileId: string, password?: string) => Promise<boolean>;
  createProfile: (name: string, isAdmin: boolean, password?: string) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  renameProfile: (id: string, name: string) => Promise<void>;
}

const initialProfileId = localStorage.getItem('current_profile_id') || 'default';

export const useCommunicationStore = create<CommunicationState>((set, get) => ({
  selectedCards: [],
  activeCategoryId: null,
  isAuthenticated: !!localStorage.getItem('auth_token'),
  currentProfileId: initialProfileId,
  currentProfile: null,
  profiles: [],
  speechRate: 0.85,

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

  setProfileId: (id) => {
    get().switchProfile(id);
  },

  loadProfiles: async () => {
    let list = await db.profiles.toArray();
    if (list.length === 0) {
      const defaultProf: UserProfile = {
        id: 'default',
        name: 'PADRÃO',
        isAdmin: true,
        createdAt: new Date()
      };
      await db.profiles.add(defaultProf);
      list = [defaultProf];
    }
    const currentId = get().currentProfileId || 'default';
    let current = list.find(p => p.id === currentId) || null;
    if (!current && list.length > 0) {
      current = list[0];
    }
    const finalProfileId = current?.id || 'default';
    localStorage.setItem('current_profile_id', finalProfileId);
    const rate = parseFloat(localStorage.getItem('speech_rate_' + finalProfileId) || '0.85');

    set({ 
      profiles: list, 
      currentProfile: current, 
      currentProfileId: finalProfileId,
      speechRate: rate
    });
  },

  switchProfile: async (profileId: string, password?: string) => {
    const targetProfile = await db.profiles.get(profileId);
    if (!targetProfile) return false;

    // Se o perfil tiver senha cadastrada, valida a senha
    if (targetProfile.password && targetProfile.password !== password) {
      return false;
    }

    localStorage.setItem('current_profile_id', profileId);
    const rate = parseFloat(localStorage.getItem('speech_rate_' + profileId) || '0.85');

    set({
      currentProfileId: profileId,
      currentProfile: targetProfile,
      speechRate: rate,
      selectedCards: [],
      activeCategoryId: null
    });
    return true;
  },

  createProfile: async (name: string, isAdmin: boolean, password?: string) => {
    const newId = 'profile_' + Date.now();
    const newProfile: UserProfile = {
      id: newId,
      name: name.trim().toUpperCase(),
      isAdmin,
      password: password || undefined,
      createdAt: new Date()
    };
    await db.profiles.add(newProfile);
    await seedProfile(newId);
    await get().loadProfiles();
  },

  deleteProfile: async (id: string) => {
    if (id === 'default') return;
    await db.profiles.delete(id);

    await db.transaction('rw', db.categories, db.actionCards, db.savedWords, async () => {
      await db.categories.where('profileId').equals(id).delete();
      await db.actionCards.where('profileId').equals(id).delete();
      await db.savedWords.where('profileId').equals(id).delete();
    });

    if (get().currentProfileId === id) {
      await get().switchProfile('default');
    }
    await get().loadProfiles();
  },

  renameProfile: async (id: string, name: string) => {
    await db.profiles.update(id, { name: name.trim().toUpperCase() });
    await get().loadProfiles();
  }
}));

