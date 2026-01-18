import { useEffect, useState } from 'react'
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Login() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);

  const logoutUser = async (id) => {
  try {
    const res = await fetch(`http://localhost:4000/api/logout/${id}`, {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error("Erreur logout");
    }

    // Retirer l'utilisateur du tableau
    setUsers(prev => prev.filter(u => u !== id));
  } catch (err) {
    console.error(err);
    alert("Impossible de déconnecter l'utilisateur");
  }
};

  useEffect(() => {
    fetch("http://localhost:4000/api/connections", {
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Accès refusé");
        }
        return res.json();
      })
      .then(data => {
        setUsers(data); //stocke les ids
      })
      .catch(err => {
        console.error(err);
        setError("Impossible de charger les connexions");
      });
  }, []);

  return (
    <main className="container">
      <h2>Utilisateurs connectés</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table border="1" cellPadding="8">
        <thead>
          <tr>
            <th>#</th>
            <th>ID Discord</th>
          </tr>
        </thead>
        <tbody>
            {users.map((id, index) => (
            <tr key={id}>
                <td>{index + 1}</td>
                <td>{id}</td>
                <td>
                    <button onClick={() => logoutUser(id)}>
                        Déconnecter
                    </button>
                </td>
            </tr>
            ))}
        </tbody>
      </table>
    </main>
  );
}
