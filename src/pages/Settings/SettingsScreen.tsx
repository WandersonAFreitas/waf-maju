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

  // Salvar novo card
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
      const newCard = {
        label: label.trim().toUpperCase(),
        imageSource: finalImageSource,
        categoryId: categoryId || undefined,
        order: parseInt(order, 10) || 1
      };

      await db.actionCards.add(newCard);
      setMessage({ text: 'Botão criado com sucesso!', type: 'success' });
      
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

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer mt-4 text-center text-sm"
            >
              Criar Botão
            </button>
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
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <LucideIcons.Trash2 size={16} />
                          </button>
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
                  <button
                    onClick={() => setExpandedCategoryId(isExpanded ? null : cat.id)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors border-b border-slate-100"
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full border border-slate-300 ${cat.color.split(' ')[0]}`}></span>
                      {cat.label} ({catCards.length})
                    </span>
                    {isExpanded ? (
                      <LucideIcons.ChevronDown size={18} />
                    ) : (
                      <LucideIcons.ChevronRight size={18} />
                    )}
                  </button>

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
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <LucideIcons.Trash2 size={16} />
                            </button>
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
    </div>
  );
};
