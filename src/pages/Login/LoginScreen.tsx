import React, { useState, useEffect } from 'react';
import { useCommunicationStore } from '../../store/useCommunicationStore';
import { User, Lock, Shield, Plus } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onBackToMain: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBackToMain }) => {
  const {
    profiles,
    switchProfile,
    login,
    createProfile,
    loadProfiles
  } = useCommunicationStore();

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form de criação
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);

  // Carrega os perfis do IndexedDB na montagem
  useEffect(() => {
    loadProfiles();
  }, []);

  const handleProfileClick = async (profileId: string) => {
    setErrorMessage('');
    const targetProfile = profiles.find(p => p.id === profileId);
    if (!targetProfile) return;

    if (!targetProfile.isAdmin) {
      setErrorMessage('Apenas perfis administradores podem alterar os cards e grupos.');
      setSelectedProfileId(null);
      return;
    }

    if (targetProfile.password) {
      setSelectedProfileId(profileId);
      setPassword('');
    } else {
      // Admin sem senha
      await switchProfile(profileId);
      login('admin_verified_token');
      onLoginSuccess();
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!selectedProfileId) return;

    const success = await switchProfile(selectedProfileId, password);
    if (success) {
      login('admin_verified_token');
      onLoginSuccess();
    } else {
      setErrorMessage('Senha incorreta! Tente novamente.');
    }
  };

  const handleCreateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!newName.trim()) {
      setErrorMessage('Nome do perfil é obrigatório.');
      return;
    }

    try {
      await createProfile(newName, newIsAdmin, newPassword);
      setNewName('');
      setNewPassword('');
      setNewIsAdmin(false);
      setShowCreateForm(false);
    } catch (err) {
      setErrorMessage('Erro ao criar perfil.');
    }
  };

  const selectedProfileObj = profiles.find(p => p.id === selectedProfileId);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8 font-sans select-none">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-md p-6 relative">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-full mb-3 border border-blue-100">
            <Shield size={28} className="fill-blue-100" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Acesso ao Painel</h2>
          <p className="text-xs text-slate-500 mt-1">Selecione um perfil de administrador para gerenciar o Maju</p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-50 text-rose-800 text-xs rounded-xl border border-rose-200 font-bold uppercase tracking-wider text-center">
            {errorMessage}
          </div>
        )}

        {/* MODO: DIGITAR SENHA */}
        {selectedProfileId && selectedProfileObj ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center animate-fade-in">
              <User className="w-10 h-10 text-blue-600 mx-auto mb-2" />
              <span className="text-sm font-extrabold text-slate-800 uppercase tracking-wider block">
                {selectedProfileObj.name}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                Perfil Protegido por Senha
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Digite a Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full text-center py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-lg font-bold"
                autoFocus
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="flex-grow py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setSelectedProfileId(null)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
              >
                Voltar
              </button>
            </div>
          </form>
        ) : showCreateForm ? (
          /* MODO: CADASTRAR NOVO PERFIL */
          <form onSubmit={handleCreateProfileSubmit} className="space-y-4 animate-fade-in">
            <div className="text-center mb-2">
              <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wide">Cadastrar Novo Perfil</h3>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Perfil</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Wanderson"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors uppercase font-bold text-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Senha do Perfil</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-xs font-semibold"
              />
              <p className="text-[10px] text-slate-400 italic mt-1 px-1">
                Opcional. Deixe em branco para acessar sem senha.
              </p>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Tornar Administrador
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!newName.trim()}
                className="flex-grow py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-2xl shadow-sm transition-all active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
              >
                Salvar Perfil
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-xs uppercase tracking-wider"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          /* MODO: SELEÇÃO DE PERFIS */
          <div className="space-y-5 animate-fade-in">
            {/* Lista de Perfis em Cards */}
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
              {profiles.map(profile => {
                const hasPassword = !!profile.password;
                const isAdminProfile = !!profile.isAdmin;

                return (
                  <div
                    key={profile.id}
                    onClick={() => handleProfileClick(profile.id!)}
                    className="flex flex-col justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-blue-400 rounded-2xl cursor-pointer transition-all hover:shadow-sm"
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <User className="w-4 h-4 shrink-0 text-slate-400" />
                          <span className="text-xs text-slate-800 font-black uppercase tracking-wide truncate max-w-[80px]">
                            {profile.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {isAdminProfile && (
                            <span title="Administrador">
                              <Shield className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
                            </span>
                          )}
                          {hasPassword && (
                            <span title="Protegido por senha">
                              <Lock className="w-3.5 h-3.5 text-slate-400" />
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[8px] text-slate-400 font-medium">
                        {isAdminProfile ? 'Administrador' : 'Comum'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="w-full py-3.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-1.5 text-xs uppercase tracking-wider"
              >
                <Plus size={16} />
                Cadastrar Novo Perfil
              </button>
              <button
                type="button"
                onClick={onBackToMain}
                className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl transition-all active:scale-[0.98] cursor-pointer text-center text-xs uppercase tracking-wider"
              >
                Voltar para a Prancha
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
