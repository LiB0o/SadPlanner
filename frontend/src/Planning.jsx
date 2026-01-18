import { useEffect, useState } from 'react'
import { useNavigate } from "react-router-dom";

export default function Planning() {

    const navigate = useNavigate();

    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('')
    
    async function load() {
    setLoading(true);
    try {
        const res = await fetch("api/sheet");
        if (!res.ok) throw new Error('Erreur réseau');
        const values = await res.json();
        setData(values);
    } catch (err) {
        console.error(err);
        setError('Impossible de récupérer les données');
    } finally {
        setLoading(false);
    }
  }

    useEffect(() => {load()}, [])

    return(
    <main className="container">
      <div>
        <h2>Planning</h2>
        <table border="1">
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => {
                  // 2e colonne (index 1) → bouton
                  if (cellIndex === 1) {
                    return (
                      <td key={cellIndex}>
                        <button
                          onClick={() =>
                            navigate("/emploi-du-temps", {
                              state: { nom: row[0], id: row[1] }
                            })
                          }
                        >
                          Voir Emploi du temps
                        </button>
                      </td>
                    );
                  }
                  // Autres cellules
                  return <td key={cellIndex}>{cell}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
    )
}

