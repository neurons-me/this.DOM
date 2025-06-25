// In createDOMFormatter.js
import DOMFormatterNode from './nodejs/domFormatter.node.js';
import DOMFormatterBrowser from './browser/domFormatter.browser.js';

function isNode() {
    return typeof window === 'undefined';
}

function isBrowser() {
    return typeof window !== 'undefined';
}

function isValidDOMInput(input) {
    // Implement checks based on what you consider valid DOM inputs (strings, objects, URLs)
    return true; // Placeholder implementation
}

export async function createDOMFormatter(domInput) {
    try {
        if (isNode()) {
            if (!isValidDOMInput(domInput)) {
                throw new Error("Invalid DOM input type in Node.js environment.");
            }
            return { formatter: new DOMFormatterNode(domInput), error: null };
        } else if (isBrowser()) {
            if (!isValidDOMInput(domInput)) {
                throw new Error("Invalid DOM input type in browser environment.");
            }
            return { formatter: new DOMFormatterBrowser(domInput), error: null };
        } else {
            throw new Error("Unsupported environment.");
        }
    } catch (error) {
        return { formatter: null, error: error.message };
    }
}
