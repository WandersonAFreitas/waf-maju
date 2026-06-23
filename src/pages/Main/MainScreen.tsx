import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedProfile } from '../../data/db';
import { useCommunicationStore } from '../../store/useCommunicationStore';
import { Card } from '../../components/ui/Card';
import { SafeTouch } from '../../components/ui/SafeTouch';
import * as LucideIcons from 'lucide-react';
import {
  Home,
  Settings,
  Delete,
  Trash2,
  Volume2,
  ChevronLeft,
  X,
  Keyboard,
  LayoutGrid,
  FolderOpen,
  User,
  Plus
} from 'lucide-react';

interface MainScreenProps {
  onNavigateToSettings: () => void;
}

const KEYBOARD_ROWS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export const MainScreen: React.FC<MainScreenProps> = ({
  onNavigateToSettings
}) => {
  // Zustand State
  const {
    selectedCards,
    activeCategoryId,
    addCard,
    addTypedChar,
    removeLastCard,
    clearPhrase,
    setActiveCategoryId,
    login,
    speechRate,
    currentProfileId,
    currentProfile,
    profiles,
    switchProfile,
    createProfile,
    deleteProfile
  } = useCommunicationStore();

  // Database Queries
  const categories = useLiveQuery(() => 
    db.categories.where('profileId').equals(currentProfileId).sortBy('order')
  , [currentProfileId]) || [];
  
  const actions = useLiveQuery(async () => {
    if (!activeCategoryId) {
      // Cards sem categoria (raiz) do perfil ativo
      const cardsInProfile = await db.actionCards.where('profileId').equals(currentProfileId).toArray();
      return cardsInProfile.filter(card => !card.categoryId).sort((a, b) => a.order - b.order);
    } else {
      // Cards da categoria selecionada
      return db.actionCards.where('categoryId').equals(activeCategoryId).sortBy('order');
    }
  }, [activeCategoryId, currentProfileId]) || [];

  const savedWords = useLiveQuery(() => 
    db.savedWords.where('profileId').equals(currentProfileId).sortBy('order')
  , [currentProfileId]) || [];

  // Local State
  const [viewMode, setViewMode] = useState<'grid' | 'keyboard'>('grid');
  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState<string | null>(null);
  const [settingsAlertMessage, setSettingsAlertMessage] = useState<string | null>(null);
  const [newProfilePassword, setNewProfilePassword] = useState('');
  const [newProfileIsAdmin, setNewProfileIsAdmin] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  // Profile Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Garante que o perfil atual possui seus dados iniciais (seeding)
  useEffect(() => {
    if (currentProfileId) {
      seedProfile(currentProfileId);
    }
  }, [currentProfileId]);

  // Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const phraseInputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para o final quando novos cards/letras são adicionados
  useEffect(() => {
    const timer = setTimeout(() => {
      if (phraseInputRef.current) {
        phraseInputRef.current.scrollLeft = phraseInputRef.current.scrollWidth;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedCards]);

  // Som de clique/feedback tátil
  const playClickSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Ignorar bloqueio de áudio
    }
  };

  const triggerVibrate = (duration = 12) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch (err) {}
    }
  };



  const handleSettingsClick = () => {
    playClickSound();
    triggerVibrate(8);

    if (!currentProfile) return;

    if (!currentProfile.isAdmin) {
      setSettingsAlertMessage('Apenas perfis administradores podem alterar os cards e grupos.');
      return;
    }

    if (currentProfile.password) {
      setShowAdminPasswordModal(true);
      setAdminPasswordInput('');
      setAdminPasswordError(null);
    } else {
      login('admin_verified_token');
      onNavigateToSettings();
    }
  };

  // Leitura sequencial das palavras da frase
  // Leitura sequencial das palavras da frase (incluindo o texto digitado)
  const speakPhrase = async () => {
    const textParts = selectedCards.map((c) => c.label);
    if (textParts.length === 0 || speakingIndex !== null) return;
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Síntese de voz não suportada neste navegador.');
      return;
    }

    try {
      window.speechSynthesis.cancel();

      for (let i = 0; i < textParts.length; i++) {
        setSpeakingIndex(i);
        
        await new Promise<void>((resolve) => {
          const textToSpeak = textParts[i].toLowerCase();
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          
          utterance.lang = 'pt-BR';
          utterance.rate = speechRate;
          utterance.pitch = 1.1;

          const voices = window.speechSynthesis.getVoices();
          const ptVoice = voices.find(
            (v) => v.lang.toLowerCase() === 'pt-br' || v.lang.toLowerCase().replace('_', '-') === 'pt-br'
          );
          if (ptVoice) {
            utterance.voice = ptVoice;
          }

          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          window.speechSynthesis.speak(utterance);
        });
      }
    } catch (error) {
      console.error('Erro na síntese de voz da frase:', error);
    } finally {
      setSpeakingIndex(null);
    }
  };

  const handleCardClick = (card: any) => {
    playClickSound();
    triggerVibrate(12);
    addCard(card);
    
    // Fala a palavra individualmente ao clicar
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(card.label.toLowerCase());
      utterance.lang = 'pt-BR';
      utterance.rate = 0.9;
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.toLowerCase() === 'pt-br' || v.lang.toLowerCase().replace('_', '-') === 'pt-br'
      );
      if (ptVoice) utterance.voice = ptVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Teclado virtual: digitação de letras
  const handleKeyPress = (char: string) => {
    playClickSound();
    triggerVibrate(8);
    addTypedChar(char);

    // Fala a letra/número pressionado
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(char.toLowerCase());
      utterance.lang = 'pt-BR';
      utterance.rate = speechRate;
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.toLowerCase() === 'pt-br' || v.lang.toLowerCase().replace('_', '-') === 'pt-br'
      );
      if (ptVoice) utterance.voice = ptVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleKeyBackspace = () => {
    playClickSound();
    triggerVibrate(8);
    removeLastCard();
  };

  const handleKeySpace = () => {
    playClickSound();
    triggerVibrate(8);
    addTypedChar(' ');
  };

  const handleRemoveLast = () => {
    playClickSound();
    triggerVibrate(8);
    removeLastCard();
  };

  const handleClearAll = () => {
    playClickSound();
    triggerVibrate(10);
    clearPhrase();
  };

  const lastCard = selectedCards[selectedCards.length - 1];
  const canSaveWord = lastCard && lastCard.imageSource === 'Keyboard' && lastCard.label.trim().length > 0;

  const handleSaveCurrentWord = async () => {
    if (!canSaveWord) return;
    const wordToSave = lastCard.label.trim();
    
    // Evita duplicados para o mesmo perfil
    const exists = await db.savedWords
      .where({ profileId: currentProfileId, word: wordToSave })
      .first();
      
    if (exists) {
      alert('Esta palavra já está salva!');
      return;
    }

    const maxOrder = (await db.savedWords.where('profileId').equals(currentProfileId).toArray())
      .reduce((max, w) => w.order > max ? w.order : max, 0);

    await db.savedWords.add({
      word: wordToSave,
      profileId: currentProfileId,
      order: maxOrder + 1
    });

    playClickSound();
    triggerVibrate(8);
  };

  const handleSelectSavedWord = (word: string) => {
    playClickSound();
    triggerVibrate(12);
    
    // Adiciona a palavra salva como um card de teclado para permitir edição/fala posterior
    addCard({
      label: word,
      imageSource: 'Keyboard',
      order: Date.now()
    });
  };

  const handleDeleteSavedWord = async (id: number) => {
    playClickSound();
    triggerVibrate(8);
    await db.savedWords.delete(id);
  };

  // Identifica o último card adicionado para destacar na prancha
  const lastAddedCard = selectedCards[selectedCards.length - 1];

  return (
    <div className="flex flex-col h-screen bg-[#f7faf9] overflow-hidden select-none">
      
      {/* 1. BARRA SUPERIOR (CONFORME PROTÓTIPO - DUAS LINHAS) */}
      <header className="bg-white border-b border-[#ebeeed] px-4 py-3 md:px-6 md:py-4 flex flex-col gap-3 h-auto shrink-0">
        
        {/* Linha 1: Botões de Navegação e Ações Rápidas */}
        <div className="flex items-center justify-between w-full">
          {/* Navegação Principal (Esquerda) */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Botão Home */}
            <SafeTouch
              onClick={() => {
                playClickSound();
                setActiveCategoryId(null);
                setViewMode('grid');
              }}
              className="flex items-center justify-center p-2 md:p-3 rounded-xl border-2 border-[#944a00] bg-white hover:bg-orange-50 text-[#944a00] w-11 h-11 md:w-14 md:h-14 shrink-0 cursor-pointer min-h-[44px] md:min-h-[48px]"
              title="Início"
              style={{ touchAction: 'manipulation' }}
            >
              <Home className="w-5.5 h-5.5 md:w-7 md:h-7" />
            </SafeTouch>

            {/* Botão de Perfil */}
            <SafeTouch
              onClick={() => {
                playClickSound();
                setShowProfileModal(true);
              }}
              className="flex flex-col items-center justify-center p-1 rounded-xl border-2 border-[#944a00] bg-white hover:bg-orange-50 text-[#944a00] w-11 h-11 md:w-14 md:h-14 relative cursor-pointer shrink-0 min-h-[44px] md:min-h-[48px]"
              title="Alternar Perfil"
              style={{ touchAction: 'manipulation' }}
            >
              <User className="w-4.5 h-4.5 md:w-6 md:h-6" />
              <span className="text-[6px] md:text-[8px] font-black text-[#944a00] uppercase truncate w-9 md:w-12 text-center mt-0.5 leading-none">
                {profiles.find(p => p.id === currentProfileId)?.name || 'PADRÃO'}
              </span>
            </SafeTouch>
          </div>

          {/* Controles de Frase (Direita) */}
          <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
            {/* Botão APAGAR (Amarelo) */}
            <SafeTouch
              onClick={handleRemoveLast}
              disabled={selectedCards.length === 0}
              className="flex flex-col items-center justify-center bg-[#fed023] hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed border border-[#6f5900]/20 rounded-xl w-11 h-11 md:w-14 md:h-14 shadow-sm min-h-[44px] md:min-h-[48px] cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              <Delete className="text-[#6f5900] w-4.5 h-4.5 md:w-6 md:h-6" />
              <span className="text-[7px] md:text-[9px] font-extrabold text-[#6f5900] tracking-wider mt-0.5 uppercase leading-none">Apagar</span>
            </SafeTouch>

            {/* Botão LIMPAR (Vermelho/Rosa) */}
            <SafeTouch
              onClick={handleClearAll}
              disabled={selectedCards.length === 0}
              className="flex flex-col items-center justify-center bg-[#ffdad6] hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-300 rounded-xl w-11 h-11 md:w-14 md:h-14 shadow-sm min-h-[44px] md:min-h-[48px] cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              <Trash2 className="text-[#93000a] w-4.5 h-4.5 md:w-6 md:h-6" />
              <span className="text-[7px] md:text-[9px] font-extrabold text-[#93000a] tracking-wider mt-0.5 uppercase leading-none">Limpar</span>
            </SafeTouch>

            {/* Botão FALAR (Verde) */}
            <SafeTouch
              onClick={speakPhrase}
              disabled={selectedCards.length === 0 || speakingIndex !== null}
              className="flex items-center justify-center gap-1 md:gap-2 bg-[#00b05c] hover:bg-[#00964e] active:bg-[#007a3f] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed px-2.5 md:px-4 rounded-xl h-11 md:h-14 shadow-md font-bold text-[10px] md:text-sm uppercase tracking-wider min-h-[44px] md:min-h-[48px] cursor-pointer"
              style={{ touchAction: 'manipulation' }}
            >
              <Volume2 className="w-4.5 h-4.5 md:w-6 md:h-6" />
              <span>Falar</span>
            </SafeTouch>
          </div>
        </div>

        {/* Linha 2: Fila da Frase (Input de Frase) - Abaixo dos botões, largura total */}
        <div ref={phraseInputRef} className="w-full flex items-center bg-white border border-slate-300 rounded-xl h-11 md:h-14 px-3 overflow-x-auto gap-1.5 md:gap-2 scrollbar-none">
          {selectedCards.length === 0 ? (
            <span className="text-slate-400 text-xs md:text-sm font-semibold pl-2 uppercase tracking-wide select-none">
              Monte sua frase aqui...
            </span>
          ) : (
            <>
              {selectedCards.map((card, idx) => {
                const isKeyboard = card.imageSource === 'Keyboard';
                const isSpeaking = speakingIndex === idx;

                if (isKeyboard) {
                  return (
                    <div
                      key={`${card.id || idx}-${idx}`}
                      className={`flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 bg-[#ffdcc5] border border-amber-300 rounded-lg h-7 md:h-10 shadow-sm shrink-0 ${
                        isSpeaking ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
                      }`}
                    >
                      <Keyboard className="text-[#944a00] w-4 h-4 md:w-5 md:h-5" />
                      <span className="text-[10px] md:text-xs font-bold text-slate-800 uppercase tracking-wider">{card.label}</span>
                      {idx === selectedCards.length - 1 && viewMode === 'keyboard' && (
                        <span className="animate-pulse h-3 w-0.5 bg-[#944a00] inline-block"></span>
                      )}
                    </div>
                  );
                }

                return (
                  <div
                    key={`${card.id || idx}-${idx}`}
                    className={`flex items-center gap-1.5 px-2 py-0.5 md:px-3 md:py-1 bg-white border rounded-lg h-7 md:h-10 shadow-sm border-slate-300 shrink-0 ${
                      isSpeaking ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
                    }`}
                  >
                    {card.imageSource.startsWith('data:image') ? (
                      <img src={card.imageSource} alt="" className="w-5 h-5 md:w-6 md:h-6 object-cover rounded" />
                    ) : (
                      React.createElement((LucideIcons as any)[card.imageSource] || LucideIcons.HelpCircle, {
                        className: 'text-[#944a00] w-4 h-4 md:w-5 md:h-5'
                      })
                    )}
                    <span className="text-[10px] md:text-xs font-bold text-slate-800 uppercase">{card.label}</span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </header>

      {/* 2. ÁREA CENTRAL (GRADE OU TECLADO) */}
      <main className={`flex-grow overflow-hidden flex flex-col justify-center ${viewMode === 'keyboard' ? 'p-0' : 'p-2 sm:p-4'}`}>
        
        {viewMode === 'grid' ? (
          /* MODO GRADE DE COMUNICAÇÃO */
          <div className="flex-grow bg-white border border-[#ebeeed] rounded-2xl p-2.5 sm:p-4 overflow-hidden shadow-sm flex flex-col gap-2.5 sm:gap-4">
            
            {/* Categorias no topo da prancha principal - Responsiva (Scroll em Celular, Fixa em Tablet) */}
            <div className="flex overflow-x-auto whitespace-nowrap scrollbar-none snap-x gap-2 sm:gap-3 pb-3 border-b border-[#ebeeed] shrink-0 items-center w-full">
              {/* Botão Geral */}
              <button
                onClick={() => {
                  playClickSound();
                  setActiveCategoryId(null);
                }}
                className={`w-[120px] h-28 p-2 sm:w-32 sm:h-36 sm:p-3 md:w-36 md:h-40 rounded-lg border-2 font-bold text-[10px] sm:text-xs md:text-sm tracking-wider uppercase transition-all duration-150 active:scale-95 cursor-pointer flex flex-col justify-between shrink-0 min-w-[120px] snap-center min-h-[48px] ${
                  !activeCategoryId
                    ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                <span className="font-bold text-center w-full truncate uppercase tracking-wider text-[10px] sm:text-xs block mb-1">
                  Geral
                </span>
                <div className="flex items-center justify-center w-full flex-grow">
                  <LayoutGrid className="w-8 h-8 sm:w-11 sm:h-11" />
                </div>
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    playClickSound();
                    setActiveCategoryId(cat.id);
                  }}
                  className={`w-[120px] h-28 p-2 sm:w-32 sm:h-36 sm:p-3 md:w-36 md:h-40 rounded-lg border-2 font-bold text-[10px] sm:text-xs md:text-sm tracking-wider uppercase transition-all duration-150 active:scale-95 cursor-pointer flex flex-col justify-between shrink-0 min-w-[120px] snap-center min-h-[48px] ${cat.color} ${cat.textColor} ${
                    activeCategoryId === cat.id
                      ? 'ring-4 ring-amber-200 border-amber-400 scale-95 shadow-inner'
                      : 'border-slate-300'
                  }`}
                  style={{ touchAction: 'manipulation' }}
                >
                  <span className="font-bold text-center w-full truncate uppercase tracking-wider text-[10px] sm:text-xs block mb-1">
                    {cat.label}
                  </span>
                  <div className="flex items-center justify-center w-full flex-grow">
                    <FolderOpen className="w-8 h-8 sm:w-11 sm:h-11" />
                  </div>
                </button>
              ))}
            </div>

            {/* Grade de Cards Adaptativa */}
            <div className="flex-grow overflow-y-auto pr-1">
              <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2 sm:gap-3 md:gap-4 justify-items-center">
                
                {/* Botão voltar dentro da subcategoria */}
                {activeCategoryId && (
                  <SafeTouch
                    onClick={() => {
                      playClickSound();
                      setActiveCategoryId(null);
                    }}
                    className="w-full max-w-[144px] h-28 sm:w-32 sm:h-36 md:w-36 md:h-40 p-2 sm:p-3 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 rounded-lg flex flex-col items-center justify-between active:scale-95 cursor-pointer min-h-[48px]"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <span className="font-bold text-center w-full uppercase tracking-wider text-xs md:text-sm block">
                      Voltar
                    </span>
                    <div className="flex items-center justify-center flex-grow">
                      <ChevronLeft className="w-8 h-8 sm:w-11 sm:h-11 md:w-12 md:h-12" />
                    </div>
                  </SafeTouch>
                )}

                {/* Cards da Prancha */}
                {actions.map((card) => {
                  const categoryObj = card.categoryId ? categories.find(c => c.id === card.categoryId) : null;
                  
                  // Se o card tiver cor customizada, usa ela; senão usa a cor da categoria, ou bg-white por padrão
                  const cardColor = card.color 
                    ? card.color 
                    : (categoryObj ? categoryObj.color : 'bg-white');

                  const cardTextColor = card.color
                    ? 'text-slate-900 font-bold'
                    : (categoryObj ? categoryObj.textColor : 'text-slate-800');

                  const isSelected = lastAddedCard && lastAddedCard.label === card.label;

                  return (
                    <Card
                      key={card.id}
                      label={card.label}
                      imageSource={card.imageSource}
                      color={cardColor}
                      textColor={cardTextColor}
                      selected={isSelected}
                      onClick={() => handleCardClick(card)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* MODO TECLADO VIRTUAL DE ALTO CONTRASTE */
          <div className="flex-grow bg-white flex flex-col w-full h-full justify-between p-3 md:p-5 gap-3">
            
            {/* Opção para guardar palavras digitadas e selecionar palavras armazenadas */}
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 shrink-0 overflow-x-auto w-full scrollbar-none min-h-[56px]">
              
              {/* Botão de Salvar Palavra */}
              <SafeTouch
                onClick={handleSaveCurrentWord}
                disabled={!canSaveWord}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[44px] md:min-h-[48px] transition-all active:scale-95 select-none uppercase tracking-wider shadow-sm"
                title="Salvar palavra digitada"
                style={{ touchAction: 'manipulation' }}
              >
                <Plus className="w-4 h-4 md:w-5 md:h-5" />
                <span>Salvar</span>
              </SafeTouch>

              {/* Divisor */}
              <div className="w-px h-8 bg-slate-300 shrink-0" />

              {/* Lista de Palavras Armazenadas */}
              {savedWords.length === 0 ? (
                <span className="text-slate-400 text-xs pl-1 italic select-none">Nenhuma palavra salva...</span>
              ) : (
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
                  {savedWords.map((item) => (
                    <div 
                      key={item.id}
                      className="inline-flex items-center bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl shrink-0 transition-all select-none min-h-[44px] md:min-h-[48px] overflow-hidden"
                    >
                      <button
                        onClick={() => handleSelectSavedWord(item.word)}
                        className="text-slate-800 font-extrabold uppercase text-xs tracking-wider cursor-pointer h-full px-3 flex items-center min-h-[44px] md:min-h-[48px]"
                        title={`Inserir "${item.word}"`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {item.word}
                      </button>
                      <div className="w-px h-6 bg-slate-300 shrink-0" />
                      <button
                        onClick={() => handleDeleteSavedWord(item.id!)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-100 cursor-pointer flex items-center justify-center w-10 h-full min-h-[44px] md:min-h-[48px] transition-colors"
                        title="Excluir"
                        style={{ touchAction: 'manipulation' }}
                      >
                        <X className="w-4 h-4 md:w-4.5 md:h-4.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Grid de Letras Simétrico em Grade 20x5 */}
            <div 
              className="flex-grow grid gap-3 w-full h-full"
              style={{ 
                gridTemplateColumns: 'repeat(20, minmax(0, 1fr))',
                gridTemplateRows: 'repeat(5, minmax(0, 1fr))' 
              }}
            >
              {/* Row 1: Números (10 teclas, cada uma ocupa 2 colunas) */}
              {KEYBOARD_ROWS[0].map((char) => (
                <button
                  key={char}
                  onClick={() => handleKeyPress(char)}
                  className="bg-white border-2 border-black text-black font-black text-lg sm:text-2xl rounded-xl hover:bg-slate-100 active:bg-slate-200 active:scale-95 shadow-sm focus:outline-none flex items-center justify-center h-full w-full cursor-pointer min-h-[48px]"
                  style={{ gridColumn: 'span 2 / span 2', touchAction: 'manipulation' }}
                >
                  {char}
                </button>
              ))}

              {/* Row 2: Q-P (10 teclas, cada uma ocupa 2 colunas) */}
              {KEYBOARD_ROWS[1].map((char) => (
                <button
                  key={char}
                  onClick={() => handleKeyPress(char)}
                  className="bg-white border-2 border-black text-black font-black text-lg sm:text-2xl rounded-xl hover:bg-slate-100 active:bg-slate-200 active:scale-95 shadow-sm focus:outline-none flex items-center justify-center h-full w-full cursor-pointer min-h-[48px]"
                  style={{ gridColumn: 'span 2 / span 2', touchAction: 'manipulation' }}
                >
                  {char}
                </button>
              ))}

              {/* Row 3: A-L (9 teclas, com espaçamento de 1 coluna em cada lado) */}
              <div style={{ gridColumn: 'span 1 / span 1' }} />
              {KEYBOARD_ROWS[2].map((char) => (
                <button
                  key={char}
                  onClick={() => handleKeyPress(char)}
                  className="bg-white border-2 border-black text-black font-black text-lg sm:text-2xl rounded-xl hover:bg-slate-100 active:bg-slate-200 active:scale-95 shadow-sm focus:outline-none flex items-center justify-center h-full w-full cursor-pointer min-h-[48px]"
                  style={{ gridColumn: 'span 2 / span 2', touchAction: 'manipulation' }}
                >
                  {char}
                </button>
              ))}
              <div style={{ gridColumn: 'span 1 / span 1' }} />

              {/* Row 4: Z-M (7 teclas, com espaçamento de 3 colunas em cada lado) */}
              <div style={{ gridColumn: 'span 3 / span 3' }} />
              {KEYBOARD_ROWS[3].map((char) => (
                <button
                  key={char}
                  onClick={() => handleKeyPress(char)}
                  className="bg-white border-2 border-black text-black font-black text-lg sm:text-2xl rounded-xl hover:bg-slate-100 active:bg-slate-200 active:scale-95 shadow-sm focus:outline-none flex items-center justify-center h-full w-full cursor-pointer min-h-[48px]"
                  style={{ gridColumn: 'span 2 / span 2', touchAction: 'manipulation' }}
                >
                  {char}
                </button>
              ))}
              <div style={{ gridColumn: 'span 3 / span 3' }} />

              {/* Row 5: Ações Especiais (Espaço 12 colunas, Apagar 5 colunas, Limpar 3 colunas) */}
              {/* Espaço */}
              <button
                onClick={handleKeySpace}
                className="bg-white border-2 border-black text-black font-black text-sm sm:text-lg uppercase rounded-xl hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center shadow-sm h-full w-full cursor-pointer min-h-[48px]"
                style={{ gridColumn: 'span 12 / span 12', touchAction: 'manipulation' }}
              >
                Espaço
              </button>

              {/* Backspace do teclado */}
              <button
                onClick={handleKeyBackspace}
                className="bg-white border-2 border-black text-black font-black flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200 shadow-sm h-full w-full cursor-pointer min-h-[48px]"
                style={{ gridColumn: 'span 5 / span 5', touchAction: 'manipulation' }}
                title="Apagar"
              >
                <Delete className="w-5 h-5 sm:w-6.5 sm:h-6.5" />
              </button>

              {/* Limpar */}
              <button
                onClick={handleClearAll}
                className="bg-[#ffdad6] hover:bg-red-200 border-2 border-black text-[#93000a] font-black flex items-center justify-center rounded-xl active:scale-95 shadow-sm h-full w-full cursor-pointer min-h-[48px]"
                style={{ gridColumn: 'span 3 / span 3', touchAction: 'manipulation' }}
                title="Limpar tudo"
              >
                <Trash2 className="w-5 h-5 sm:w-6.5 sm:h-6.5" />
              </button>
            </div>

          </div>
        )}
      </main>

      {/* 3. BARRA INFERIOR (CONFORME PROTÓTIPO - AJUSTADA) */}
      <footer className="h-16 bg-white border-t border-[#ebeeed] flex items-center justify-between shrink-0 overflow-hidden">
        
        {/* Marca do sistema (Alinhado à esquerda) */}
        <div className="flex items-center gap-2 px-6 h-full text-sm font-black text-slate-400 uppercase tracking-widest select-none">
          <span>WFreitas Solution</span>
          <span className="text-[10px] font-semibold text-slate-400/80 lowercase mt-0.5 select-none">v{import.meta.env.VITE_APP_VERSION || '1.0.0'}</span>
        </div>

        {/* Controles de Modo e Configurações (Alinhado à direita) */}
        <div className="flex h-full items-stretch border-l border-[#ebeeed]">
          {/* Botão de Grade */}
          <button
            onClick={() => {
              playClickSound();
              triggerVibrate(8);
              setViewMode('grid');
            }}
            className={`px-6 h-full transition-all duration-150 active:scale-95 flex items-center justify-center border-r border-[#ebeeed] min-h-[48px] cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <LayoutGrid className="w-6 h-6" />
          </button>

          {/* Botão de Teclado */}
          <button
            onClick={() => {
              playClickSound();
              triggerVibrate(8);
              setViewMode('keyboard');
            }}
            className={`px-6 h-full transition-all duration-150 active:scale-95 flex items-center justify-center border-r border-[#ebeeed] min-h-[48px] cursor-pointer ${
              viewMode === 'keyboard'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
            style={{ touchAction: 'manipulation' }}
          >
            <Keyboard className="w-6 h-6" />
          </button>

          {/* Botão Configurações (Laranja) - Agora o Último */}
          <SafeTouch
            onClick={handleSettingsClick}
            className="px-6 h-full bg-white text-[#944a00] hover:bg-orange-50 transition-all duration-150 active:scale-95 flex items-center justify-center min-h-[48px] cursor-pointer"
            style={{ touchAction: 'manipulation' }}
          >
            <Settings className="w-6 h-6" />
          </SafeTouch>
        </div>
      </footer>

      {/* 4. MODAL DE AVISO DE ACESSO RESTRITO */}
      {settingsAlertMessage && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="inline-flex items-center justify-center p-3 bg-rose-50 text-rose-600 rounded-full mb-3 border border-rose-100">
              <LucideIcons.ShieldAlert size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Acesso Restrito</h3>
            <p className="text-sm text-slate-500 mt-2">
              {settingsAlertMessage}
            </p>
            <button
              onClick={() => setSettingsAlertMessage(null)}
              className="mt-5 w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer text-sm"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* 4.1. MODAL DE SENHA DO ADMINISTRADOR */}
      {showAdminPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                setShowAdminPasswordModal(false);
                setAdminPasswordInput('');
                setAdminPasswordError(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full mb-3 border border-blue-100">
                <LucideIcons.Lock size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Senha do Administrador</h3>
              <p className="text-xs text-slate-500 mt-1">
                Digite a senha do perfil "{currentProfile?.name}" para acessar as configurações.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setAdminPasswordError(null);
                if (currentProfile?.password === adminPasswordInput) {
                  login('admin_verified_token');
                  setShowAdminPasswordModal(false);
                  setAdminPasswordInput('');
                  onNavigateToSettings();
                } else {
                  setAdminPasswordError('Senha incorreta! Tente novamente.');
                }
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="Digite a senha"
                  className={`block w-full text-center py-3 bg-slate-50 border rounded-2xl text-lg font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                    adminPasswordError
                      ? 'border-rose-400 focus:border-rose-500 text-rose-600'
                      : 'border-slate-200 focus:border-blue-500 text-slate-800'
                  }`}
                  autoFocus
                />
                {adminPasswordError && (
                  <p className="text-center text-xs text-rose-500 mt-1.5 font-medium">
                    {adminPasswordError}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-center text-sm"
              >
                Acessar Painel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL DE GERENCIAMENTO DE PERFIS */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-orange-50 text-[#944a00] rounded-full mb-3 border border-orange-100">
                <User size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide">Trocar ou Criar Perfil</h3>
              <p className="text-xs text-slate-500 mt-1">
                Alterne entre perfis locais ou cadastre novos usuários.
              </p>
            </div>

            {/* List of profiles as cards */}
            <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto mb-6 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {profiles.map((profile) => {
                const isActive = profile.id === currentProfileId;
                const hasPassword = !!profile.password;
                const isAdminProfile = !!profile.isAdmin;

                return (
                  <div
                    key={profile.id}
                    className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md ${
                      isActive
                        ? 'bg-orange-50 border-[#944a00] text-orange-950 font-bold'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                    }`}
                    onClick={async () => {
                      if (isActive) return;
                      if (hasPassword) {
                        const enteredPassword = prompt(`Digite a senha para acessar o perfil "${profile.name}":`);
                        if (enteredPassword === null) return;
                        const success = await switchProfile(profile.id!, enteredPassword);
                        if (!success) {
                          alert('Senha incorreta!');
                        } else {
                          setShowProfileModal(false);
                        }
                      } else {
                        await switchProfile(profile.id!);
                        setShowProfileModal(false);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <User className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#944a00]' : 'text-slate-400'}`} />
                          <span className="text-xs uppercase tracking-wide truncate max-w-[80px]">
                            {profile.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {isAdminProfile && (
                            <span title="Administrador">
                              <LucideIcons.Shield className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                            </span>
                          )}
                          {hasPassword && (
                            <span title="Protegido por senha">
                              <LucideIcons.Lock className="w-3.5 h-3.5 text-slate-400" />
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-medium">
                        {isAdminProfile ? 'Administrador' : 'Comum'}
                      </span>
                    </div>

                    {/* Botão de Excluir Perfil */}
                    {profile.id !== 'default' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Deseja realmente excluir o perfil "${profile.name}" e todas as suas configurações?`)) {
                            await deleteProfile(profile.id!);
                          }
                        }}
                        className="absolute bottom-2 right-2 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Excluir perfil"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Form to create new profile */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (newProfileName.trim()) {
                  await createProfile(newProfileName, newProfileIsAdmin, newProfilePassword);
                  setNewProfileName('');
                  setNewProfileIsAdmin(false);
                  setNewProfilePassword('');
                }
              }}
              className="border-t border-slate-100 pt-4 space-y-3"
            >
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                Criar Novo Perfil
              </label>
              
              <div className="flex flex-col gap-2.5">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Nome do perfil"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-[#944a00]/20 focus:border-[#944a00]"
                />
                
                <input
                  type="password"
                  value={newProfilePassword}
                  onChange={(e) => setNewProfilePassword(e.target.value)}
                  placeholder="Senha (deixe em branco para sem senha)"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#944a00]/20 focus:border-[#944a00]"
                />
                <p className="text-[9px] text-slate-400 italic -mt-1.5 px-1">
                  Opcional. Deixe em branco para acessar sem senha.
                </p>

                <div className="flex items-center justify-between px-1 py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={newProfileIsAdmin}
                      onChange={(e) => setNewProfileIsAdmin(e.target.checked)}
                      className="rounded text-[#944a00] focus:ring-[#944a00] w-4 h-4"
                    />
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Administrador
                    </span>
                  </label>
                  
                  <button
                    type="submit"
                    disabled={!newProfileName.trim()}
                    className="px-4 py-2 bg-[#944a00] hover:bg-[#7a3c00] disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Criar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
