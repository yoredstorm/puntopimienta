import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

// Initializes the Google APIs client library and sets up the authentication using service account credentials.
const auth = new GoogleAuth({
    keyFile: './google.json',  // Path to your service account key file.
    scopes: ['https://www.googleapis.com/auth/spreadsheets']  // Scope for Google Sheets API.
});

const spreadsheetId = '15mJyccKb6jKxLBhz8rhhgO8ByLyEqLEPmwFsrVWfwlM';

async function appendToSheet(values: any[][]): Promise<any> {
    const sheets = google.sheets({ version: 'v4', auth }); // Create a Sheets API client instance
    const range = 'Sheet1!A1'; // The range in the sheet to start appending
    const valueInputOption = 'USER_ENTERED'; // How input data should be interpreted

    const resource = { values: values };

    try {
        const res = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption,
            requestBody: resource,
        });
        return res; // Returns the response from the Sheets API
    } catch (error) {
        console.error('error', error); // Logs errors
        throw error;
    }
}

async function getSheetLastRow(sheetName: string): Promise<number> {
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${sheetName}`
        });
        return response.data.values ? response.data.values.length : 0; // Returns the number of rows with data
    } catch (error) {
        console.error('error', error); // Logs errors
        throw error;
    }
}

async function readSheet(range: string): Promise<any[][] | undefined> {
    const sheets = google.sheets({ version: 'v4', auth });

    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId, range
        });
        const rows = response.data.values; // Extracts the rows from the response.
        return rows; // Returns the rows.
    } catch (error) {
        console.error('error', error); // Logs errors.
        throw error;
    }
}




export { appendToSheet, readSheet, getSheetLastRow };
