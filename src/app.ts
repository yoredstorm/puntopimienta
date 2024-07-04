import { join } from 'path'
import { createBot, createProvider, createFlow, addKeyword, utils, EVENTS } from '@builderbot/bot'
import { MemoryDB as Database } from '@builderbot/bot'
import { BaileysProvider as Provider } from '@builderbot/provider-baileys'
import * as fs from 'fs';
import * as path from 'path';

import moment from 'moment-timezone';

import { getSheetLastRow, readSheet, appendToSheet } from 'utils';
import { getRowByPhoneNumber, appendToSheetContacts, getDataByPhoneNumber } from 'contacts';
import { chat } from 'chatGPT';
import { tts } from 'tts.js';
import { handlerAI } from 'whisper';

const PORT = process.env.PORT ?? 3008

const menuPath: string = path.join('mensajes', 'menu.txt');
const menu = fs.readFileSync(menuPath, 'utf8');

const pathConsultas = path.join('mensajes', 'promptConsultas.txt');
const promptConsultas = fs.readFileSync(pathConsultas, 'utf8');

function NombreApellidoA() {
    const pathNombreApellido = path.join('mensajes', 'prompt_Nombre_Apellido.txt');
    const NombreApellido = fs.readFileSync(pathNombreApellido, 'utf8');
    const frases_NombreApellido = NombreApellido.split('\n').filter(frase => frase.trim().length > 0);
    const NombreApellidoA = frases_NombreApellido[Math.floor(Math.random() * frases_NombreApellido.length)];
    return NombreApellidoA
}

function direccionA() {
    const pathDireccion = path.join('mensajes', 'prompt_Direccion.txt');
    const direccion = fs.readFileSync(pathDireccion, 'utf8');
    const frases_Direccion = direccion.split('\n').filter(frase => frase.trim().length > 0);
    const direccionA = frases_Direccion[Math.floor(Math.random() * frases_Direccion.length)];
    return direccionA
}

function CumpleanosA() {
    const pathCumpleanos = path.join('mensajes', 'prompt_Cumpleanos.txt');
    const cumpleanos = fs.readFileSync(pathCumpleanos, 'utf8');
    const frases_Cumpleaños = cumpleanos.split('\n').filter(frase => frase.trim().length > 0);
    const CumpleanosA = frases_Cumpleaños[Math.floor(Math.random() * frases_Cumpleaños.length)];
    return CumpleanosA
}

function graciasRegistroA() {
    const pathAgradecimiento = path.join('mensajes', 'prompt_Agradecimiento.txt');
    const graciasRegistro = fs.readFileSync(pathAgradecimiento, 'utf8');
    const frases_Gracias = graciasRegistro.split('\n').filter(frase => frase.trim().length > 0);
    const graciasRegistroA = frases_Gracias[Math.floor(Math.random() * frases_Gracias.length)];
    return graciasRegistroA
}

function PedirConsultaA() {
    const pathPedirConsulta = path.join('mensajes', 'prompt_PedirConsulta.txt');    
    const PedirConsulta = fs.readFileSync(pathPedirConsulta, 'utf8');
    const frases_Pconsulta = PedirConsulta.split('\n').filter(frase => frase.trim().length > 0);
    const PedirConsultaA = frases_Pconsulta[Math.floor(Math.random() * frases_Pconsulta.length)];
    return PedirConsultaA;
}

function fraseAleatoria() {
    const regalosPath = path.join('mensajes', 'regalosRegistro.txt');
    const regalosRegistro = fs.readFileSync(regalosPath, 'utf8');
    const frases = regalosRegistro.split('\n').filter(frase => frase.trim().length > 0);
    const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
    return fraseAleatoria
}

// const discordFlow = addKeyword<Provider, Database>('doc').addAnswer(
//     ['You can see the documentation here', '📄 https://builderbot.app/docs \n', 'Do you want to continue? *yes*'].join(
//         '\n'
//     ),
//     { capture: true },
//     async (ctx, { gotoFlow, flowDynamic }) => {
//         if (ctx.body.toLocaleLowerCase().includes('yes')) {
//             return gotoFlow(registerFlow)
//         }
//         await flowDynamic('Thanks!')
//         return
//     }
// )

