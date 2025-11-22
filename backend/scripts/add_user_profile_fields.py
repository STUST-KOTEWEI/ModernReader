"""Add username and avatar_url to users table."""
import sys
from pathlib import Path
from sqlalchemy import create_engine, text


def migrate():
    # Ensure project root is in sys.path before importing engine
    sys.path.insert(0, str(Path(__file__).parent.parent))
    engine = create_engine('sqlite:///your_database_file.db')

    with engine.connect() as conn:
        # Check if columns already exist
        result = conn.execute(text("PRAGMA table_info(users)"))
        columns = [row[1] for row in result]

        if 'username' not in columns:
            print("Adding username column...")
            # SQLite cannot add UNIQUE constraint in ALTER,
            # add column then create index
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN username VARCHAR(64)"
            ))
            conn.commit()
            # Create unique index separately
            conn.execute(text(
                "CREATE UNIQUE INDEX idx_users_username "
                "ON users(username) "
                "WHERE username IS NOT NULL"
            ))
            conn.commit()
            print("✓ Added username column with unique index")
        else:
            print("✓ username column already exists")

        if 'avatar_url' not in columns:
            print("Adding avatar_url column...")
            conn.execute(text(
                "ALTER TABLE users ADD COLUMN avatar_url VARCHAR(512)"
            ))
            conn.commit()
            print("✓ Added avatar_url column")
        else:
            print("✓ avatar_url column already exists")

    print("\nMigration complete!")


if __name__ == "__main__":
    migrate()
