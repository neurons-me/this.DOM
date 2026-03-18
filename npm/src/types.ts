export type DOMInput =
  | string
  | URL
  | Document
  | { html: string; url?: string | null };

export type DOMNodeType = "document" | "element" | "text" | "comment";

export interface DOMNode {
  type: DOMNodeType;
  tag?: string;
  attributes?: Record<string, string>;
  text?: string;
  children?: DOMNode[];
  path?: string;
  selector?: string;
}

export interface DOMFlatNode {
  path: string;
  selector: string;
  tag: string;
  attributes: Record<string, string>;
  text?: string;
}

export interface DOMMeta {
  sourceType: "html" | "url" | "dom";
  url?: string | null;
  title?: string | null;
}

export interface DOMProcessed {
  root: DOMNode;
  flat: DOMFlatNode[];
  meta: DOMMeta;
}

export interface DOMFormatter {
  process(): Promise<DOMProcessed>;
}

export interface DOMFormatterResult {
  formatter: DOMFormatter | null;
  error: string | null;
}

