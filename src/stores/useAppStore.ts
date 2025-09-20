// 音乐理论平台 - 状态管理

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, AppActions, User, Progress, Badge, ModuleKey, GameState, Difficulty } from '../types';
import { STORAGE_CONFIG } from '../constants';

// 初始状态
const initialState: AppState = {
  user: null,
  currentModule: 'notes',
  gameState: {
    score: 0,
    level: 1,
    isPlaying: false,
    currentModule: 'notes',
    difficulty: 'beginner',
  },
  progress: [],
  badges: [],
  audioEnabled: true,
  theme: 'light',
  language: 'zh',
};

// 状态管理Store
export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // 用户相关操作
      setUser: (user: User | null) => {
        set({ user });
      },

      // 模块相关操作
      setCurrentModule: (module: ModuleKey) => {
        set((state) => ({
          currentModule: module,
          gameState: {
            ...state.gameState,
            currentModule: module,
          },
        }));
      },

      // 游戏状态操作
      updateGameState: (gameStateUpdate: Partial<GameState>) => {
        set((state) => ({
          gameState: {
            ...state.gameState,
            ...gameStateUpdate,
          },
        }));
      },

      // 进度相关操作
      updateProgress: (progressUpdate: Progress) => {
        set((state) => {
          const existingIndex = state.progress.findIndex(
            (p) => p.userId === progressUpdate.userId && p.moduleKey === progressUpdate.moduleKey
          );

          if (existingIndex >= 0) {
            const updatedProgress = [...state.progress];
            updatedProgress[existingIndex] = progressUpdate;
            return { progress: updatedProgress };
          } else {
            return { progress: [...state.progress, progressUpdate] };
          }
        });
      },

      // 徽章相关操作
      addBadge: (badge: Badge) => {
        set((state) => {
          const existingBadge = state.badges.find((b) => b.id === badge.id);
          if (existingBadge) {
            return state; // 徽章已存在，不重复添加
          }
          return { badges: [...state.badges, badge] };
        });
      },

      // 设置相关操作
      setAudioEnabled: (enabled: boolean) => {
        set({ audioEnabled: enabled });
      },

      setTheme: (theme: 'light' | 'dark') => {
        set({ theme });
        // 更新HTML根元素的主题类
        document.documentElement.setAttribute('data-theme', theme);
      },

      setLanguage: (language: 'zh' | 'en') => {
        set({ language });
        // 更新HTML根元素的语言属性
        document.documentElement.setAttribute('lang', language);
      },

      // 工具方法
      getProgressByModule: (moduleKey: ModuleKey) => {
        const state = get();
        return state.progress.find(
          (p) => p.userId === state.user?.id && p.moduleKey === moduleKey
        );
      },

      getBadgesByCategory: (category: 'basic' | 'advanced' | 'expert') => {
        const state = get();
        return state.badges.filter((badge) => badge.category === category);
      },

      getTotalXP: () => {
        const state = get();
        return state.progress.reduce((total, p) => total + p.xp, 0);
      },

      getCurrentLevel: () => {
        const state = get();
        const totalXP = state.getTotalXP();
        // 简单的等级计算：每100XP升一级
        return Math.floor(totalXP / 100) + 1;
      },

      getStreak: () => {
        const state = get();
        const userProgress = state.progress.filter((p) => p.userId === state.user?.id);
        if (userProgress.length === 0) return 0;
        
        // 计算最长连续学习天数
        const sortedProgress = userProgress.sort((a, b) => 
          new Date(a.lastActiveAt).getTime() - new Date(b.lastActiveAt).getTime()
        );
        
        let maxStreak = 0;
        let currentStreak = 0;
        let lastDate: Date | null = null;

        for (const progress of sortedProgress) {
          const currentDate = new Date(progress.lastActiveAt);
          if (lastDate) {
            const daysDiff = Math.floor(
              (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysDiff === 1) {
              currentStreak++;
            } else if (daysDiff > 1) {
              maxStreak = Math.max(maxStreak, currentStreak);
              currentStreak = 1;
            }
          } else {
            currentStreak = 1;
          }
          lastDate = currentDate;
        }

        return Math.max(maxStreak, currentStreak);
      },

      // 重置状态
      resetState: () => {
        set(initialState);
      },

      // 清除用户数据
      clearUserData: () => {
        set({
          user: null,
          progress: [],
          badges: [],
        });
      },
    }),
    {
      name: STORAGE_CONFIG.settingsKey,
      partialize: (state) => ({
        user: state.user,
        progress: state.progress,
        badges: state.badges,
        audioEnabled: state.audioEnabled,
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);

// 选择器Hook
export const useUser = () => useAppStore((state) => state.user);
export const useCurrentModule = () => useAppStore((state) => state.currentModule);
export const useGameState = () => useAppStore((state) => state.gameState);
export const useProgress = () => useAppStore((state) => state.progress);
export const useBadges = () => useAppStore((state) => state.badges);
export const useAudioEnabled = () => useAppStore((state) => state.audioEnabled);
export const useTheme = () => useAppStore((state) => state.theme);
export const useLanguage = () => useAppStore((state) => state.language);

// 计算属性Hook
export const useTotalXP = () => useAppStore((state) => state.getTotalXP());
export const useCurrentLevel = () => useAppStore((state) => state.getCurrentLevel());
export const useStreak = () => useAppStore((state) => state.getStreak());

// 模块进度Hook
export const useModuleProgress = (moduleKey: ModuleKey) => 
  useAppStore((state) => state.getProgressByModule(moduleKey));

// 徽章分类Hook
export const useBadgesByCategory = (category: 'basic' | 'advanced' | 'expert') => 
  useAppStore((state) => state.getBadgesByCategory(category));
