import dotenv from "dotenv";
import {google} from "googleapis" ;
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import axios from "axios";

import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

const ROLE_DEFAULT = "user";

const PORT = process.env.PORT || 4000;

dotenv.config();

const app = express();

app.use(cookieParser())

// CORS DOIT ETRE AVANT LES ROUTES
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

app.listen(PORT, () => {
  console.log(`API ready on http://localhost:${PORT}`);
});

const filename = fileURLToPath(import.meta.url); //récupére url du G sheet
const DIR_NAME = path.dirname(filename);

//charge .env
dotenv.config();

app.get("/api/test", (req, res) => {
  res.json({ ok: true });
});

const connectedUsers = new Map(); //all connected users

//authentification de G sheet
const authentification = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_KEYS,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

//auth du client
const client = await authentification.getClient();

const sheet = google.sheets({version:"v4",auth:client});



app.get('/api/sheet', async (req, res) =>{
  try{
    // Lecture des valeurs
    const response = await sheet.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: "Liste Étudiant!A:Z", // récupère toutes les colonnes
    });

    res.json(response.data.values || []);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur lors de la récupération de la Google Sheet");
    //console.error("Erreur Google API :", err.message);
    //console.error(err);
    //res.status(500).json({
    //error: err.message,
  //});
  }
});

app.get('/api/sheet/:id', async (req, res) => {
  const id = req.params.id;
  //const nom = decodeURIComponent(req.params.nom);

  try {
    // Récupère tous les onglets
    const response = await sheet.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID
    });

    const sheetNames = response.data.sheets.map(s => s.properties.title);
    const matchingSheet = sheetNames.find(name => name.startsWith(id));

    if (!matchingSheet) {
      return res.status(404).send("Aucun onglet ne correspond au préfixe");
    }

    // Récupère les valeurs de l'onglet trouvé
    const valuesResponse = await sheet.spreadsheets.values.batchGet({
      spreadsheetId: process.env.SPREADSHEET_ID,
      ranges: [`${matchingSheet}!A1:F11`,`${matchingSheet}!B14`],
    });

    //console.log(valuesResponse.data.valueRanges)
    res.json([valuesResponse.data.valueRanges[0].values,valuesResponse.data.valueRanges[1].values] || [[],[]]);
    //res.status(200).send();

  } catch (err) {
    console.error("Erreur Google API :", err.message);
    res.status(500).send("Erreur lors de la récupération du Google Sheet");
  }
});

/**
 * column = days, ex : lundi is supposed to be B
 * line = hour, ex : 8h = 2
 * Permit to get the coordonates for modification with text
 */
app.post('/api/sheet/update/:id', async (req,res)=>{
  const id = req.params.id;

  try{
      const { column, line, text } = req.body || {};

  if (typeof column !== 'string' || column.trim() === '') {
    return res.status(400).json({ error: 'a day is requiered' });
  }
  if (typeof line !== 'string' || line.trim() === '') {
    return res.status(400).json({ error: 'an hour is requiered' });
  }

  //create position for update
  const position = column.concat(line);

  console.log("valeur de position : ",position);

  //get sheet
  const response = await sheet.spreadsheets.get({
      spreadsheetId: process.env.SPREADSHEET_ID
  });

  const sheetNames = response.data.sheets.map(s => s.properties.title);
  const matchingSheet = sheetNames.find(name => name.startsWith(id));

  if (!matchingSheet) {
    return res.status(404).send("Aucun onglet ne correspond au préfixe");
  }

  // Récupère les valeurs de l'onglet trouvé
    const valuesResponse = await sheet.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${matchingSheet}!${position}`,   
      valueInputOption: "RAW",
    requestBody: {
      values: [[text]],
    },
    });

    console.log("MODIF FINI");

    //modifier la date en position B14
    const formattedDate = new Date().toLocaleDateString("fr-FR");

    const valuesResponseDate = await sheet.spreadsheets.values.update({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range: `${matchingSheet}!B14`,   
      valueInputOption: "RAW",
    requestBody: {
      values: [[formattedDate]],
    },
    });

    return res.status(200);

  }
  catch(err){
    console.error("Erreur Google API :", err.message);
    res.status(501).send("Erreur lors de la modification du Google Sheet");
  }
});

// discord auth gestion
app.get("/auth/discord", (req, res) => {

  //console.log(process.env.TOKEN_DISCORD);

  const params = new URLSearchParams({
    client_id: process.env.TOKEN_DISCORD,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: "code",
    scope: "identify email",
  });

  res.redirect(
    `https://discord.com/api/oauth2/authorize?${params.toString()}`
  );
});

