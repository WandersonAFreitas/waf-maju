import { useState, useEffect } from 'react';
import { useCommunicationStore } from './store/useCommunicationStore';
import { MainScreen } from './pages/Main/MainScreen';
import { LoginScreen } from './pages/Login/LoginScreen';
import { SettingsScreen } from './pages/Settings/SettingsScreen';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'MAIN' | 'LOGIN' | 'SETTINGS'>('MAIN');
  const loadProfiles = useCommunicationStore((state) => state.loadProfiles);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Registra o Service Worker e gerencia atualizações
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registrado com sucesso:', r);
      // Força verificação periódica de atualizações a cada 1 hora
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('Erro no registro do SW:', error);
    },
  });

  // Força verificação imediata de atualizações quando o app é focado (ex: aberto da home screen no iOS)
  useEffect(() => {
    const checkUpdate = async () => {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          registration.update();
        }
      }
    };

    window.addEventListener('focus', checkUpdate);
    // Também executa no carregamento inicial
    checkUpdate();

    return () => {
      window.removeEventListener('focus', checkUpdate);
    };
  }, []);

  // Força o reload quando o Service Worker é atualizado e toma o controle (importante para iOS no modo autoUpdate)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        console.log('Novo Service Worker tomou o controle. Recarregando página...');
        window.location.reload();
      };
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  const handleNavigateToSettings = () => {
    if (useCommunicationStore.getState().isAuthenticated) {
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
