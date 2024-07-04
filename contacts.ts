import dotenv from 'dotenv';
import { google, sheets_v4 } from 'googleapis';
import path from 'path';
import fs, { existsSync } from 'fs';
dotenv.config()

const googleCredentials = JSON.parse(process.env.GOOGLE_JSON);

if (!googleCredentials){
    throw new Error('GOOGLE_JSON environment variable is not defined');
}

const googleJsonPath = path.join(process.cwd(), 'google.json');

if (!existsSync(googleJsonPath)){
    try{
        fs.writeFileSync(googleJsonPath, JSON.stringify(googleCredentials, null, 2));
        console.log('google.json creado correctamente')
    }catch(error){
        throw new Error(`error al crear el archivo' ${error.message}`);
    }
}else{
    console.log("archivo creado correctamente00");
}
// Inicializa la autenticación con las credenciales del servicio
const auth = new google.auth.GoogleAuth({
    keyFile: 'google.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});


// ID de la hoja de cálculo y rango de la hoja
const spreadsheetId = '1X5uZDJuExhrFIKsMtl3fpzAb8hcacyKI8giKA2kLxtc';

export async function getRowByPhoneNumber(phoneNumber: string): Promise<string> {
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!C:C', // Rango que cubre toda la columna C
            valueRenderOption: 'FORMATTED_VALUE',
            dateTimeRenderOption: 'FORMATTED_STRING',
        });
        const values = response.data.values || [];
        for (let i = 0; i < values.length; i++) {
            if (values[i][0] === phoneNumber) {
                // Si encuentra el número de teléfono, busca el valor correspondiente en la columna A
                const rowResponse = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: `Sheet1!A${i + 1}`, // Obtiene el valor de la columna A en la misma fila
                    valueRenderOption: 'FORMATTED_VALUE',
                    dateTimeRenderOption: 'FORMATTED_STRING',
                });
                return rowResponse.data.values[0][0]; // Devuelve el valor de la columna A
            }
        }
        return "desconocido"; // Si no se encuentra el número de teléfono, devuelve "desconocido"
    } catch (error) {
        console.error('error', error);
        return "desconocido";
    }
}

export async function appendToSheetContacts(values: string[][]): Promise<sheets_v4.Schema$AppendValuesResponse | undefined> {
    const sheets = google.sheets({ version: 'v4', auth }); // Crea una instancia del cliente de la API de Sheets
    const range = 'Sheet1!A1'; // El rango en la hoja para comenzar a agregar
    const valueInputOption = 'USER_ENTERED'; // Cómo se deben interpretar los datos de entrada

    const resource = { values };

    try {
        const res = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption,
            requestBody: resource,
        });
        return res.data; // Devuelve la respuesta de la API de Sheets
    } catch (error) {
        console.error('error', error); // Registra los errores
    }
}

export async function getDataByPhoneNumber(phoneNumber: string): Promise<any[] | string> {
    const sheets = google.sheets({ version: 'v4', auth });
    const range = 'Sheet1!A:H'; // Define el rango para leer de la hoja

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        });
        const rows = response.data.values; // Extrae las filas de la respuesta.

        if (!rows || rows.length === 0) {
            return 'Numero de telefono no registrado';
        }

        // Normaliza el número de teléfono para la comparación (elimina espacios, guiones, etc.)
        const normalizedPhoneNumber = phoneNumber.replace(/\D/g, '');

        for (const row of rows) {
            const rowPhoneNumber = row[2] ? row[2].replace(/\D/g, '') : '';
            if (rowPhoneNumber === normalizedPhoneNumber) { // Verifica si el número de teléfono coincide
                return row; // Devuelve la fila coincidente
            }
        }

        return 'Numero de telefono no registrado'; // Si no se encuentra coincidencia
    } catch (error) {
        console.error('Error fetching data:', error); // Registra los errores.
        throw error;
    }
}
