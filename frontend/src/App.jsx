import { useState, useEffect } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import "./App.css";
import Login from './logins.jsx';
import Planning from './Planning.jsx';
import Student from "./Student.jsx";

function App() {
  // Condition pour afficher le lien caché
  const [isAdmin, setIsAdmin] = useState(false);

  /*const connectUser = (user) => {
    console.log("Utilisateur connecté :", user);
  };*/
  const planningAll = ()=>{
    console.log("Google Sheet avec tout les noms");
  }

  useEffect(() => {
    // Récupère le cookie token
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));

    if (cookie) {
      const token = cookie.split("=")[1];
      try {
        // Décode le JWT
        const payload = jwtDecode(token);
        if (payload.role === "admin") {
          setIsAdmin(true); // Affiche le lien admin
        }
      } catch (err) {
        console.error("JWT invalide", err);
      }
    }
  }, []);

  return (
    <>
      {/* Banderole */}
      <header className="banner">
        <nav>
          
          <a href="/auth/discord">Connexion</a>
          <Link to="/sheet">Emploi du temps</Link>

          {/* Lien affiché uniquement si la condition est remplie */}
          {isAdmin && <Link to="/connexions">Gestion connexion</Link>}
        </nav>
      </header>

      <Routes>
        <Route path="/sheet" element={<Planning />} />
        <Route path="/connexions" element={<Login />} />
        <Route path="/emploi-du-temps" element={<Student />} />
      </Routes>

    </>
  );
}

export default App
