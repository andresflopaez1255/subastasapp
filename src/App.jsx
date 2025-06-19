import React from "react";
import { auth } from "./firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import AuthForm from "./components/AuthForm";

function App() {
  const [user] = useAuthState(auth);

  return (
    <div>
      {user ? (
        <div>
          <p>Bienvenido, {user.email}</p>
          <button onClick={() => auth.signOut()}>Cerrar sesión</button>
        </div>
      ) : (
        <AuthForm />
      )}
      {/* ...resto de tu app... */}
    </div>
  );
}

export default App;
