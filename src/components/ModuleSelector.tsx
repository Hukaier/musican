// 音乐理论平台 - 模块选择器组件

import React from 'react';
import { motion } from 'framer-motion';
import { ModuleKey } from '../types';
import { MODULE_CONFIG } from '../constants';
import Card from './ui/Card';
import ProgressBar from './ui/ProgressBar';
import { useModuleProgress } from '../stores/useAppStore';

interface ModuleSelectorProps {
  onModuleSelect: (module: ModuleKey) => void;
  currentModule?: ModuleKey;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({
  onModuleSelect,
  currentModule,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🎵 音乐理论游戏化学习平台
        </h2>
        <p className="text-gray-600">
          选择学习模块，开始你的音乐理论之旅
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.values(MODULE_CONFIG).map((module) => (
          <ModuleCard
            key={module.key}
            module={module}
            isSelected={currentModule === module.key}
            onSelect={() => onModuleSelect(module.key)}
          />
        ))}
      </div>
    </div>
  );
};

interface ModuleCardProps {
  module: typeof MODULE_CONFIG[keyof typeof MODULE_CONFIG];
  isSelected: boolean;
  onSelect: () => void;
}

const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  isSelected,
  onSelect,
}) => {
  const progress = useModuleProgress(module.key);
  const completionRate = progress?.completionRate || 0;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'advanced': return 'text-orange-600 bg-orange-100';
      case 'expert': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      <Card
        className={`cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'ring-2 ring-blue-500 shadow-lg' 
            : 'hover:shadow-md'
        }`}
        onClick={onSelect}
        hover
        clickable
      >
        <div className="text-center">
          {/* 图标 */}
          <div className="text-6xl mb-4">{module.icon}</div>
          
          {/* 标题 */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {module.title}
          </h3>
          
          {/* 描述 */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {module.description}
          </p>
          
          {/* 难度标签 */}
          <div className="flex justify-center mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
              {module.difficulty === 'beginner' && '入门'}
              {module.difficulty === 'intermediate' && '中级'}
              {module.difficulty === 'advanced' && '高级'}
              {module.difficulty === 'expert' && '专家'}
            </span>
          </div>
          
          {/* 进度条 */}
          {progress && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>学习进度</span>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <ProgressBar
                value={completionRate}
                size="sm"
                variant="success"
                animated
              />
            </div>
          )}
          
          {/* 预估时间 */}
          <div className="flex items-center justify-center text-xs text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            约 {module.estimatedTime} 分钟
          </div>
          
          {/* 状态指示器 */}
          {completionRate === 100 && (
            <div className="mt-3 flex items-center justify-center text-green-600">
              <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium">已完成</span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default ModuleSelector;
