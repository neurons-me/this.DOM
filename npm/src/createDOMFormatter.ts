import type {
  DOMFormatter,
  DOMFormatterResult,
  DOMInput,
  DOMMeta,
  DOMNode,
  DOMFlatNode,
  DOMProcessed,
} from "./types.js";

type LinkeDomModule = {
  parseHTML: (html: string) => { document: Document };
};

const MAX_TEXT_PREVIEW = 120;

function isUrlString(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

async function loadDocumentFromHtml(html: string): Promise<Document> {
  if (typeof DOMParser !== "undefined") {
    return new DOMParser().parseFromString(html, "text/html");
  }

  try {
    const mod = (await import("linkedom")) as LinkeDomModule;
    const parsed = mod.parseHTML(html);
    return parsed.document;
  } catch (error) {
    throw new Error(
      "DOM parser unavailable. Install 'linkedom' for Node usage.",
    );
  }
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function nodeTypeToName(nodeType: number): DOMNode["type"] {
  switch (nodeType) {
    case 9:
      return "document";
    case 1:
      return "element";
    case 3:
      return "text";
    case 8:
      return "comment";
    default:
      return "element";
  }
}

function buildSelectorSegment(node: Element): string {
  const id = node.getAttribute("id");
  if (id) return `#${id}`;
  const className = node.getAttribute("class");
  if (className) {
    const firstClass = className.split(/\s+/).filter(Boolean)[0];
    if (firstClass) return `.${firstClass}`;
  }
  return node.tagName.toLowerCase();
}

function getNodeTextPreview(node: Element): string | undefined {
  const text = normalizeWhitespace(node.textContent || "");
  if (!text) return undefined;
  return text.length > MAX_TEXT_PREVIEW ? `${text.slice(0, MAX_TEXT_PREVIEW)}…` : text;
}

function serializeNode(
  node: Node,
  parentPath: string | null,
  siblingCounts: Map<string, number>,
  flat: DOMFlatNode[],
): DOMNode {
  const type = nodeTypeToName(node.nodeType);

  if (type === "text") {
    const textValue = normalizeWhitespace(node.nodeValue || "");
    return { type, text: textValue || undefined };
  }

  if (type === "comment") {
    return { type, text: node.nodeValue || undefined };
  }

  if (type === "document") {
    const children: DOMNode[] = [];
    node.childNodes.forEach((child) => {
      children.push(serializeNode(child, parentPath, new Map(), flat));
    });
    return { type, children };
  }

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  const attributes: Record<string, string> = {};
  if (element.attributes) {
    for (const attr of Array.from(element.attributes)) {
      attributes[attr.name] = attr.value;
    }
  }

  let segment = buildSelectorSegment(element);
  const countKey = `${parentPath ?? ""}:${segment}`;
  const count = (siblingCounts.get(countKey) || 0) + 1;
  siblingCounts.set(countKey, count);
  if (count > 1) segment = `${segment}~${count}`;

  const path = parentPath ? `${parentPath}.${segment}` : segment;
  const selector = segment;

  const children: DOMNode[] = [];
  const nextCounts = new Map<string, number>();
  element.childNodes.forEach((child) => {
    children.push(serializeNode(child, path, nextCounts, flat));
  });

  const textPreview = getNodeTextPreview(element);

  flat.push({
    path,
    selector,
    tag,
    attributes,
    text: textPreview,
  });

  return {
    type,
    tag,
    attributes,
    children,
    path,
    selector,
    text: textPreview,
  };
}

async function processDocument(doc: Document, meta: DOMMeta): Promise<DOMProcessed> {
  const root = doc.documentElement ?? doc;
  const flat: DOMFlatNode[] = [];
  const tree = serializeNode(root, null, new Map(), flat);
  const title = doc.title || null;
  return {
    root: tree,
    flat,
    meta: {
      ...meta,
      title,
    },
  };
}

class HtmlFormatter implements DOMFormatter {
  private readonly html: string;
  private readonly meta: DOMMeta;

  constructor(html: string, meta: DOMMeta) {
    this.html = html;
    this.meta = meta;
  }

  async process(): Promise<DOMProcessed> {
    const document = await loadDocumentFromHtml(this.html);
    return processDocument(document, this.meta);
  }
}

class DomFormatter implements DOMFormatter {
  private readonly document: Document;
  private readonly meta: DOMMeta;

  constructor(document: Document, meta: DOMMeta) {
    this.document = document;
    this.meta = meta;
  }

  async process(): Promise<DOMProcessed> {
    return processDocument(this.document, this.meta);
  }
}

export async function createDOMFormatter(domInput: DOMInput): Promise<DOMFormatterResult> {
  if (domInput == null) {
    return { formatter: null, error: "DOM input is required." };
  }

  if (typeof domInput === "string") {
    const raw = domInput.trim();
    if (!raw) return { formatter: null, error: "DOM input is empty." };
    if (isUrlString(raw)) {
      try {
        const response = await fetch(raw);
        const html = await response.text();
        return {
          formatter: new HtmlFormatter(html, { sourceType: "url", url: raw }),
          error: null,
        };
      } catch (error) {
        return {
          formatter: null,
          error: error instanceof Error ? error.message : "Failed to fetch URL.",
        };
      }
    }

    return {
      formatter: new HtmlFormatter(raw, { sourceType: "html" }),
      error: null,
    };
  }

  if (domInput instanceof URL) {
    try {
      const response = await fetch(domInput.toString());
      const html = await response.text();
      return {
        formatter: new HtmlFormatter(html, { sourceType: "url", url: domInput.toString() }),
        error: null,
      };
    } catch (error) {
      return {
        formatter: null,
        error: error instanceof Error ? error.message : "Failed to fetch URL.",
      };
    }
  }

  if (typeof (domInput as Document).nodeType === "number") {
    return {
      formatter: new DomFormatter(domInput as Document, { sourceType: "dom" }),
      error: null,
    };
  }

  if (typeof domInput === "object" && "html" in domInput) {
    const html = String(domInput.html || "").trim();
    if (!html) return { formatter: null, error: "HTML payload is empty." };
    return {
      formatter: new HtmlFormatter(html, {
        sourceType: "html",
        url: domInput.url ?? null,
      }),
      error: null,
    };
  }

  return {
    formatter: null,
    error: "Unsupported DOM input type.",
  };
}

