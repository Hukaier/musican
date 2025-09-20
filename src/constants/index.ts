// 音乐理论平台 - 常量定义

import { NoteData, ModuleKey, Badge, Asset, LoopCategory, RhythmSequence, TimeSignature } from '../types';

// 音符数据
export const NOTE_DATA: NoteData[] = [
  { note: 'C', solfege: 'Do', emoji: '🎵', pitch: 'C4', frequency: 261.63 },
  { note: 'D', solfege: 'Re', emoji: '🎶', pitch: 'D4', frequency: 293.66 },
  { note: 'E', solfege: 'Mi', emoji: '🎼', pitch: 'E4', frequency: 329.63 },
  { note: 'F', solfege: 'Fa', emoji: '🎹', pitch: 'F4', frequency: 349.23 },
  { note: 'G', solfege: 'Sol', emoji: '🎺', pitch: 'G4', frequency: 392.00 },
  { note: 'A', solfege: 'La', emoji: '🎻', pitch: 'A4', frequency: 440.00 },
  { note: 'B', solfege: 'Si', emoji: '🎸', pitch: 'B4', frequency: 493.88 },
];

// 模块配置
export const MODULE_CONFIG = {
  notes: {
    key: 'notes' as ModuleKey,
    title: '基础音符游戏',
    description: '学习 C D E F G A B 与 Do Re Mi Fa Sol La Si 的对应关系',
    icon: '🎼',
    color: '#007bff',
    difficulty: 'beginner' as const,
    estimatedTime: 15,
  },
  rhythm: {
    key: 'rhythm' as ModuleKey,
    title: '节拍大师',
    description: '掌握基本音符时值和节拍感',
    icon: '⏱️',
    color: '#28a745',
    difficulty: 'beginner' as const,
    estimatedTime: 20,
  },
  scale: {
    key: 'scale' as ModuleKey,
    title: '音阶探险',
    description: '理解大调音阶的结构和模式',
    icon: '🎹',
    color: '#ffc107',
    difficulty: 'intermediate' as const,
    estimatedTime: 25,
  },
  chord: {
    key: 'chord' as ModuleKey,
    title: '和弦魔法',
    description: '学习基础三和弦的构成和声音特色',
    icon: '🔀',
    color: '#dc3545',
    difficulty: 'intermediate' as const,
    estimatedTime: 30,
  },
  key: {
    key: 'key' as ModuleKey,
    title: '调性王国',
    description: '理解不同调性的特点和转换',
    icon: '🎨',
    color: '#6f42c1',
    difficulty: 'intermediate' as const,
    estimatedTime: 35,
  },
  interval: {
    key: 'interval' as ModuleKey,
    title: '音程冒险',
    description: '掌握基本音程的识别和性质',
    icon: '🎪',
    color: '#fd7e14',
    difficulty: 'advanced' as const,
    estimatedTime: 40,
  },
  staff: {
    key: 'staff' as ModuleKey,
    title: '五线谱读写',
    description: '掌握五线谱的基本读写技能',
    icon: '📊',
    color: '#20c997',
    difficulty: 'advanced' as const,
    estimatedTime: 45,
  },
  mode: {
    key: 'mode' as ModuleKey,
    title: '调式与和声',
    description: '理解调式的概念，掌握基本和声知识',
    icon: '🎭',
    color: '#e83e8c',
    difficulty: 'advanced' as const,
    estimatedTime: 50,
  },
  form: {
    key: 'form' as ModuleKey,
    title: '曲式分析',
    description: '理解音乐的结构，学会分析音乐作品',
    icon: '🎼',
    color: '#6c757d',
    difficulty: 'expert' as const,
    estimatedTime: 60,
  },
  composition: {
    key: 'composition' as ModuleKey,
    title: '模块化编曲工坊',
    description: '通过Loop编曲、智能和弦/旋律、卷帘窗完成作品',
    icon: '🎛️',
    color: '#17a2b8',
    difficulty: 'expert' as const,
    estimatedTime: 90,
  },
};

