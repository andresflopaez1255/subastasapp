
import React from 'react';
import { APP_TITLE } from '../../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white text-center p-6 mt-12">
      <p>&copy; {new Date().getFullYear()} {APP_TITLE}. Todos los derechos reservados (¡no realmente, es una demo!).</p>
      <p className="text-sm text-gray-400">¡Haz tu Puja ya!</p>
    </footer>
  );
};