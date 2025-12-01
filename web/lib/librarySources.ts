import type { LibraryAccessType, LibraryHolding } from "@/types/user";

type LibraryType = 'open' | 'national' | 'academic';

interface LibrarySource {
    id: string;
    name: string;
    country: string;
    type: LibraryType;
    access: Exclude<LibraryAccessType, 'Any'>;
    location: string;
    callPrefix: string;
    baseUrl?: string;
}

// Curated set of open/national/academic libraries across regions
export const LIBRARY_SOURCES: LibrarySource[] = [
    {
        id: "openlibrary",
        name: "Open Library",
        country: "Global",
        type: "open",
        access: "Digital",
        location: "Digital stacks • worldwide",
        callPrefix: "OL",
        baseUrl: "https://openlibrary.org",
    },
    {
        id: "ncl",
        name: "National Central Library",
        country: "Taiwan",
        type: "national",
        access: "Hybrid",
        location: "Taipei Main Library 5F • Humanities/Indigenous",
        callPrefix: "NCL",
        baseUrl: "https://www.ncl.edu.tw/",
    },
    {
        id: "loc",
        name: "Library of Congress",
        country: "USA",
        type: "national",
        access: "Hybrid",
        location: "Jefferson Building • Main Reading Room",
        callPrefix: "LOC",
        baseUrl: "https://www.loc.gov/",
    },
    {
        id: "ndl",
        name: "National Diet Library",
        country: "Japan",
        type: "national",
        access: "Physical",
        location: "Tokyo Main • Humanities 4F",
        callPrefix: "NDL",
        baseUrl: "https://www.ndl.go.jp/",
    },
    {
        id: "bl",
        name: "British Library",
        country: "UK",
        type: "national",
        access: "Hybrid",
        location: "St Pancras • Humanities 2F",
        callPrefix: "BL",
        baseUrl: "https://www.bl.uk/",
    },
    {
        id: "ntu",
        name: "National Taiwan University Library",
        country: "Taiwan",
        type: "academic",
        access: "Hybrid",
        location: "Main Library • General Stacks 6F",
        callPrefix: "NTU",
        baseUrl: "https://www.lib.ntu.edu.tw/",
    },
    {
        id: "harvard",
        name: "Harvard Library",
        country: "USA",
        type: "academic",
        access: "Hybrid",
        location: "Widener Stacks • Level 3",
        callPrefix: "HRV",
        baseUrl: "https://library.harvard.edu/",
    },
    {
        id: "bnf",
        name: "Bibliothèque nationale de France",
        country: "France",
        type: "national",
        access: "Hybrid",
        location: "François-Mitterrand • Haut-de-jardin",
        callPrefix: "BnF",
        baseUrl: "https://www.bnf.fr/",
    },
];

// Light Dewey/LC style mapping so we can show plausible shelf marks
const SUBJECT_CLASS_MAP: Record<string, string> = {
    technology: "004",
    tech: "004",
    science: "500",
    physics: "530",
    biology: "570",
    history: "900",
    business: "650",
    finance: "332",
    "self-help": "158.1",
    psychology: "150",
    education: "370",
    art: "700",
    design: "745",
    fiction: "820",
    fantasy: "823",
    literature: "800",
    culture: "306",
};

function normalizeSubject(subject?: string): string {
    if (!subject) return "general";
    return subject.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() || "general";
}

function filterByPreferences(preferredIds?: string[], preferredAccess?: LibraryAccessType): LibrarySource[] {
    let pool = [...LIBRARY_SOURCES];
    if (preferredIds && preferredIds.length) {
        pool = pool.filter(src => preferredIds.includes(src.id));
    }
    if (preferredAccess && preferredAccess !== "Any") {
        pool = pool.filter(src => src.access === preferredAccess);
    }
    return pool.length ? pool : LIBRARY_SOURCES;
}

function pickLibrarySource(subject?: string, index = 0, preferredIds?: string[], preferredAccess?: LibraryAccessType): LibrarySource {
    const normalized = normalizeSubject(subject);
    const pool = filterByPreferences(preferredIds, preferredAccess);

    // Prefer national libraries for humanities/history, academic for science/tech
    if (normalized.includes("history") || normalized.includes("culture")) {
        const preferred = pool.find(src => src.id === "ncl") || pool.find(src => src.type === "national");
        if (preferred) return preferred;
    }
    if (normalized.includes("science") || normalized.includes("tech") || normalized.includes("technology")) {
        const preferred = pool.find(src => src.id === "harvard") || pool.find(src => src.type === "academic");
        if (preferred) return preferred;
    }
    if (normalized.includes("literature") || normalized.includes("fiction")) {
        const preferred = pool.find(src => src.id === "bl") || pool.find(src => src.type === "national");
        if (preferred) return preferred;
    }
    return pool[index % pool.length];
}

function buildCallNumber(subject: string, source: LibrarySource, index: number): string {
    const normalized = normalizeSubject(subject);
    const base = SUBJECT_CLASS_MAP[normalized] || SUBJECT_CLASS_MAP[normalized.split(" ")[0]] || "300";
    const cutter = String(12 + (index % 87)).padStart(2, "0");
    return `${source.callPrefix} ${base}/${cutter}`;
}

export function buildLibraryHolding(
    subject?: string,
    index = 0,
    options?: { preferredLibraryIds?: string[]; preferredAccess?: LibraryAccessType }
): LibraryHolding {
    const source = pickLibrarySource(subject, index, options?.preferredLibraryIds, options?.preferredAccess);
    const callNumber = buildCallNumber(subject || "general", source, index);

    return {
        libraryId: source.id,
        libraryName: source.name,
        country: source.country,
        callNumber,
        location: source.location,
        access: source.access,
        note: `${source.type === "open" ? "Open access" : "Library card"} • ${subject || "General collections"}`,
        url: source.baseUrl,
    };
}
