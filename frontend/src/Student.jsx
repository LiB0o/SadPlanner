import { useEffect, useState } from 'react'
import { useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

export default function Student() {

    const location = useLocation();
    const { nom, id } = location.state || {};

    //Données affichage
    const [data, setData] = useState([]);
    const [date, setDate] = useState(0);

    //Données pour update
    const [day, setDay] = useState("B");
    const [hour, setHour] = useState("2");
    const [text, setText] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [canEdit, setCanEdit] = useState(false);
    
    async function load() {
    setLoading(true);
    try {
        const url = `http://localhost:4000/api/sheet/${id}`;

        const res = await fetch(`api/sheet/${id}`);

        if (!res.ok) throw new Error('Erreur réseau');

        const values = await res.json();
        setData(values[0]);
        setDate(values[1]);
        //console.log(values);

    } catch (err) {
        console.error(err);
        setError('Impossible de récupérer les données');
    } finally {
        setLoading(false);
    }
  }

  const handleModifier = async () => {
  try {
    const res = await fetch(
      `api/sheet/update/${id}`, // adapte le port et l'id
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          column: day,
          line: hour,
          text: text,
        }),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      console.error("Erreur :", result);
      alert(result.error || "Erreur serveur");
      return;
    }

    console.log("Modification réussie :", result);
    alert("Modification effectuée avec succès !");
  } catch (error) {
    console.error("Erreur réseau :", error);
    alert("Impossible de contacter le serveur");
  }
};

const testCookie = async () => {
  try {
    const res = await fetch(
      `http://localhost:4000/api/me`,{credentials : "include"} // adapte le port et l'id
      )
      console.log(res);
    }
    catch(err){
      console.log(err);
    }
};

useEffect(() => {

    load();
    //testCookie(); //Pour tester si la session était encore valide
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="));

    if (!cookie) return;

    try {
      const token = cookie.split("=")[1];
      const payload = jwtDecode(token);

      // CONDITION CLÉ
      if (payload.role === "admin" || payload.id === id) {
        setCanEdit(true);
      }
    } catch (err) {
      console.error("JWT invalide", err);
    }
  }, [id]);

    //useEffect(() => {load()}, [])

    return(
    <main className="container">
  <div>
    <h2>Planning</h2>
    <table border="1">
      <tbody>
        {(() => {
          //Calcul du nombre max de colonnes
          const maxCols = data.reduce((max, row) => Math.max(max, row.length), 0);

          return data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: maxCols }).map((_, colIndex) => (
                <td key={colIndex}>
                  {row[colIndex] !== undefined ? row[colIndex] : ""}
                </td>
              ))}
            </tr>
          ));
        })()}
      </tbody>
    </table>
    <p>Dernière Modification : {date}</p>
    {/* Modification */}
      {canEdit && (
        <div style={{ marginTop: "10px" }}>
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
          >
            <option value="B">-- Lundi --</option>
            <option value="C">-- Mardi --</option>
            <option value="D">-- Mercredi --</option>
            <option value="E">-- Jeudi --</option>
            <option value="F">-- Vendredi --</option>
          </select>

          <select
            style={{ marginLeft: "10px" }}
            value={hour}
            onChange={(e) => setHour(e.target.value)}
          >
            <option value="2">-- 8h --</option>
            <option value="3">-- 9h --</option>
            <option value="4">-- 10h --</option>
            <option value="5">-- 11h --</option>
            <option value="6">-- 12h --</option>
            <option value="7">-- 13h --</option>
            <option value="8">-- 14h --</option>
            <option value="9">-- 15h --</option>
            <option value="10">-- 16h --</option>
            <option value="11">-- 17h --</option>
          </select>

          <input
            style={{ marginLeft: "10px" }}
            type="text"
            placeholder="Nouveau cours"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <button onClick={handleModifier}>
            Modifier
          </button>
        </div>
      )}
  </div>
</main>
    )
};
