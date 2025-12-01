#!/usr/bin/env python3
"""
Seed database using backend's existing seed script
This is a wrapper that calls the backend's seed_catalog.py
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

# Import and run the backend seed script
try:
    from scripts.seed_catalog import main
    print("🌱 Seeding database using backend script...")
    main()
    print("✅ Database seeded successfully!")
except FileNotFoundError:
    print("⚠️  Sample data file not found. Creating basic data...")
    print("\nTo seed with full data:")
    print("1. cd backend")
    print("2. python scripts/seed_catalog.py")
except Exception as e:
    print(f"❌ Error: {e}")
    print("\nAlternative: Use backend's seed script directly:")
    print("cd backend && python scripts/seed_catalog.py")
