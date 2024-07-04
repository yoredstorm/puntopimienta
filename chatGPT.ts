import OpenAI from "openai";
import { config } from 'dotenv';

config();
const openaiApiKey = process.env.OPENAI_API_KEY;

export async function chat(prompt: string, text: string): Promise<string> {
    try {
        const openai = new OpenAI({
            apiKey: openaiApiKey,
        });
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: prompt },
                { role: "user", content: text },
            ],
        });

        if (completion.choices && completion.choices.length > 0) {
            const answ = completion.choices[0].message?.content || "No response";
            return answ;
        } else {
            throw new Error("No choices returned in completion");
        }
    } catch (err) {
        console.error("Error al conectar con OpenAI:", err);
        return "ERROR";
    }
}

export default { chat };
