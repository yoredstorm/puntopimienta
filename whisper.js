import { downloadMediaMessage } from "@adiwajshing/baileys";
import { Configuration, OpenAIApi } from "openai";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import ffmpeg, { setFfmpegPath } from "fluent-ffmpeg";
import { existsSync, createReadStream, writeFileSync, unlink } from "fs";
setFfmpegPath(ffmpegPath);

const voiceToText = async (path) => {
    if (!existsSync(path)) {
        throw new Error("No se encuentra el archivo");
    }
    try {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_API_KEY,
        });
        const openai = new OpenAIApi(configuration);
        const resp = await openai.createTranscription(
            createReadStream(path),
            "whisper-1"
        );
        return resp.data.text;
    } catch (err) {
        console.log(err.response);
        return "ERROR";
    }
};

const convertOggMp3 = async (inputStream, outStream) => {
    return new Promise((resolve, reject) => {
        ffmpeg(inputStream)
            .audioQuality(96)
            .toFormat("mp3")
            .save(outStream)
            .on("progress", (p) => null)
            .on("end", () => {
                resolve(true);
            });
    });
};

const handlerAI = async (ctx) => {
    const buffer = await downloadMediaMessage(ctx, "buffer");
    const pathTmpOgg = `${process.cwd()}/tmp/voice-note-${Date.now()}.ogg`;
    const pathTmpMp3 = `${process.cwd()}/tmp/voice-note-${Date.now()}.mp3`;
    await writeFileSync(pathTmpOgg, buffer);
    await convertOggMp3(pathTmpOgg, pathTmpMp3);
    const text = await voiceToText(pathTmpMp3);
    unlink(pathTmpMp3, (error) => {
        if (error) throw error;
    });
    unlink(pathTmpOgg, (error) => {
        if (error) throw error;
    });
    return text;
};

export default { handlerAI };