import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

export const Button = ({ children, variant = 'primary', className = '', icon: Icon, onClick, ...props }) => {
  return (
    <motion.button 
      className={`btn btn-${variant} ${className}`} 
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {Icon && <Icon size={20} />}
      {children}
    </motion.button>
  );
};