// 成就徽章配置
export const BADGE_CONFIG: Omit<Badge, 'earnedAt'>[] = [
  // 基础成就
  {
    id: 'note_beginner',
    key: 'note_beginner',
    title: '音符新手',
    description: '认识所有基本音符',
    rarity: 'common',
    category: 'basic',
    icon: '🎵',
  },
  {
    id: 'rhythm_apprentice',
    key: 'rhythm_apprentice',
    title: '节拍学徒',
    description: '掌握基本节拍型',
    rarity: 'common',
    category: 'basic',
    icon: '🎶',
  },
  {
    id: 'scale_explorer',
    key: 'scale_explorer',
    title: '音阶探索者',
    description: '理解大调音阶结构',
    rarity: 'common',
    category: 'basic',
    icon: '🎹',
  },
  {
    id: 'chord_beginner',
    key: 'chord_beginner',
    title: '和弦入门者',
    description: '识别大小三和弦',
    rarity: 'common',
    category: 'basic',
    icon: '🔀',
  },
  {
    id: 'key_scholar',
    key: 'key_scholar',
    title: '调性学者',
    description: '掌握调号规律',
    rarity: 'common',
    category: 'basic',
    icon: '🎨',
  },
  {
    id: 'interval_expert',
    key: 'interval_expert',
    title: '音程专家',
    description: '理解基本音程关系',
    rarity: 'rare',
    category: 'basic',
    icon: '🎪',
  },
  
  // 进阶成就
  {
    id: 'staff_master',
    key: 'staff_master',
    title: '谱面大师',
    description: '熟练读写五线谱',
    rarity: 'rare',
    category: 'advanced',
    icon: '📊',
  },
  {
    id: 'mode_expert',
    key: 'mode_expert',
    title: '调式专家',
    description: '掌握各种调式',
    rarity: 'rare',
    category: 'advanced',
    icon: '🎭',
  },
  {
    id: 'harmony_scholar',
    key: 'harmony_scholar',
    title: '和声学者',
    description: '理解和声进行',
    rarity: 'rare',
    category: 'advanced',
    icon: '🔀',
  },
  {
    id: 'form_analyst',
    key: 'form_analyst',
    title: '曲式分析家',
    description: '能分析音乐结构',
    rarity: 'epic',
    category: 'advanced',
    icon: '🎼',
  },
  {
    id: 'composition_novice',
    key: 'composition_novice',
    title: '编曲新手',
    description: '完成第一首作品',
    rarity: 'epic',
    category: 'advanced',
    icon: '🎛️',
  },
  {
    id: 'sight_reading_master',
    key: 'sight_reading_master',
    title: '视唱达人',
    description: '准确视唱旋律',
    rarity: 'epic',
    category: 'advanced',
    icon: '🎤',
  },
  
  // 高级成就
  {
    id: 'theory_master',
    key: 'theory_master',
    title: '理论大师',
    description: '完成所有挑战',
    rarity: 'legendary',
    category: 'expert',
    icon: '🌟',
  },
  {
    id: 'music_composer',
    key: 'music_composer',
    title: '音乐创作家',
    description: '创作原创作品',
    rarity: 'legendary',
    category: 'expert',
    icon: '🎵',
  },
  {
    id: 'analysis_expert',
    key: 'analysis_expert',
    title: '分析专家',
    description: '深度音乐分析',
    rarity: 'legendary',
    category: 'expert',
    icon: '🎼',
  },
  {
    id: 'improvisation_master',
    key: 'improvisation_master',
    title: '即兴演奏家',
    description: '即兴演奏能力',
    rarity: 'legendary',
    category: 'expert',
    icon: '🎹',
  },
  {
    id: 'style_master',
    key: 'style_master',
    title: '风格大师',
    description: '掌握多种音乐风格',
    rarity: 'legendary',
    category: 'expert',
    icon: '🎭',
  },
  {
    id: 'complete_musician',
    key: 'complete_musician',
    title: '全能音乐家',
    description: '综合音乐能力',
    rarity: 'legendary',
    category: 'expert',
    icon: '🏆',
  },
];

// 游戏配置
export const GAME_CONFIG = {
  memory: {
    cardPairs: 7,
    flipDelay: 1000,
    matchPoints: 10,
    comboMultiplier: 5,
  },
  matching: {
    gridWidth: 8,
    gridHeight: 6,
    totalCards: 48,
    matchPoints: 10,
    comboMultiplier: 5,
  },
  rhythm: {
    bpm: 120,
    timeSignature: '4/4',
    noteValues: ['whole', 'half', 'quarter', 'eighth', 'sixteenth'],
  },
};

