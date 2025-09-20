// 模块化编曲工坊主组件

import React, { useState, useCallback, useEffect } from 'react';
import { Asset, Track, Clip, Project } from '../../types';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import LoopManager from './LoopManager';
import EnhancedTimeline from './EnhancedTimeline';
import Button from '../ui/Button';
import Card from '../ui/Card';

const CompositionWorkshop: React.FC = () => {
  // 项目状态
  const [project, setProject] = useState<Project>({
    id: 'demo-project',
    userId: 'demo-user',
    title: '我的第一首作品',
    bpm: 120,
    key: 'C',
    scale: 'major',
    createdAt: new Date(),
    updatedAt: new Date(),
    isPublic: false,
    tracks: []
  });

  // 播放状态
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalBars, setTotalBars] = useState(8);

  // UI状态
  const [activeTab, setActiveTab] = useState<'loops' | 'timeline'>('loops');
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);

  const audioEngine = useAudioEngine();

  // 初始化音频引擎（延迟到用户交互时）
  const initializeAudioEngine = useCallback(async () => {
    try {
      await audioEngine.initialize();
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
    }
  }, [audioEngine]);

  // 播放控制
  const handlePlay = useCallback(async () => {
    // 首先初始化音频引擎
    await initializeAudioEngine();
    
    if (isPlaying) {
      audioEngine.pauseTransport();
      setIsPlaying(false);
    } else {
      audioEngine.startTransport();
      setIsPlaying(true);
    }
  }, [audioEngine, isPlaying, initializeAudioEngine]);

  const handleStop = useCallback(() => {
    audioEngine.stopTransport();
    setIsPlaying(false);
    setCurrentTime(0);
  }, [audioEngine]);

  const handleSeek = useCallback((time: number) => {
    setCurrentTime(time);
    // 这里应该设置Transport时间，但Tone.js的Transport.seconds是只读的
    // 需要通过其他方式实现时间定位
  }, []);

  // 轨道管理
  const handleTrackAdd = useCallback((type: Track['type']) => {
    const newTrack: Track = {
      id: `track_${Date.now()}`,
      projectId: project.id,
      type,
      name: `${type}轨道 ${project.tracks.length + 1}`,
      color: getTrackColor(type),
      mute: false,
      solo: false,
      order: project.tracks.length,
      volume: 0.8,
      clips: []
    };

    setProject(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
  }, [project]);

  const handleTrackRemove = useCallback((trackId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== trackId)
    }));
  }, []);

  const handleTrackMute = useCallback((trackId: string, muted: boolean) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, mute: muted } : track
      )
    }));

    // 控制音频引擎中的静音状态
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.clips.forEach(clip => {
        audioEngine.muteLoop(clip.refId, muted);
      });
    }
  }, [project.tracks, audioEngine]);

  const handleTrackSolo = useCallback((trackId: string, solo: boolean) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        solo: track.id === trackId ? solo : false
      }))
    }));

    // 控制音频引擎中的独奏状态
    const track = project.tracks.find(t => t.id === trackId);
    if (track && track.clips.length > 0 && track.clips[0]) {
      audioEngine.soloLoop(track.clips[0].refId, solo);
    }
  }, [project.tracks, audioEngine]);

  const handleTrackVolumeChange = useCallback((trackId: string, volume: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId ? { ...track, volume } : track
      )
    }));

    // 控制音频引擎中的音量
    const track = project.tracks.find(t => t.id === trackId);
    if (track) {
      track.clips.forEach(clip => {
        audioEngine.setLoopVolume(clip.refId, volume);
      });
    }
  }, [project.tracks, audioEngine]);

  // Clip管理
  const handleClipAdd = useCallback(async (trackId: string, asset: Asset, startBeat: number) => {
    // 先加载资产
    try {
      await audioEngine.loadLoop(asset);
    } catch (error) {
      console.error('Failed to load asset for clip:', error);
      return;
    }

    const newClip: Clip = {
      id: `clip_${Date.now()}`,
      trackId,
      startBeat,
      lengthBeat: asset.lengthBeat,
      kind: 'loop',
      refId: asset.id
    };

    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track =>
        track.id === trackId
          ? { ...track, clips: [...track.clips, newClip] }
          : track
      )
    }));
  }, [audioEngine]);

  const handleClipRemove = useCallback((clipId: string) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.filter(clip => clip.id !== clipId)
      }))
    }));
  }, []);

  const handleClipMove = useCallback((clipId: string, newStartBeat: number) => {
    setProject(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => ({
        ...track,
        clips: track.clips.map(clip =>
          clip.id === clipId
            ? { ...clip, startBeat: Math.max(0, newStartBeat) }
            : clip
        )
      }))
    }));
  }, []);

  // Loop选择处理
  const handleLoopSelect = useCallback((asset: Asset) => {
    setSelectedAssets(prev => {
      const exists = prev.find(a => a.id === asset.id);
      if (exists) {
        return prev.filter(a => a.id !== asset.id);
      } else {
        return [...prev, asset];
      }
    });
  }, []);

  // 获取轨道颜色
  function getTrackColor(type: Track['type']): string {
    const colors = {
      drum: '#dc3545',
      bass: '#28a745',
      chord: '#007bff',
      melody: '#ffc107',
      effect: '#6f42c1'
    };
    return colors[type] || '#6c757d';
  }

  // 保存项目
  const handleSaveProject = useCallback(() => {
    // 这里应该调用API保存项目
    localStorage.setItem('composition_project', JSON.stringify(project));
    console.log('Project saved:', project);
  }, [project]);

  // 导出项目
  const handleExportProject = useCallback(() => {
    // 这里应该实现音频导出功能
    console.log('Exporting project...');
    alert('导出功能正在开发中...');
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部工具栏 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-gray-900">
                🎛️ 编曲工坊
              </h1>
              <div className="text-sm text-gray-600">
                {project.title} - {project.bpm} BPM - {project.key} {project.scale}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="secondary" onClick={handleSaveProject}>
                💾 保存
              </Button>
              <Button variant="primary" onClick={handleExportProject}>
                📤 导出
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 标签切换 */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('loops')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'loops'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🎵 Loop素材库
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'timeline'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            ⏱️ 时间轴编辑
          </button>
        </div>

        {/* 选中的资产显示 */}
        {selectedAssets.length > 0 && (
          <Card className="p-4 mb-6 bg-blue-50 border-blue-200">
            <h3 className="font-semibold mb-2">已选择的Loop ({selectedAssets.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedAssets.map(asset => (
                <span
                  key={asset.id}
                  className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                >
                  {asset.name}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* 内容区域 */}
        <div className="space-y-6">
          {activeTab === 'loops' && (
            <LoopManager
              onLoopSelect={handleLoopSelect}
              className="bg-white rounded-lg shadow-sm"
            />
          )}

          {activeTab === 'timeline' && (
            <EnhancedTimeline
              tracks={project.tracks}
              totalBars={totalBars}
              bpm={project.bpm}
              onTrackAdd={handleTrackAdd}
              onTrackRemove={handleTrackRemove}
              onClipAdd={handleClipAdd}
              onClipRemove={handleClipRemove}
              onClipMove={handleClipMove}
              onTrackMute={handleTrackMute}
              onTrackSolo={handleTrackSolo}
              onTrackVolumeChange={handleTrackVolumeChange}
              className="bg-white rounded-lg shadow-sm"
            />
          )}
        </div>

        {/* 项目统计 */}
        <Card className="p-4 mt-6 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{project.tracks.length}</div>
              <div className="text-sm text-gray-600">轨道数量</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {project.tracks.reduce((sum, track) => sum + track.clips.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Clip数量</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{totalBars}</div>
              <div className="text-sm text-gray-600">小节数</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {Math.round((totalBars * 4 * 60) / project.bpm)}s
              </div>
              <div className="text-sm text-gray-600">总时长</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompositionWorkshop;
