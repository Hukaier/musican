// 音乐理论平台 - 统一类型定义

// 基础类型
export type GameMode = 'memory' | 'matching' | 'rhythm' | 'scale' | 'chord' | 'interval';
export type CardState = 'hidden' | 'revealed' | 'matched';
export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type ModuleKey = 'notes' | 'rhythm' | 'scale' | 'chord' | 'key' | 'interval' | 'staff' | 'mode' | 'form' | 'composition';

// 节拍相关类型
export type RhythmPattern = 'simple' | 'compound' | 'syncopated' | 'polyrhythm';
export type TimeSignature = '4/4' | '3/4' | '2/4' | '6/8' | '9/8' | '12/8';
export type NoteValue = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth' | 'thirty-second';

export interface RhythmBeat {
  beat: number;
  subdivision: number;
  emphasis: 'strong' | 'medium' | 'weak' | 'off';
  noteValue: NoteValue;
  isRest: boolean;
}

export interface RhythmSequence {
  id: string;
  name: string;
  timeSignature: TimeSignature;
  bpm: number;
  pattern: RhythmBeat[];
  difficulty: Difficulty;
  description: string;
}

export interface BeatTap {
  timestamp: number;
  expectedTime: number;
  deviation: number;
  accuracy: 'perfect' | 'great' | 'good' | 'miss';
  score: number;
}

export interface RhythmGameState {
  sequence: RhythmSequence | null;
  currentBeat: number;
  isPlaying: boolean;
  taps: BeatTap[];
  score: number;
  combo: number;
  maxCombo: number;
  accuracy: number;
  startTime: number;
  endTime: number | null;
}

// 游戏网格相关类型
export interface GridCell {
  card: MatchingCard | null;
  isEmpty: boolean;
}

export interface ConnectionLine {
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
}

// 音符相关
export interface NoteData {
  note: string;
  solfege: string;
  emoji: string;
  pitch: string;
  frequency?: number;
}

// 游戏相关
export interface GameState {
  score: number;
  level: number;
  isPlaying: boolean;
  currentModule: ModuleKey;
  difficulty: Difficulty;
}

export interface Card {
  id: string;
  content: string;
  type: 'note' | 'solfege' | 'chord' | 'interval';
  emoji: string;
  state: CardState;
  data?: any;
}

export interface MatchingCard {
  id: string;
  note: string;
  solfege: string;
  emoji: string;
  icon: string;
  x: number;
  y: number;
  selected: boolean;
  matched: boolean;
  eliminating: boolean;
}

// 音频相关
export interface AudioEngine {
  initialize: () => Promise<void>;
  playNote: (note: string, duration?: string) => void;
  playSequence: (notes: string[], interval?: number) => void;
  startMetronome: (bpm: number) => void;
  stopMetronome: () => void;
  playEffect: (type: EffectType) => void;
  dispose: () => void;
  // 扩展方法
  playNoteByName: (noteOrSolfege: string) => void;
  playScale: (scale?: string[]) => void;
  playChord: (notes: string[], duration?: string) => void;
  setVolume: (volume: number) => void;
  setBPM: (bpm: number) => void;
  // Loop相关方法
  loadLoop: (asset: Asset) => Promise<void>;
  playLoop: (assetId: string, startTime?: number) => void;
  stopLoop: (assetId: string) => void;
  setLoopVolume: (assetId: string, volume: number) => void;
  muteLoop: (assetId: string, mute: boolean) => void;
  soloLoop: (assetId: string, solo: boolean) => void;
  startTransport: () => void;
  stopTransport: () => void;
  pauseTransport: () => void;
  getTransportTime: () => number;
  // 增强的Transport控制
  getCurrentBeat: () => number;
  setTransportPosition: (beat: number) => void;
  quantizeToGrid: (time: number, subdivision?: string) => number;
  setBeatCallback: (callback: ((beat: number) => void) | null) => void;
  setBarCallback: (callback: ((bar: number) => void) | null) => void;
  // 节拍器控制
  enableMetronome: (enabled: boolean) => void;
  setMetronomeVolume: (volume: number) => void;
  setMetronomeSubdivision: (subdivision: number) => void;
}

export type EffectType = 'success' | 'error' | 'combo' | 'complete' | 'warning' | 'info';

// 用户与进度
export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  locale: string;
  createdAt: Date;
  preferences: UserPreferences;
}

export interface UserPreferences {
  audioEnabled: boolean;
  difficulty: Difficulty;
  theme: 'light' | 'dark' | 'auto';
  language: 'zh' | 'en';
  notifications: boolean;
}

export interface Progress {
  userId: string;
  moduleKey: ModuleKey;
  level: number;
  xp: number;
  streak: number;
  lastActiveAt: Date;
  completionRate: number;
}

export interface Badge {
  id: string;
  key: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'basic' | 'advanced' | 'expert';
  icon: string;
  earnedAt?: Date;
}

