// 节拍大师游戏组件

import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { RhythmSequence, RhythmGameState, BeatTap, RhythmBeat } from '../../types';
import { useAudioEngine } from '../../hooks/useAudioEngine';
import { RHYTHM_CONFIG, RHYTHM_SEQUENCES } from '../../constants';
import Button from '../ui/Button';
import Card from '../ui/Card';
import ProgressBar from '../ui/ProgressBar';

interface RhythmMasterProps {
  onComplete?: (score: number, accuracy: number) => void;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

type NoteType = 'quarter' | 'eighth' | 'sixteenth';

const RhythmMaster: React.FC<RhythmMasterProps> = ({
  onComplete,
  difficulty = 'beginner'
}) => {
  // 添加飘出动画样式
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes float-up {
        0% {
          transform: translateX(-50%) translateY(0) scale(0.8);
          opacity: 0;
        }
        15% {
          transform: translateX(-50%) translateY(-8px) scale(1.1);
          opacity: 1;
        }
        100% {
          transform: translateX(-50%) translateY(-50px) scale(1);
          opacity: 0;
        }
      }
      
      @keyframes tap-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const [gameState, setGameState] = useState<RhythmGameState>({
    sequence: null,
    currentBeat: 0,
    isPlaying: false,
    taps: [],
    score: 0,
    combo: 0,
    maxCombo: 0,
    accuracy: 0,
    startTime: 0,
    endTime: null
  });

  const [selectedSequence, setSelectedSequence] = useState<RhythmSequence | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [practiceMode, setPracticeMode] = useState(true);
  const [currentPatternIndex, setCurrentPatternIndex] = useState(0);
  const [expectedBeats, setExpectedBeats] = useState<number[]>([]);
  const [lastFeedback, setLastFeedback] = useState<string>('');
  const [feedbackAnimation, setFeedbackAnimation] = useState<{
    text: string;
    type: 'perfect' | 'great' | 'good' | 'miss';
    id: number;
  } | null>(null);
  const feedbackIdRef = useRef(0);
  const [noteType, setNoteType] = useState<NoteType>('quarter');
  const [currentBPM, setCurrentBPM] = useState(100);
  
  const audioEngine = useAudioEngine();
  const gameStartTimeRef = useRef<number>(0);
  const patternStartTimeRef = useRef<number>(0);
  const preparationSecondsRef = useRef<number>(0);

  // 初始化音频引擎（延迟到用户交互时）
  const initializeAudioEngine = useCallback(async () => {
    try {
      await audioEngine.initialize();
      audioEngine.enableMetronome(true);
      audioEngine.setMetronomeVolume(0.7);
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error; // 重新抛出错误以便上层处理
    }
  }, [audioEngine]);

  // 根据音符类型生成节拍模式
  const generatePatternByNoteType = useCallback((type: NoteType): RhythmBeat[] => {
    const basePattern: RhythmBeat[] = [];
    
    switch (type) {
      case 'quarter':
        // 四分音符：每拍一个音符
        for (let beat = 1; beat <= 4; beat++) {
          basePattern.push({
            beat,
            subdivision: 0,
            emphasis: beat === 1 ? 'strong' : beat === 3 ? 'medium' : 'weak',
            noteValue: 'quarter',
            isRest: false
          });
        }
        break;
        
      case 'eighth':
        // 八分音符：每拍两个音符
        for (let beat = 1; beat <= 4; beat++) {
          for (let sub = 0; sub < 2; sub++) {
            basePattern.push({
              beat,
              subdivision: sub,
              emphasis: beat === 1 && sub === 0 ? 'strong' : 
                       beat === 3 && sub === 0 ? 'medium' : 'weak',
              noteValue: 'eighth',
              isRest: false
            });
          }
        }
        break;
        
      case 'sixteenth':
        // 十六分音符：每拍四个音符
        for (let beat = 1; beat <= 4; beat++) {
          for (let sub = 0; sub < 4; sub++) {
            basePattern.push({
              beat,
              subdivision: sub,
              emphasis: beat === 1 && sub === 0 ? 'strong' :
                       beat === 3 && sub === 0 ? 'medium' : 'weak',
              noteValue: 'sixteenth',
              isRest: false
            });
          }
        }
        break;
    }
    
    return basePattern;
  }, []);

  // 获取当前的节拍序列（只使用统一的练习器）
  const getCurrentSequence = useCallback((): RhythmSequence => {
    const baseSequence = RHYTHM_SEQUENCES.find(seq => seq.id === 'unified_rhythm_practice')!;
    return {
      ...baseSequence,
      bpm: currentBPM,
      pattern: generatePatternByNoteType(noteType),
      name: `${noteType === 'quarter' ? '四分' : noteType === 'eighth' ? '八分' : '十六分'}音符练习`,
      description: `${noteType === 'quarter' ? '每拍一个音符' : 
                    noteType === 'eighth' ? '每拍两个音符' : 
                    '每拍四个音符'}的节拍练习`
    };
  }, [noteType, currentBPM, generatePatternByNoteType]);

  // 开始游戏（统一入口）
  const startGame = useCallback(async () => {
    const sequence = getCurrentSequence();
    try {
      // 首先初始化音频引擎
      await initializeAudioEngine();
      
      setSelectedSequence(sequence);
      setGameState({
        sequence,
        currentBeat: 0,
        isPlaying: false,
        taps: [],
        score: 0,
        combo: 0,
        maxCombo: 0,
        accuracy: 0,
        startTime: Date.now(),
        endTime: null
      });
      setCurrentPatternIndex(0);
      setShowResults(false);
      setLastFeedback('');

      // 设置BPM和节拍回调
      audioEngine.setBPM(sequence.bpm);
      
      // 设置节拍器subdivision
      const subdivision = noteType === 'quarter' ? 1 : 
                         noteType === 'eighth' ? 2 : 4;
      audioEngine.setMetronomeSubdivision(subdivision);
    } catch (error) {
      console.error('Failed to start game:', error);
      // 即使音频初始化失败，也要显示游戏界面
      setSelectedSequence(sequence);
      setGameState({
        sequence,
        currentBeat: 0,
        isPlaying: false,
        taps: [],
        score: 0,
        combo: 0,
        maxCombo: 0,
        accuracy: 0,
        startTime: Date.now(),
        endTime: null
      });
      setCurrentPatternIndex(0);
      setShowResults(false);
      setLastFeedback('');
      
      // 即使音频初始化失败，也要设置subdivision
      try {
        const subdivision = noteType === 'quarter' ? 1 : 
                           noteType === 'eighth' ? 2 : 4;
        audioEngine.setMetronomeSubdivision(subdivision);
      } catch (err) {
        console.warn('Failed to set metronome subdivision:', err);
      }
    }
    
    // 计算预期的节拍时间点（基于音符类型）
    const beats: number[] = [];
    const subdivision = noteType === 'quarter' ? 1 : 
                       noteType === 'eighth' ? 2 : 4;
    
    // 为4拍生成所有预期的节拍点
    const preparationBeats = 8; // 预备阶段：两个八拍（两小节）
    const secondsPerBeat = 60 / currentBPM;
    const skipTime = preparationBeats * secondsPerBeat; // 以秒为单位的跳过时间
    for (let beat = 1; beat <= 4; beat++) {
      for (let sub = 0; sub < subdivision; sub++) {
        // 计算相对于开始时间的节拍时间（以秒为单位）
        const beatTime = skipTime + ((beat - 1) + (sub / subdivision)) * secondsPerBeat;
        beats.push(beatTime);
      }
    }
    
    // 扩展到多个循环（因为是持续播放）
    const extendedBeats: number[] = [];
    for (let cycle = 0; cycle < 100; cycle++) { // 支持400拍的练习
      beats.forEach(beat => {
        extendedBeats.push(beat + cycle * 4 * secondsPerBeat); // 每个循环4拍（按秒）
      });
    }
    
    setExpectedBeats(extendedBeats);
    
    // 调试：打印前几个预期节拍时间
    console.log('Generated expected beats (first 16):', extendedBeats.slice(0, 16));
    console.log(`Note type: ${noteType}, Subdivision: ${subdivision}, BPM: ${currentBPM}`);

    // 设置节拍回调
    audioEngine.setBeatCallback((beat) => {
      setGameState(prev => ({ ...prev, currentBeat: beat }));
    });

    // 启动播放
    patternStartTimeRef.current = audioEngine.getTransportTime();
    audioEngine.startTransport();
    setGameState(prev => ({ ...prev, isPlaying: true }));

  }, [audioEngine, initializeAudioEngine, getCurrentSequence]);

  // 开始播放
  const startPlaying = useCallback(async () => {
    if (!selectedSequence) return;

    // 确保在用户手势中初始化音频（解决 AudioContext not allowed to start）
    await audioEngine.initialize();

    gameStartTimeRef.current = Date.now();
    patternStartTimeRef.current = audioEngine.getTransportTime();
    audioEngine.startTransport();
    setGameState(prev => ({ ...prev, isPlaying: true }));

    // 移除自动停止定时器，改为持续播放模式

  }, [selectedSequence, audioEngine]);

  // 停止游戏
  const stopGame = useCallback(() => {
    audioEngine.stopTransport();
    audioEngine.setBeatCallback(null);
    
    setGameState(prev => {
      const finalState = {
        ...prev,
        isPlaying: false,
        endTime: Date.now(),
        accuracy: prev.taps.length > 0 
          ? (prev.taps.filter(tap => tap.accuracy !== 'miss').length / prev.taps.length) * 100
          : 0
      };
      
      // 触发完成回调
      if (onComplete) {
        onComplete(finalState.score, finalState.accuracy);
      }
      
      return finalState;
    });
    
    setShowResults(true);
  }, [audioEngine, onComplete]);

  // 计算模式持续时间
  const calculatePatternDuration = (sequence: RhythmSequence): number => {
    const beatsInPattern = Math.max(...sequence.pattern.map(b => b.beat));
    return (beatsInPattern / sequence.bpm) * 60;
  };

  // 处理用户点击
  const handleTap = useCallback(() => {
    if (!gameState.isPlaying || !selectedSequence) return;

    const now = Date.now();
    const currentTime = audioEngine.getTransportTime();
    const relativeTime = currentTime - patternStartTimeRef.current;
    
    // 跳过开始的预备时间（前两个八拍），按秒
    const secondsPerBeat = 60 / (selectedSequence?.bpm || currentBPM);
    const preparationBeats = 8;
    const preparationSeconds = preparationBeats * secondsPerBeat;
    if (relativeTime < preparationSeconds) {
      return;
    }
    
    // 找到最近的预期节拍
    // 校正系统/输出延迟：使用 AudioContext 的 baseLatency/outputLatency（若可用）
    const baseLatency = (Tone.context as any)?.baseLatency ?? 0;
    const outputLatency = (Tone.context as any)?.outputLatency ?? 0;
    const audioLatency = baseLatency + outputLatency; // 秒
    const correctedTime = Math.max(0, relativeTime - audioLatency);
    const expectedBeat = findNearestExpectedBeat(correctedTime, expectedBeats, selectedSequence, noteType);
    
    let accuracy: 'perfect' | 'great' | 'good' | 'miss';
    let deviation: number;
    let score: number;
    
    if (expectedBeat !== null) {
      // 有预期节拍，计算偏差
      deviation = Math.abs(correctedTime - expectedBeat) * 1000; // 转换为毫秒
      accuracy = calculateAccuracy(deviation);
      score = calculateScore(accuracy, gameState.combo);
    console.log(`Tap: time=${relativeTime.toFixed(3)} (corrected ${correctedTime.toFixed(3)}), expected=${expectedBeat.toFixed(3)}, deviation=${deviation.toFixed(1)}ms, accuracy=${accuracy}`);
    } else {
      // 没有预期节拍，算作miss但仍然记录
      deviation = 999; // 设置一个很大的偏差值
      accuracy = 'miss';
      score = 0;
      console.log(`Tap: time=${relativeTime.toFixed(3)}, no expected beat found, accuracy=miss`);
    }
    
    const tap: BeatTap = {
      timestamp: now,
      expectedTime: expectedBeat || relativeTime,
      deviation,
      accuracy,
      score
    };

    setGameState(prev => {
      const newTaps = [...prev.taps, tap];
      const newCombo = accuracy === 'miss' ? 0 : prev.combo + 1;
      const newScore = prev.score + score;
      const newMaxCombo = Math.max(prev.maxCombo, newCombo);
      
      // 重新计算准确率（加权平均）
      const weights: Record<BeatTap['accuracy'], number> = {
        perfect: 1,
        great: 0.85,
        good: 0.7,
        miss: 0,
      };
      const weightedSum = newTaps.reduce((sum, t) => sum + weights[t.accuracy], 0);
      const newAccuracy = newTaps.length > 0 ? (weightedSum / newTaps.length) * 100 : 0;
      
      return {
        ...prev,
        taps: newTaps,
        score: newScore,
        combo: newCombo,
        maxCombo: newMaxCombo,
        accuracy: newAccuracy
      };
    });

    // 移除点击音效反馈，避免干扰节拍练习
    // audioEngine.playEffect(accuracy === 'perfect' ? 'success' : 
    //                      accuracy === 'great' ? 'info' :
    //                      accuracy === 'good' ? 'warning' : 'error');
    
    // 显示飘出动画反馈
    feedbackIdRef.current += 1;
    const feedbackId = feedbackIdRef.current;
    const feedbackText = accuracy.toUpperCase();
    
    console.log(`Setting feedback animation: ${feedbackText} (${accuracy}) with ID: ${feedbackId}`);
    
    // 立即清除之前的动画（如果有的话）
    setFeedbackAnimation(null);
    
    // 使用微小延迟确保状态更新
    setTimeout(() => {
      setFeedbackAnimation({
        text: feedbackText,
        type: accuracy,
        id: feedbackId
      });
      
      // 清除当前动画
      setTimeout(() => {
        console.log(`Clearing feedback animation for: ${feedbackText} (ID: ${feedbackId})`);
        setFeedbackAnimation(prev => 
          prev && prev.id === feedbackId ? null : prev
        );
      }, 1500);
    }, 10);
  }, [gameState.isPlaying, selectedSequence, audioEngine, expectedBeats, gameState.combo]);

  // 寻找最近的预期节拍
  const findNearestExpectedBeat = (currentTime: number, beats: number[], sequence: RhythmSequence, currentNoteType: NoteType): number | null => {
    const baseTolerance = RHYTHM_CONFIG.timing.miss / 1000; // 基础容差(秒)
    
    // 根据音符类型调整容差 - 更宽松的设置
    const subdivision = currentNoteType === 'quarter' ? 1 : currentNoteType === 'eighth' ? 2 : 4;
    const beatInterval = (60 / sequence.bpm) / subdivision; // 当前音符类型的间隔时间
    
    // 更宽松的容差设置：
    // - 四分音符：使用基础容差
    // - 八分音符：取基础容差和间隔45%中的较小值（更严格）
    // - 十六分音符：取基础容差和间隔35%中的较小值（更严格）
    let tolerance: number;
    if (subdivision === 1) {
      tolerance = baseTolerance; // 四分音符保持基础容差
    } else if (subdivision === 2) {
      tolerance = Math.min(baseTolerance, beatInterval * 0.45); // 八分音符：45%间隔
    } else {
      tolerance = Math.min(baseTolerance, beatInterval * 0.35); // 十六分音符：35%间隔
    }
    
    let nearestBeat = null;
    let minDistance = Infinity;
    
    beats.forEach(beatTime => {
      // beats数组中已经存储的是以秒为单位的绝对时间，无需再转换
      const distance = Math.abs(currentTime - beatTime);
      
      if (distance < tolerance && distance < minDistance) {
        minDistance = distance;
        nearestBeat = beatTime;
      }
    });
    
    // 调试信息：显示容差和找到的节拍
    console.log(`Finding beat: time=${currentTime.toFixed(3)}, tolerance=${(tolerance*1000).toFixed(1)}ms, interval=${(beatInterval*1000).toFixed(1)}ms, found=${nearestBeat}`);
    
    return nearestBeat;
  };

  // 计算准确度
  const calculateAccuracy = (deviation: number): BeatTap['accuracy'] => {
    if (deviation <= RHYTHM_CONFIG.timing.perfect) return 'perfect';
    if (deviation <= RHYTHM_CONFIG.timing.great) return 'great';
    if (deviation <= RHYTHM_CONFIG.timing.good) return 'good';
    return 'miss';
  };

  // 计算得分
  const calculateScore = (accuracy: BeatTap['accuracy'], combo: number): number => {
    const baseScore = RHYTHM_CONFIG.scoring[accuracy];
    const comboBonus = Math.min(combo * RHYTHM_CONFIG.scoring.comboBonus, RHYTHM_CONFIG.scoring.maxCombo);
    return baseScore + comboBonus;
  };

  // 渲染节拍指示器
  const renderBeatIndicator = () => {
    if (!selectedSequence) return null;

    const subdivision = noteType === 'quarter' ? 1 : 
                       noteType === 'eighth' ? 2 : 4;
    
    return (
      <div className="space-y-6">
        {/* 音符说明 */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {noteType === 'quarter' ? '四分音符' : 
             noteType === 'eighth' ? '八分音符' : 
             '十六分音符'} - 每拍{subdivision}个音
          </h3>
          <div className="text-3xl mb-2">
            {noteType === 'quarter' ? '♩ ♩ ♩ ♩' : 
             noteType === 'eighth' ? '♫ ♫ ♫ ♫' : 
             '♬ ♬ ♬ ♬'}
          </div>
          <div className="text-sm text-gray-600">
            {noteType === 'quarter' ? '1  2  3  4' : 
             noteType === 'eighth' ? '1 & 2 & 3 & 4 &' : 
             '1e&a 2e&a 3e&a 4e&a'}
          </div>
        </div>

        {/* 4拍的可视化 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          {subdivision === 1 ? (
            /* 四分音符：4列布局 */
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(beat => (
                <div key={beat} className="text-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">第{beat}拍</div>
                  <div className="flex justify-center">
                    {(() => {
                      const totalSubdivision = (beat - 1) * subdivision;
                      const currentSubdivision = Math.floor(gameState.currentBeat) % (4 * subdivision);
                      const isActive = currentSubdivision === totalSubdivision && gameState.isPlaying;
                      const isStrongBeat = beat === 1;
                      const isMediumBeat = beat === 3;
                      
                      return (
                        <div
                          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-lg font-bold transition-all duration-150 ${
                            isActive
                              ? isStrongBeat 
                                ? 'bg-red-500 text-white border-red-500 scale-125 animate-pulse'
                                : isMediumBeat
                                ? 'bg-orange-500 text-white border-orange-500 scale-110 animate-pulse'
                                : 'bg-blue-500 text-white border-blue-500 scale-110 animate-pulse'
                              : isStrongBeat
                              ? 'bg-red-100 text-red-600 border-red-300'
                              : isMediumBeat
                              ? 'bg-orange-100 text-orange-600 border-orange-300'
                              : 'bg-gray-100 text-gray-500 border-gray-300'
                          }`}
                        >
                          {beat}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {beat === 1 ? '强拍' : beat === 3 ? '次强拍' : '弱拍'}
                  </div>
                </div>
              ))}
            </div>
          ) : subdivision === 2 ? (
            /* 八分音符：8列平均布局 */
            <div>
              <div className="grid grid-cols-8 gap-2 mb-4">
                {Array.from({ length: 8 }, (_, index) => {
                  const beat = Math.floor(index / 2) + 1;
                  const subIndex = index % 2;
                  const totalSubdivision = index;
                  const currentSubdivision = Math.floor(gameState.currentBeat) % (4 * subdivision);
                  const isActive = currentSubdivision === totalSubdivision && gameState.isPlaying;
                  const isStrongBeat = beat === 1 && subIndex === 0;
                  const isMediumBeat = beat === 3 && subIndex === 0;
                  
                  return (
                    <div key={index} className="text-center">
                      <div
                        className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-150 mx-auto ${
                          isActive
                            ? isStrongBeat 
                              ? 'bg-red-500 text-white border-red-500 scale-125 animate-pulse'
                              : isMediumBeat
                              ? 'bg-orange-500 text-white border-orange-500 scale-110 animate-pulse'
                              : 'bg-blue-500 text-white border-blue-500 scale-110 animate-pulse'
                            : isStrongBeat
                            ? 'bg-red-100 text-red-600 border-red-300'
                            : isMediumBeat
                            ? 'bg-orange-100 text-orange-600 border-orange-300'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}
                      >
                        {subIndex === 0 ? beat : '&'}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {subIndex === 0 ? beat : '&'}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 拍子标识 */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(beat => (
                  <div key={beat} className="text-center">
                    <div className="text-xs text-gray-500">
                      {beat === 1 ? '强拍' : beat === 3 ? '次强拍' : '弱拍'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 十六分音符：flexbox平均布局 */
            <div>
              <div className="flex justify-between mb-4">
                {Array.from({ length: 16 }, (_, index) => {
                  const beat = Math.floor(index / 4) + 1;
                  const subIndex = index % 4;
                  const totalSubdivision = index;
                  const currentSubdivision = Math.floor(gameState.currentBeat) % (4 * subdivision);
                  const isActive = currentSubdivision === totalSubdivision && gameState.isPlaying;
                  const isStrongBeat = beat === 1 && subIndex === 0;
                  const isMediumBeat = beat === 3 && subIndex === 0;
                  
                  return (
                    <div key={index} className="text-center flex-1">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-150 mx-auto ${
                          isActive
                            ? isStrongBeat 
                              ? 'bg-red-500 text-white border-red-500 scale-125 animate-pulse'
                              : isMediumBeat
                              ? 'bg-orange-500 text-white border-orange-500 scale-110 animate-pulse'
                              : 'bg-blue-500 text-white border-blue-500 scale-110 animate-pulse'
                            : isStrongBeat
                            ? 'bg-red-100 text-red-600 border-red-300'
                            : isMediumBeat
                            ? 'bg-orange-100 text-orange-600 border-orange-300'
                            : 'bg-gray-100 text-gray-500 border-gray-300'
                        }`}
                      >
                        {['1', 'e', '&', 'a'][subIndex]}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {subIndex === 0 ? beat : ['e', '&', 'a'][subIndex - 1]}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* 拍子标识 */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map(beat => (
                  <div key={beat} className="text-center">
                    <div className="text-xs text-gray-500">
                      {beat === 1 ? '强拍' : beat === 3 ? '次强拍' : '弱拍'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 当前节拍状态 */}
        <div className="text-center">
          {gameState.isPlaying ? (
            <div className="text-sm text-gray-600">
              {(() => {
                const relativeTime = audioEngine.getTransportTime() - patternStartTimeRef.current;
                const preparationBeats = 8;
                
                if (relativeTime < preparationBeats) {
                  // 预备阶段显示
                  const currentBeat = Math.floor(relativeTime) + 1;
                  const currentBar = Math.ceil(currentBeat / 4);
                  const beatInBar = ((currentBeat - 1) % 4) + 1;
                  return `预备阶段: 第${currentBar}小节第${beatInBar}拍`;
                } else {
                  // 正式练习阶段显示
                  const practiceBeat = Math.floor(relativeTime - preparationBeats);
                  const currentBar = Math.floor(practiceBeat / 4) + 1;
                  const beatInBar = (practiceBeat % 4) + 1;
                  return `练习中: 第${currentBar}小节第${beatInBar}拍${subdivision > 1 ? ` - ${['第1', '第2', '第3', '第4'][Math.floor(gameState.currentBeat) % subdivision]}个音` : ''}`;
                }
              })()}
            </div>
          ) : (
            <div className="text-sm text-blue-600">
              点击"开始练习"后，先有两个八拍的预备时间，然后开始计分
            </div>
          )}
        </div>
      </div>
    );
  };

  // 渲染序列选择
  const renderSequenceSelection = () => {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ⏱️ 节拍大师
          </h2>
          <p className="text-gray-600">
            跟随节拍器，在正确的时间点击按钮
          </p>
        </div>

        {/* 音符类型选择器 */}
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">选择音符类型</h3>
          <div className="flex space-x-4">
            {(['quarter', 'eighth', 'sixteenth'] as NoteType[]).map((type) => (
              <Button
                key={type}
                variant={noteType === type ? 'primary' : 'secondary'}
                onClick={() => setNoteType(type)}
                className="min-w-20"
              >
                {type === 'quarter' ? '♩ 四分' : 
                 type === 'eighth' ? '♫ 八分' : 
                 '♬ 十六分'}
              </Button>
            ))}
          </div>
        </div>

        {/* BPM 调节器 */}
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">调节速度 (BPM)</h3>
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              onClick={() => setCurrentBPM(Math.max(60, currentBPM - 10))}
              disabled={currentBPM <= 60}
            >
              -10
            </Button>
            <span className="text-xl font-bold text-gray-800 min-w-16 text-center">
              {currentBPM}
            </span>
            <Button
              variant="secondary"
              onClick={() => setCurrentBPM(Math.min(200, currentBPM + 10))}
              disabled={currentBPM >= 200}
            >
              +10
            </Button>
          </div>
        </div>

        {/* 练习模式开关 */}
        <div className="flex items-center justify-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={practiceMode}
              onChange={(e) => setPracticeMode(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">练习模式（显示提示）</span>
          </label>
        </div>

        {/* 开始练习按钮 */}
        <div className="flex justify-center">
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-50 to-purple-50"
            clickable={true}
            onClick={() => {
              startGame();
            }}
          >
            <div className="space-y-3 text-center">
              <div className="text-3xl">
                {noteType === 'quarter' ? '♩' : 
                 noteType === 'eighth' ? '♫' : 
                 '♬'}
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                开始{noteType === 'quarter' ? '四分' : 
                     noteType === 'eighth' ? '八分' : 
                     '十六分'}音符练习
              </h3>
              <p className="text-sm text-gray-600">
                BPM: {currentBPM} • 4/4拍 • {practiceMode ? '练习模式' : '挑战模式'}
              </p>
              <p className="text-xs text-gray-500">
                {noteType === 'quarter' ? '每拍一个音符' : 
                 noteType === 'eighth' ? '每拍两个音符' : 
                 '每拍四个音符'}
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  // 渲染游戏界面（压缩布局，左右分栏）
  const renderGameInterface = () => (
    <div className="space-y-4">
      {/* 顶部信息与控制条 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🎵 节拍练习器</h2>
          <p className="text-gray-600 text-sm">BPM: {currentBPM} • {practiceMode ? '练习模式' : '挑战模式'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['quarter', 'eighth', 'sixteenth'] as NoteType[]).map((type) => (
            <Button
              key={type}
              variant={noteType === type ? 'primary' : 'secondary'}
              onClick={() => setNoteType(type)}
              className="min-w-20"
            >
              {type === 'quarter' ? '♩ 四分' : type === 'eighth' ? '♫ 八分' : '♬ 十六分'}
            </Button>
          ))}
          <div className="flex items-center gap-2 ml-2">
            <Button variant="secondary" onClick={() => setCurrentBPM(Math.max(60, currentBPM - 5))}>-5</Button>
            <span className="w-12 text-center font-semibold">{currentBPM}</span>
            <Button variant="secondary" onClick={() => setCurrentBPM(Math.min(200, currentBPM + 5))}>+5</Button>
          </div>
          <label className="flex items-center gap-2 ml-2 text-sm">
            <input type="checkbox" checked={practiceMode} onChange={(e) => setPracticeMode(e.target.checked)} className="rounded"/>
            练习模式
          </label>
          {!gameState.isPlaying ? (
            <Button onClick={async () => { await startGame(); }} variant="primary" className="ml-2">开始</Button>
          ) : (
            <Button onClick={stopGame} variant="danger" className="ml-2">停止</Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* 左侧：节拍可视化（占两列） */}
        <div className="md:col-span-2 bg-white p-4 rounded-lg shadow-sm border">
          {renderBeatIndicator()}
          {gameState.isPlaying && (() => {
            const now = audioEngine.getTransportTime();
            const secondsPerBeat = 60 / (selectedSequence?.bpm || currentBPM);
            const preparationSeconds = 8 * secondsPerBeat;
            const elapsed = now - patternStartTimeRef.current;
            if (elapsed < preparationSeconds) {
              const beatIndex = Math.floor(elapsed / secondsPerBeat);
              const bar = Math.floor(beatIndex / 4);
              const beatInBar = (beatIndex % 4) + 1;
              const colors = ['bg-blue-500','bg-green-500','bg-orange-500','bg-purple-500'];
              const bgColor = colors[(beatInBar - 1) % 4];
              return (
                <div className={`fixed inset-0 ${bgColor} bg-opacity-20 flex items-center justify-center pointer-events-none select-none`} style={{ zIndex: 50 }}>
                  <div className="text-6xl md:text-8xl font-extrabold text-gray-900/80 drop-shadow-lg">
                    {bar === 0 ? 2 - (beatInBar - 1) : 4 - (beatInBar - 1)}
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>

        {/* 右侧：统计 + 点击按钮 */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-blue-600">{gameState.score}</div>
              <div className="text-xs text-gray-600">得分</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-green-600">{gameState.combo}</div>
              <div className="text-xs text-gray-600">连击</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-purple-600">{gameState.accuracy.toFixed(1)}%</div>
              <div className="text-xs text-gray-600">准确率</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg text-center">
              <div className="text-lg font-bold text-orange-600">{gameState.taps.length}</div>
              <div className="text-xs text-gray-600">总点击</div>
            </div>
          </div>

          <div className="relative flex justify-center items-center" style={{ height: '120px' }}>
            <button
              onClick={handleTap}
              disabled={!gameState.isPlaying}
              className={`w-24 h-24 rounded-full text-white font-bold text-lg transition-all duration-200 transform ${gameState.isPlaying ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:scale-110 active:scale-125 active:animate-pulse' : 'bg-gray-400 cursor-not-allowed'}`}
              style={{ filter: feedbackAnimation ? 'brightness(1.2)' : 'brightness(1)' }}
            >
              点击
            </button>
            {feedbackAnimation && (
              <div key={feedbackAnimation.id} className={`${feedbackAnimation.type === 'perfect' ? 'bg-green-500 text-white border-2 border-green-300' : feedbackAnimation.type === 'great' ? 'bg-blue-500 text-white border-2 border-blue-300' : feedbackAnimation.type === 'good' ? 'bg-yellow-500 text-white border-2 border-yellow-300' : 'bg-red-500 text-white border-2 border-red-300'} absolute px-4 py-2 rounded-full text-lg font-bold pointer-events-none select-none shadow-lg whitespace-nowrap`} style={{ top: '0px', left: '50%', transform: 'translateX(-50%)', animation: 'float-up 1.5s ease-out forwards', zIndex: 1000, minWidth: '80px', textAlign: 'center' }}>
                {feedbackAnimation.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染结果
  const renderResults = () => (
    <div className="space-y-6 text-center">
      <h2 className="text-2xl font-bold text-gray-900">练习结果</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {gameState.score}
          </div>
          <div className="text-sm text-gray-600">总分</div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {gameState.accuracy.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">准确率</div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {gameState.maxCombo}
          </div>
          <div className="text-sm text-gray-600">最高连击</div>
        </div>
        
        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">
            {gameState.taps.length}
          </div>
          <div className="text-sm text-gray-600">总点击</div>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">点击分析</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-green-600">
              {gameState.taps.filter(t => t.accuracy === 'perfect').length}
            </div>
            <div className="text-gray-600">Perfect</div>
          </div>
          <div>
            <div className="font-medium text-blue-600">
              {gameState.taps.filter(t => t.accuracy === 'great').length}
            </div>
            <div className="text-gray-600">Great</div>
          </div>
          <div>
            <div className="font-medium text-yellow-600">
              {gameState.taps.filter(t => t.accuracy === 'good').length}
            </div>
            <div className="text-gray-600">Good</div>
          </div>
          <div>
            <div className="font-medium text-red-600">
              {gameState.taps.filter(t => t.accuracy === 'miss').length}
            </div>
            <div className="text-gray-600">Miss</div>
          </div>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <Button onClick={() => startGame()} variant="primary">
          再次练习
        </Button>
        <Button 
          onClick={() => {
            setSelectedSequence(null);
            setShowResults(false);
          }}
          variant="secondary"
        >
          选择其他
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {showResults ? renderResults() : renderGameInterface()}
    </div>
  );
};

export default RhythmMaster;
