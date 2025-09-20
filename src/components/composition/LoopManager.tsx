// Loop管理器组件 - 管理和播放Loop素材

import React, { useState, useEffect, useCallback } from 'react';
import { Asset, LoopCategory } from '../../types';
import { LOOP_CATEGORIES, SAMPLE_ASSETS } from '../../constants';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface LoopManagerProps {
  onLoopSelect?: (asset: Asset) => void;
  selectedCategory?: string;
  className?: string;
}

const LoopManager: React.FC<LoopManagerProps> = ({
  onLoopSelect,
  selectedCategory = 'drums',
  className = ''
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategory);
  const [loadedAssets, setLoadedAssets] = useState<Set<string>>(new Set());
  const [playingAssets, setPlayingAssets] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const audioEngine = useAudioEngine();

  // 初始化音频引擎
  useEffect(() => {
    audioEngine.initialize().catch(console.error);
  }, [audioEngine]);

  // 获取当前分类的资产
  const getCurrentAssets = useCallback((): Asset[] => {
    return SAMPLE_ASSETS.filter(asset => {
      const category = LOOP_CATEGORIES.find(cat => cat.id === activeCategory);
      return category && asset.tags.includes(activeCategory);
    });
  }, [activeCategory]);

  // 加载Loop资产
  const handleLoadAsset = useCallback(async (asset: Asset) => {
    if (loadedAssets.has(asset.id)) {
      return;
    }

    setIsLoading(true);
    try {
      await audioEngine.loadLoop(asset);
      setLoadedAssets(prev => new Set([...prev, asset.id]));
      console.log(`Loaded asset: ${asset.name}`);
    } catch (error) {
      console.error(`Failed to load asset ${asset.name}:`, error);
    } finally {
      setIsLoading(false);
    }
  }, [audioEngine, loadedAssets]);

  // 播放/停止Loop
  const handleTogglePlayback = useCallback(async (asset: Asset) => {
    // 确保资产已加载
    if (!loadedAssets.has(asset.id)) {
      await handleLoadAsset(asset);
    }

    const isPlaying = playingAssets.has(asset.id);
    
    if (isPlaying) {
      audioEngine.stopLoop(asset.id);
      setPlayingAssets(prev => {
        const newSet = new Set(prev);
        newSet.delete(asset.id);
        return newSet;
      });
    } else {
      audioEngine.playLoop(asset.id);
      setPlayingAssets(prev => new Set([...prev, asset.id]));
    }
  }, [audioEngine, loadedAssets, playingAssets, handleLoadAsset]);

  // 选择Loop用于编曲
  const handleSelectLoop = useCallback((asset: Asset) => {
    onLoopSelect?.(asset);
  }, [onLoopSelect]);

  // 停止所有播放
  const handleStopAll = useCallback(() => {
    playingAssets.forEach(assetId => {
      audioEngine.stopLoop(assetId);
    });
    setPlayingAssets(new Set());
  }, [audioEngine, playingAssets]);

  // 渲染分类标签
  const renderCategoryTabs = () => (
    <div className="flex space-x-2 mb-6 overflow-x-auto">
      {LOOP_CATEGORIES.map(category => (
        <button
          key={category.id}
          onClick={() => setActiveCategory(category.id)}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap
            transition-all duration-200 hover:scale-105
            ${activeCategory === category.id
              ? 'bg-blue-500 text-white shadow-lg'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }
          `}
          style={{
            backgroundColor: activeCategory === category.id ? category.color : undefined
          }}
        >
          <span className="text-lg">{category.icon}</span>
          <span>{category.name}</span>
        </button>
      ))}
    </div>
  );

  // 渲染Loop卡片
  const renderLoopCard = (asset: Asset) => {
    const isLoaded = loadedAssets.has(asset.id);
    const isPlaying = playingAssets.has(asset.id);
    const currentCategory = LOOP_CATEGORIES.find(cat => cat.id === activeCategory);

    return (
      <Card
        key={asset.id}
        className={`
          p-4 cursor-pointer transition-all duration-200 hover:shadow-lg
          ${isPlaying ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
        `}
      >
        <div className="space-y-3">
          {/* 标题和标签 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              {asset.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span className="px-2 py-1 bg-gray-100 rounded">
                {asset.bpm} BPM
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded">
                {asset.key} {asset.scale}
              </span>
              <span className="px-2 py-1 bg-gray-100 rounded">
                {asset.lengthBeat}拍
              </span>
            </div>
          </div>

          {/* 风格和情绪标签 */}
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
              {asset.style}
            </span>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              {asset.mood}
            </span>
            <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
              {asset.instrument}
            </span>
          </div>

          {/* 控制按钮 */}
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant={isPlaying ? "danger" : "primary"}
              onClick={() => handleTogglePlayback(asset)}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <span className="animate-spin">⟳</span>
              ) : isPlaying ? (
                '⏸️ 停止'
              ) : (
                '▶️ 播放'
              )}
            </Button>
            
            <Button
              size="sm"
              variant="secondary"
              onClick={() => handleSelectLoop(asset)}
              disabled={!isLoaded}
              className="flex-1"
            >
              📎 选择
            </Button>
          </div>

          {/* 加载状态指示器 */}
          {!isLoaded && !isLoading && (
            <div className="text-xs text-gray-500 text-center">
              点击播放加载
            </div>
          )}
        </div>
      </Card>
    );
  };

  const currentAssets = getCurrentAssets();
  const currentCategory = LOOP_CATEGORIES.find(cat => cat.id === activeCategory);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题和控制 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🎵 Loop素材库
          </h2>
          <p className="text-gray-600">
            选择和试听各种风格的音乐Loop
          </p>
        </div>
        
        {playingAssets.size > 0 && (
          <Button
            variant="danger"
            onClick={handleStopAll}
            className="ml-4"
          >
            ⏹️ 停止全部
          </Button>
        )}
      </div>

      {/* 分类标签 */}
      {renderCategoryTabs()}

      {/* 当前分类描述 */}
      {currentCategory && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-2xl">{currentCategory.icon}</span>
            <h3 className="text-lg font-semibold">{currentCategory.name}</h3>
          </div>
          <p className="text-gray-600">{currentCategory.description}</p>
        </div>
      )}

      {/* Loop网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentAssets.map(renderLoopCard)}
      </div>

      {/* 空状态 */}
      {currentAssets.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-4xl mb-4">🎵</div>
          <p>该分类暂无Loop素材</p>
          <p className="text-sm mt-2">敬请期待更多内容...</p>
        </div>
      )}

      {/* 状态信息 */}
      <div className="text-sm text-gray-500 text-center">
        已加载: {loadedAssets.size} | 播放中: {playingAssets.size}
      </div>
    </div>
  );
};

export default LoopManager;