const flowMenuRest = addKeyword(EVENTS.ACTION).addAnswer('Este es el menu');

const flowConsultas = addKeyword(EVENTS.ACTION)
    .addAction(async(ctx, ctxFn) =>{
        await ctxFn.flowDynamic(PedirConsultaA())
    })
    .addAnswer(null, { delay: 1500,capture: true }, async (ctx, ctxFn) => {
        const prompt = promptConsultas;
        const consulta = ctx.body;
        const answer = await chat(prompt, consulta);
        await ctxFn.flowDynamic(answer);
        return
    });


const flowPromociones = addKeyword(EVENTS.ACTION)
.addAnswer("Te presentamos nuestras promociones",{ media: join(process.cwd(), 'assets', 'Promocion_Junio_2024.jpg') })


const flowRegistroCliente = addKeyword(EVENTS.ACTION)
    .addAnswer(NombreApellidoA(), { delay: 1500,capture: true }, async (ctx, ctxFn) => {
        await ctxFn.state.update({ name: ctx.body });
    })
    .addAnswer(direccionA(), { delay: 1500,capture: true }, async (ctx, ctxFn) => {
        await ctxFn.state.update({ direccion: ctx.body });
    })
    .addAnswer(CumpleanosA(), { delay: 1500,capture: true }, async (ctx, ctxFn) => {
        await ctxFn.state.update({ fcumple: ctx.body });
    })
    .addAnswer(graciasRegistroA(), null, async (ctx, ctxFn) => {
        const name = ctxFn.state.get('name');
        const direccion = ctxFn.state.get('direccion');
        const fcumple = ctxFn.state.get('fcumple');
        const date = moment().tz('America/Lima').format('YYYY-MM-DD HH:mm:ss');
        const number = ctx.from.slice(2).toString();
        const puntos = 0;
        const estado_pedido = 'Sin pedido';
        await appendToSheetContacts([[name, 'X', number, direccion, fcumple, date,puntos,estado_pedido]]);
        await ctxFn.flowDynamic(fraseAleatoria());
    });



const flowRegistradoExiste = addKeyword(EVENTS.ACTION).addAnswer('Lo siento no te puedes volver a registrar, pero disfruta de todas nuestras promociones😉');

const flowRegistro = addKeyword(EVENTS.ACTION)
    .addAnswer('Bievenido al registro!🤗, validaremos si tu numero de celular ya se encuentra registrado', null, async (ctx, { gotoFlow, endFlow }) => {
        const number = ctx.from.slice(2);
        const senderName = await getRowByPhoneNumber(number);
        console.log("registro de: " + number.toString())
        if (senderName != 'desconocido') {
            return gotoFlow(flowRegistradoExiste);
            //addChild(flowRegistradoExiste)
        } else {
            return gotoFlow(flowRegistroCliente);
            //addChild(flowRegistradoExiste)
        }
    });


const flowConsultaUsuario = addKeyword(EVENTS.ACTION)
    .addAction(async(ctx, ctxFn) =>{
        const consulta_usuario = await getDataByPhoneNumber(ctx.from.substring(2))
        if (consulta_usuario === 'Numero de telefono no registrado'){
            await ctxFn.flowDynamic('Numero de telefono no registrado, te estamos dirigiendo al formulario de registro😉')
            return ctxFn.gotoFlow(flowRegistroCliente);
        }else{
            const [nombre, genero, telefono, direccion, fechaNacimiento, fechaRegistro,puntos,estado_pedido] = consulta_usuario;
            console.log(consulta_usuario)
            //await ctxFn.flowDynamic(PedirConsultaA())
            await ctxFn.flowDynamic('Nombre Registrado: ' + nombre + '\n' + 'Genero: ' + genero + '\n' + 'Telefono: ' + telefono + '\n' + 'Direccion: ' + direccion + '\n' + 'Fecha de Nacimiento: ' + fechaNacimiento + '\n' + 'Fecha de registro: ' + fechaRegistro + '\n' + 'Puntos Acumulados: ' + puntos + ' *proximamente habilitado* ' + '\n' + 'Estado de pedido: ' + estado_pedido);
            }
    })

