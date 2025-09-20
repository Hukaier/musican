// 音乐理论平台 - 音频引擎Hook

import { useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { AudioEngine, EffectType, Asset } from '../types';
import { AUDIO_CONFIG, NOTE_DATA, LOOP_CONFIG } from '../constants';

export const useAudioEngine = (): AudioEngine => {
  const synthRef = useRef<Tone.Synth | null>(null);
  const effectSynthRef = useRef<Tone.Synth | null>(null);
  const backgroundMusicRef = useRef<Tone.Pattern<any> | null>(null);
  const isPlayingRef = useRef(false);
  const audioQueueRef = useRef<string[]>([]);
  const isInitializedRef = useRef(false);
  
  // Loop相关引用
  const loadedLoopsRef = useRef<Map<string, Tone.Player>>(new Map());
  const loopVolumesRef = useRef<Map<string, Tone.Volume>>(new Map());
  const soloTrackRef = useRef<string | null>(null);
  const mutedTracksRef = useRef<Set<string>>(new Set());
  
  // 初始化状态管理
  const initializationPromiseRef = useRef<Promise<void> | null>(null);
  
  // Transport和调度相关引用
  const metronomeRef = useRef<Tone.Player | null>(null);
  const metronomeEnabledRef = useRef<boolean>(true);
  const metronomeTickSynthRef = useRef<Tone.Synth | null>(null);
  const metronomeAccentSynthRef = useRef<Tone.Synth | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const lookAheadTime = useRef<number>(25.0); // 25ms提前调度
  const scheduleAheadTime = useRef<number>(0.1); // 100ms调度窗口
  const nextNoteTime = useRef<number>(0);
  const currentBeatRef = useRef<number>(0);
  const isTransportRunningRef = useRef<boolean>(false);
  
  // 回调函数引用
  const onBeatCallbackRef = useRef<((beat: number) => void) | null>(null);
  const onBarCallbackRef = useRef<((bar: number) => void) | null>(null);
  
  // 节拍subdivision设置（用于控制节拍器密度）
  const subdivisionRef = useRef<number>(1); // 1=四分音符, 2=八分音符, 4=十六分音符

  // 初始化音频引擎
  const initialize = useCallback(async (): Promise<void> => {
    // 如果已经在初始化中，返回现有的Promise
    if (initializationPromiseRef.current) {
      return initializationPromiseRef.current;
    }
    
    // 如果已经初始化完成，直接返回
    if (isInitializedRef.current && Tone.context.state === 'running') {
      return Promise.resolve();
    }
    
    // 创建新的初始化Promise
    initializationPromiseRef.current = (async () => {
      try {
        // 检查音频上下文状态
        if (Tone.context.state === 'closed') {
          // 如果上下文已关闭，创建新的上下文
          console.log('AudioContext is closed, creating new context...');
          const newContext = new AudioContext();
          Tone.setContext(newContext);
        }
        
        // 确保 Tone.js 已启动（只有在用户交互后才启动）
        if (Tone.context.state !== 'running') {
          try {
            await Tone.start();
            console.log('Tone.js started successfully');
          } catch (error) {
            console.warn('Tone.js start failed, this is expected if called without user interaction:', error);
            throw new Error('Audio context requires user interaction to start');
          }
        }
      
      // 清理旧的合成器
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
      if (effectSynthRef.current) {
        effectSynthRef.current.dispose();
        effectSynthRef.current = null;
      }
      
      // 初始化主合成器 - 使用更简单的设置
      synthRef.current = new Tone.Synth({
        oscillator: { 
          type: 'triangle' 
        },
        envelope: { 
          attack: 0.02, 
          decay: 0.3, 
          sustain: 0.3, 
          release: 0.8 
        }
      }).toDestination();
      
      // 初始化效果合成器
      effectSynthRef.current = new Tone.Synth({
        oscillator: { 
          type: 'sine' 
        },
        envelope: { 
          attack: 0.01, 
          decay: 0.2, 
          sustain: 0.1, 
          release: 0.3 
        }
      }).toDestination();
      
      // 设置音量
      synthRef.current.volume.value = -10; // 降低音量避免过载
      effectSynthRef.current.volume.value = -15;
      
      // 设置Transport
      Tone.Transport.bpm.value = AUDIO_CONFIG.defaultBPM;
      Tone.Transport.timeSignature = [4, 4]; // 4/4拍
      Tone.Transport.swing = 0; // 不使用摆动节拍
      Tone.Transport.swingSubdivision = '8n';
      
      // 初始化节拍器
      metronomeRef.current = new Tone.Player({
        url: "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuR2O/JdCYELIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjuR2O/JdCYE"
      }).toDestination();
      metronomeRef.current.volume.value = -20; // 节拍器音量较小

      // 初始化节拍器合成器（用于重音/普通音区分）
      metronomeTickSynthRef.current = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.03, sustain: 0, release: 0.03 }
      }).toDestination();
      metronomeAccentSynthRef.current = new Tone.Synth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
      }).toDestination();
      metronomeTickSynthRef.current.volume.value = -16;
      metronomeAccentSynthRef.current.volume.value = -12;
      
      // 初始化调度器
      initializeScheduler();
      
        isInitializedRef.current = true;
        console.log('Audio engine initialized successfully');
        
      } catch (error) {
        console.error('Audio initialization failed:', error);
        isInitializedRef.current = false;
        initializationPromiseRef.current = null;
        throw error;
      }
    })();
    
    return initializationPromiseRef.current;
  }, []);

  // 播放单个音符
  const playNote = useCallback((note: string, duration: string = AUDIO_CONFIG.noteDuration): void => {
    if (!synthRef.current || !isInitializedRef.current) {
      console.warn('Audio engine not initialized, attempting to initialize...');
      initialize().then(() => {
        if (synthRef.current && isInitializedRef.current) {
          synthRef.current.triggerAttackRelease(note, duration);
        }
      }).catch((error) => {
        console.error('Failed to initialize audio engine:', error);
      });
      return;
    }
    
    try {
      // 确保音频上下文处于运行状态
      if (Tone.context.state !== 'running') {
        Tone.start().then(() => {
          if (synthRef.current) {
            synthRef.current.triggerAttackRelease(note, duration);
          }
        }).catch(console.error);
        return;
      }
      
      synthRef.current.triggerAttackRelease(note, duration);
      console.log(`Playing note: ${note}`);
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  }, [initialize]);

  // 播放音符序列
  const playSequence = useCallback((notes: string[], interval: number = 150): void => {
    if (!synthRef.current || isPlayingRef.current) return;
    
    isPlayingRef.current = true;
    
    notes.forEach((note, index) => {
      const delay = index * interval;
      
      Tone.Transport.scheduleOnce(() => {
        synthRef.current?.triggerAttackRelease(note, AUDIO_CONFIG.noteDuration);
      }, `+${delay / 1000}`);
    });
    
    // 播放完成后重置状态
    setTimeout(() => {
      isPlayingRef.current = false;
      
      // 播放队列中的音符
      if (audioQueueRef.current.length > 0) {
        const queuedNotes = [...audioQueueRef.current];
        audioQueueRef.current = [];
        playSequence(queuedNotes, interval);
      }
    }, notes.length * interval + 500);
  }, []);

  // 启动节拍器
  const startMetronome = useCallback((bpm: number): void => {
    Tone.Transport.bpm.value = bpm;
    Tone.Transport.start();
  }, []);

  // 停止节拍器
  const stopMetronome = useCallback((): void => {
    Tone.Transport.stop();
  }, []);

  // 播放效果音
  const playEffect = useCallback((type: EffectType): void => {
    if (!effectSynthRef.current) return;
    
    switch (type) {
      case 'success':
        effectSynthRef.current.triggerAttackRelease('C5', AUDIO_CONFIG.effectDuration);
        setTimeout(() => {
          effectSynthRef.current?.triggerAttackRelease('E5', AUDIO_CONFIG.effectDuration);
        }, 100);
        break;
        
      case 'error':
        effectSynthRef.current.triggerAttackRelease('F3', AUDIO_CONFIG.noteDuration);
        break;
        
      case 'warning':
        effectSynthRef.current.triggerAttackRelease('G3', AUDIO_CONFIG.effectDuration);
        break;
        
      case 'info':
        effectSynthRef.current.triggerAttackRelease('A4', AUDIO_CONFIG.effectDuration);
        break;
        
      case 'combo':
        // 播放上升音阶片段
        const comboNotes = ['C5', 'D5', 'E5', 'F5', 'G5'];
        comboNotes.forEach((note, i) => {
          setTimeout(() => {
            effectSynthRef.current?.triggerAttackRelease(note, '16n');
          }, i * 80);
        });
        break;
        
      case 'complete':
        // 播放完整 Do Re Mi 上行
        const completeScale = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
        completeScale.forEach((note, i) => {
          setTimeout(() => {
            effectSynthRef.current?.triggerAttackRelease(note, AUDIO_CONFIG.effectDuration);
          }, i * 120);
        });
        break;
    }
  }, []);

  // 播放音符名称对应的音高
  const playNoteByName = useCallback((noteOrSolfege: string): void => {
    const noteData = NOTE_DATA.find(n => n.note === noteOrSolfege || n.solfege === noteOrSolfege);
    if (noteData) {
      playNote(noteData.pitch);
    }
  }, [playNote]);

  // 播放音阶
  const playScale = useCallback((scale: string[] = NOTE_DATA.map(n => n.pitch)): void => {
    playSequence(scale);
  }, [playSequence]);

  // 播放和弦
  const playChord = useCallback((notes: string[], duration: string = '2n'): void => {
    if (!synthRef.current) return;
    
    notes.forEach((note, index) => {
      setTimeout(() => {
        synthRef.current?.triggerAttackRelease(note, duration);
      }, index * 50);
    });
  }, []);

  // 设置音量
  const setVolume = useCallback((volume: number): void => {
    if (synthRef.current) {
      synthRef.current.volume.value = Tone.gainToDb(volume);
    }
    if (effectSynthRef.current) {
      effectSynthRef.current.volume.value = Tone.gainToDb(volume);
    }
  }, []);

  // 设置BPM
  const setBPM = useCallback((bpm: number): void => {
    Tone.Transport.bpm.value = bpm;
    // 更新调度器的时间计算
    updateSchedulerTiming();
  }, []);

  // Transport和调度相关方法
  
  // 初始化调度器
  const initializeScheduler = useCallback((): void => {
    // 设置初始值
    nextNoteTime.current = Tone.context.currentTime;
    currentBeatRef.current = 0;
    
    // 清理现有的调度器
    if (schedulerRef.current) {
      clearInterval(schedulerRef.current);
    }
    
    // 创建高精度调度器
    schedulerRef.current = window.setInterval(() => {
      scheduler();
    }, lookAheadTime.current);
  }, []);

  // 更新调度器时间计算
  const updateSchedulerTiming = useCallback((): void => {
    // 根据当前BPM计算节拍间隔
    const bpm = Tone.Transport.bpm.value;
    const secondsPerBeat = 60.0 / bpm;
    
    // 更新下一个节拍时间
    if (isTransportRunningRef.current) {
      const currentTime = Tone.context.currentTime;
      const elapsed = currentTime - nextNoteTime.current;
      const beatsElapsed = elapsed / secondsPerBeat;
      currentBeatRef.current += beatsElapsed;
      nextNoteTime.current = currentTime;
    }
  }, []);

  // 主调度器函数
  const scheduler = useCallback((): void => {
    if (!isTransportRunningRef.current) return;
    
    const currentTime = Tone.context.currentTime;
    const bpm = Tone.Transport.bpm.value;
    const secondsPerBeat = 60.0 / bpm;
    const subdivision = subdivisionRef.current;
    const secondsPerSubdivision = secondsPerBeat / subdivision;
    
    // 调度所有在提前时间窗口内的事件
    while (nextNoteTime.current < currentTime + scheduleAheadTime.current) {
      // 播放节拍器点击（如果启用）
      scheduleMetronomeClick(nextNoteTime.current, currentBeatRef.current);
      
      // 每个subdivision都触发节拍回调
      if (onBeatCallbackRef.current) {
        onBeatCallbackRef.current(Math.floor(currentBeatRef.current));
      }
      
      // 检查小节边界（基于整拍数）
      const wholeBeat = Math.floor(currentBeatRef.current / subdivision);
      if (wholeBeat % 4 === 0 && currentBeatRef.current % subdivision === 0 && onBarCallbackRef.current) {
        onBarCallbackRef.current(Math.floor(wholeBeat / 4));
      }
      
      // 调度Loop播放事件
      scheduleLoopEvents(nextNoteTime.current, currentBeatRef.current);
      
      // 移动到下一个subdivision
      nextNoteTime.current += secondsPerSubdivision;
      currentBeatRef.current += 1;
    }
  }, []);

  // 调度节拍器点击
  const scheduleMetronomeClick = useCallback((time: number, beatCounter: number): void => {
    if (!metronomeEnabledRef.current) return;
    const subdivision = subdivisionRef.current;
    const isBarDownbeat = (Math.floor(beatCounter) % (4 * subdivision) === 0);

    if (isBarDownbeat && metronomeAccentSynthRef.current) {
      metronomeAccentSynthRef.current.triggerAttackRelease('C6', 0.02, time);
    } else if (metronomeTickSynthRef.current) {
      metronomeTickSynthRef.current.triggerAttackRelease('C5', 0.01, time);
    } else if (metronomeRef.current && !metronomeRef.current.mute) {
      metronomeRef.current.start(time);
    }
  }, []);

  // 调度Loop事件
  const scheduleLoopEvents = useCallback((time: number, beat: number): void => {
    // 这里可以添加更复杂的Loop调度逻辑
    // 比如在特定节拍启动或停止Loop
  }, []);

  // 设置节拍回调
  const setBeatCallback = useCallback((callback: ((beat: number) => void) | null): void => {
    onBeatCallbackRef.current = callback;
  }, []);

  // 设置小节回调
  const setBarCallback = useCallback((callback: ((bar: number) => void) | null): void => {
    onBarCallbackRef.current = callback;
  }, []);

  // Loop相关方法
  
  // 加载Loop资产
  const loadLoop = useCallback(async (asset: Asset): Promise<void> => {
    try {
      if (loadedLoopsRef.current.has(asset.id)) {
        console.log(`Loop ${asset.id} already loaded`);
        return;
      }

      // 创建音量控制节点
      const volumeNode = new Tone.Volume(Tone.gainToDb(LOOP_CONFIG.defaultVolume));
      loopVolumesRef.current.set(asset.id, volumeNode);

      // 创建播放器
      const player = new Tone.Player({
        url: asset.url,
        loop: true,
        fadeIn: LOOP_CONFIG.fadeInTime,
        fadeOut: LOOP_CONFIG.fadeOutTime,
        onload: () => {
          console.log(`Loop ${asset.name} loaded successfully`);
        }
      }).connect(volumeNode).toDestination();

      loadedLoopsRef.current.set(asset.id, player);
      
      // 如果BPM不匹配，调整播放速度
      const currentBPM = Tone.Transport.bpm.value;
      if (asset.bpm !== currentBPM) {
        player.playbackRate = currentBPM / asset.bpm;
      }

    } catch (error) {
      console.error(`Failed to load loop ${asset.name}:`, error);
      throw error;
    }
  }, []);

  // 播放Loop
  const playLoop = useCallback((assetId: string, startTime: number = 0): void => {
    const player = loadedLoopsRef.current.get(assetId);
    if (!player) {
      console.warn(`Loop ${assetId} not loaded`);
      return;
    }

    try {
      // 检查是否被静音或独奏状态
      const isMuted = mutedTracksRef.current.has(assetId);
      const hasSolo = soloTrackRef.current !== null;
      const isSolo = soloTrackRef.current === assetId;
      
      if (isMuted || (hasSolo && !isSolo)) {
        return;
      }

      if (startTime > 0) {
        player.start(`+${startTime}`);
      } else {
        player.start();
      }
      
      console.log(`Playing loop: ${assetId}`);
    } catch (error) {
      console.error(`Failed to play loop ${assetId}:`, error);
    }
  }, []);

  // 停止Loop
  const stopLoop = useCallback((assetId: string): void => {
    const player = loadedLoopsRef.current.get(assetId);
    if (!player) {
      console.warn(`Loop ${assetId} not loaded`);
      return;
    }

    try {
      player.stop();
      console.log(`Stopped loop: ${assetId}`);
    } catch (error) {
      console.error(`Failed to stop loop ${assetId}:`, error);
    }
  }, []);

  // 设置Loop音量
  const setLoopVolume = useCallback((assetId: string, volume: number): void => {
    const volumeNode = loopVolumesRef.current.get(assetId);
    if (!volumeNode) {
      console.warn(`Volume node for loop ${assetId} not found`);
      return;
    }

    const clampedVolume = Math.max(LOOP_CONFIG.minVolume, Math.min(LOOP_CONFIG.maxVolume, volume));
    volumeNode.volume.value = Tone.gainToDb(clampedVolume);
  }, []);

  // 静音/取消静音Loop
  const muteLoop = useCallback((assetId: string, mute: boolean): void => {
    if (mute) {
      mutedTracksRef.current.add(assetId);
      stopLoop(assetId);
    } else {
      mutedTracksRef.current.delete(assetId);
    }
  }, [stopLoop]);

  // 独奏Loop
  const soloLoop = useCallback((assetId: string, solo: boolean): void => {
    if (solo) {
      soloTrackRef.current = assetId;
      // 停止所有其他Loop
      loadedLoopsRef.current.forEach((player, id) => {
        if (id !== assetId) {
          player.stop();
        }
      });
    } else {
      soloTrackRef.current = null;
    }
  }, []);

  // Transport控制
  const startTransport = useCallback((): void => {
    if (!isTransportRunningRef.current) {
      // 同步Tone.js Transport
      Tone.Transport.start();
      
      // 启动自定义调度器
      isTransportRunningRef.current = true;
      nextNoteTime.current = Tone.context.currentTime;
      
      // 启动所有未静音的Loop
      loadedLoopsRef.current.forEach((player, assetId) => {
        const isMuted = mutedTracksRef.current.has(assetId);
        const hasSolo = soloTrackRef.current !== null;
        const isSolo = soloTrackRef.current === assetId;
        
        if (!isMuted && (!hasSolo || isSolo)) {
          player.start();
        }
      });
      
      console.log('Transport started');
    }
  }, []);

  const stopTransport = useCallback((): void => {
    // 停止Tone.js Transport
    Tone.Transport.stop();
    
    // 停止自定义调度器
    isTransportRunningRef.current = false;
    currentBeatRef.current = 0;
    nextNoteTime.current = 0;
    
    // 停止所有Loop
    loadedLoopsRef.current.forEach(player => player.stop());
    
    console.log('Transport stopped');
  }, []);

  const pauseTransport = useCallback((): void => {
    // 暂停Tone.js Transport
    Tone.Transport.pause();
    
    // 暂停自定义调度器
    isTransportRunningRef.current = false;
    
    // 暂停所有Loop
    loadedLoopsRef.current.forEach(player => player.stop());
    
    console.log('Transport paused');
  }, []);

  const getTransportTime = useCallback((): number => {
    return Tone.Transport.seconds;
  }, []);

  // 获取当前节拍位置
  const getCurrentBeat = useCallback((): number => {
    return currentBeatRef.current;
  }, []);

  // 设置Transport位置
  const setTransportPosition = useCallback((beat: number): void => {
    const bpm = Tone.Transport.bpm.value;
    const secondsPerBeat = 60.0 / bpm;
    const timePosition = beat * secondsPerBeat;
    
    // 设置Tone.js Transport位置
    Tone.Transport.seconds = timePosition;
    
    // 更新自定义调度器状态
    currentBeatRef.current = beat;
    nextNoteTime.current = Tone.context.currentTime;
    
    console.log(`Transport position set to beat ${beat}`);
  }, []);

  // 量化函数 - 将时间量化到最近的节拍网格
  const quantizeToGrid = useCallback((time: number, subdivision: string = '8n'): number => {
    const bpm = Tone.Transport.bpm.value;
    const secondsPerBeat = 60.0 / bpm;
    
    // 计算细分值
    let subdivisionValue = 1;
    switch (subdivision) {
      case '4n': subdivisionValue = 1; break;
      case '8n': subdivisionValue = 0.5; break;
      case '16n': subdivisionValue = 0.25; break;
      case '32n': subdivisionValue = 0.125; break;
      default: subdivisionValue = 0.5;
    }
    
    const gridInterval = secondsPerBeat * subdivisionValue;
    return Math.round(time / gridInterval) * gridInterval;
  }, []);

  // 节拍器控制
  const enableMetronome = useCallback((enabled: boolean): void => {
    metronomeEnabledRef.current = enabled;
    if (metronomeRef.current) {
      metronomeRef.current.mute = !enabled;
    }
  }, []);

  const setMetronomeVolume = useCallback((volume: number): void => {
    if (metronomeRef.current) {
      metronomeRef.current.volume.value = Tone.gainToDb(Math.max(0, Math.min(1, volume)));
    }
    if (metronomeTickSynthRef.current) {
      metronomeTickSynthRef.current.volume.value = Tone.gainToDb(Math.max(0, Math.min(1, volume)));
    }
    if (metronomeAccentSynthRef.current) {
      metronomeAccentSynthRef.current.volume.value = Tone.gainToDb(Math.max(0, Math.min(1, volume)));
    }
  }, []);

  const setMetronomeSubdivision = useCallback((subdivision: number): void => {
    subdivisionRef.current = subdivision;
  }, []);

  // 清理资源
  const dispose = useCallback((): void => {
    try {
      // 停止调度器
      if (schedulerRef.current) {
        clearInterval(schedulerRef.current);
        schedulerRef.current = null;
      }
      
      // 停止Transport
      isTransportRunningRef.current = false;
      
      // 清理合成器
      synthRef.current?.dispose();
      effectSynthRef.current?.dispose();
      backgroundMusicRef.current?.stop();
      backgroundMusicRef.current?.dispose();
      
      // 清理节拍器
      metronomeRef.current?.dispose();
      metronomeRef.current = null;
      metronomeTickSynthRef.current?.dispose();
      metronomeTickSynthRef.current = null;
      metronomeAccentSynthRef.current?.dispose();
      metronomeAccentSynthRef.current = null;
      
      // 清理所有Loop
      loadedLoopsRef.current.forEach(player => {
        player.stop();
        player.dispose();
      });
      loadedLoopsRef.current.clear();
      
      // 清理音量节点
      loopVolumesRef.current.forEach(volume => {
        volume.dispose();
      });
      loopVolumesRef.current.clear();
      
      // 重置引用
      synthRef.current = null;
      effectSynthRef.current = null;
      backgroundMusicRef.current = null;
      soloTrackRef.current = null;
      mutedTracksRef.current.clear();
      
      // 清理回调
      onBeatCallbackRef.current = null;
      onBarCallbackRef.current = null;
      
      // 停止Tone.js Transport
      Tone.Transport.stop();
      Tone.Transport.cancel();
      
      // 不要关闭音频上下文，只是重置状态
      // 这样可以避免 "Cannot resume a closed AudioContext" 错误
      isInitializedRef.current = false;
      initializationPromiseRef.current = null;
      
      console.log('Audio engine disposed');
    } catch (error) {
      console.warn('Audio cleanup failed:', error);
    }
  }, []);

  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      dispose();
    };
  }, [dispose]);

  return {
    initialize,
    playNote,
    playSequence,
    startMetronome,
    stopMetronome,
    playEffect,
    dispose,
    // 扩展方法
    playNoteByName,
    playScale,
    playChord,
    setVolume,
    setBPM,
    // Loop相关方法
    loadLoop,
    playLoop,
    stopLoop,
    setLoopVolume,
    muteLoop,
    soloLoop,
    startTransport,
    stopTransport,
    pauseTransport,
    getTransportTime,
    // 增强的Transport控制
    getCurrentBeat,
    setTransportPosition,
    quantizeToGrid,
    setBeatCallback,
    setBarCallback,
    // 节拍器控制
    enableMetronome,
    setMetronomeVolume,
    setMetronomeSubdivision,
  };
};
