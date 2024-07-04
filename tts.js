import OpenAI from 'openai';
import { promises } from 'fs';
import { resolve } from "path";
// Inicializa el cliente de OpenAI
const openai = new OpenAI(process.env.OPENAI_API_KEY);

const speechFile = resolve("./speech1.mp3");


async function tts(text, fileName) {
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "nova",
            input: text,
          });

          const buffer = Buffer.from(await mp3.arrayBuffer());
          await promises.writeFile(speechFile, buffer);
    } catch (err) {
        console.error('Error al generar el texto a voz:', err);
    }
}

export default { tts };