const welcomeFlow = addKeyword<Provider, Database>(EVENTS.WELCOME)
    .addAnswer(menu,{ delay: 1000, capture: true },
        async (ctx, { gotoFlow, fallBack, flowDynamic, endFlow }) => {
            if (!['1', '2', '3', '4','5','0'].includes(ctx.body)) {
                return fallBack('Respuesta no válida, por favor selecciona una de las opciones.');
            }
            switch (ctx.body) {
                case '1':
                    return gotoFlow(flowMenuRest);
                case '2':
                    return gotoFlow(flowRegistro);
                case '3':
                    return gotoFlow(flowConsultas);
                case '4':
                    return gotoFlow(flowPromociones);
                case '5':
                    return gotoFlow(flowConsultaUsuario);
                case '0':
                    return await flowDynamic('Saliendo... Puedes volver a escribirme cuando gustes');
            }
            return endFlow()
        },
    )



// const registerFlow = addKeyword<Provider, Database>(utils.setEvent('REGISTER_FLOW'))
//     .addAnswer(`What is your name?`, { capture: true }, async (ctx, { state }) => {
//         await state.update({ name: ctx.body })
//     })
//     .addAnswer('What is your age?', { capture: true }, async (ctx, { state }) => {
//         await state.update({ age: ctx.body })
//     })
//     .addAction(async (_, { flowDynamic, state }) => {
//         await flowDynamic(`${state.get('name')}, thanks for your information!: Your age: ${state.get('age')}`)
//     })

// const fullSamplesFlow = addKeyword<Provider, Database>(['samples', utils.setEvent('SAMPLES')])
//     .addAnswer(`💪 I'll send you a lot files...`)
//     .addAnswer(`Send image from Local`, { media: join(process.cwd(), 'assets', 'sample.png') })
//     .addAnswer(`Send video from URL`, {
//         media: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTJ0ZGdjd2syeXAwMjQ4aWdkcW04OWlqcXI3Ynh1ODkwZ25zZWZ1dCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/LCohAb657pSdHv0Q5h/giphy.mp4',
//     })
//     .addAnswer(`Send audio from URL`, { media: 'https://cdn.freesound.org/previews/728/728142_11861866-lq.mp3' })
//     .addAnswer(`Send file from URL`, {
//         media: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
//     })

const main = async () => {
    const adapterFlow = createFlow([welcomeFlow,flowMenuRest,flowRegistro,flowConsultas,flowPromociones,flowRegistroCliente,flowConsultaUsuario])
    
    const adapterProvider = createProvider(Provider)
    const adapterDB = new Database()

    const { handleCtx, httpServer } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    adapterProvider.server.post(
        '/v1/messages',
        handleCtx(async (bot, req, res) => {
            const { number, message, urlMedia } = req.body
            await bot.sendMessage(number, message, { media: urlMedia ?? null })
            return res.end('sended')
        })
    )

    adapterProvider.server.post(
        '/v1/register',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('REGISTER_FLOW', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/samples',
        handleCtx(async (bot, req, res) => {
            const { number, name } = req.body
            await bot.dispatch('SAMPLES', { from: number, name })
            return res.end('trigger')
        })
    )

    adapterProvider.server.post(
        '/v1/blacklist',
        handleCtx(async (bot, req, res) => {
            const { number, intent } = req.body
            if (intent === 'remove') bot.blacklist.remove(number)
            if (intent === 'add') bot.blacklist.add(number)

            res.writeHead(200, { 'Content-Type': 'application/json' })
            return res.end(JSON.stringify({ status: 'ok', number, intent }))
        })
    )

    httpServer(+PORT)
}

main()
