import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { useCommunicationStore } from '../../store/useCommunicationStore';
import { Card } from '../../components/ui/Card';
import { SafeTouch } from '../../components/ui/SafeTouch';
import {
  Home,
  Settings,
  Delete,
  Trash2,
  Play,
  ChevronLeft,
  X,
  Lock
} from 'lucide-react';

interface MainScreenProps {
  onNavigateToSettings: () => void;
  onNavigateToLogin: () => void;
}

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
  const [showParentalModal, setShowParentalModal] = useState(false);
  const [parentalMode, setParentalMode] = useState<'hold' | 'math'>('hold'); // 'hold' ou 'math'
  const [holdProgress, setHoldProgress] = useState(0);
  const [mathProblem, setMathProblem] = useState({ q: '', a: 0 });
  const [mathInput, setMathInput] = useState('');
  const [mathError, setMathError] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);

  // Refs
  const holdIntervalRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Som sutil de feedback (opcional, mas adiciona um toque premium e acessível)
  const playClickSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Navegadores podem bloquear áudio antes de interação, falhar silenciosamente
    }
  };

  // Gerador de conta matemática para a trava parental
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

  // Abre o modal de controle dos pais
  const handleSettingsClick = () => {
    if (isAuthenticated) {
      onNavigateToSettings();
    } else {
      generateMathProblem();
      setShowParentalModal(true);
      setHoldProgress(0);
    }
  };

  // Lógica do botão de segurar 3s
  const startHoldTimer = () => {
    setHoldProgress(0);
    const startTime = Date.now();
    const duration = 3000; // 3 segundos

    holdIntervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setHoldProgress(progress);

      if (progress >= 100) {
        clearInterval(holdIntervalRef.current!);
        holdIntervalRef.current = null;
        // Sucesso na trava parental
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

  // Limpa o timer caso o componente seja desmontado
  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

  // Validação da resposta matemática
  const handleMathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(mathInput, 10) === mathProblem.a) {
      setShowParentalModal(false);
      onNavigateToLogin();
    } else {
      setMathError(true);
      setMathInput('');
      // Regenera o problema após erro
      setTimeout(generateMathProblem, 1000);
    }
  };

  // Executa a fala sequencial dos cards
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
        utterance.rate = 0.85; // Leitura um pouco mais lenta e clara
        utterance.pitch = 1.1;

        // Tenta achar voz em português
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
    addCard(card);
    // Fala o card individualmente ao clicar
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

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden select-none">
      
      {/* 1. BARRA SUPERIOR (CONTROLES E FRASE) */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-4 h-24 shrink-0">
        
        {/* Botão Home / Resetar Categorias */}
        <SafeTouch
          onClick={() => setActiveCategoryId(null)}
          className="flex flex-col items-center justify-center p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 min-w-16 h-16 border border-slate-200"
        >
          <Home size={24} />
          <span className="text-[10px] font-bold mt-1">INÍCIO</span>
        </SafeTouch>

        {/* Fila de Frase (Cards Selecionados) */}
        <div className="flex-grow flex items-center bg-slate-50 border border-slate-200 rounded-2xl h-16 px-3 overflow-x-auto gap-2 scrollbar-thin scrollbar-thumb-slate-300">
          {selectedCards.length === 0 ? (
            <span className="text-slate-400 text-sm font-medium pl-2 uppercase tracking-wider">
              Toque nos cartões abaixo para formar sua frase...
            </span>
          ) : (
            selectedCards.map((card, idx) => (
              <div
                key={`${card.id}-${idx}`}
                className={`transform transition-all ${
                  speakingIndex === idx
                    ? 'scale-105 ring-4 ring-emerald-400 border-emerald-400'
                    : ''
                }`}
              >
                <Card
                  label={card.label}
                  imageSource={card.imageSource}
                  size="sm"
                  color={
                    speakingIndex === idx
                      ? 'bg-emerald-50 border-emerald-400'
                      : card.categoryId 
                        ? categories.find(c => c.id === card.categoryId)?.color 
                        : 'bg-white border-slate-200'
                  }
                />
              </div>
            ))
          )}
        </div>

        {/* Botões de Ação da Frase */}
        <div className="flex items-center gap-2 h-16">
          {/* Backspace */}
          <SafeTouch
            onClick={removeLastCard}
            disabled={selectedCards.length === 0}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 disabled:opacity-40 disabled:cursor-not-allowed border border-amber-200 w-16 h-16"
          >
            <Delete size={24} />
            <span className="text-[10px] font-bold mt-1">APAGAR</span>
          </SafeTouch>

          {/* Limpar tudo */}
          <SafeTouch
            onClick={clearPhrase}
            disabled={selectedCards.length === 0}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-800 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-200 w-16 h-16"
          >
            <Trash2 size={24} />
            <span className="text-[10px] font-bold mt-1">LIMPAR</span>
          </SafeTouch>

          {/* Falar Frase */}
          <SafeTouch
            onClick={speakPhrase}
            disabled={selectedCards.length === 0}
            className="flex flex-col items-center justify-center px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white disabled:bg-slate-300 disabled:cursor-not-allowed shadow-md h-16 min-w-24"
          >
            <Play size={28} fill="white" />
            <span className="text-[10px] font-bold mt-0.5 uppercase tracking-wider">Falar</span>
          </SafeTouch>

          {/* Configurações (Com trava parental) */}
          <SafeTouch
            onClick={handleSettingsClick}
            className="flex flex-col items-center justify-center p-2 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 w-16 h-16"
          >
            <Settings size={24} />
            <span className="text-[10px] font-bold mt-1">PAINEL</span>
          </SafeTouch>
        </div>
      </header>

      {/* 2. GRADES DE COMUNICAÇÃO */}
      <main className="flex-grow flex flex-col p-4 gap-4 overflow-hidden">
        
        {/* Grade Superior (Ações) */}
        <div className="flex-grow bg-white border border-slate-200 rounded-3xl p-4 overflow-y-auto shadow-sm">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 justify-items-center">
            
            {/* Se houver categoria selecionada, adiciona o botão voltar como primeiro card */}
            {activeCategoryId && (
              <SafeTouch
                onClick={() => {
                  playClickSound();
                  setActiveCategoryId(null);
                }}
                className="w-32 h-36 p-3 md:w-36 md:h-40 border-2 border-dashed border-slate-300 bg-slate-50 text-slate-500 rounded-2xl flex flex-col items-center justify-between active:scale-95"
              >
                <div className="flex items-center justify-center flex-grow">
                  <ChevronLeft size={44} />
                </div>
                <span className="font-bold text-center w-full mt-2 uppercase tracking-wider text-xs">
                  Voltar
                </span>
              </SafeTouch>
            )}

            {/* Listagem de cards da categoria ou da raiz */}
            {actions.map((card) => {
              // Encontra a cor da categoria para colorir os botões
              const categoryColor = card.categoryId 
                ? categories.find(c => c.id === card.categoryId)?.color 
                : 'bg-slate-50 border-slate-300 hover:bg-slate-100 active:bg-slate-200';
              const categoryTextColor = card.categoryId
                ? categories.find(c => c.id === card.categoryId)?.textColor
                : 'text-slate-800';

              return (
                <Card
                  key={card.id}
                  label={card.label}
                  imageSource={card.imageSource}
                  color={categoryColor}
                  textColor={categoryTextColor}
                  onClick={() => handleCardClick(card)}
                />
              );
            })}
          </div>
        </div>

        {/* Grade Inferior (Categorias / Grupos) */}
        <div className="h-28 bg-white border border-slate-200 rounded-3xl p-3 shadow-sm shrink-0 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3 h-full min-w-max">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  playClickSound();
                  setActiveCategoryId(cat.id);
                }}
                className={`px-6 h-full flex flex-col items-center justify-center border-2 rounded-2xl transition-all font-bold tracking-wider uppercase text-sm cursor-pointer active:scale-95 ${cat.color} ${cat.textColor} ${
                  activeCategoryId === cat.id ? 'ring-4 ring-blue-400 border-blue-400' : 'border-transparent'
                }`}
                style={{ touchAction: 'manipulation' }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* 3. MODAL DE TRAVA PARENTAL */}
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

            {/* Abas de Opção da Trava */}
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

            {/* Modo: Segurar 3s */}
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
                  {/* Círculo de progresso */}
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

            {/* Modo: Desafio Matemático */}
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
                    <p className="text-center text-xs text-rose-500 mt-1.5 font-medium animate-bounce">
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
