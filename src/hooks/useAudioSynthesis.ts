import { useCallback, useEffect, useState } from 'react';

export function useAudioSynthesis() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported in this browser.');
      return;
    }

    // Cancel any current speaking
    window.speechSynthesis.cancel();

    if (!text.trim()) return;

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Tenta encontrar uma voz em português brasileiro
    const ptVoice = voices.find(
      (voice) => voice.lang.toLowerCase() === 'pt-br' || voice.lang.toLowerCase().replace('_', '-') === 'pt-br'
    );
    
    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9; // Velocidade ligeiramente reduzida para facilitar a compreensão
    utterance.pitch = 1.1; // Tom de voz ligeiramente mais infantil/amigável

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [voices]);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  return { speak, cancel, isSpeaking };
}
