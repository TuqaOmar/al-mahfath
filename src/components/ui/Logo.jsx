import React from 'react';
import { motion } from 'framer-motion';

export const Logo = ({ size = 32, className = '' }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} className={className}>
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        initial={{ rotate: -90, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 1, type: 'spring' }}
      >
        {/* Glow Filter */}
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Abstract Book/Quran Shape */}
        <motion.path
          d="M50 85C50 85 20 75 20 40C20 20 40 15 50 30C60 15 80 20 80 40C80 75 50 85 50 85Z"
          fill="none"
          stroke="url(#primaryGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#glow)"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />

        {/* AI Circuit / Nodes inside */}
        <motion.circle 
          cx="50" cy="45" r="5" fill="url(#goldGrad)"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 }}
        />
        <motion.circle 
          cx="35" cy="55" r="3" fill="#10b981"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2 }}
        />
        <motion.circle 
          cx="65" cy="55" r="3" fill="#3b82f6"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.4 }}
        />
        
        {/* Connecting lines */}
        <motion.path
          d="M50 45 L35 55 M50 45 L65 55 M50 30 L50 45"
          stroke="url(#goldGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
        />

        {/* Outer Orbit / Crescent abstract */}
        <motion.path
          d="M10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke="url(#primaryGrad)"
          strokeWidth="2"
          strokeDasharray="4 6"
          initial={{ rotate: 180, opacity: 0 }}
          animate={{ rotate: 360, opacity: 0.5 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: '50% 50%' }}
        />
      </motion.svg>

      {/* Text Mark */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ fontSize: size * 0.6, fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-1px' }}>
          محفظ <span className="text-gradient">الكتروني</span>
        </span>
        <span style={{ fontSize: size * 0.25, color: 'var(--text-secondary)', letterSpacing: '2px', fontWeight: 600, marginTop: '2px' }}>
          ROCKET
        </span>
      </div>
    </div>
  );
};
