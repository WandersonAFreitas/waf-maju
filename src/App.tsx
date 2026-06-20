import { useState } from 'react';
import { useCommunicationStore } from './store/useCommunicationStore';
import { MainScreen } from './pages/Main/MainScreen';
import { LoginScreen } from './pages/Login/LoginScreen';
import { SettingsScreen } from './pages/Settings/SettingsScreen';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'MAIN' | 'LOGIN' | 'SETTINGS'>('MAIN');
  const isAuthenticated = useCommunicationStore((state) => state.isAuthenticated);

  // Registra o Service Worker e gerencia atualizações
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registrado com sucesso:', r);
    },
    onRegisterError(error) {
      console.error('Erro no registro do SW:', error);
    },
  });

  const handleNavigateToSettings = () => {
    if (isAuthenticated) {
      setCurrentScreen('SETTINGS');
    } else {
      setCurrentScreen('LOGIN');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      {/* Barra de Notificação de Atualização PWA */}
      {needRefresh && (
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between text-sm font-semibold z-50 shadow-lg">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="animate-spin" />
            <span>Nova versão disponível! Recarregue para atualizar.</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateServiceWorker(true)}
              className="bg-white text-blue-600 px-4 py-1.5 rounded-xl font-bold hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Atualizar
            </button>
            <button
              onClick={() => setNeedRefresh(false)}
              className="text-white hover:text-blue-200 p-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Roteador de Telas */}
      {currentScreen === 'MAIN' && (
        <MainScreen
          onNavigateToSettings={handleNavigateToSettings}
          onNavigateToLogin={() => setCurrentScreen('LOGIN')}
        />
      )}

      {currentScreen === 'LOGIN' && (
        <LoginScreen
          onLoginSuccess={() => setCurrentScreen('SETTINGS')}
          onBackToMain={() => setCurrentScreen('MAIN')}
        />
      )}

      {currentScreen === 'SETTINGS' && (
        <ProtectedRoute onRedirect={() => setCurrentScreen('LOGIN')}>
          <SettingsScreen onBackToMain={() => setCurrentScreen('MAIN')} />
        </ProtectedRoute>
      )}
    </div>
  );
}
