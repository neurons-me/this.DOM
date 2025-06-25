/*
this.DOM.js
ⓝⓔⓤⓡⓞⓝⓢ.ⓜⓔ
🆂🆄🅸🅶🅽 /*
/**
 * @file this.DOM
 */
import { createDOMFormatter } from './createDOMFormatter.js';

/**
 * Asynchronously processes a DOM input, returning structured data or an error object.
 * @param {string|Object} domInput - The string containing HTML, a URL to an HTML page, or a DOM object.
 * @returns {Promise<Object>} A promise that resolves to an object indicating success or failure, with data or an error message.
 */
async function thisDOM(domInput) {
    let { formatter, error } = await createDOMFormatter(domInput);
    // If there's an error in creating the formatter, return it immediately
    if (error) {
        return { success: false, error };
    }

    try {
        // Process the DOM using the appropriate formatter
        const processedDOM = await formatter.process();
        return { success: true, data: processedDOM };
    } catch (processingError) {
        // Catch and return any errors that occur during processing
        return { success: false, error: processingError.message };
    }
}

export default thisDOM;