// 音频配置
export const AUDIO_CONFIG = {
  defaultBPM: 120,
  noteDuration: '4n',
  effectDuration: '8n',
  backgroundVolume: -25,
  synthSettings: {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.3, sustain: 0.3, release: 0.8 },
  },
  effectSynthSettings: {
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.3 },
  },
};

// 学习路径配置
export const LEARNING_PATHS = {
  beginner: ['notes', 'rhythm', 'scale'] as ModuleKey[],
  intermediate: ['chord', 'key', 'interval'] as ModuleKey[],
  advanced: ['staff', 'mode', 'form'] as ModuleKey[],
  expert: ['composition'] as ModuleKey[],
};

// 每日任务配置
export const DAILY_TASKS = {
  practice: {
    title: '每日练习',
    description: '完成任意模块的练习',
    points: 10,
    target: 1,
  },
  streak: {
    title: '连续学习',
    description: '连续学习天数',
    points: 5,
    target: 1,
  },
  achievement: {
    title: '获得成就',
    description: '解锁新的成就徽章',
    points: 20,
    target: 1,
  },
};

// 主题配置
export const THEME_CONFIG = {
  light: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
  },
  dark: {
    primary: '#0d6efd',
    secondary: '#6c757d',
    success: '#198754',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#0dcaf0',
    background: '#212529',
    surface: '#343a40',
    text: '#ffffff',
  },
};

// 本地化配置
export const I18N_CONFIG = {
  zh: {
    language: '中文',
    direction: 'ltr',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm',
  },
  en: {
    language: 'English',
    direction: 'ltr',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
  },
};

// API配置
export const API_CONFIG = {
  baseUrl: typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3000'
    : 'https://api.music-theory-playground.com',
  timeout: 10000,
  retryAttempts: 3,
};

// 存储配置
export const STORAGE_CONFIG = {
  userKey: 'music_theory_user',
  progressKey: 'music_theory_progress',
  settingsKey: 'music_theory_settings',
  cacheKey: 'music_theory_cache',
};

// Loop资产配置
export const LOOP_CATEGORIES: LoopCategory[] = [
  {
    id: 'drums',
    name: '鼓组',
    icon: '🥁',
    color: '#dc3545',
    description: '各种风格的鼓点Loop',
    assets: []
  },
  {
    id: 'bass',
    name: '贝斯',
    icon: '🎸',
    color: '#28a745',
    description: '低音贝斯线条',
    assets: []
  },
  {
    id: 'chords',
    name: '和弦',
    icon: '🎹',
    color: '#007bff',
    description: '和弦进行与伴奏',
    assets: []
  },
  {
    id: 'melody',
    name: '旋律',
    icon: '🎺',
    color: '#ffc107',
    description: '主旋律与装饰音',
    assets: []
  },
  {
    id: 'effects',
    name: '效果',
    icon: '✨',
    color: '#6f42c1',
    description: '音效与氛围声音',
    assets: []
  }
];

