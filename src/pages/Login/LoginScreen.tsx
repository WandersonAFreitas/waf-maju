import React, { useState, useEffect } from 'react';
import { useCommunicationStore } from '../../store/useCommunicationStore';
import { KeyRound, User as UserIcon, Wifi, WifiOff } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onBackToMain: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBackToMain }) => {
  const login = useCommunicationStore((state) => state.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor, preencha todos os campos.');
      return;
    }

    if (isOffline) {
      // Se estiver offline, aceita qualquer login simulado
      const mockToken = `offline_token_${Date.now()}`;
      login(mockToken);
      onLoginSuccess();
    } else {
      // Se estiver online, aceita qualquer login ou valida credenciais básicas
      // Usaremos admin/admin como padrão ou qualquer credencial para facilidade de uso
      if (username.toLowerCase() === 'admin' && password === 'admin') {
        const token = `online_token_${Date.now()}`;
        login(token);
        onLoginSuccess();
      } else {
        // Para resiliência e facilidade, se o usuário digitar qualquer coisa, também podemos
        // aceitar ou mostrar erro. A especificação diz: "A tela aceita qualquer login simulado se o app estiver offline."
        // Online, validamos admin/admin para simular segurança real.
        setErrorMessage('Credenciais inválidas para o modo online. Use usuario: "admin" e senha: "admin".');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-md p-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full mb-3">
            <KeyRound size={28} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Área do Responsável</h2>
          <p className="text-sm text-slate-500 mt-1">Autenticação para acessar as configurações do Maju</p>
        </div>

        {/* Status de Conexão */}
        <div className="mb-6 flex justify-center">
          {isOffline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <WifiOff size={12} />
              Modo Offline (Qualquer login será aceito)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Wifi size={12} />
              Conectado à Internet (admin/admin)
            </span>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 text-rose-800 text-sm rounded-xl border border-rose-200 font-medium">
              {errorMessage}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Usuário</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <UserIcon size={18} />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Senha</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-center"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={onBackToMain}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-center text-sm"
            >
              Voltar para a Prancha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
