import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, resetDatabase } from '../../data/db';
import { useCommunicationStore } from '../../store/useCommunicationStore';
import { useImageProcessor } from '../../hooks/useImageProcessor';
import { SafeTouch } from '../../components/ui/SafeTouch';
import * as LucideIcons from 'lucide-react';

interface SettingsScreenProps {
  onBackToMain: () => void;
}

// Lista de ícones disponíveis para seleção, idêntica ao mapeamento no Card
const AVAILABLE_ICONS = [
  // Essenciais / Feedback
  'ThumbsUp', 'ThumbsDown', 'Check', 'X', 'HelpCircle', 'Heart', 'AlertCircle', 'MessageSquare',
  // Pessoas & Relações
  'User', 'Users', 'UserPlus', 'GraduationCap', 'Baby',
  // Sentimentos & Estados
  'Smile', 'Frown', 'Angry', 'Laugh', 'BatteryCharging', 'BatteryLow', 'Activity', 'Thermometer',
  // Necessidades / Alimentação / Sono
  'Utensils', 'GlassWater', 'CupSoda', 'Bed', 'Moon', 'Sun', 'Apple', 'Cookie', 'Pizza', 'Cake', 'IceCream',
  // Higiene / Saúde
  'Bath', 'ShowerHead', 'Droplet', 'Trash2', 'ShieldAlert',
  // Ações / Brincadeiras / Mídia
  'Gamepad2', 'ToyBrick', 'Puzzle', 'Music', 'Tv', 'BookOpen', 'Pencil', 'Brush', 'Speaker', 'Volume2', 'Megaphone', 'Hand', 'Eye', 'Ear',
  // Lugares & Transporte
  'Home', 'School', 'Trees', 'Store', 'MapPin', 'Car', 'Bike', 'Footprints', 'Clock'
];

// Presets de cores para categorias/grupos
const COLOR_PRESETS = [
  { name: 'Laranja', color: 'bg-amber-100 border-amber-300 active:bg-amber-200', textColor: 'text-amber-900', circleBg: 'bg-amber-100 border-amber-300' },
  { name: 'Verde', color: 'bg-emerald-100 border-emerald-300 active:bg-emerald-200', textColor: 'text-emerald-950', circleBg: 'bg-emerald-100 border-emerald-300' },
  { name: 'Azul', color: 'bg-sky-100 border-sky-300 active:bg-sky-200', textColor: 'text-blue-950', circleBg: 'bg-sky-100 border-sky-300' },
  { name: 'Roxo', color: 'bg-purple-100 border-purple-300 active:bg-purple-200', textColor: 'text-purple-950', circleBg: 'bg-purple-100 border-purple-300' },
  { name: 'Ciano', color: 'bg-cyan-100 border-cyan-300 active:bg-cyan-200', textColor: 'text-cyan-950', circleBg: 'bg-cyan-100 border-cyan-300' },
  { name: 'Rosa', color: 'bg-rose-100 border-rose-300 active:bg-rose-200', textColor: 'text-rose-950', circleBg: 'bg-rose-100 border-rose-300' },
  { name: 'Vermelho', color: 'bg-red-100 border-red-300 active:bg-red-200', textColor: 'text-red-950', circleBg: 'bg-red-100 border-red-300' },
  { name: 'Amarelo', color: 'bg-yellow-100 border-yellow-300 active:bg-yellow-200', textColor: 'text-yellow-950', circleBg: 'bg-yellow-100 border-yellow-300' },
  { name: 'Indigo', color: 'bg-indigo-100 border-indigo-300 active:bg-indigo-200', textColor: 'text-indigo-950', circleBg: 'bg-indigo-100 border-indigo-300' },
  { name: 'Cinza', color: 'bg-slate-100 border-slate-300 active:bg-slate-200', textColor: 'text-slate-950', circleBg: 'bg-slate-100 border-slate-300' }
];