// 示例Loop资产数据
export const SAMPLE_ASSETS: Asset[] = [
  // 鼓组
  {
    id: 'drum_basic_pop',
    kind: 'loop',
    name: '流行基础鼓点',
    url: '/assets/loops/drums/basic_pop_120.wav',
    bpm: 120,
    key: 'C',
    scale: 'major',
    lengthBeat: 4,
    tags: ['drums', 'pop', 'basic'],
    style: 'pop',
    mood: 'energetic',
    instrument: 'drums',
    difficulty: 'beginner',
    createdAt: new Date()
  },
  {
    id: 'drum_rock_beat',
    kind: 'loop',
    name: '摇滚鼓点',
    url: '/assets/loops/drums/rock_beat_120.wav',
    bpm: 120,
    key: 'C',
    scale: 'major',
    lengthBeat: 4,
    tags: ['drums', 'rock', 'powerful'],
    style: 'rock',
    mood: 'powerful',
    instrument: 'drums',
    difficulty: 'intermediate',
    createdAt: new Date()
  },
  
  // 贝斯
  {
    id: 'bass_simple_walk',
    kind: 'loop',
    name: '简单行走贝斯',
    url: '/assets/loops/bass/simple_walk_120.wav',
    bpm: 120,
    key: 'C',
    scale: 'major',
    lengthBeat: 4,
    tags: ['bass', 'walking', 'simple'],
    style: 'jazz',
    mood: 'smooth',
    instrument: 'bass',
    difficulty: 'beginner',
    createdAt: new Date()
  },
  {
    id: 'bass_funk_groove',
    kind: 'loop',
    name: 'Funk贝斯律动',
    url: '/assets/loops/bass/funk_groove_120.wav',
    bpm: 120,
    key: 'C',
    scale: 'major',
    lengthBeat: 4,
    tags: ['bass', 'funk', 'groove'],
    style: 'funk',
    mood: 'groovy',
    instrument: 'bass',
    difficulty: 'intermediate',
    createdAt: new Date()
  },
  
  // 和弦
  {
    id: 'chord_basic_progression',
    kind: 'loop',
    name: '基础和弦进行',
    url: '/assets/loops/chords/basic_progression_120.wav',
    bpm: 120,
    key: 'C',
    scale: 'major',
    lengthBeat: 8,
    tags: ['chords', 'progression', 'basic'],
    style: 'pop',
    mood: 'bright',
    instrument: 'piano',
    difficulty: 'beginner',
    createdAt: new Date()
  },
  {
    id: 'chord_jazz_voicing',
    kind: 'loop',
    name: '爵士和弦配置',
    url: '/assets/loops/chords/jazz_voicing_120.wav',
    bpm: 120,
    key: 'C',
    scale: 'major',
    lengthBeat: 8,
    tags: ['chords', 'jazz', 'sophisticated'],
    style: 'jazz',
    mood: 'sophisticated',
    instrument: 'piano',
    difficulty: 'advanced',
    createdAt: new Date()
  },
  
  // 旋律
  {
    id: 'melody_simple_theme',
    kind: 'loop',
    name: '简单主题旋律',
    url: '/assets/loops/melody/simple_theme_120.wav',
    bpm: 120,
    key: 'C',
    scale: 'major',
    lengthBeat: 8,
    tags: ['melody', 'theme', 'simple'],
    style: 'classical',
    mood: 'peaceful',
    instrument: 'flute',
    difficulty: 'beginner',
    createdAt: new Date()
  },
  {
    id: 'melody_electronic_lead',
    kind: 'loop',
    name: '电子主音',
    url: '/assets/loops/melody/electronic_lead_120.wav',
    bpm: 120,
    key: 'C',
    scale: 'minor',
    lengthBeat: 4,
    tags: ['melody', 'electronic', 'lead'],
    style: 'electronic',
    mood: 'energetic',
    instrument: 'synth',
    difficulty: 'intermediate',
    createdAt: new Date()
  }
];

// Loop配置
export const LOOP_CONFIG = {
  maxTracks: 8,
  maxClipsPerTrack: 16,
  quantizeOptions: ['1/4', '1/8', '1/16'],
  defaultQuantize: '1/8',
  fadeInTime: 0.1,
  fadeOutTime: 0.1,
  crossfadeTime: 0.05,
  maxVolume: 1.0,
  minVolume: 0.0,
  defaultVolume: 0.8,
};

// 节拍大师配置
export const RHYTHM_CONFIG = {
  // 时间容差配置 (毫秒) - 适中设置（收紧）
  timing: {
    perfect: 50,    // ±50ms = Perfect
    great: 100,     // ±100ms = Great
    good: 160,      // ±160ms = Good（比之前180略收紧）
    miss: 220,      // >160ms = Miss（比之前250收紧）
  },
  
  // 评分配置
  scoring: {
    perfect: 100,
    great: 80,
    good: 60,
    miss: 0,
    comboBonus: 5,  // 每连击加分
    maxCombo: 50,   // 最大连击倍数
  },
  
  // 默认设置
  defaults: {
    bpm: 120,
    timeSignature: '4/4' as TimeSignature,
    patternLength: 8, // 8拍模式
    practiceMode: true,
  },
  
  // 可视化配置
  visual: {
    beatIndicatorSize: 60,
    pulseAnimation: true,
    showSubdivisions: true,
    colorScheme: {
      strong: '#ef4444',      // 强拍 - 红色
      medium: '#f97316',      // 中拍 - 橙色  
      weak: '#22c55e',        // 弱拍 - 绿色
      off: '#6b7280',         // 休止 - 灰色
      active: '#3b82f6',      // 当前拍 - 蓝色
    }
  }
};

