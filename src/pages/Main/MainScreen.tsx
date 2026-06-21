import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
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
  Lock,
  Keyboard,
  LayoutGrid,
  Plus
} from 'lucide-react';

interface MainScreenProps {
  onNavigateToSettings: () => void;
  onNavigateToLogin: () => void;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
];

export const MainScreen: React.FC<MainScreenProps> = ({
  onNavigateToSettings,
  onNavigateToLogin
}) => {
  // Zustand State
  const {
    selectedCards,
    activeCategoryId,
    addCard,
    removeLastCard,
    clearPhrase,
    setActiveCategoryId,
    isAuthenticated
  } = useCommunicationStore();

  // Database Queries
  const categories = useLiveQuery(() => db.categories.orderBy('order').toArray()) || [];
  
  const actions = useLiveQuery(async () => {
    if (!activeCategoryId) {
      // Cards sem categoria (raiz)
      return db.actionCards.filter(card => !card.categoryId).sortBy('order');
    } else {
      // Cards da categoria selecionada
      return db.actionCards.where('categoryId').equals(activeCategoryId).sortBy('order');
    }
  }, [activeCategoryId]) || [];

  // Local State
  const [viewMode, setViewMode] = useState<'grid' | 'keyboard'>('grid');
  const [typedText, setTypedText] = useState('');
  const [showParentalModal, setShowParentalModal] = useState(false);
  const [parentalMode, setParentalMode] = useState<'hold' | 'math'>('hold');
  const [holdProgress, setHoldProgress] = useState(0);
  const [mathProblem, setMathProblem] = useState({ q: '', a: 0 });
  const [mathInput, setMathInput] = useState('');
  const [mathError, setMathError] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  // Refs
  const holdIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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

  // Gerador de equações matemáticas
  const generateMathProblem = () => {
    const num1 = Math.floor(Math.random() * 8) + 2; // 2 a 9
    const num2 = Math.floor(Math.random() * 8) + 2; // 2 a 9
    setMathProblem({
      q: `${num1} x ${num2} = ?`,
      a: num1 * num2
    });
    setMathInput('');
    setMathError(false);
  };

  const handleSettingsClick = () => {
    if (isAuthenticated) {
      onNavigateToSettings();
    } else {
      generateMathProblem();
      setShowParentalModal(true);
      setHoldProgress(0);
    }
  };

  const startHoldTimer = () => {
    setHoldProgress(0);
    const startTime = Date.now();
    const duration = 3000;

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        setShowParentalModal(false);
        onNavigateToLogin();
      }
    }, 50);
  };

  const stopHoldTimer = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    setHoldProgress(0);
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(mathInput, 10) === mathProblem.a) {
      setShowParentalModal(false);
      onNavigateToLogin();
    } else {
      setMathError(true);
      setMathInput('');
      setTimeout(generateMathProblem, 1000);
    }
  };

  // Leitura sequencial das palavras da frase
  const speakPhrase = async () => {
    if (selectedCards.length === 0) return;
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('Síntese de voz não suportada neste navegador.');
      return;
    }

    window.speechSynthesis.cancel();

    for (let i = 0; i < selectedCards.length; i++) {
      setSpeakingIndex(i);
      
      await new Promise<void>((resolve) => {
        const textToSpeak = selectedCards[i].label.toLowerCase();
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        
        utterance.lang = 'pt-BR';
        utterance.rate = 0.85;
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
    setSpeakingIndex(null);
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
    setTypedText(prev => prev + char);
  };

  const handleKeyBackspace = () => {
    playClickSound();
    triggerVibrate(8);
    setTypedText(prev => prev.slice(0, -1));
  };

  const handleKeySpace = () => {
    playClickSound();
    triggerVibrate(8);
    setTypedText(prev => prev + ' ');
  };

  const handleKeyAdd = () => {
    if (!typedText.trim()) return;
    playClickSound();
    triggerVibrate(15);
    
    // Adiciona o texto digitado como card temporário
    addCard({
      label: typedText.trim().toUpperCase(),
      imageSource: 'Plus',
      order: 0
    });
    setTypedText('');
  };

  const handleKeyClear = () => {
    playClickSound();
    triggerVibrate(8);
    setTypedText('');
  };

  // Identifica o último card adicionado para destacar na prancha
  const lastAddedCard = selectedCards[selectedCards.length - 1];

  return (
    <div className="flex flex-col h-screen bg-[#f7faf9] overflow-hidden select-none">
      
      {/* 1. BARRA SUPERIOR (CONFORME PROTÓTIPO) */}
      <header className="bg-white border-b border-[#ebeeed] px-4 py-3 flex items-center justify-between gap-3 h-20 shrink-0">
        
        {/* Botão Home */}
        <SafeTouch
          onClick={() => {
            playClickSound();
            setActiveCategoryId(null);
            setViewMode('grid');
          }}
          className="flex items-center justify-center p-3 rounded-xl border-2 border-[#944a00] bg-white hover:bg-orange-50 text-[#944a00] w-14 h-14"
        >
          <Home size={28} />
        </SafeTouch>

        {/* Fila da Frase (Input de Frase) */}
        <div className="flex-grow flex items-center bg-white border border-slate-300 rounded-xl h-14 px-3 overflow-x-auto gap-2">
          {selectedCards.length === 0 ? (
            <span className="text-slate-400 text-sm font-semibold pl-2 uppercase tracking-wide">
              Monte sua frase aqui...
            </span>
          ) : (
            selectedCards.map((card, idx) => (
              <div
                key={`${card.id}-${idx}`}
                className={`flex items-center gap-1.5 px-3 py-1 bg-white border rounded-lg h-10 shadow-sm border-slate-300 shrink-0 ${
                  speakingIndex === idx ? 'ring-2 ring-emerald-500 border-emerald-500' : ''
                }`}
              >
                {card.imageSource.startsWith('data:image') ? (
                  <img src={card.imageSource} alt="" className="w-6 h-6 object-cover rounded" />
                ) : (
                  React.createElement((LucideIcons as any)[card.imageSource] || LucideIcons.HelpCircle, { size: 18, className: 'text-[#944a00]' })
                )}
                <span className="text-xs font-bold text-slate-800 uppercase">{card.label}</span>
              </div>
            ))
          )}
        </div>

        {/* Controles de Frase e Configurações */}
        <div className="flex items-center gap-2">
          {/* Botão APAGAR (Amarelo) */}
          <SafeTouch
            onClick={removeLastCard}
            disabled={selectedCards.length === 0}
            className="flex flex-col items-center justify-center bg-[#fed023] hover:bg-yellow-400 disabled:opacity-40 disabled:cursor-not-allowed border border-[#6f5900]/20 rounded-xl w-14 h-14 shadow-sm"
          >
            <Delete size={20} className="text-[#6f5900]" />
            <span className="text-[9px] font-extrabold text-[#6f5900] tracking-wider mt-0.5 uppercase">Apagar</span>
          </SafeTouch>

          {/* Botão LIMPAR (Vermelho/Rosa) */}
          <SafeTouch
            onClick={clearPhrase}
            disabled={selectedCards.length === 0}
            className="flex flex-col items-center justify-center bg-[#ffdad6] hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-300 rounded-xl w-14 h-14 shadow-sm"
          >
            <Trash2 size={20} className="text-[#93000a]" />
            <span className="text-[9px] font-extrabold text-[#93000a] tracking-wider mt-0.5 uppercase">Limpar</span>
          </SafeTouch>

          {/* Botão FALAR (Verde) */}
          <SafeTouch
            onClick={speakPhrase}
            disabled={selectedCards.length === 0}
            className="flex items-center justify-center gap-2 bg-[#00b05c] hover:bg-[#00964e] active:bg-[#007a3f] text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed px-4 rounded-xl h-14 shadow-md font-bold text-sm uppercase tracking-wider"
          >
            <Volume2 size={22} />
            <span>Falar</span>
          </SafeTouch>
        </div>
      </header>

      {/* 2. ÁREA CENTRAL (GRADE OU TECLADO) */}
      <main className="flex-grow p-4 overflow-hidden flex flex-col justify-center">
        
        {viewMode === 'grid' ? (
          /* MODO GRADE DE COMUNICAÇÃO */
          <div className="flex-grow bg-white border border-[#ebeeed] rounded-2xl p-4 overflow-y-auto shadow-sm">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3 justify-items-center">
              
              {/* Botão voltar dentro da subcategoria */}
              {activeCategoryId && (
                <SafeTouch
                  onClick={() => {
                    playClickSound();
                    setActiveCategoryId(null);
                  }}
                  className="w-32 h-36 p-3 md:w-36 md:h-40 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 rounded-lg flex flex-col items-center justify-between active:scale-95"
                >
                  <span className="font-bold text-center w-full uppercase tracking-wider text-xs block">
                    Voltar
                  </span>
                  <div className="flex items-center justify-center flex-grow">
                    <ChevronLeft size={44} />
                  </div>
                </SafeTouch>
              )}

              {/* Renderização dos cards */}
              {actions.map((card) => {
                const categoryColor = card.categoryId 
                  ? categories.find(c => c.id === card.categoryId)?.color 
                  : 'bg-white';
                const categoryTextColor = card.categoryId
                  ? categories.find(c => c.id === card.categoryId)?.textColor
                  : 'text-slate-800';

                // Verifica se este card foi o último selecionado para aplicar destaque de 3px
                const isSelected = lastAddedCard && lastAddedCard.label === card.label;

                return (
                  <Card
                    key={card.id}
                    label={card.label}
                    imageSource={card.imageSource}
                    color={categoryColor}
                    textColor={categoryTextColor}
                    selected={isSelected}
                    onClick={() => handleCardClick(card)}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          /* MODO TECLADO VIRTUAL DE ALTO CONTRASTE */
          <div className="flex-grow bg-white border border-[#ebeeed] rounded-2xl p-5 flex flex-col gap-4 shadow-sm max-w-4xl mx-auto w-full justify-between">
            
            {/* Campo de Visualização do Texto Digitado */}
            <div className="flex items-center justify-between border-2 border-black rounded-xl p-3 bg-slate-50 h-16">
              <span className="text-2xl font-black text-black tracking-wide uppercase">
                {typedText || 'Digite aqui...'}
              </span>
              {typedText && (
                <button
                  onClick={handleKeyClear}
                  className="p-1 text-slate-500 hover:text-rose-600 rounded-full hover:bg-slate-200"
                >
                  <X size={24} />
                </button>
              )}
            </div>

            {/* Grid de Letras */}
            <div className="flex flex-col gap-2.5">
              {KEYBOARD_ROWS.map((row, rowIdx) => (
                <div key={rowIdx} className="flex justify-center gap-2">
                  {row.map((char) => (
                    <button
                      key={char}
                      onClick={() => handleKeyPress(char)}
                      className="w-12 h-14 sm:w-14 sm:h-16 bg-white border-2 border-black text-black font-black text-xl sm:text-2xl rounded-xl hover:bg-slate-100 active:bg-slate-200 active:scale-95 shadow-sm focus:outline-none"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              ))}

              {/* Linha de Ações Especiais */}
              <div className="flex justify-center gap-2 mt-1">
                {/* Espaço */}
                <button
                  onClick={handleKeySpace}
                  className="flex-grow max-w-[200px] h-14 sm:h-16 bg-white border-2 border-black text-black font-black text-sm uppercase rounded-xl hover:bg-slate-100 active:bg-slate-200"
                >
                  Espaço
                </button>

                {/* Backspace do teclado */}
                <button
                  onClick={handleKeyBackspace}
                  disabled={!typedText}
                  className="w-16 h-14 sm:h-16 bg-white border-2 border-black disabled:opacity-40 text-black font-black flex items-center justify-center rounded-xl hover:bg-slate-100 active:bg-slate-200"
                >
                  <Delete size={26} />
                </button>

                {/* Adicionar à frase (Oversized) */}
                <button
                  onClick={handleKeyAdd}
                  disabled={!typedText.trim()}
                  className="px-6 h-14 sm:h-16 bg-[#00b05c] hover:bg-[#00964e] active:bg-[#007a3f] disabled:bg-slate-200 disabled:border-slate-300 disabled:text-slate-400 border-2 border-black text-white font-black text-sm uppercase rounded-xl flex items-center gap-2 shadow-md transition-all"
                >
                  <Plus size={20} />
                  Adicionar
                </button>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* 3. BARRA INFERIOR (CONFORME PROTÓTIPO - AJUSTADA) */}
      <footer className="h-24 bg-white border-t border-[#ebeeed] px-5 py-4 flex items-center justify-between shrink-0">
        
        {/* Categorias (Alinhado à esquerda) */}
        <div className="flex gap-3 overflow-x-auto max-w-[65%] scrollbar-none py-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                playClickSound();
                setActiveCategoryId(cat.id);
                setViewMode('grid'); // Volta para o grid caso estivesse no teclado
              }}
              className={`px-6 py-3.5 rounded-xl border font-black text-sm tracking-wider uppercase transition-all duration-150 active:scale-95 ${cat.color} ${cat.textColor} ${
                activeCategoryId === cat.id && viewMode === 'grid'
                  ? 'ring-4 ring-amber-200 border-amber-400 scale-95 shadow-inner'
                  : 'border-transparent'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Controles de Modo e Configurações (Alinhado à direita) */}
        <div className="flex items-center gap-3">
          {/* Botão Configurações (Laranja) */}
          <SafeTouch
            onClick={handleSettingsClick}
            className="p-4 border-2 border-orange-200 bg-white text-[#944a00] hover:bg-orange-50 rounded-xl shadow-sm transition-all duration-150 active:scale-95 flex items-center justify-center h-14 w-14"
          >
            <Settings size={26} />
          </SafeTouch>

          {/* Botão de Grade */}
          <button
            onClick={() => {
              playClickSound();
              triggerVibrate(8);
              setViewMode('grid');
            }}
            className={`p-4 border rounded-xl shadow-sm transition-all duration-150 active:scale-95 flex items-center justify-center h-14 w-14 ${
              viewMode === 'grid'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid size={26} />
          </button>

          {/* Botão de Teclado */}
          <button
            onClick={() => {
              playClickSound();
              triggerVibrate(8);
              setViewMode('keyboard');
            }}
            className={`p-4 border rounded-xl shadow-sm transition-all duration-150 active:scale-95 flex items-center justify-center h-14 w-14 ${
              viewMode === 'keyboard'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Keyboard size={26} />
          </button>
        </div>
      </footer>

      {/* 4. MODAL DE TRAVA PARENTAL */}
      {showParentalModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowParentalModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center p-3 bg-amber-50 text-amber-700 rounded-full mb-3 border border-amber-100">
                <Lock size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Controle dos Pais</h3>
              <p className="text-xs text-slate-500 mt-1">
                Resolva o desafio abaixo para acessar as configurações.
              </p>
            </div>

            {/* Abas */}
            <div className="flex border-b border-slate-100 mb-6">
              <button
                onClick={() => setParentalMode('hold')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${
                  parentalMode === 'hold'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Pressionar e Segurar
              </button>
              <button
                onClick={() => {
                  setParentalMode('math');
                  generateMathProblem();
                }}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 text-center transition-colors ${
                  parentalMode === 'math'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Desafio Matemático
              </button>
            </div>

            {/* Segurar */}
            {parentalMode === 'hold' && (
              <div className="flex flex-col items-center justify-center py-4">
                <button
                  onMouseDown={startHoldTimer}
                  onMouseUp={stopHoldTimer}
                  onMouseLeave={stopHoldTimer}
                  onTouchStart={startHoldTimer}
                  onTouchEnd={stopHoldTimer}
                  className="relative w-28 h-28 rounded-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md transition-transform active:scale-95 cursor-pointer select-none"
                  style={{ touchAction: 'none' }}
                >
                  <svg className="absolute inset-0 w-28 h-28 transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      stroke="rgba(255, 255, 255, 0.2)"
                      strokeWidth="6"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="50"
                      stroke="white"
                      strokeWidth="6"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - holdProgress / 100)}
                    />
                  </svg>
                  SEGURE
                </button>
                <p className="mt-4 text-xs text-slate-500 text-center">
                  Mantenha pressionado por 3 segundos para desbloquear.
                </p>
              </div>
            )}

            {/* Matemática */}
            {parentalMode === 'math' && (
              <form onSubmit={handleMathSubmit} className="space-y-4">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl py-6 text-center">
                  <span className="text-3xl font-bold text-slate-700 tracking-wider">
                    {mathProblem.q}
                  </span>
                </div>

                <div>
                  <input
                    type="number"
                    value={mathInput}
                    onChange={(e) => setMathInput(e.target.value)}
                    placeholder="Sua resposta"
                    className={`block w-full text-center py-3 bg-slate-50 border rounded-2xl text-lg font-semibold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${
                      mathError
                        ? 'border-rose-400 focus:border-rose-500 text-rose-600'
                        : 'border-slate-200 focus:border-blue-500 text-slate-800'
                    }`}
                    autoFocus
                  />
                  {mathError && (
                    <p className="text-center text-xs text-rose-500 mt-1.5 font-medium">
                      Resposta incorreta! Tente novamente.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-center text-sm"
                >
                  Confirmar Resposta
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
