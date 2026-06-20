export function mergeImageFiles(prev: File[], incoming: File[]): File[] {
    const seen = new Set(
      prev.map((f) => `${f.name}\0${f.size}\0${f.lastModified}`)
    );
    const out = [...prev];
    for (const f of incoming) {
      const key = `${f.name}\0${f.size}\0${f.lastModified}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(f);
      }
    }
    return out;
  }
  
  export function formatSeoKeywords(keywords: string[] | string): string {
    if (Array.isArray(keywords)) {
      return keywords.join(", ");
    }
    return keywords;
  }
  
  export function parseSeoKeywords(keywords: string): string[] {
    return keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
  }