// 预设节拍序列
export const RHYTHM_SEQUENCES: RhythmSequence[] = [
  // 统一的节拍练习器 - 支持动态音符类型切换
  {
    id: 'unified_rhythm_practice',
    name: '节拍练习器',
    timeSignature: '4/4',
    bpm: 100,
    difficulty: 'beginner',
    description: '可切换四分、八分、十六分音符的节拍练习',
    pattern: [
      // 这里的 pattern 会根据选择的音符类型动态生成
      { beat: 1, subdivision: 0, emphasis: 'strong', noteValue: 'quarter', isRest: false },
      { beat: 2, subdivision: 0, emphasis: 'weak', noteValue: 'quarter', isRest: false },
      { beat: 3, subdivision: 0, emphasis: 'medium', noteValue: 'quarter', isRest: false },
      { beat: 4, subdivision: 0, emphasis: 'weak', noteValue: 'quarter', isRest: false },
    ]
  },

  // 中级 - 3/4拍华尔兹
  {
    id: 'waltz_3_4',
    name: '华尔兹节拍',
    timeSignature: '3/4',
    bpm: 140,
    difficulty: 'intermediate',
    description: '经典的三拍华尔兹节奏',
    pattern: [
      { beat: 1, subdivision: 0, emphasis: 'strong', noteValue: 'quarter', isRest: false },
      { beat: 2, subdivision: 0, emphasis: 'weak', noteValue: 'quarter', isRest: false },
      { beat: 3, subdivision: 0, emphasis: 'weak', noteValue: 'quarter', isRest: false },
    ]
  },

  // 中级 - 切分节奏
  {
    id: 'syncopated_4_4',
    name: '切分节奏',
    timeSignature: '4/4',
    bpm: 110,
    difficulty: 'intermediate', 
    description: '包含切分音的节奏练习',
    pattern: [
      { beat: 1, subdivision: 0, emphasis: 'strong', noteValue: 'quarter', isRest: false },
      { beat: 1, subdivision: 1, emphasis: 'off', noteValue: 'eighth', isRest: true },
      { beat: 2, subdivision: 1, emphasis: 'medium', noteValue: 'eighth', isRest: false },
      { beat: 3, subdivision: 0, emphasis: 'medium', noteValue: 'quarter', isRest: false },
      { beat: 4, subdivision: 0, emphasis: 'weak', noteValue: 'quarter', isRest: false },
    ]
  },

  // 高级 - 6/8拍复合节拍
  {
    id: 'compound_6_8',
    name: '复合节拍6/8',
    timeSignature: '6/8',
    bpm: 120,
    difficulty: 'advanced',
    description: '6/8拍的复合节拍感',
    pattern: [
      { beat: 1, subdivision: 0, emphasis: 'strong', noteValue: 'eighth', isRest: false },
      { beat: 1, subdivision: 1, emphasis: 'weak', noteValue: 'eighth', isRest: false },
      { beat: 1, subdivision: 2, emphasis: 'weak', noteValue: 'eighth', isRest: false },
      { beat: 2, subdivision: 0, emphasis: 'medium', noteValue: 'eighth', isRest: false },
      { beat: 2, subdivision: 1, emphasis: 'weak', noteValue: 'eighth', isRest: false },
      { beat: 2, subdivision: 2, emphasis: 'weak', noteValue: 'eighth', isRest: false },
    ]
  },

  // 专家级 - 十六分音符
  {
    id: 'sixteenth_notes',
    name: '十六分音符挑战',
    timeSignature: '4/4',
    bpm: 100,
    difficulty: 'expert',
    description: '快速的十六分音符节奏',
    pattern: [
      { beat: 1, subdivision: 0, emphasis: 'strong', noteValue: 'sixteenth', isRest: false },
      { beat: 1, subdivision: 1, emphasis: 'weak', noteValue: 'sixteenth', isRest: false },
      { beat: 1, subdivision: 2, emphasis: 'weak', noteValue: 'sixteenth', isRest: false },
      { beat: 1, subdivision: 3, emphasis: 'weak', noteValue: 'sixteenth', isRest: false },
      { beat: 2, subdivision: 0, emphasis: 'weak', noteValue: 'quarter', isRest: false },
      { beat: 3, subdivision: 0, emphasis: 'medium', noteValue: 'eighth', isRest: false },
      { beat: 3, subdivision: 1, emphasis: 'weak', noteValue: 'eighth', isRest: false },
      { beat: 4, subdivision: 0, emphasis: 'weak', noteValue: 'quarter', isRest: false },
    ]
  }
];
