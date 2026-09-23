import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', hover = true, ...props }) => {
  return (
    <motion.div 
      className={`glass-card ${className}`}
      whileHover={hover ? { y: -5, boxShadow: "var(--shadow-hover)" } : {}}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
