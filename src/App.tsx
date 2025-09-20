import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ModuleKey } from './types';
import { useAppStore } from './stores/useAppStore';
import ModuleSelector from './components/ModuleSelector';
import NoteGame from './components/games/NoteGame';
import RhythmMaster from './components/games/RhythmMaster';
import ScaleAdventure from './components/games/ScaleAdventure';
import CompositionWorkshop from './components/composition/CompositionWorkshop';
import Button from './components/ui/Button';

const AppInner: React.FC = () => {
  const { currentModule, setCurrentModule, theme, setTheme } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleModuleSelect = (module: ModuleKey) => {
    setCurrentModule(module);
    navigate(`/module/${module}`);
  };

  const handleBackToHome = () => {
    setCurrentModule('notes'); // 重置为默认模块
    navigate('/'); // 导航到主页
  };

  const renderModule = () => {
    switch (currentModule) {
      case 'notes':
        return <NoteGame />;
      case 'rhythm':
        return <RhythmMaster />;
      case 'scale':
        return <ScaleAdventure />;
      case 'chord':
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🔀 和弦魔法</h2>
            <p className="text-gray-600 mb-8">即将推出...</p>
            <Button onClick={handleBackToHome}>返回主页</Button>
          </div>
        );
      case 'key':
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🎨 调性王国</h2>
            <p className="text-gray-600 mb-8">即将推出...</p>
            <Button onClick={handleBackToHome}>返回主页</Button>
          </div>
        );
      case 'interval':
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🎪 音程冒险</h2>
            <p className="text-gray-600 mb-8">即将推出...</p>
            <Button onClick={handleBackToHome}>返回主页</Button>
          </div>
        );
      case 'staff':
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">📊 五线谱读写</h2>
            <p className="text-gray-600 mb-8">即将推出...</p>
            <Button onClick={handleBackToHome}>返回主页</Button>
          </div>
        );
      case 'mode':
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🎭 调式与和声</h2>
            <p className="text-gray-600 mb-8">即将推出...</p>
            <Button onClick={handleBackToHome}>返回主页</Button>
          </div>
        );
      case 'form':
        return (
          <div className="text-center py-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">🎼 曲式分析</h2>
            <p className="text-gray-600 mb-8">即将推出...</p>
            <Button onClick={handleBackToHome}>返回主页</Button>
          </div>
        );
      case 'composition':
        return <CompositionWorkshop />;
      default:
        return <ModuleSelector onModuleSelect={handleModuleSelect} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">🎵 音乐理论学习平台</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </Button>
              {location.pathname !== '/' && (
                <Button variant="secondary" size="sm" onClick={handleBackToHome}>
                  ← 返回主页
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<ModuleSelector onModuleSelect={handleModuleSelect} />} />
          <Route path="/module/:moduleKey" element={renderModule()} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>🎵 音乐理论游戏化学习平台 - 让学习变得有趣而难忘</p>
            <p className="mt-2">版本 0.1.0 | 基于 React + TypeScript + Tone.js 构建</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <Router>
    <AppInner />
  </Router>
);

export default App;


