export interface AcademicPaper {
    id: string;
    title: string;
    authors: string[];
    summary: string;
    source: string;
    metadata: {
        url?: string;
        pdf_url?: string;
        published?: string;
        doi?: string;
        publisher?: string;
        journal?: string;
    };
}

export interface AcademicSearchResponse {
    results: AcademicPaper[];
    total: int;
}

export async function searchAcademicPapers(
    query: string,
    limit: number = 10,
    source?: string
): Promise<AcademicSearchResponse> {
    const params = new URLSearchParams({
        q: query,
        limit: limit.toString(),
    });
    if (source) {
        params.append("source", source);
    }

    // Assuming the Next.js app proxies /api to the backend or the backend is on localhost:8000
    // If working in dev mode, we might need the full URL if no proxy is set up.
    // Based on README, API is at http://127.0.0.1:8000
    // But in production/docker, it might differ.
    // We'll try the relative path /api/v1... assuming Next.js rewrites or we are calling from browser to backend directly (CORS).
    // If we are running locally:
    
    const apiUrl = `http://localhost:8000/api/v1/academic/search?${params.toString()}`;

    const res = await fetch(apiUrl);

    if (!res.ok) {
        throw new Error("Failed to fetch academic papers");
    }

    return res.json();
}
