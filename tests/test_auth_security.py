import os
from pathlib import Path
from tempfile import TemporaryDirectory


def test_auth_uses_hashed_password_and_session_expiry():
    with TemporaryDirectory() as directory:
        os.environ['MODERNREADER_DB'] = str(Path(directory) / 'auth.sqlite3')
        import importlib
        api = importlib.import_module('web.backend.main')
        api.DB_PATH = Path(os.environ['MODERNREADER_DB'])
        from fastapi.testclient import TestClient
        client = TestClient(api.app)
        registered = client.post('/api/auth/register', json={'email': 'test@example.com', 'password': 'secure-pass'})
        assert registered.status_code == 200
        token = registered.json()['token']
        with api.db() as connection:
            password = connection.execute('SELECT password_hash FROM users').fetchone()[0]
            expires = connection.execute('SELECT expires_at FROM sessions').fetchone()[0]
        assert '$' in password
        assert expires
        assert client.get('/api/books', headers={'Authorization': f'Bearer {token}'}).status_code == 200
