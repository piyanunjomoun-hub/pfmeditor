import { Product } from './types';

const API_URL = import.meta.env.VITE_GOOGLE_SHEETS_URL;

/**
 * Fetches all products from the Google Sheet.
 */
export const fetchProducts = async (): Promise<Product[]> => {
    if (!API_URL || API_URL === 'PLACEHOLDER_SHEET_URL') {
        console.warn("Google Sheets API URL is missing.");
        return [];
    }

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        // Ensure numeric/date fields are correctly typed if needed, though JSON handles most
        return data.map((item: any) => ({
            ...item,
            id: Number(item.id), // Ensure ID is a number
            date: item.date || new Date().toISOString()
        }));
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
};

/**
 * Adds a new product to the Google Sheet.
 */
export const addProductToSheet = async (product: Product): Promise<boolean> => {
    if (!API_URL) return false;

    try {
        // We send data as a POST request
        // Note: Google Apps Script Web App needs 'no-cors' or specific handling for CORS,
        // but usually responding with JSONP or valid CORS headers from the script helps.
        // simpler way for this demo:

        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Apps Script simple triggers sometimes
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(product),
        });

        // With 'no-cors', we get an opaque response, so we can't check .ok
        // We assume success if no network error thrown.
        return true;
    } catch (error) {
        console.error("Error adding product:", error);
        return false;
    }
};

/**
 * Deletes a product from the Google Sheet.
 */
export const deleteProductFromSheet = async (id: number): Promise<boolean> => {
    if (!API_URL) return false;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'delete', id: id }),
        });

        return true;
    } catch (error) {
        console.error("Error deleting product:", error);
        return false;
    }
};
