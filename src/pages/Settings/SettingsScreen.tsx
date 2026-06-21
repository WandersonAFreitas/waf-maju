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
  'Hand', 'ThumbsDown', 'Check', 'X', 'HelpCircle', 'Heart', 
  'User', 'UserCheck', 'GraduationCap', 'Users', 
  'Gamepad2', 'Utensils', 'CupSoda', 'Moon', 'MapPin', 'Eye', 
  'Droplet', 'Apple', 'Cookie', 'GlassWater', 
  'Smile', 'Frown', 'Angry', 'BatteryLow', 'Activity', 
  'ToyBrick', 'Tablet', 'Tv', 'Circle', 'BookOpen', 
  'Home', 'School', 'Trees', 'Bath'
];

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBackToMain }) => {
  const { logout } = useCommunicationStore();
  const { processImage, isProcessing, error: compressionError } = useImageProcessor();

  // Queries reativas com Dexie
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray()) || [];
  const cards = useLiveQuery(() => db.actionCards.orderBy('order').toArray()) || [];

  // Form State
  const [label, setLabel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [order, setOrder] = useState('1');
  const [imageType, setImageType] = useState<'icon' | 'upload'>('icon');
  const [selectedIcon, setSelectedIcon] = useState('HelpCircle');
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  
  // UI State
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // State para edição de cards e categorias
  const [editingCardId, setEditingCardId] = useState<number | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryLabel, setCategoryLabel] = useState('');
  const [categoryOrder, setCategoryOrder] = useState('1');

  // Inicializa o form de edição de categoria
  React.useEffect(() => {
    if (editingCategory) {
      setCategoryLabel(editingCategory.label);
      setCategoryOrder(editingCategory.order.toString());
    }
  }, [editingCategory]);

  const handleStartEditCard = (card: any) => {
    setEditingCardId(card.id);
    setLabel(card.label);
    setCategoryId(card.categoryId || '');
    setOrder(card.order.toString());
    if (card.imageSource.startsWith('data:image')) {
      setImageType('upload');
      setUploadedImageBase64(card.imageSource);
    } else {
      setImageType('icon');
      setSelectedIcon(card.imageSource);
      setUploadedImageBase64(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditCard = () => {
    setEditingCardId(null);
    setLabel('');
    setOrder('1');
    setUploadedImageBase64(null);
    setMessage(null);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryLabel.trim()) return;

    try {
      await db.categories.update(editingCategory.id, {
        label: categoryLabel.trim().toUpperCase(),
        order: parseInt(categoryOrder, 10) || 1
      });
      setEditingCategory(null);
      setMessage({ text: 'Categoria editada com sucesso!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving category:', err);
    }
  };

  // Manipulador de upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Processa a imagem para deixá-la leve e no tamanho padrão
      const compressedBase64 = await processImage(file);
      setUploadedImageBase64(compressedBase64);
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  };

  // Salvar novo card ou alterações do card editado
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!label.trim()) {
      setMessage({ text: 'Por favor, insira o nome do botão.', type: 'error' });
      return;
    }

    const finalImageSource = imageType === 'icon' ? selectedIcon : uploadedImageBase64;
    if (!finalImageSource) {
      setMessage({ text: 'Por favor, selecione um ícone ou faça o upload de uma imagem.', type: 'error' });
      return;
    }

    try {
      if (editingCardId !== null) {
        // Modo Edição
        await db.actionCards.update(editingCardId, {
          label: label.trim().toUpperCase(),
          imageSource: finalImageSource,
          categoryId: categoryId || undefined,
          order: parseInt(order, 10) || 1
        });
        setMessage({ text: 'Botão editado com sucesso!', type: 'success' });
        setEditingCardId(null);
      } else {
        // Modo Criação
        const newCard = {
          label: label.trim().toUpperCase(),
          imageSource: finalImageSource,
          categoryId: categoryId || undefined,
          order: parseInt(order, 10) || 1
        };
        await db.actionCards.add(newCard);
        setMessage({ text: 'Botão criado com sucesso!', type: 'success' });
      }

      // Limpa os campos
      setLabel('');
      setOrder('1');
      setUploadedImageBase64(null);
      
      // Remove mensagens após 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving card:', err);
      setMessage({ text: 'Erro ao salvar o botão no banco de dados.', type: 'error' });
    }
  };

  // Excluir um card
  const handleDeleteCard = async (id?: number) => {
    if (!id) return;
    if (confirm('Deseja realmente excluir este botão?')) {
      await db.actionCards.delete(id);
    }
  };

  // Resetar banco de dados para os padrões
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

      {/* Main Content Area */}
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-12 p-6 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Formulário de Cadastro (5 cols no lg) */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
            Criar Novo Botão (Card)
          </h2>

          <form onSubmit={handleSaveCard} className="space-y-4">
            {message && (
              <div
                className={`p-3 rounded-xl border text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}
              >
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Nome do Botão (Fala / Texto)
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Ex: QUERO BRINCAR"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors uppercase font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Grupo / Categoria
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm font-semibold"
                >
                  <option value="">Raiz (Ações Principais)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ordem de Exibição
                </label>
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  min="1"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>

            {/* Tipo de Imagem Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Tipo de Imagem
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setImageType('icon')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    imageType === 'icon' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ícone do Sistema
                </button>
                <button
                  type="button"
                  onClick={() => setImageType('upload')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                    imageType === 'upload' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Fazer Upload / Foto
                </button>
              </div>
            </div>

            {/* Renderizar o seletor correspondente */}
            {imageType === 'icon' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Selecione um Ícone ({selectedIcon})
                </label>
                <div className="grid grid-cols-6 gap-2 h-48 overflow-y-auto p-2 border border-slate-100 rounded-2xl scrollbar-thin scrollbar-thumb-slate-300">
                  {AVAILABLE_ICONS.map((iconName) => {
                    const Icon = (LucideIcons as any)[iconName] || LucideIcons.HelpCircle;
                    const isSelected = selectedIcon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setSelectedIcon(iconName)}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-600 ring-2 ring-blue-200'
                            : 'border-slate-100 hover:border-slate-300 text-slate-600 bg-slate-50'
                        }`}
                      >
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Carregar do Aparelho (ou Tirar Foto)
                </label>
                
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <LucideIcons.UploadCloud className="w-8 h-8 text-slate-400 mb-1.5" />
                      <p className="text-xs text-slate-500 font-semibold">Clique para escolher imagem</p>
                      <p className="text-[10px] text-slate-400">Aceita Câmera e Galeria</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {isProcessing && (
                  <p className="text-xs text-blue-600 font-medium animate-pulse">Comprimindo imagem...</p>
                )}
                {compressionError && (
                  <p className="text-xs text-rose-500 font-medium">{compressionError}</p>
                )}

                {uploadedImageBase64 && (
                  <div className="flex items-center gap-4 p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                    <img
                      src={uploadedImageBase64}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-300 shadow-sm"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-700">Imagem Processada</p>
                      <p className="text-[10px] text-slate-500">Tamanho: ~{Math.round((uploadedImageBase64.length * 3) / 4 / 1024)} KB</p>
                      <button
                        type="button"
                        onClick={() => setUploadedImageBase64(null)}
                        className="text-[10px] text-rose-500 font-bold hover:underline mt-1 block"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="flex-grow py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer mt-4 text-center text-sm"
              >
                {editingCardId !== null ? 'Salvar Alterações' : 'Criar Botão'}
              </button>
              {editingCardId !== null && (
                <button
                  type="button"
                  onClick={handleCancelEditCard}
                  className="py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl transition-all active:scale-[0.98] cursor-pointer mt-4 text-center text-sm"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Gerenciador de Cards (7 cols no lg) */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
            Gerenciar Botões & Categorias
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300">
            
            {/* Categoria: Sem Categoria (Raiz) */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-sm">
              <button
                onClick={() => setExpandedCategoryId(expandedCategoryId === 'raiz' ? null : 'raiz')}
                className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors border-b border-slate-100"
              >
                <span className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-slate-400"></span>
                  BOTOES DA RAIZ ({cards.filter(c => !c.categoryId).length})
                </span>
                {expandedCategoryId === 'raiz' ? (
                  <LucideIcons.ChevronDown size={18} />
                ) : (
                  <LucideIcons.ChevronRight size={18} />
                )}
              </button>

              {expandedCategoryId === 'raiz' && (
                <div className="p-4 bg-slate-50/50 space-y-2">
                  {cards.filter(c => !c.categoryId).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Nenhum botão na raiz.</p>
                  ) : (
                    cards
                      .filter(c => !c.categoryId)
                      .map((card) => (
                        <div
                          key={card.id}
                          className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                              {card.imageSource.startsWith('data:image') ? (
                                <img src={card.imageSource} alt={card.label} className="w-full h-full object-cover" />
                              ) : (
                                React.createElement((LucideIcons as any)[card.imageSource] || LucideIcons.HelpCircle, { size: 20 })
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-800">{card.label}</p>
                              <p className="text-[10px] text-slate-400">Ordem: {card.order}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleStartEditCard(card)}
                              className="p-2 text-[#944a00] hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                              type="button"
                            >
                              <LucideIcons.Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              type="button"
                            >
                              <LucideIcons.Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>

            {/* Listagem das Categorias Reais */}
            {categories.map((cat) => {
              const catCards = cards.filter((c) => c.categoryId === cat.id);
              const isExpanded = expandedCategoryId === cat.id;

              return (
                <div key={cat.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 shadow-sm">
                  <div className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors border-b border-slate-100">
                    <button
                      type="button"
                      onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                      className="flex-grow flex items-center gap-2 text-left"
                    >
                      <span className={`w-3.5 h-3.5 rounded-full border border-slate-300 ${cat.color.split(' ')[0]}`}></span>
                      <span className="text-sm font-bold uppercase tracking-wider">{cat.label}</span>
                      <span className="text-xs text-slate-400 font-semibold">({catCards.length})</span>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCategory(cat);
                        }}
                        className="p-1.5 text-slate-400 hover:text-[#944a00] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <LucideIcons.Edit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                        className="text-slate-400 p-1 cursor-pointer"
                      >
                        {isExpanded ? (
                          <LucideIcons.ChevronDown size={18} />
                        ) : (
                          <LucideIcons.ChevronRight size={18} />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-slate-50/50 space-y-2">
                      {catCards.length === 0 ? (
                        <p className="text-xs text-slate-400 italic">Nenhum botão nesta categoria.</p>
                      ) : (
                        catCards.map((card) => (
                          <div
                            key={card.id}
                            className="flex items-center justify-between bg-white border border-slate-100 rounded-xl p-3 shadow-sm hover:border-slate-200 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200">
                                {card.imageSource.startsWith('data:image') ? (
                                  <img src={card.imageSource} alt={card.label} className="w-full h-full object-cover" />
                                ) : (
                                  React.createElement((LucideIcons as any)[card.imageSource] || LucideIcons.HelpCircle, { size: 20 })
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">{card.label}</p>
                                <p className="text-[10px] text-slate-400">Ordem: {card.order}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleStartEditCard(card)}
                                className="p-2 text-[#944a00] hover:bg-orange-50 rounded-xl transition-colors cursor-pointer"
                                type="button"
                              >
                                <LucideIcons.Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                                type="button"
                              >
                                <LucideIcons.Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
      {/* Modal de Edição de Categoria */}
      {editingCategory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setEditingCategory(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100"
            >
              <LucideIcons.X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-[#944a00] rounded-full mb-3 border border-amber-100">
                <LucideIcons.FolderOpen size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Editar Categoria</h3>
              <p className="text-xs text-slate-500 mt-1">
                Altere o nome e a ordem de exibição do grupo.
              </p>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Nome do Grupo / Categoria
                </label>
                <input
                  type="text"
                  value={categoryLabel}
                  onChange={(e) => setCategoryLabel(e.target.value)}
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors uppercase font-bold text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Ordem de Edição
                </label>
                <input
                  type="number"
                  value={categoryOrder}
                  onChange={(e) => setCategoryOrder(e.target.value)}
                  min="1"
                  className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-sm font-bold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-grow py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center text-sm uppercase tracking-wider"
                >
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-center text-sm uppercase tracking-wider"
                >
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
