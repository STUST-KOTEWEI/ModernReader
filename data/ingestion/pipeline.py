"""Data ingestion pipeline outline."""

def fetch_source_corpus() -> None:
    """Fetch raw text/audio assets under CARE agreements."""
    raise NotImplementedError


def sync_metadata_catalog() -> None:
    """Standardize metadata fields for downstream services."""
    raise NotImplementedError
