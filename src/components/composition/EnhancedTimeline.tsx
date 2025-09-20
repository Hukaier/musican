// 增强的时间轴组件 - 利用优化后的音频引擎

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Asset, Track, Clip } from '../../types';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import Button from '../ui/Button';

interface EnhancedTimelineProps {
  tracks: Track[];
  totalBars: number;
  bpm: number;
  onTrackAdd: (type: Track['type']) => void;
  onTrackRemove: (trackId: string) => void;
  onClipAdd: (trackId: string, asset: Asset, startBeat: number) => void;
  onClipRemove: (clipId: string) => void;
  onClipMove: (clipId: string, newStartBeat: number) => void;
  onTrackMute: (trackId: string, muted: boolean) => void;
  onTrackSolo: (trackId: string, solo: boolean) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  className?: string;
}

const EnhancedTimeline: React.FC<EnhancedTimelineProps> = ({
  tracks,
  totalBars,
  bpm,
  onTrackAdd,
  onTrackRemove,
  onClipAdd,
  onClipRemove,
  onClipMove,
  onTrackMute,
  onTrackSolo,
  onTrackVolumeChange,
  className = ''
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [metronomeEnabled, setMetronomeEnabled] = useState(true);
  const [metronomeVolume, setMetronomeVolume] = useState(0.5);
  
  const audioEngine = useAudioEngine();

  // 初始化音频引擎
  useEffect(() => {
    audioEngine.initialize().then(() => {
      // 设置BPM
      audioEngine.setBPM(bpm);
      
      // 设置节拍回调
      audioEngine.setBeatCallback((beat) => {
        setCurrentBeat(beat);
      });
      
      // 设置节拍器
      audioEngine.enableMetronome(metronomeEnabled);
      audioEngine.setMetronomeVolume(metronomeVolume);
    }).catch(console.error);
    
    return () => {
      audioEngine.setBeatCallback(null);
      audioEngine.setBarCallback(null);
    };
  }, [audioEngine, bpm, metronomeEnabled, metronomeVolume]);

  // 计算像素到拍的转换
  const pixelsPerBeat = 60 * zoom;
  const beatsPerBar = 4;
  const totalBeats = totalBars * beatsPerBar;

  const beatToPixel = useCallback((beat: number): number => {
    return beat * pixelsPerBeat;
  }, [pixelsPerBeat]);

  const pixelToBeat = useCallback((pixel: number): number => {
    return pixel / pixelsPerBeat;
  }, [pixelsPerBeat]);

  // 播放控制
  const handlePlay = useCallback(() => {
    if (isPlaying) {
      audioEngine.pauseTransport();
      setIsPlaying(false);
    } else {
      audioEngine.startTransport();
      setIsPlaying(true);
    }
  }, [audioEngine, isPlaying]);

  const handleStop = useCallback(() => {
    audioEngine.stopTransport();
    setIsPlaying(false);
    setCurrentBeat(0);
  }, [audioEngine]);

  // 定位到指定节拍
  const handleSeekToBeat = useCallback((beat: number) => {
    const quantizedBeat = audioEngine.quantizeToGrid(beat, '16n');
    audioEngine.setTransportPosition(quantizedBeat);
    setCurrentBeat(quantizedBeat);
  }, [audioEngine]);

  // 时间轴点击定位
  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = event.clientX - rect.left;
    const clickBeat = pixelToBeat(clickX);
    handleSeekToBeat(clickBeat);
  }, [pixelToBeat, handleSeekToBeat]);

  // BPM调整
  const handleBPMChange = useCallback((newBPM: number) => {
    audioEngine.setBPM(newBPM);
  }, [audioEngine]);

  // 节拍器控制
  const handleMetronomeToggle = useCallback(() => {
    const newEnabled = !metronomeEnabled;
    setMetronomeEnabled(newEnabled);
    audioEngine.enableMetronome(newEnabled);
  }, [audioEngine, metronomeEnabled]);

  const handleMetronomeVolumeChange = useCallback((volume: number) => {
    setMetronomeVolume(volume);
    audioEngine.setMetronomeVolume(volume);
  }, [audioEngine]);

  // 渲染时间标尺
  const renderTimeRuler = () => {
    const rulers = [];
    for (let bar = 0; bar <= totalBars; bar++) {
      const x = beatToPixel(bar * beatsPerBar);
      rulers.push(
        <div
          key={bar}
          className="absolute top-0 bottom-0 border-l border-gray-300"
          style={{ left: `${x}px` }}
        >
          <span className="absolute -top-6 text-xs text-gray-500">
            {bar + 1}
          </span>
        </div>
      );
      
      // 添加拍标记
      for (let beat = 1; beat < beatsPerBar; beat++) {
        const beatX = beatToPixel(bar * beatsPerBar + beat);
        rulers.push(
          <div
            key={`${bar}-${beat}`}
            className="absolute top-0 bottom-0 border-l border-gray-200"
            style={{ left: `${beatX}px`, opacity: 0.5 }}
          />
        );
      }
    }
    return rulers;
  };

  // 渲染播放头
  const renderPlayhead = () => {
    const x = beatToPixel(currentBeat);
    
    return (
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none transition-all duration-75"
        style={{ left: `${x}px` }}
      >
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full shadow-lg">
          <div className="absolute inset-1 bg-white rounded-full"></div>
        </div>
      </div>
    );
  };

  // 渲染Clip
  const renderClip = (clip: Clip) => {
    const x = beatToPixel(clip.startBeat);
    const width = beatToPixel(clip.lengthBeat);
    const track = tracks.find(t => t.id === clip.trackId);
    
    return (
      <div
        key={clip.id}
        className="absolute h-12 rounded cursor-move select-none shadow-sm border border-gray-300 hover:shadow-md transition-all duration-150"
        style={{
          left: `${x}px`,
          width: `${width}px`,
          backgroundColor: track?.color || '#3b82f6',
          top: '4px',
          bottom: '4px'
        }}
      >
        <div className="p-2 text-white text-xs font-medium truncate">
          {clip.refId}
        </div>
        
        {/* 波形预览 */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-20 rounded-b">
          <div className="h-full bg-white bg-opacity-40 rounded-b" style={{ width: '60%' }}></div>
        </div>
        
        {/* Clip控制按钮 */}
        <button
          className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onClipRemove(clip.id);
          }}
        >
          ×
        </button>
      </div>
    );
  };

  // 渲染轨道
  const renderTrack = (track: Track) => {
    return (
      <div key={track.id} className="flex border-b border-gray-200 group hover:bg-gray-50">
        {/* 轨道控制面板 */}
        <div className="w-80 p-4 bg-gray-50 border-r border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded shadow-sm border border-gray-300"
                style={{ backgroundColor: track.color }}
              ></div>
              <span className="font-medium text-gray-900">{track.name}</span>
              <span className="text-xs text-gray-500">({track.type})</span>
            </div>
            
            <button
              onClick={() => onTrackRemove(track.id)}
              className="text-red-500 hover:text-red-700 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
            >
              删除
            </button>
          </div>
          
          <div className="flex items-center space-x-2 mb-2">
            <button
              onClick={() => onTrackMute(track.id, !track.mute)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                track.mute ? 'bg-red-500 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              MUTE
            </button>
            
            <button
              onClick={() => onTrackSolo(track.id, !track.solo)}
              className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                track.solo ? 'bg-yellow-500 text-white shadow-sm' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              SOLO
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600">Vol:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={track.volume}
              onChange={(e) => onTrackVolumeChange(track.id, parseFloat(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-600 w-8">{Math.round(track.volume * 100)}</span>
          </div>
        </div>
        
        {/* 轨道内容区域 */}
        <div className="flex-1 h-20 relative bg-white">
          {track.clips.map(renderClip)}
          
          {/* 网格线 */}
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: totalBeats + 1 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-gray-100"
                style={{ left: `${beatToPixel(i)}px` }}
              />
            ))}
          </div>
          
          {/* 拖拽放置区域 */}
          <div className="absolute inset-0 hover:bg-blue-50 hover:bg-opacity-30 transition-colors duration-150" />
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border rounded-lg overflow-hidden shadow-lg ${className}`}>
      {/* 增强的控制面板 */}
      <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="flex items-center justify-between">
          {/* 播放控制 */}
          <div className="flex items-center space-x-4">
            <Button
              variant={isPlaying ? "danger" : "primary"}
              onClick={handlePlay}
              className="shadow-sm"
            >
              {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
            </Button>
            
            <Button variant="secondary" onClick={handleStop} className="shadow-sm">
              ⏹️ 停止
            </Button>
            
            <div className="text-sm text-gray-600 bg-white px-3 py-1 rounded border">
              节拍: {Math.floor(currentBeat)} | 小节: {Math.floor(currentBeat / 4) + 1}
            </div>
          </div>
          
          {/* 节拍器控制 */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleMetronomeToggle}
              className={`flex items-center space-x-2 px-3 py-1 rounded text-sm transition-colors ${
                metronomeEnabled 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <span>🎵</span>
              <span>节拍器</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">音量:</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={metronomeVolume}
                onChange={(e) => handleMetronomeVolumeChange(parseFloat(e.target.value))}
                className="w-16"
              />
            </div>
          </div>
          
          {/* 缩放和工具 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">缩放:</span>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-20"
              />
            </div>
            
            <Button
              variant="secondary"
              onClick={() => onTrackAdd('melody')}
              className="shadow-sm"
            >
              + 添加轨道
            </Button>
          </div>
        </div>
      </div>

      {/* 时间轴主体 */}
      <div className="overflow-auto max-h-96">
        {/* 时间标尺 */}
        <div className="flex">
          <div className="w-80 h-8 bg-gray-100 border-r border-gray-200 flex-shrink-0 flex items-center justify-center">
            <span className="text-xs text-gray-500 font-medium">轨道控制</span>
          </div>
          <div
            ref={timelineRef}
            className="relative h-8 bg-gray-100 cursor-pointer"
            style={{ width: `${beatToPixel(totalBeats)}px` }}
            onClick={handleTimelineClick}
          >
            {renderTimeRuler()}
            {renderPlayhead()}
          </div>
        </div>
        
        {/* 轨道列表 */}
        <div>
          {tracks.map(renderTrack)}
        </div>
        
        {/* 空状态 */}
        {tracks.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-4">🎵</div>
            <p className="text-lg font-medium">还没有轨道</p>
            <p className="text-sm mt-2 text-gray-400">点击"添加轨道"开始创建音乐</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTimeline;
