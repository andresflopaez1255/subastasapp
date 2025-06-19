import React, { useState } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, getDoc } from "firebase/firestore";

export default function AuthForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister) {
        // Verifica si el usuario ya existe
        const usernameDoc = await getDoc(doc(db, "usernames", username));
        if (usernameDoc.exists()) {
          setError("El nombre de usuario ya está en uso.");
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Guarda el username en Firestore
        await setDoc(doc(db, "usernames", username), {
          uid: userCredential.user.uid,
          email: email
        });
        await setDoc(doc(db, "users", userCredential.user.uid), {
          username,
          email
        });
      } else {
        // Permite login por email o username
        let loginEmail = email;
        if (!email.includes("@")) {
          // Busca el email por username
          const usernameDoc = await getDoc(doc(db, "usernames", email));
          if (!usernameDoc.exists()) {
            setError("Usuario no encontrado.");
            return;
          }
          loginEmail = usernameDoc.data().email;
        }
        await signInWithEmailAndPassword(auth, loginEmail, password);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isRegister ? "Registro" : "Iniciar sesión"}</h2>
      {isRegister && (
        <input
          type="text"
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      )}
      <input
        type="text"
        placeholder={isRegister ? "Correo" : "Correo o usuario"}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">{isRegister ? "Registrarse" : "Entrar"}</button>
      <button type="button" onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
}
