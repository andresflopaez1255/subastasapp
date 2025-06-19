
import React from 'react';

export const PokemonBallIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    className={`w-8 h-8 ${className || ''}`}
    fill="currentColor"
  >
    <circle cx="50" cy="50" r="45" fill="#f0f0f0" stroke="#333" strokeWidth="3" />
    <path d="M50,5 A45,45 0 0,1 50,95" fill="#ff4040" />
    <path d="M5,50 A45,45 0 0,1 95,50" stroke="#333" strokeWidth="3" fill="none" />
    <circle cx="50" cy="50" r="15" fill="#f0f0f0" stroke="#333" strokeWidth="3" />
    <circle cx="50" cy="50" r="8" fill="#333" />
  </svg>
);
