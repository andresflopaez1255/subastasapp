import React, { useState } from 'react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (emailOrUsername: string, password: string) => Promise<void>;
  onRegister?: (username: string, email: string, password: string) => Promise<void>;
  loginError: string | null;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  loginError
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    if (isRegister && onRegister) {
      await onRegister(username, email, password);
    } else {
      await onLogin(isRegister ? email : email, password);
    }
    setIsProcessing(false);
    // No cerrar el modal aquí; App.tsx lo hará si el login/registro es exitoso
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      aria-modal="true"
      role="dialog"
      aria-labelledby="login-modal-title"
    >
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 id="login-modal-title" className="text-2xl font-bold mb-6 text-gray-800 text-center">
          {isRegister ? "Registro de Usuario" : "Iniciar Sesión como Administrador"}
        </h2>
        {loginError && <div role="alert" aria-live="assertive" className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{loginError}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Usuario</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                required
                disabled={isProcessing}
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              {isRegister ? "Correo Electrónico" : "Correo Electrónico o Usuario"}
            </label>
            <input
              type="text"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
              required
              disabled={isProcessing}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
              required
              disabled={isProcessing}
            />
          </div>
          <div className="flex flex-col sm:flex-row-reverse sm:space-x-reverse sm:space-x-2 space-y-2 sm:space-y-0 pt-2">
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out disabled:opacity-70"
            >
              {isProcessing
                ? (isRegister ? 'Registrando...' : 'Iniciando Sesión...')
                : (isRegister ? 'Registrarse' : 'Iniciar Sesión')}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="w-full sm:w-auto bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-md shadow-sm transition duration-150 ease-in-out disabled:opacity-70"
            >
              Cancelar
            </button>
          </div>
        </form>
        <div className="pt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 hover:underline text-sm"
            disabled={isProcessing}
          >
            {isRegister
              ? "¿Ya tienes cuenta? Inicia sesión"
              : "¿No tienes cuenta? Regístrate"}
          </button>
        </div>
      </div>
    </div>
  );
};