app.get("/auth/discord/callback", async (req, res) => {
  const code = req.query.code;

  try {
    //Échange code → access_token

    const params = new URLSearchParams({
      client_id:  process.env.TOKEN_DISCORD,
      client_secret: process.env.CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: "http://localhost:4000/auth/discord/callback",
      scope: 'identify guilds.members.read'
    })  

    const tokenRecieve = await fetch ('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params
    }) 

    const accessToken = tokenRecieve;
    //console.log("TOKEN RESPONSE ", accessToken);

    const token = await accessToken.json();

    // Récupérer infos utilisateur
    const userResponse = await axios.get(
      "https://discord.com/api/users/@me",
      {
        headers: {
          Authorization: `${token.token_type} ${token.access_token}`,
        },
      }
    );

    //console.log("USER",userResponse);

    const user = userResponse.data;

    var role = ROLE_DEFAULT;
    const adminIds = JSON.parse(process.env.ADMINS); 

    const isAdmin = adminIds.includes(user.id);

    if (isAdmin) {
      role = "admin";
    } 

    //Générer JWT avec ID et rôle
    const jwtToken = jwt.sign(
      {
        id: user.id,
        role: role,
      },
      process.env.JWT_SECRET, // clé secrète
      { expiresIn: "30m" } // 30 minutes
    );

    //Envoyer le JWT en cookie
    res.cookie("token", jwtToken, {
      httpOnly: false,        // possible à lire depuis JS côté client
      secure: false,         // mettre true en prod HTTPS
      maxAge: 30 * 60 * 1000, // 30 minutes en ms
      sameSite: "lax",
      path: "/", //accès partout
    });

    //Enregistre la session
    connectedUsers.set(user.id, {
      id: user.id,
      role,
      connectedAt: Date.now(),
    });

    //Supprime la session de la liste au bout de 30 minutes
    setTimeout(() => {
      connectedUsers.delete(user.id);
      console.log(`Utilisateur ${user.id} déconnecté (timeout)`);
    }, 30 * 60 * 1000);


    // Redirection vers React

    res.redirect(
      "http://localhost:5173/"
    );
  } catch (err) {
    console.error("ERREUR : pb callback", err);
    res.status(500).send("Erreur Discord OAuth");
  }
});

//check if the person is connected
app.get('/api/me', (req, res) => {
  const token = req.cookies.token; //BON NOM

  if (!token) return res.sendStatus(410);

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.sendStatus(411);
  }

  const user = connectedUsers.get(payload.id);

  if (!user) return res.sendStatus(412);

  res.status(200).json(user);
});

//retourne toutes les connections si user est admin
//disparais une fois le server down
app.get("/api/connections", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401); //si pas de cookie erreur

  const payload = jwt.verify(token, process.env.JWT_SECRET);

  if (payload.role !== "admin") {
    return res.sendStatus(403);
  }

  res.json([...connectedUsers.values()].map(u => u.id));
});

app.post("/api/logout/:id", (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.sendStatus(401);

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (payload.role !== "admin") return res.sendStatus(403);

  const userId = req.params.id;

  // Supprimer de la map
  connectedUsers.delete(userId);

  // Si l'admin se déconnecte lui-même
  if (payload.id === userId) {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
    });
  }

  res.sendStatus(200);
});