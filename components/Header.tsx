
import React from 'react';
import { PokemonBallIcon } from './icons/PokemonBallIcon';
import { APP_TITLE } from '../constants';
import type { User } from 'https://esm.sh/firebase@10.12.2/auth'; // Import User type

interface HeaderProps {
  currentUser: User | null;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenLoginModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, isAdmin, onLogout, onOpenLoginModal }) => {
  return (
    <header className="bg-gradient-to-r from-yellow-400 via-red-500 to-blue-500 text-white shadow-lg p-4 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <PokemonBallIcon className="text-white w-10 h-10" />
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{APP_TITLE}</h1>
        </div>
        <div className="flex items-center space-x-3">
          {currentUser && isAdmin ? (
            <>
              <span className="text-sm hidden sm:inline">Admin: {currentUser.email}</span>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm text-sm transition-colors"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md shadow-sm text-sm transition-colors"
            >
              Iniciar Sesión (Admin)
            </button>
          )}
        </div>
      </div>
    </header>
  );
};