import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

dotenv.config({ path:"backend/server/.env"});

const commands = [
    new SlashCommandBuilder()
        .setName("planning")
        .setDescription("Affiche le planning d'une personne")
        .addStringOption(option =>
            option
                .setName("id")
                .setDescription("id discord de la cible")
                .setRequired(true)
        ).addStringOption(option =>
            option
                .setName("day")
                .setDescription("specific day")
                .setRequired(false)
        ).addIntegerOption(option =>
            option
                .setName("hour")
                .setDescription("specific hour")
                .setRequired(false)
        )
        .toJSON(),

        new SlashCommandBuilder()
        .setName("modify")
        .setDescription("Modify le planning")
        .addStringOption(option =>
            option
                .setName("day")
                .setDescription("specific day")
                .setRequired(true)
        ).addIntegerOption(option =>
            option
                .setName("hour")
                .setDescription("specific hour")
                .setRequired(true)
        ).addStringOption(option =>
            option
                .setName("course")
                .setDescription("new course")
                .setRequired(true)
        )
        .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);

console.log("⏳ Enregistrement des slash commands...");
        
await rest.put(
    Routes.applicationCommands(process.env.TOKEN_DISCORD),
    { body: commands }
);

console.log("✅ Slash commands enregistrées !");
