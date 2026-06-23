import Dexie, { type Table } from 'dexie';
import type { Category, ActionCard, SavedWord, UserProfile } from '../types';
import { initialCategories, initialActionCards } from './initialData';

export class WfreitasSolutionDatabase extends Dexie {
  categories!: Table<Category, string>;
  actionCards!: Table<ActionCard, number>;
  savedWords!: Table<SavedWord, number>;
  profiles!: Table<UserProfile, string>;

  constructor() {
    super('WfreitasSolutionDB');
    this.version(1).stores({
      categories: 'id, label, color, textColor, order',
      actionCards: '++id, label, imageSource, categoryId, order'
    });
    this.version(2).stores({
      categories: 'id, label, color, textColor, order, profileId',
      actionCards: '++id, label, imageSource, categoryId, order, profileId'
    }).upgrade(async tx => {
      // Migrate existing records to profileId: 'default'
      await tx.table('categories').toCollection().modify({ profileId: 'default' });
      await tx.table('actionCards').toCollection().modify({ profileId: 'default' });
    });
    this.version(3).stores({
      categories: 'id, label, color, textColor, order, profileId',
      actionCards: '++id, label, imageSource, categoryId, order, profileId',
      savedWords: '++id, word, profileId, order'
    });
    this.version(4).stores({
      categories: 'id, label, color, textColor, order, profileId',
      actionCards: '++id, label, imageSource, categoryId, order, profileId',
      savedWords: '++id, word, profileId, order',
      profiles: 'id, name, isAdmin, createdAt'
    }).upgrade(async tx => {
      // Seed default admin profile if profiles is empty
      const count = await tx.table('profiles').count();
      if (count === 0) {
        await tx.table('profiles').add({
          id: 'default',
          name: 'PADRÃO',
          isAdmin: true,
          createdAt: new Date()
        });
      }
      // Migrate existing records to profileId: 'default'
      await tx.table('categories').toCollection().modify(item => {
        if (!item.profileId) item.profileId = 'default';
      });
      await tx.table('actionCards').toCollection().modify(item => {
        if (!item.profileId) item.profileId = 'default';
      });
    });
  }
}

export const db = new WfreitasSolutionDatabase();

// Popula o banco com os dados iniciais caso ele seja criado pela primeira vez
db.on('populate', () => {
  // Usando transaction para garantir que todas as inserções ocorram
  db.transaction('rw', db.categories, db.actionCards, db.profiles, async () => {
    await db.profiles.add({
      id: 'default',
      name: 'PADRÃO',
      isAdmin: true,
      createdAt: new Date()
    });
    const seededCategories = initialCategories.map(c => ({ ...c, profileId: 'default' }));
    const seededCards = initialActionCards.map(c => ({ ...c, profileId: 'default' }));
    await db.categories.bulkAdd(seededCategories);
    await db.actionCards.bulkAdd(seededCards);
    console.log('WfreitasSolutionDB seeded successfully!');
  }).catch(err => {
    console.error('Error seeding database:', err);
  });
});

// Função utilitária para resetar o banco de dados para o estado inicial, se necessário
export async function resetDatabase() {
  await db.transaction('rw', db.categories, db.actionCards, db.profiles, async () => {
    await db.categories.clear();
    await db.actionCards.clear();
    await db.profiles.clear();

    await db.profiles.add({
      id: 'default',
      name: 'PADRÃO',
      isAdmin: true,
      createdAt: new Date()
    });

    const seededCategories = initialCategories.map(c => ({ ...c, profileId: 'default' }));
    const seededCards = initialActionCards.map(c => ({ ...c, profileId: 'default' }));
    await db.categories.bulkAdd(seededCategories);
    await db.actionCards.bulkAdd(seededCards);
  });
}

// Cria um ecossistema inicial completo e isolado para um novo perfil
export async function seedProfile(profileId: string) {
  const hasCategories = await db.categories.where('profileId').equals(profileId).count();
  if (hasCategories === 0) {
    const profileCategories = initialCategories.map(c => ({
      ...c,
      id: `${profileId}_${c.id}`, // Chave única para o perfil
      profileId
    }));
    const profileCards = initialActionCards.map(c => ({
      ...c,
      categoryId: c.categoryId ? `${profileId}_${c.categoryId}` : undefined,
      profileId
    }));
    await db.transaction('rw', db.categories, db.actionCards, async () => {
      await db.categories.bulkAdd(profileCategories);
      await db.actionCards.bulkAdd(profileCards);
    });
  }
}
