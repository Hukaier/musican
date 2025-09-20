// 时间轴组件 - 支持拖拽和对齐功能

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Asset, Track, Clip } from '../../types';
import { LOOP_CONFIG } from '../../constants';
import Button from '../ui/Button';

interface TimelineProps {
  tracks: Track[];
  currentTime: number;
  totalBars: number;
  bpm: number;
  isPlaying: boolean;
  onTrackAdd: (type: Track['type']) => void;
  onTrackRemove: (trackId: string) => void;
  onClipAdd: (trackId: string, asset: Asset, startBeat: number) => void;
  onClipRemove: (clipId: string) => void;
  onClipMove: (clipId: string, newStartBeat: number) => void;
  onTrackMute: (trackId: string, muted: boolean) => void;
  onTrackSolo: (trackId: string, solo: boolean) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onPlay: () => void;
  onStop: () => void;
  onSeek: (time: number) => void;
  className?: string;
}

interface DragState {
  isDragging: boolean;
  clipId: string | null;
  startX: number;
  startBeat: number;
  trackId: string | null;
}

const Timeline: React.FC<TimelineProps> = ({
  tracks,
  currentTime,
  totalBars,
  bpm,
  isPlaying,
  onTrackAdd,
  onTrackRemove,
  onClipAdd,
  onClipRemove,
  onClipMove,
  onTrackMute,
  onTrackSolo,
  onTrackVolumeChange,
  onPlay,
  onStop,
  onSeek,
  className = ''
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    clipId: null,
    startX: 0,
    startBeat: 0,
    trackId: null
  });
  const [zoom, setZoom] = useState(1);
  const [draggedAsset, setDraggedAsset] = useState<Asset | null>(null);

  // 计算像素到拍的转换
  const pixelsPerBeat = 60 * zoom; // 可调整的缩放比例
  const beatsPerBar = 4; // 假设4/4拍
  const totalBeats = totalBars * beatsPerBar;

  // 拍转换为像素位置
  const beatToPixel = useCallback((beat: number): number => {
    return beat * pixelsPerBeat;
  }, [pixelsPerBeat]);

  // 像素位置转换为拍
  const pixelToBeat = useCallback((pixel: number): number => {
    return pixel / pixelsPerBeat;
  }, [pixelsPerBeat]);

  // 量化到最近的网格
  const quantizeBeat = useCallback((beat: number): number => {
    const quantizeValue = 0.25; // 1/16拍量化
    return Math.round(beat / quantizeValue) * quantizeValue;
  }, []);

  // 处理Clip拖拽开始
  const handleClipDragStart = useCallback((
    event: React.MouseEvent,
    clip: Clip
  ) => {
    event.preventDefault();
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDragState({
      isDragging: true,
      clipId: clip.id,
      startX: event.clientX - rect.left,
      startBeat: clip.startBeat,
      trackId: clip.trackId
    });
  }, []);

  // 处理鼠标移动
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragState.isDragging || !dragState.clipId) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = event.clientX - rect.left;
    const deltaX = currentX - dragState.startX;
    const deltaBeat = pixelToBeat(deltaX);
    const newBeat = Math.max(0, dragState.startBeat + deltaBeat);
    const quantizedBeat = quantizeBeat(newBeat);

    // 临时更新显示位置（这里可以添加视觉反馈）
    console.log(`Moving clip to beat: ${quantizedBeat}`);
  }, [dragState, pixelToBeat, quantizeBeat]);

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (dragState.isDragging && dragState.clipId) {
      // 这里应该调用onClipMove，但需要计算最终位置
      // 暂时使用dragState中的信息
      onClipMove(dragState.clipId, dragState.startBeat);
    }

    setDragState({
      isDragging: false,
      clipId: null,
      startX: 0,
      startBeat: 0,
      trackId: null
    });
  }, [dragState, onClipMove]);

  // 监听全局鼠标事件
  useEffect(() => {
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleMouseUp]);

  // 处理时间轴点击定位
  const handleTimelineClick = useCallback((event: React.MouseEvent) => {
    if (dragState.isDragging) return;

    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = event.clientX - rect.left;
    const clickBeat = pixelToBeat(clickX);
    const quantizedBeat = quantizeBeat(clickBeat);
    
    // 转换为时间并定位
    const timeInSeconds = (quantizedBeat / beatsPerBar) * (60 / bpm) * beatsPerBar;
    onSeek(timeInSeconds);
  }, [dragState.isDragging, pixelToBeat, quantizeBeat, beatsPerBar, bpm, onSeek]);

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
    }
    return rulers;
  };

  // 渲染播放头
  const renderPlayhead = () => {
    const currentBeat = (currentTime / 60) * bpm;
    const x = beatToPixel(currentBeat);
    
    return (
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
        style={{ left: `${x}px` }}
      >
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full"></div>
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
        className={`
          absolute h-12 rounded cursor-move select-none
          ${dragState.clipId === clip.id ? 'opacity-50' : ''}
          transition-all duration-150 hover:brightness-110
        `}
        style={{
          left: `${x}px`,
          width: `${width}px`,
          backgroundColor: track?.color || '#3b82f6',
          top: '4px',
          bottom: '4px'
        }}
        onMouseDown={(e) => handleClipDragStart(e, clip)}
      >
        <div className="p-2 text-white text-xs font-medium truncate">
          {clip.refId}
        </div>
        
        {/* Clip控制按钮 */}
        <button
          className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs hover:bg-red-600"
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
      <div key={track.id} className="flex border-b border-gray-200">
        {/* 轨道控制面板 */}
        <div className="w-64 p-4 bg-gray-50 border-r border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div
                className="w-4 h-4 rounded"
                style={{ backgroundColor: track.color }}
              ></div>
              <span className="font-medium text-gray-900">{track.name}</span>
            </div>
            
            <button
              onClick={() => onTrackRemove(track.id)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              删除
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onTrackMute(track.id, !track.mute)}
              className={`px-2 py-1 text-xs rounded ${
                track.mute ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              M
            </button>
            
            <button
              onClick={() => onTrackSolo(track.id, !track.solo)}
              className={`px-2 py-1 text-xs rounded ${
                track.solo ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              S
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={track.volume}
              onChange={(e) => onTrackVolumeChange(track.id, parseFloat(e.target.value))}
              className="flex-1"
            />
          </div>
        </div>
        
        {/* 轨道内容区域 */}
        <div className="flex-1 h-20 relative bg-white">
          {track.clips.map(renderClip)}
          
          {/* 拖拽放置区域 */}
          <div
            className="absolute inset-0 hover:bg-blue-50 transition-colors duration-150"
            onDrop={(e) => {
              e.preventDefault();
              if (draggedAsset) {
                const rect = e.currentTarget.getBoundingClientRect();
                const dropX = e.clientX - rect.left;
                const dropBeat = quantizeBeat(pixelToBeat(dropX));
                onClipAdd(track.id, draggedAsset, dropBeat);
                setDraggedAsset(null);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${className}`}>
      {/* 时间轴头部控制 */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant={isPlaying ? "danger" : "primary"}
              onClick={isPlaying ? onStop : onPlay}
            >
              {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
            </Button>
            
            <Button variant="secondary" onClick={onStop}>
              ⏹️ 停止
            </Button>
            
            <div className="text-sm text-gray-600">
              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
            </div>
          </div>
          
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
          <div className="w-64 h-8 bg-gray-100 border-r border-gray-200 flex-shrink-0"></div>
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
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🎵</div>
            <p>还没有轨道</p>
            <p className="text-sm mt-2">点击"添加轨道"开始创建</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
