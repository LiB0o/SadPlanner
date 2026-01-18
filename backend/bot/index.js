import dotenv from "dotenv";

import { Client, GatewayIntentBits } from "discord.js";
import {google} from "googleapis";

dotenv.config({ path:"backend/server/.env"});

const sheets = google.sheets('v4');



const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once("ready", () => {
    console.log(`Connecté en tant que ${client.user.tag}`);
});

function dayIndexToColumn(index) {
    // index 0 => A, 1 => B, 2 => C ...
    console.log("JE CONVERTIS EN CHAR");
    return String.fromCharCode(65 + index);
}

//permet de gérer les slash commands
client.on("interactionCreate", async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "planning") {
          const id = interaction.options.getString('id');
          const day = interaction.options.getString('day');
          const hour = interaction.options.getInteger('hour');
    
          await interaction.deferReply({flag:42});

          try{
            const res = await fetch(`http://localhost:4000/api/sheet/${id}`);

            if(!res.ok){
                return await interaction.editReply("Erreur : étudiant introuvable ou erreur serveur");
            }
            let affich = await res.json();

            // séparer le planning et la date
            const planning = affich[0]; // 2D array
            const lastModif = affich[1][0][0] ?? ''; // B14

            

            // trouver le nombre max de colonnes dans le planning
            const maxCols = Math.max(...planning.map(row => row.length));

            // compléter chaque ligne pour avoir le même nombre de colonnes
            let formatted = planning.map(row => {
                const newRow = [];
                for (let i = 0; i < maxCols; i++) {
                    newRow[i] = row[i] ?? '';
                }
                return newRow;
            });

            if(day){
                const colIndex = formatted[0].findIndex(
                    d => typeof d === 'string' &&
                        d.toLowerCase().trim() === day.toLowerCase().trim()
                );

                if(colIndex === -1){
                    return await interaction.editReply(`Jour ${day} non trouvé`);
                }

                formatted = formatted.map(row => [
                    row[0],
                    row[colIndex]
                ]);
            }

            if(hour){
                formatted = formatted.filter(row => row[0] === String(hour));
            }

            // séparer header et lignes
            const headers = formatted[0];
            const rows = formatted.slice(1);

            // échapper les | pour Discord Markdown
            function escapeMarkdown(text) {
                return String(text).replace(/\|/g, '\\|');
            }

            // construire le tableau Markdown
            let markdown = `| ${headers.map(escapeMarkdown).join(' | ')} |\n`;
            markdown += `| ${headers.map(() => '---').join(' | ')} |\n`;

            for (let row of rows) {
                markdown += `| ${row.map(escapeMarkdown).join(' | ')} |\n`;
            }

            // ajouter la date de dernière modification
            markdown += `\nDernière modification : ${lastModif}`;

            // envoyer dans Discord
            await interaction.editReply(markdown);
          }
          catch(err){
            
            console.error(err);
            await interaction.editReply("Erreur lors de l'affichage via commande discord");
          }
        }
    else if(interaction.commandName === "modify"){
        const course = interaction.options.getString('course');
        const day = interaction.options.getString('day');
        const hour = interaction.options.getInteger('hour');
        const id = interaction.user.id;

        await interaction.deferReply({flag:43});

        try{

            const res = await fetch(`http://localhost:4000/api/sheet/${id}`);
            
            if(!res.ok){
                return await interaction.editReply("Erreur : étudiant introuvable ou erreur serveur");
            }
            let edit = await res.json();

            // séparer le planning et la date
            const planning = edit[0]; // 2D array
            const lastModif = edit[1][0][0] ?? ''; // B14

            const dayIndex = planning[0].findIndex(
                d => typeof d === 'string' &&
                d.toLowerCase().trim() === day.toLocaleLowerCase().trim()
            );

            console.log("GET DAY",dayIndexToColumn(dayIndex));

            if(dayIndex === -1){
                return await interaction.editReply(`Jour ${day} non trouvé`);
            }

            let hourIndex = -1;
            for(let i = 1; i<planning.length;i++){
                if(planning[i][0] === String(hour)){
                    hourIndex = i;
                    break;
                }
            }

            console.log("GET HOUR",hourIndex.toString());

            if(hourIndex === -1){
                return await interaction.editReply(`Heure ${hour} non trouvé`);
            }

            //planning[hourIndex][dayIndex] = course;

            const postRes = await fetch(`http://localhost:4000/api/sheet/update/${id}`,
                {
                    method: 'POST',
                    headers:{
                        'Content-Type':'application/json',
                    },
                    body: JSON.stringify({
                        column: dayIndexToColumn(dayIndex), // par exemple "B", "C", ...
                        line: (hourIndex+1).toString(), // ex: "2", "3", ...
                        text: course, // le cours à écrire
                    }),
                }
            );

            console.log("modif ok");

            if(!postRes.ok){
                return await interaction.editReply("Erreur lors de la modification");
            }

            await interaction.editReply("Emploi du temps modifié");
        }
        catch(err){
            console.error(err);
            await interaction.editReply("Erreur lors de la modif Emploi du temps");
        }
    }
});

//console.log("BOT TOKEN:", process.env.DISCORD_BOT_TOKEN);
client.login(process.env.DISCORD_BOT_TOKEN);
