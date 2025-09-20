// 音乐理论平台 - 进度条组件

import React from 'react';
import { motion } from 'framer-motion';
import { BaseComponentProps } from '../../types';

interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  showLabel?: boolean;
  animated?: boolean;
  striped?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  variant = 'default',
  showLabel = false,
  animated = true,
  striped = false,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const baseClasses = 'w-full bg-gray-200 rounded-full overflow-hidden';
  
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  
  const variantClasses = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
    info: 'bg-cyan-600',
  };
  
  const barClasses = `${sizeClasses[size]} ${variantClasses[variant]} ${striped ? 'bg-stripes' : ''}`;
  
  const classes = `${baseClasses} ${className}`;

  return (
    <div className={classes}>
      <motion.div
        className={barClasses}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' }}
      >
        {showLabel && (
          <div className="flex items-center justify-center h-full text-white text-xs font-medium">
            {Math.round(percentage)}%
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ProgressBar;
