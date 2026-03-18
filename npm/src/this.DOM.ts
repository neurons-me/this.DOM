import { createDOMFormatter } from "./createDOMFormatter.js";
import type { DOMInput, DOMProcessed } from "./types.js";

export type DOMResult =
  | { success: true; data: DOMProcessed }
  | { success: false; error: string };

/**
 * Processes DOM input (HTML string, URL, or Document) into a structured DOM representation.
 */
export default async function DOM(domInput: DOMInput): Promise<DOMResult> {
  const { formatter, error } = await createDOMFormatter(domInput);
  if (error || !formatter) {
    return { success: false, error: error || "Formatter not available." };
  }

  try {
    const processedDOM = await formatter.process();
    return { success: true, data: processedDOM };
  } catch (processingError) {
    return {
      success: false,
      error: processingError instanceof Error ? processingError.message : "DOM processing failed.",
    };
  }
}
