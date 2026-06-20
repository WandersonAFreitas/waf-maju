import Dexie, { type Table } from 'dexie';
import type { Category, ActionCard } from '../types';
import { initialCategories, initialActionCards } from './initialData';

export class VoiceBoardDatabase extends Dexie {
  categories!: Table<Category, string>;
  actionCards!: Table<ActionCard, number>;

  constructor() {
    super('VoiceBoardDB');
    this.version(1).stores({
      categories: 'id, label, color, textColor, order',
      actionCards: '++id, label, imageSource, categoryId, order'
    });
  }
}

export const db = new VoiceBoardDatabase();

// Popula o banco com os dados iniciais caso ele seja criado pela primeira vez
db.on('populate', () => {
  // Usando transaction para garantir que todas as inserções ocorram
  db.transaction('rw', db.categories, db.actionCards, async () => {
    await db.categories.bulkAdd(initialCategories);
    await db.actionCards.bulkAdd(initialActionCards);
    console.log('VoiceBoardDB seeded successfully!');
  }).catch(err => {
    console.error('Error seeding database:', err);
  });
});

// Função utilitária para resetar o banco de dados para o estado inicial, se necessário
export async function resetDatabase() {
  await db.transaction('rw', db.categories, db.actionCards, async () => {
    await db.categories.clear();
    await db.actionCards.clear();
    await db.categories.bulkAdd(initialCategories);
    await db.actionCards.bulkAdd(initialActionCards);
  });
}
