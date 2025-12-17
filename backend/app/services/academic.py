import httpx
import xml.etree.ElementTree as ET
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class AcademicPaperService:
    """Service for searching academic papers from arXiv, IEEE, ACM (via OpenAlex)."""

    def __init__(self):
        self.arxiv_api_url = "http://export.arxiv.org/api/query"
        self.openalex_api_url = "https://api.openalex.org/works"

    async def search_all(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search both arXiv and OpenAlex and merge results."""
        # We can run these in parallel in a real async env, but for simplicity:
        results = []
        
        # 1. ArXiv
        try:
            arxiv_results = await self.search_arxiv(query, limit=limit // 2)
            results.extend(arxiv_results)
        except Exception as e:
            logger.error(f"ArXiv search failed: {e}")

        # 2. OpenAlex (covers IEEE, ACM, etc.)
        try:
            # Calculate remaining limit
            remaining = limit - len(results)
            if remaining > 0:
                openalex_results = await self.search_openalex(query, limit=remaining)
                results.extend(openalex_results)
        except Exception as e:
            logger.error(f"OpenAlex search failed: {e}")

        return results

    async def search_arxiv(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search arXiv API."""
        params = {
            "search_query": f"all:{query}",
            "start": 0,
            "max_results": limit,
            "sortBy": "relevance",
            "sortOrder": "descending"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.arxiv_api_url, params=params)
            response.raise_for_status()
            
        return self._parse_arxiv_response(response.text)

    def _parse_arxiv_response(self, xml_data: str) -> List[Dict[str, Any]]:
        """Parse arXiv Atom response."""
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom', 'arxiv': 'http://arxiv.org/schemas/atom'}
        
        results = []
        for entry in root.findall('atom:entry', ns):
            title = entry.find('atom:title', ns).text.strip().replace('\n', ' ')
            summary = entry.find('atom:summary', ns).text.strip().replace('\n', ' ')
            id_url = entry.find('atom:id', ns).text.strip()
            published = entry.find('atom:published', ns).text.strip()
            
            authors = []
            for author in entry.findall('atom:author', ns):
                name = author.find('atom:name', ns).text.strip()
                authors.append(name)

            # Get PDF link
            pdf_link = None
            for link in entry.findall('atom:link', ns):
                if link.get('title') == 'pdf':
                    pdf_link = link.get('href')
            
            # If no explicit pdf link, try to construct or use alternate
            if not pdf_link:
                # Check for 'related' or alternate links if needed
                pass

            results.append({
                "source": "arXiv",
                "id": id_url,
                "title": title,
                "authors": authors,
                "summary": summary,
                "published": published,
                "url": id_url,
                "pdf_url": pdf_link,
                "metadata": {
                    "categories": [c.get('term') for c in entry.findall('atom:category', ns)]
                }
            })
        return results

    async def search_openalex(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search OpenAlex for works (covers IEEE, ACM)."""
        params = {
            "search": query,
            "per-page": limit,
            "filter": "type:article|book-chapter|proceedings-article", # Limit to papers
            "select": "id,title,display_name,publication_year,authorships,abstract_inverted_index,doi,primary_location,open_access"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.openalex_api_url, params=params)
            response.raise_for_status()
            data = response.json()

        results = []
        for item in data.get('results', []):
            # Reconstruct abstract from inverted index if needed, but it's heavy.
            # OpenAlex often doesn't give full abstract text directly in simple query without heavy reconstruction.
            # We'll skip abstract reconstruction for now or use a placeholder.
            # Actually, 'abstract_inverted_index' is complex.
            
            title = item.get('title') or item.get('display_name')
            doi = item.get('doi')
            
            authors = []
            for authorship in item.get('authorships', []):
                author = authorship.get('author', {})
                if author.get('display_name'):
                    authors.append(author.get('display_name'))
            
            # Determine source (IEEE/ACM)
            location = item.get('primary_location') or {}
            source_meta = location.get('source') or {}
            host_org = source_meta.get('host_organization_name', 'Unknown')
            
            # Filter mainly for relevant ones if needed, or just label them.
            # If user specifically asked for IEEE/ACM, we can highlight them.
            source_label = "OpenAlex"
            if "IEEE" in host_org:
                source_label = "IEEE"
            elif "ACM" in host_org:
                source_label = "ACM"

            pdf_url = item.get('open_access', {}).get('oa_url')
            
            results.append({
                "source": source_label,
                "id": item.get('id'),
                "title": title,
                "authors": authors,
                "summary": "Abstract available in full view.", # Placeholder
                "published": str(item.get('publication_year')),
                "url": doi or item.get('id'),
                "pdf_url": pdf_url,
                "metadata": {
                    "doi": doi,
                    "publisher": host_org,
                    "journal": source_meta.get('display_name')
                }
            })
        return results