// 教程系统
export interface Tutorial {
  id: string;
  title: string;
  description: string;
  order: number;
  difficulty: Difficulty;
  category: ModuleKey;
  content: TutorialContent[];
}

export interface TutorialContent {
  type: 'text' | 'video' | 'demo' | 'exercise';
  title: string;
  content: string;
  data?: any;
}

export interface Video {
  id: string;
  tutorialId: string;
  title: string;
  url: string;
  duration: number;
  subtitles?: string;
  annotations?: VideoAnnotation[];
}

export interface VideoAnnotation {
  time: number;
  type: 'note' | 'highlight' | 'interaction';
  content: string;
  data?: any;
}

// 知识图谱
export interface KnowledgeNode {
  id: string;
  concept: string;
  description: string;
  difficulty: Difficulty;
  prerequisites: string[];
  applications: string[];
  relations: KnowledgeRelation[];
}

export interface KnowledgeRelation {
  from: string;
  to: string;
  type: 'prerequisite' | 'related' | 'application' | 'example';
  strength: number;
}

// 学习内容
export interface Lesson {
  id: string;
  moduleKey: ModuleKey;
  title: string;
  description: string;
  order: number;
  goals: string[];
  prerequisites: string[];
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: ExerciseType;
  title: string;
  description: string;
  payload: ExercisePayload;
  difficulty: Difficulty;
  timeLimit?: number;
  points: number;
}

export type ExerciseType = 
  | 'multiple_choice' 
  | 'matching' 
  | 'drag_drop' 
  | 'fill_blank' 
  | 'audio_identification' 
  | 'rhythm_tapping'
  | 'sight_reading'
  | 'harmony_analysis'
  | 'form_analysis'
  | 'composition';

export interface ExercisePayload {
  prompt: string;
  options?: string[];
  correctAnswer: string | string[];
  data?: any;
  audioUrl?: string;
  imageUrl?: string;
}

export interface Attempt {
  id: string;
  exerciseId: string;
  userId: string;
  startedAt: Date;
  finishedAt?: Date;
  score: number;
  answers: any[];
  timeSpent: number;
  hintsUsed: number;
}

// Loop资产
export interface Asset {
  id: string;
  kind: 'loop' | 'audio' | 'sprite';
  name: string;
  url: string;
  bpm: number;
  key: string;
  scale: string;
  lengthBeat: number;
  tags: string[];
  style: string;
  mood: string;
  instrument: string;
  difficulty: Difficulty;
  previewUrl?: string;
  waveformUrl?: string;
  createdAt: Date;
}

export interface LoopCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  assets: Asset[];
}

// 编曲工程
export interface Project {
  id: string;
  userId: string;
  title: string;
  description?: string;
  bpm: number;
  key: string;
  scale: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  tracks: Track[];
}

export interface Track {
  id: string;
  projectId: string;
  type: 'drum' | 'bass' | 'chord' | 'melody' | 'effect';
  name: string;
  color: string;
  mute: boolean;
  solo: boolean;
  order: number;
  volume: number;
  clips: Clip[];
}

export interface Clip {
  id: string;
  trackId: string;
  startBeat: number;
  lengthBeat: number;
  kind: 'loop' | 'midi';
  refId: string;
  notes?: MidiNote[];
}

export interface MidiNote {
  id: string;
  clipId: string;
  pitch: string;
  startBeat: number;
  lengthBeat: number;
  velocity: number;
}

// 学习分析
export interface LearningPath {
  id: string;
  userId: string;
  path: ModuleKey[];
  currentStep: number;
  completedSteps: number[];
  estimatedTime: number;
  actualTime: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assessment {
  id: string;
  userId: string;
  type: 'module' | 'comprehensive' | 'diagnostic';
  moduleKey?: ModuleKey;
  score: number;
  details: AssessmentDetail[];
  timestamp: Date;
}

export interface AssessmentDetail {
  skill: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface LearningAnalytics {
  id: string;
  userId: string;
  event: string;
  data: any;
  timestamp: Date;
}

// 组件Props类型
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface GameComponentProps extends BaseComponentProps {
  onComplete?: (score: number) => void;
  onProgress?: (progress: number) => void;
  difficulty?: Difficulty;
}

export interface TutorialComponentProps extends BaseComponentProps {
  tutorial: Tutorial;
  onComplete?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

// 状态管理类型
export interface AppState {
  user: User | null;
  currentModule: ModuleKey;
  gameState: GameState;
  progress: Progress[];
  badges: Badge[];
  audioEnabled: boolean;
  theme: 'light' | 'dark';
  language: 'zh' | 'en';
}

export interface AppActions {
  setUser: (user: User | null) => void;
  setCurrentModule: (module: ModuleKey) => void;
  updateGameState: (state: Partial<GameState>) => void;
  updateProgress: (progress: Progress) => void;
  addBadge: (badge: Badge) => void;
  setAudioEnabled: (enabled: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'zh' | 'en') => void;
}