// Presets de cores para cards de comunicação
const CARD_COLOR_PRESETS = [
  { name: 'Branco', color: 'bg-white', circleBg: 'bg-white border-slate-300' },
  { name: 'Laranja', color: 'bg-amber-100 border-amber-300 active:bg-amber-200', circleBg: 'bg-amber-100 border-amber-300' },
  { name: 'Verde', color: 'bg-emerald-100 border-emerald-300 active:bg-emerald-200', circleBg: 'bg-emerald-100 border-emerald-300' },
  { name: 'Azul', color: 'bg-sky-100 border-sky-300 active:bg-sky-200', circleBg: 'bg-sky-100 border-sky-300' },
  { name: 'Roxo', color: 'bg-purple-100 border-purple-300 active:bg-purple-200', circleBg: 'bg-purple-100 border-purple-300' },
  { name: 'Ciano', color: 'bg-cyan-100 border-cyan-300 active:bg-cyan-200', circleBg: 'bg-cyan-100 border-cyan-300' },
  { name: 'Rosa', color: 'bg-rose-100 border-rose-300 active:bg-rose-200', circleBg: 'bg-rose-100 border-rose-300' },
  { name: 'Vermelho', color: 'bg-red-100 border-red-300 active:bg-red-200', circleBg: 'bg-red-100 border-red-300' },
  { name: 'Amarelo', color: 'bg-yellow-100 border-yellow-300 active:bg-yellow-200', circleBg: 'bg-yellow-100 border-yellow-300' },
  { name: 'Indigo', color: 'bg-indigo-100 border-indigo-300 active:bg-indigo-200', circleBg: 'bg-indigo-100 border-indigo-300' },
  { name: 'Cinza', color: 'bg-slate-100 border-slate-300 active:bg-slate-200', circleBg: 'bg-slate-100 border-slate-300' }
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBackToMain }) => {
  const { logout, speechRate, setSpeechRate, currentProfileId } = useCommunicationStore();
  const { processImage, isProcessing, error: compressionError } = useImageProcessor();

  // Queries reativas com Dexie, isoladas pelo perfil ativo
  const categories = useLiveQuery(() =>
    db.categories.where('profileId').equals(currentProfileId).sortBy('order')
  , [currentProfileId]) || [];

  const cards = useLiveQuery(() =>
    db.actionCards.where('profileId').equals(currentProfileId).sortBy('order')
  , [currentProfileId]) || [];

  // UI State
  const [activeCategoryId, setActiveCategoryId] = useState<string>('raiz');
  const [draggedCardId, setDraggedCardId] = useState<number | null>(null);
  const [justDraggedId, setJustDraggedId] = useState<number | null>(null);
  const [mode, setMode] = useState<'edit' | 'order'>('edit');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // ─── MODAL: Criar Novo Card ────────────────────────────────────────────────
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [newCardLabel, setNewCardLabel] = useState('');
  const [newCardCategoryId, setNewCardCategoryId] = useState('');
  const [newCardImageType, setNewCardImageType] = useState<'icon' | 'upload'>('icon');
  const [newCardSelectedIcon, setNewCardSelectedIcon] = useState('HelpCircle');
  const [newCardUploadedImage, setNewCardUploadedImage] = useState<string | null>(null);
  const [newCardColor, setNewCardColor] = useState('bg-white');

  const openCreateCardModal = () => {
    setNewCardLabel('');
    setNewCardCategoryId(activeCategoryId === 'raiz' ? '' : activeCategoryId);
    setNewCardImageType('icon');
    setNewCardSelectedIcon('HelpCircle');
    setNewCardUploadedImage(null);
    setNewCardColor('bg-white');
    setShowCreateCardModal(true);
  };

  const closeCreateCardModal = () => setShowCreateCardModal(false);

  const handleNewCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processImage(file);
      setNewCardUploadedImage(compressed);
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  };

  const handleSaveNewCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardLabel.trim()) {
      setMessage({ text: 'Por favor, insira o nome do botão.', type: 'error' });
      return;
    }
    const finalImageSource = newCardImageType === 'icon' ? newCardSelectedIcon : newCardUploadedImage;
    if (!finalImageSource) {
      setMessage({ text: 'Por favor, selecione um ícone ou faça upload de uma imagem.', type: 'error' });
      return;
    }
    try {
      let nextOrder = 1;
      if (newCardCategoryId) {
        const catCards = await db.actionCards.where('categoryId').equals(newCardCategoryId).toArray();
        if (catCards.length > 0) nextOrder = Math.max(...catCards.map(c => c.order)) + 1;
      } else {
        const profileCards = await db.actionCards.where('profileId').equals(currentProfileId).toArray();
        const rootCards = profileCards.filter(c => !c.categoryId);
        if (rootCards.length > 0) nextOrder = Math.max(...rootCards.map(c => c.order)) + 1;
      }
      await db.actionCards.add({
        label: newCardLabel.trim().toUpperCase(),
        imageSource: finalImageSource,
        categoryId: newCardCategoryId || undefined,
        order: nextOrder,
        color: newCardColor,
        profileId: currentProfileId
      });
      setMessage({ text: 'Botão criado com sucesso!', type: 'success' });
      closeCreateCardModal();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving card:', err);
      setMessage({ text: 'Erro ao salvar o botão.', type: 'error' });
    }
  };

  // ─── MODAL: Criar Novo Grupo ───────────────────────────────────────────────
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupLabel, setNewGroupLabel] = useState('');
  const [newGroupColorIdx, setNewGroupColorIdx] = useState(0);

  const openCreateGroupModal = () => {
    setNewGroupLabel('');
    setNewGroupColorIdx(0);
    setShowCreateGroupModal(true);
  };

  const closeCreateGroupModal = () => setShowCreateGroupModal(false);

  const handleSaveNewGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupLabel.trim()) {
      setMessage({ text: 'Por favor, insira o nome do grupo.', type: 'error' });
      return;
    }
    const generatedId = newGroupLabel.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
    if (!generatedId) {
      setMessage({ text: 'Nome do grupo inválido.', type: 'error' });
      return;
    }
    const baseId = `${currentProfileId}_${generatedId}`;
    const existing = await db.categories.get(baseId);
    const finalId = existing ? `${baseId}-${Date.now().toString().slice(-4)}` : baseId;

    const preset = COLOR_PRESETS[newGroupColorIdx];
    try {
      const profileCats = await db.categories.where('profileId').equals(currentProfileId).toArray();
      const nextOrder = profileCats.length > 0 ? Math.max(...profileCats.map(c => c.order)) + 1 : 1;
      await db.categories.add({
        id: finalId,
        label: newGroupLabel.trim().toUpperCase(),
        color: preset.color,
        textColor: preset.textColor,
        order: nextOrder,
        profileId: currentProfileId
      });
      setMessage({ text: 'Grupo criado com sucesso!', type: 'success' });
      closeCreateGroupModal();
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error creating group:', err);
      setMessage({ text: 'Erro ao criar o grupo.', type: 'error' });
    }
  };

  // ─── MODAL: Editar Card ────────────────────────────────────────────────────
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editCardLabel, setEditCardLabel] = useState('');
  const [editCardCategoryId, setEditCardCategoryId] = useState('');
  const [editCardImageType, setEditCardImageType] = useState<'icon' | 'upload'>('icon');
  const [editCardSelectedIcon, setEditCardSelectedIcon] = useState('HelpCircle');
  const [editCardUploadedImage, setEditCardUploadedImage] = useState<string | null>(null);
  const [editCardColor, setEditCardColor] = useState('bg-white');

  React.useEffect(() => {
    if (editingCard) {
      setEditCardLabel(editingCard.label);
      setEditCardCategoryId(editingCard.categoryId || '');
      setEditCardColor(editingCard.color || 'bg-white');
      if (editingCard.imageSource.startsWith('data:image')) {
        setEditCardImageType('upload');
        setEditCardUploadedImage(editingCard.imageSource);
      } else {
        setEditCardImageType('icon');
        setEditCardSelectedIcon(editingCard.imageSource);
        setEditCardUploadedImage(null);
      }
    }
  }, [editingCard]);

  const handleEditCardImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await processImage(file);
      setEditCardUploadedImage(compressed);
    } catch (err) {
      console.error('Error uploading edit image:', err);
    }
  };

  const handleSaveCardEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !editCardLabel.trim()) return;
    const finalImageSource = editCardImageType === 'icon' ? editCardSelectedIcon : editCardUploadedImage;
    if (!finalImageSource) {
      alert('Por favor, selecione um ícone ou faça upload de uma imagem.');
      return;
    }
    try {
      const updateData: any = {
        label: editCardLabel.trim().toUpperCase(),
        imageSource: finalImageSource,
        color: editCardColor
      };
      const oldCategoryId = editingCard.categoryId || '';
      const newCategoryId = editCardCategoryId || '';
      if (oldCategoryId !== newCategoryId) {
        updateData.categoryId = editCardCategoryId || undefined;
        let nextOrder = 1;
        if (editCardCategoryId) {
          const catCards = await db.actionCards.where('categoryId').equals(editCardCategoryId).toArray();
          if (catCards.length > 0) nextOrder = Math.max(...catCards.map(c => c.order)) + 1;
        } else {
          const profileCards = await db.actionCards.where('profileId').equals(currentProfileId).toArray();
          const rootCards = profileCards.filter(c => !c.categoryId);
          if (rootCards.length > 0) nextOrder = Math.max(...rootCards.map(c => c.order)) + 1;
        }
        updateData.order = nextOrder;
      }
      await db.actionCards.update(editingCard.id, updateData);
      setEditingCard(null);
      setMessage({ text: 'Botão editado com sucesso!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving card edit:', err);
    }
  };

  // ─── MODAL: Editar Categoria ───────────────────────────────────────────────
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editCategoryLabel, setEditCategoryLabel] = useState('');
  const [editCategoryColorIdx, setEditCategoryColorIdx] = useState(0);

  React.useEffect(() => {
    if (editingCategory) {
      setEditCategoryLabel(editingCategory.label);
      const idx = COLOR_PRESETS.findIndex(p => p.color === editingCategory.color);
      setEditCategoryColorIdx(idx >= 0 ? idx : 0);
    }
  }, [editingCategory]);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategoryLabel.trim()) return;
    const preset = COLOR_PRESETS[editCategoryColorIdx];
    try {
      await db.categories.update(editingCategory.id, {
        label: editCategoryLabel.trim().toUpperCase(),
        color: preset.color,
        textColor: preset.textColor
      });
      setEditingCategory(null);
      setMessage({ text: 'Categoria editada com sucesso!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  // ─── Ações de gerenciamento ────────────────────────────────────────────────
  const handleDeleteCard = async (id?: number) => {
    if (!id) return;
    if (confirm('Deseja realmente excluir este botão?')) {
      await db.actionCards.delete(id);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    const catCards = cards.filter(c => c.categoryId === catId);
    const confirmMsg = catCards.length > 0
      ? `Atenção: A categoria possui ${catCards.length} cartões. Excluir a categoria também excluirá todos os cartões dentro dela. Deseja continuar?`
      : `Deseja realmente excluir esta categoria?`;
    if (confirm(confirmMsg)) {
      await db.transaction('rw', db.categories, db.actionCards, async () => {
        await db.categories.delete(catId);
        if (catCards.length > 0) {
          const cardIds = catCards.map(c => c.id).filter((id): id is number => id !== undefined);
          await db.actionCards.bulkDelete(cardIds);
        }
      });
      setMessage({ text: 'Categoria excluída com sucesso!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleMoveCard = async (cardId: number, direction: 'up' | 'down') => {
    const currentCard = cards.find(c => c.id === cardId);
    if (!currentCard) return;
    const sameCategoryCards = cards
      .filter(c => c.categoryId === currentCard.categoryId)
      .sort((a, b) => a.order - b.order);
    const index = sameCategoryCards.findIndex(c => c.id === cardId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sameCategoryCards.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    await db.transaction('rw', db.actionCards, async () => {
      for (let idx = 0; idx < sameCategoryCards.length; idx++) {
        sameCategoryCards[idx].order = idx + 1;
      }
      const temp = sameCategoryCards[index].order;
      sameCategoryCards[index].order = sameCategoryCards[targetIndex].order;
      sameCategoryCards[targetIndex].order = temp;
      await Promise.all(sameCategoryCards.map(c => db.actionCards.update(c.id!, { order: c.order })));
    });
  };

  const handleMoveCategory = async (catId: string, direction: 'up' | 'down') => {
    const sortedCategories = [...categories].sort((a, b) => a.order - b.order);
    const index = sortedCategories.findIndex(c => c.id === catId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === sortedCategories.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    await db.transaction('rw', db.categories, async () => {
      for (let idx = 0; idx < sortedCategories.length; idx++) {
        sortedCategories[idx].order = idx + 1;
      }
      const temp = sortedCategories[index].order;
      sortedCategories[index].order = sortedCategories[targetIndex].order;
      sortedCategories[targetIndex].order = temp;
      await Promise.all(sortedCategories.map(c => db.categories.update(c.id, { order: c.order })));
    });
  };

  const handleResetData = async () => {
    if (confirm('Atenção: Isso irá remover todas as personalizações e restaurar os cartões de fábrica. Deseja continuar?')) {
      try {
        await resetDatabase();
        setMessage({ text: 'Configurações de fábrica restauradas!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      } catch (err) {
        console.error('Error resetting database:', err);
        setMessage({ text: 'Erro ao restaurar banco de dados.', type: 'error' });
      }
    }
  };

  // ─── DRAG AND DROP ─────────────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedCardId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id.toString());
  };

  const handleDragEnd = () => {
    const id = draggedCardId;
    setDraggedCardId(null);
    setJustDraggedId(id);
    setTimeout(() => {
      setJustDraggedId(null);
    }, 100);
  };

  const handleDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault();
    const draggedIdStr = e.dataTransfer.getData('text/plain');
    const draggedId = parseInt(draggedIdStr, 10);
    if (isNaN(draggedId) || draggedId === targetId) return;

    const activeCatId = activeCategoryId === 'raiz' ? undefined : activeCategoryId;
    const targetCards = cards
      .filter(c => c.categoryId === activeCatId)
      .sort((a, b) => a.order - b.order);

    const draggedIndex = targetCards.findIndex(c => c.id === draggedId);
    const targetIndex = targetCards.findIndex(c => c.id === targetId);
    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...targetCards];
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    await db.transaction('rw', db.actionCards, async () => {
      for (let i = 0; i < reordered.length; i++) {
        const cardToUpdate = reordered[i];
        const newOrder = i + 1;
        if (cardToUpdate.order !== newOrder) {
          await db.actionCards.update(cardToUpdate.id!, { order: newOrder });
        }
      }
    });
  };

  const getIconColorClass = (colorClass: string) => {
    const cleanColor = colorClass.split(' ')[0];
    switch (cleanColor) {
      case 'bg-amber-100': return 'text-amber-700 fill-amber-700/15';
      case 'bg-emerald-100': return 'text-emerald-700 fill-emerald-700/15';
      case 'bg-sky-100': return 'text-sky-700 fill-sky-700/15';
      case 'bg-purple-100': return 'text-purple-700 fill-purple-700/15';
      case 'bg-cyan-100': return 'text-cyan-700 fill-cyan-700/15';
      case 'bg-rose-100': return 'text-rose-700 fill-rose-700/15';
      case 'bg-red-100': return 'text-red-700 fill-red-700/15';
      case 'bg-yellow-100': return 'text-yellow-700 fill-yellow-700/15';
      case 'bg-indigo-100': return 'text-indigo-700 fill-indigo-700/15';
      case 'bg-slate-100': return 'text-slate-700 fill-slate-700/15';
      default: return 'text-blue-600 fill-blue-600/10';
    }
  };

  const getIconSelectorColorClass = (iconName: string, isSelected: boolean) => {
    if (isSelected) {
      return { 
        bg: 'bg-blue-50 border-blue-500 text-blue-600 ring-2 ring-blue-200', 
        fill: 'fill-blue-600/15' 
      };
    }
    const colors = [
      { bg: 'bg-emerald-50/50 hover:bg-emerald-50 border-slate-150 text-emerald-600 hover:border-emerald-300', fill: 'fill-emerald-600/10' },
      { bg: 'bg-amber-50/50 hover:bg-amber-50 border-slate-150 text-amber-600 hover:border-amber-300', fill: 'fill-amber-600/10' },
      { bg: 'bg-sky-50/50 hover:bg-sky-50 border-slate-150 text-sky-600 hover:border-sky-300', fill: 'fill-sky-600/10' },
      { bg: 'bg-purple-50/50 hover:bg-purple-50 border-slate-150 text-purple-600 hover:border-purple-300', fill: 'fill-purple-600/10' },
      { bg: 'bg-rose-50/50 hover:bg-rose-50 border-slate-150 text-rose-600 hover:border-rose-300', fill: 'fill-rose-600/10' }
    ];
    const charSum = iconName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charSum % colors.length];
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col select-none font-sans pb-10">

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-800 m-0 p-0 flex items-center gap-2">
            <LucideIcons.Settings className="text-blue-600" size={24} />
            Painel de Configurações
          </h1>
          <p className="text-xs text-slate-500 m-0">Gerencie categorias e cartões de comunicação</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            Restaurar Padrão
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
          >
            Bloquear Painel (Sair)
          </button>
          <SafeTouch
            onClick={onBackToMain}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
          >
            <LucideIcons.ArrowLeft size={16} />
            Ir para Prancha
          </SafeTouch>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col p-6 gap-6 max-w-7xl mx-auto w-full">

        {/* Mensagem Global */}
        {message && (
          <div className={`p-4 rounded-2xl border text-sm font-semibold animate-fade-in ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Seção de Acessibilidade / Velocidade da Voz */}
        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-fade-in">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <LucideIcons.Accessibility className="text-blue-600" size={20} />
            Acessibilidade / Voz
          </h2>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Velocidade da Fala
              </label>
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {speechRate.toFixed(2)}x
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold">Lenta</span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="flex-grow h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <span className="text-xs text-slate-400 font-semibold">Rápida</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Ajuste a velocidade de fala ao acionar o botão "Falar" na prancha de comunicação.
            </p>
          </div>
        </section>

        {/* Layout Principal de Duas Colunas */}
        <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
          
          {/* 📊 COLUNA ESQUERDA: "Estrutura e Grupos" (40% da Largura) */}
          <div className="w-full lg:w-[40%] flex flex-col gap-5 shrink-0">
            
            {/* Topo: Botões de Ação Rápida Empilhados */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 select-none">Ações Rápidas</h3>
              <button
                type="button"
                onClick={openCreateGroupModal}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider"
              >
                <LucideIcons.FolderPlus size={18} />
                Criar Novo Grupo
              </button>
              <button
                type="button"
                onClick={openCreateCardModal}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider"
              >
                <LucideIcons.Plus size={18} />
                Criar Novo Card
              </button>
            </div>

            {/* Lista de Grupos Ativos */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 flex justify-between items-center select-none">
                <span>Grupos de Comunicação</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {categories.length + 1}
                </span>
              </h3>

              <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin">
                
                {/* Item especial: BOTÕES DA RAIZ */}
                <button
                  type="button"
                  onClick={() => setActiveCategoryId('raiz')}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group cursor-pointer ${
                    activeCategoryId === 'raiz'
                      ? 'bg-blue-50 border-blue-300 text-blue-800 font-extrabold shadow-sm ring-1 ring-blue-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-semibold'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-slate-400 border border-slate-300 shrink-0" />
                    <span className="text-sm uppercase tracking-wide">Sem Grupo (Raiz)</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeCategoryId === 'raiz' ? 'bg-blue-200 text-blue-900' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {cards.filter(c => !c.categoryId).length}
                  </span>
                </button>

                {/* Categorias / Grupos Dinâmicos */}
                {(() => {
                  const sortedCats = [...categories].sort((a, b) => a.order - b.order);
                  return sortedCats.map((cat, catIdx) => {
                    const catCardsCount = cards.filter(c => c.categoryId === cat.id).length;
                    const isSelected = activeCategoryId === cat.id;
                    const isFirst = catIdx === 0;
                    const isLast = catIdx === sortedCats.length - 1;

                    return (
                      <div
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'bg-blue-50 border-blue-300 text-blue-800 font-extrabold shadow-sm ring-1 ring-blue-200'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden mr-2">
                          <span className={`w-3 h-3 rounded-full border border-slate-300 shrink-0 ${cat.color.split(' ')[0]}`} />
                          <span className="text-sm uppercase tracking-wide truncate">{cat.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                            isSelected ? 'bg-blue-200 text-blue-900' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {catCardsCount}
                          </span>
                        </div>

                        {/* Ações do Grupo */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(cat.id, 'up')}
                            disabled={isFirst}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Mover grupo para cima"
                          >
                            <LucideIcons.ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveCategory(cat.id, 'down')}
                            disabled={isLast}
                            className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Mover grupo para baixo"
                          >
                            <LucideIcons.ArrowDown size={14} />
                          </button>
                          <span className="w-px h-4 bg-slate-200 mx-0.5 shrink-0" />
                          <button
                            type="button"
                            onClick={() => setEditingCategory(cat)}
                            className="p-1 text-slate-400 hover:text-[#944a00] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Editar grupo"
                          >
                            <LucideIcons.Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Excluir grupo"
                          >
                            <LucideIcons.Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}

              </div>
            </div>
          </div>

          {/* 👁️ COLUNA DIREITA: "Painel de Pré-visualização Visual" (60% da Largura) */}
          <div className="w-full lg:w-[60%] flex flex-col gap-4 flex-grow">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col flex-grow min-h-[550px] w-full">
              
              {/* Cabeçalho Dinâmico da Prancha */}
              <div className="pb-4 border-b border-slate-100 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 select-none">
                    <LucideIcons.Eye className="text-blue-600" size={18} />
                    Pré-visualização da Prancha
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 select-none">
                    {activeCategoryId === 'raiz' ? (
                      <span>Visualizando: <strong className="text-slate-700 uppercase">Botões da Raiz</strong></span>
                    ) : (
                      <span>
                        Visualizando: <strong className="text-slate-700 uppercase">Grupo &gt; {
                          categories.find(c => c.id === activeCategoryId)?.label || 'Carregando...'
                        }</strong>
                      </span>
                    )}
                  </p>
                </div>
                
                {/* Segmented Control para Alternar Modos: Editar vs Ordenar */}
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 border border-slate-200 items-center">
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                      mode === 'edit'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LucideIcons.Edit size={14} />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('order')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer select-none ${
                      mode === 'order'
                        ? 'bg-white text-blue-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <LucideIcons.ArrowUpDown size={14} />
                    Ordenar
                  </button>
                </div>
              </div>

              {/* Corpo da Pré-visualização */}
              <div className="flex-grow flex flex-col justify-between">
                {(() => {
                  const activeCatId = activeCategoryId === 'raiz' ? undefined : activeCategoryId;
                  const filteredCards = cards
                    .filter(c => c.categoryId === activeCatId)
                    .sort((a, b) => a.order - b.order);

                  if (filteredCards.length === 0) {
                    return (
                      <div className="flex-grow flex flex-col items-center justify-center py-12 px-4 text-center select-none animate-fade-in">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-200 text-slate-300">
                          <LucideIcons.Inbox size={36} className="opacity-70" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide mb-2">Este grupo está vazio</h4>
                        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-4">
                          Este grupo está vazio. Clique em <strong className="text-blue-600 uppercase">"Criar Novo Card"</strong> para adicionar cartões de comunicação a esta categoria.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4">
                      {filteredCards.map((card, idx) => {
                        const isFirst = idx === 0;
                        const isLast = idx === filteredCards.length - 1;
                        const categoryObj = categories.find(c => c.id === card.categoryId);
                        const cardColor = card.color || (categoryObj ? categoryObj.color : 'bg-white');
                        const iconColorClasses = getIconColorClass(cardColor);

                        return (
                          <div
                            key={card.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, card.id!)}
                            onDragOver={(e) => e.preventDefault()}
                            onDragEnd={handleDragEnd}
                            onDrop={(e) => handleDrop(e, card.id!)}
                            onClick={() => {
                              if (mode !== 'edit' || justDraggedId === card.id) return;
                              setEditingCard(card);
                            }}
                            className={`group relative aspect-square border-2 border-slate-200 rounded-3xl flex flex-col items-center justify-between p-3.5 shadow-sm transition-all hover:shadow-md hover:border-blue-400 select-none ${
                              cardColor
                            } ${
                              mode === 'edit' ? 'hover:scale-[1.02] cursor-pointer' : 'cursor-grab active:cursor-grabbing'
                            } ${
                              draggedCardId === card.id ? 'opacity-30 scale-95 border-dashed border-blue-500' : ''
                            }`}
                          >
                            {/* Barra de Ações Superior (Apenas no Modo Editar) */}
                            {mode === 'edit' && (
                              <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs rounded-xl p-0.5 border border-slate-150 shadow-sm" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => setEditingCard(card)}
                                  className="p-1.5 text-slate-500 hover:text-[#944a00] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Editar card"
                                >
                                  <LucideIcons.Edit size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCard(card.id)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Excluir card"
                                >
                                  <LucideIcons.Trash2 size={16} />
                                </button>
                              </div>
                            )}

                            {/* Sobreposição do Modo de Ordenar (Chevron Esquerda/Direita grandes para mobile touch) */}
                            {mode === 'order' && (
                              <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-xs rounded-3xl flex items-center justify-between p-2 gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => handleMoveCard(card.id!, 'up')}
                                  disabled={isFirst}
                                  className="flex-1 h-full bg-white hover:bg-slate-100 disabled:bg-slate-200 disabled:opacity-40 text-slate-700 disabled:text-slate-400 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer border border-slate-200 min-h-[44px]"
                                  title="Mover para esquerda"
                                >
                                  <LucideIcons.ChevronLeft size={24} className="stroke-[2.5]" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveCard(card.id!, 'down')}
                                  disabled={isLast}
                                  className="flex-1 h-full bg-white hover:bg-slate-100 disabled:bg-slate-200 disabled:opacity-40 text-slate-700 disabled:text-slate-400 rounded-2xl flex items-center justify-center shadow-md active:scale-95 transition-all cursor-pointer border border-slate-200 min-h-[44px]"
                                  title="Mover para direita"
                                >
                                  <LucideIcons.ChevronRight size={24} className="stroke-[2.5]" />
                                </button>
                              </div>
                            )}

                            {/* Mini-Card Thumbnail / Imagem ou Ícone com Cores Correspondentes */}
                            <div className="flex-grow flex items-center justify-center w-full mt-4">
                              <div className="w-14 h-14 bg-white/70 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200/50 p-1 shrink-0 select-none shadow-xs">
                                {card.imageSource.startsWith('data:image') ? (
                                  <img src={card.imageSource} alt={card.label} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  React.createElement((LucideIcons as any)[card.imageSource] || LucideIcons.HelpCircle, {
                                    className: `${iconColorClasses} w-8 h-8 stroke-[2]`
                                  })
                                )}
                              </div>
                            </div>

                            {/* Nome do Card */}
                            <div className="text-center w-full truncate font-bold text-[11px] md:text-xs text-slate-800 uppercase tracking-wide shrink-0 pt-2 select-none">
                              {card.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* ═══ MODAL: Criar Novo Card ═══════════════════════════════════════════ */}
      {showCreateCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={closeCreateCardModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
              <LucideIcons.X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full mb-3 border border-blue-100">
                <LucideIcons.Plus size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Criar Novo Card</h3>
              <p className="text-xs text-slate-500 mt-1">Preencha as informações do novo botão de comunicação.</p>
            </div>

            <form onSubmit={handleSaveNewCard} className="space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Botão (Fala / Texto)</label>
                <input
                  type="text"
                  value={newCardLabel}
                  onChange={(e) => setNewCardLabel(e.target.value)}
                  placeholder="Ex: QUERO BRINCAR"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors uppercase font-bold text-sm"
                  autoFocus
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grupo / Categoria</label>
                <select
                  value={newCardCategoryId}
                  onChange={(e) => setNewCardCategoryId(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm font-semibold"
                >
                  <option value="">Raiz (Ações Principais)</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>

              {/* Cor do Card */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cor de Fundo do Card</label>
                <div className="grid grid-cols-6 gap-2 p-2 border border-slate-100 rounded-2xl bg-slate-50">
                  {CARD_COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.color} type="button" onClick={() => setNewCardColor(preset.color)}
                      className={`w-8 h-8 rounded-full border transition-all cursor-pointer ${preset.circleBg} ${
                        newCardColor === preset.color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 border-blue-500 shadow-sm' : 'hover:scale-105'
                      }`}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              {/* Tipo de Imagem */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Imagem</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setNewCardImageType('icon')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${newCardImageType === 'icon' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    Ícone do Sistema
                  </button>
                  <button type="button" onClick={() => setNewCardImageType('upload')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${newCardImageType === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    Fazer Upload / Foto
                  </button>
                </div>
              </div>

              {newCardImageType === 'icon' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione um Ícone ({newCardSelectedIcon})</label>
                  <div className="grid grid-cols-6 gap-2 h-48 overflow-y-auto p-2 border border-slate-100 rounded-2xl">
                    {AVAILABLE_ICONS.map(iconName => {
                      const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
                      const isSel = newCardSelectedIcon === iconName;
                      const colorObj = getIconSelectorColorClass(iconName, isSel);
                      return (
                        <button key={iconName} type="button" onClick={() => setNewCardSelectedIcon(iconName)}
                          className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${colorObj.bg}`}>
                          <Icon size={20} className={colorObj.fill} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Carregar do Aparelho (ou Tirar Foto)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <LucideIcons.UploadCloud className="w-8 h-8 text-slate-400 mb-1.5" />
                    <p className="text-xs text-slate-500 font-semibold">Clique para escolher imagem</p>
                    <p className="text-[10px] text-slate-400">Aceita Câmera e Galeria</p>
                    <input type="file" accept="image/*" onChange={handleNewCardImageUpload} className="hidden" />
                  </label>
                  {isProcessing && <p className="text-xs text-blue-600 font-medium animate-pulse">Comprimindo imagem...</p>}
                  {compressionError && <p className="text-xs text-rose-500 font-medium">{compressionError}</p>}
                  {newCardUploadedImage && (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <img src={newCardUploadedImage} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-sm" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Imagem Processada</p>
                        <p className="text-[10px] text-slate-500">Tamanho: ~{Math.round((newCardUploadedImage.length * 3) / 4 / 1024)} KB</p>
                        <button type="button" onClick={() => setNewCardUploadedImage(null)} className="text-[10px] text-rose-500 font-bold hover:underline mt-1 block">Remover</button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isProcessing} className="flex-grow py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider">
                  Criar Card
                </button>
                <button type="button" onClick={closeCreateCardModal} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Criar Novo Grupo ══════════════════════════════════════════ */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative">
            <button onClick={closeCreateGroupModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
              <LucideIcons.X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-600 rounded-full mb-3 border border-amber-100">
                <LucideIcons.FolderPlus size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Criar Novo Grupo</h3>
              <p className="text-xs text-slate-500 mt-1">Defina um nome e uma cor para o novo grupo de comunicação.</p>
            </div>

            <form onSubmit={handleSaveNewGroup} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Grupo (Categoria)</label>
                <input
                  type="text"
                  value={newGroupLabel}
                  onChange={(e) => setNewGroupLabel(e.target.value)}
                  placeholder="Ex: FRUTAS"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors uppercase font-bold text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cor do Grupo / Estilo</label>
                <div className="grid grid-cols-5 gap-3 p-2 border border-slate-100 rounded-2xl bg-slate-50">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx} type="button" onClick={() => setNewGroupColorIdx(idx)}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${preset.circleBg} ${
                        newGroupColorIdx === idx ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 border-blue-500 shadow-md' : 'hover:scale-105'
                      }`}
                      title={preset.name}
                    >
                      <span className={`text-[10px] font-black ${preset.textColor}`}>A</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-grow py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider">
                  Criar Grupo
                </button>
                <button type="button" onClick={closeCreateGroupModal} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Editar Categoria ══════════════════════════════════════════ */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative">
            <button onClick={() => setEditingCategory(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
              <LucideIcons.X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-[#944a00] rounded-full mb-3 border border-amber-100">
                <LucideIcons.FolderOpen size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Editar Categoria</h3>
              <p className="text-xs text-slate-500 mt-1">Altere as configurações do grupo.</p>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Grupo / Categoria</label>
                <input
                  type="text"
                  value={editCategoryLabel}
                  onChange={(e) => setEditCategoryLabel(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors uppercase font-bold text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cor do Grupo / Estilo</label>
                <div className="grid grid-cols-5 gap-3 p-2 border border-slate-100 rounded-2xl bg-slate-50">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx} type="button" onClick={() => setEditCategoryColorIdx(idx)}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${preset.circleBg} ${
                        editCategoryColorIdx === idx ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 border-blue-500 shadow-md' : 'hover:scale-105'
                      }`}
                      title={preset.name}
                    >
                      <span className={`text-[10px] font-black ${preset.textColor}`}>A</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-grow py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider">
                  Salvar
                </button>
                <button type="button" onClick={() => setEditingCategory(null)} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Editar Card ═══════════════════════════════════════════════ */}
      {editingCard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative overflow-y-auto max-h-[90vh]">
            <button onClick={() => setEditingCard(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100">
              <LucideIcons.X size={20} />
            </button>
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full mb-3 border border-blue-100">
                <LucideIcons.Edit size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Editar Card</h3>
              <p className="text-xs text-slate-500 mt-1">Altere o nome, categoria, imagem e cor do botão.</p>
            </div>

            <form onSubmit={handleSaveCardEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Botão (Fala / Texto)</label>
                <input
                  type="text"
                  value={editCardLabel}
                  onChange={(e) => setEditCardLabel(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors uppercase font-bold text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Grupo / Categoria</label>
                <select
                  value={editCardCategoryId}
                  onChange={(e) => setEditCardCategoryId(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm font-semibold"
                >
                  <option value="">Raiz (Ações Principais)</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Cor de Fundo do Card</label>
                <div className="grid grid-cols-6 gap-2 p-2 border border-slate-100 rounded-2xl bg-slate-50">
                  {CARD_COLOR_PRESETS.map(preset => (
                    <button
                      key={preset.color} type="button" onClick={() => setEditCardColor(preset.color)}
                      className={`w-8 h-8 rounded-full border transition-all cursor-pointer ${preset.circleBg} ${
                        editCardColor === preset.color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110 border-blue-500 shadow-sm' : 'hover:scale-105'
                      }`}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Imagem</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button type="button" onClick={() => setEditCardImageType('icon')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${editCardImageType === 'icon' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    Ícone do Sistema
                  </button>
                  <button type="button" onClick={() => setEditCardImageType('upload')} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${editCardImageType === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                    Fazer Upload / Foto
                  </button>
                </div>
              </div>
              {editCardImageType === 'icon' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione um Ícone ({editCardSelectedIcon})</label>
                  <div className="grid grid-cols-6 gap-2 h-48 overflow-y-auto p-2 border border-slate-100 rounded-2xl">
                    {AVAILABLE_ICONS.map(iconName => {
                      const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
                      const isSel = editCardSelectedIcon === iconName;
                      const colorObj = getIconSelectorColorClass(iconName, isSel);
                      return (
                        <button key={iconName} type="button" onClick={() => setEditCardSelectedIcon(iconName)}
                          className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${colorObj.bg}`}>
                          <Icon size={20} className={colorObj.fill} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Carregar do Aparelho (ou Tirar Foto)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <LucideIcons.UploadCloud className="w-8 h-8 text-slate-400 mb-1.5" />
                    <p className="text-xs text-slate-500 font-semibold">Clique para escolher imagem</p>
                    <p className="text-[10px] text-slate-400">Aceita Câmera e Galeria</p>
                    <input type="file" accept="image/*" onChange={handleEditCardImageUpload} className="hidden" />
                  </label>
                  {isProcessing && <p className="text-xs text-blue-600 font-medium animate-pulse">Comprimindo imagem...</p>}
                  {compressionError && <p className="text-xs text-rose-500 font-medium">{compressionError}</p>}
                  {editCardUploadedImage && (
                    <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                      <img src={editCardUploadedImage} alt="Preview" className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-sm" />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Imagem Processada</p>
                        <p className="text-[10px] text-slate-500">Tamanho: ~{Math.round((editCardUploadedImage.length * 3) / 4 / 1024)} KB</p>
                        <button type="button" onClick={() => setEditCardUploadedImage(null)} className="text-[10px] text-rose-500 font-bold hover:underline mt-1 block">Remover</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={isProcessing} className="flex-grow py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider">
                  Salvar
                </button>
                <button type="button" onClick={() => setEditingCard(null)} className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-sm uppercase tracking-wider">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
