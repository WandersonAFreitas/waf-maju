import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { HomePage } from './features/home/pages/HomePage';
import { BoardPage } from './features/board/pages/BoardPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { useEffect } from 'react';
import { seedDatabase } from './core/database/db';

function App() {
  useEffect(() => {
    // Inicializa o banco de dados e dados (seed) se for a primeira vez
    seedDatabase();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <nav className="bg-white shadow p-4 flex gap-4">
          <Link to="/" className="text-blue-500 hover:underline">Início</Link>
          <Link to="/board" className="text-blue-500 hover:underline">Prancha</Link>
          <Link to="/settings" className="text-blue-500 hover:underline">Configurações</Link>
        </nav>

        <main className="flex-1 max-w-5xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/board" element={<BoardPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
