// 音乐理论平台 - 卡片组件

import React from 'react';
import { motion } from 'framer-motion';
import { BaseComponentProps } from '../../types';

interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hover = false,
  clickable = false,
  onClick,
}) => {
  const baseClasses = 'rounded-lg transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white border border-gray-200',
    outlined: 'bg-transparent border-2 border-gray-300',
    elevated: 'bg-white shadow-lg border border-gray-100',
  };
  
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  const interactiveClasses = clickable ? 'cursor-pointer' : '';
  const hoverClasses = hover ? 'hover:shadow-md hover:scale-105' : '';
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${paddingClasses[padding]} ${interactiveClasses} ${hoverClasses} ${className}`;

  const cardContent = (
    <div className={classes}>
      {children}
    </div>
  );

  if (clickable && onClick) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.1 }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
};

export default Card;
