"""ModernReader backend MVP.

Features: SQLite accounts/books/annotations, EPUB text sync, optional OpenAI-compatible
summaries and RAG answers, podcast script generation, and optional gTTS audio.
"""
from __future__ import annotations

import hashlib
import io
import os
import secrets
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel, Field

try:
    from openai import OpenAI
except ImportError:  # optional for offline mode
    OpenAI = None

try:
    from gtts import gTTS
except ImportError:
    gTTS = None

DB_PATH = Path(os.getenv("MODERNREADER_DB", Path(__file__).with_name("modernreader.sqlite3")))
app = FastAPI(title="ModernReader API", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])


def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.executescript("""
      CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user_id INTEGER NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS books (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS annotations (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, book_id INTEGER NOT NULL, paragraph_index INTEGER NOT NULL, text TEXT NOT NULL, emotion TEXT NOT NULL, created_at TEXT NOT NULL);
    """)
    return connection


def now():
    return datetime.now(timezone.utc).isoformat()


def password_hash(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def current_user(authorization: Optional[str] = Header(default=None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "需要登入")
    with db() as connection:
        row = connection.execute("SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=?", (authorization[7:],)).fetchone()
    if not row:
        raise HTTPException(401, "登入已失效")
    return row


class AuthRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)


class BookRequest(BaseModel):
    title: str
    content: str


class TextRequest(BaseModel):
    book_id: Optional[int] = None
    text: str
    language: str = "zh-TW"
    style: str = "清楚、溫暖、適合學習"


class AskRequest(BaseModel):
    book_id: int
    question: str


class AnnotationRequest(BaseModel):
    book_id: int
    paragraph_index: int
    text: str
    emotion: str


def llm(prompt: str, system: str) -> Optional[str]:
    if not OpenAI or not os.getenv("OPENAI_API_KEY"):
        return None
    client = OpenAI()
    result = client.chat.completions.create(model=os.getenv("MODERNREADER_MODEL", "gpt-5-mini"), messages=[{"role": "system", "content": system}, {"role": "user", "content": prompt}], max_completion_tokens=700)
    return result.choices[0].message.content


def book_for(user_id: int, book_id: int):
    with db() as connection:
        row = connection.execute("SELECT * FROM books WHERE id=? AND user_id=?", (book_id, user_id)).fetchone()
    if not row:
        raise HTTPException(404, "找不到這本書")
    return row


def relevant_passages(content: str, question: str, limit: int = 4):
    paragraphs = [part.strip() for part in content.split("\n\n") if part.strip()]
    terms = set(question.lower().split())
    scored = sorted(paragraphs, key=lambda p: sum(term in p.lower() for term in terms), reverse=True)
    return scored[:limit]


@app.get("/")
def health():
    return {"name": "ModernReader API", "version": "0.2.0", "status": "ok", "features": ["auth", "books", "rag", "summary", "podcast", "tts"]}


@app.post("/api/auth/register")
def register(request: AuthRequest):
    try:
        with db() as connection:
            cursor = connection.execute("INSERT INTO users(email,password_hash,created_at) VALUES(?,?,?)", (request.email.lower(), password_hash(request.password), now()))
            user_id = cursor.lastrowid
    except sqlite3.IntegrityError as error:
        raise HTTPException(409, "Email 已註冊") from error
    token = secrets.token_urlsafe(32)
    with db() as connection:
        connection.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)", (token, user_id, now()))
    return {"token": token, "user": {"id": user_id, "email": request.email.lower()}}


@app.post("/api/auth/login")
def login(request: AuthRequest):
    with db() as connection:
        user = connection.execute("SELECT * FROM users WHERE email=? AND password_hash=?", (request.email.lower(), password_hash(request.password))).fetchone()
    if not user:
        raise HTTPException(401, "Email 或密碼錯誤")
    token = secrets.token_urlsafe(32)
    with db() as connection:
        connection.execute("INSERT INTO sessions(token,user_id,created_at) VALUES(?,?,?)", (token, user["id"], now()))
    return {"token": token, "user": {"id": user["id"], "email": user["email"]}}


@app.get("/api/books")
def books(user=Depends(current_user)):
    with db() as connection:
        return {"books": [dict(row) | {"content": None} for row in connection.execute("SELECT id,title,created_at FROM books WHERE user_id=? ORDER BY id DESC", (user["id"],))]}


@app.post("/api/books")
def create_book(request: BookRequest, user=Depends(current_user)):
    with db() as connection:
        cursor = connection.execute("INSERT INTO books(user_id,title,content,created_at) VALUES(?,?,?,?)", (user["id"], request.title, request.content, now()))
    return {"id": cursor.lastrowid, "title": request.title}


@app.post("/api/books/upload")
async def upload_book(file: UploadFile = File(...), user=Depends(current_user)):
    raw = await file.read()
    if file.filename and file.filename.lower().endswith(".epub"):
        raise HTTPException(400, "瀏覽器已負責 EPUB 解析；請上傳解析後的文字，或使用 /api/books 建立書籍")
    content = raw.decode("utf-8", errors="ignore")
    with db() as connection:
        cursor = connection.execute("INSERT INTO books(user_id,title,content,created_at) VALUES(?,?,?,?)", (user["id"], file.filename or "未命名書籍", content, now()))
    return {"id": cursor.lastrowid, "title": file.filename}


@app.get("/api/books/{book_id}")
def get_book(book_id: int, user=Depends(current_user)):
    return dict(book_for(user["id"], book_id))


@app.post("/api/ai/summary")
def summary(request: TextRequest, user=Depends(current_user)):
    text = request.text[:12000]
    result = llm(text, "你是 ModernReader 閱讀助理。請用繁體中文，給出精準、不可捏造的段落摘要與三個重點。")
    if result:
        return {"summary": result, "mode": "llm"}
    sentences = [part.strip() for part in text.replace("！", "。 ").replace("？", "。 ").split("。") if part.strip()]
    return {"summary": "本段重點：" + "。".join(sentences[:2]) + ("。" if sentences else ""), "mode": "offline"}


@app.post("/api/ai/ask")
def ask(request: AskRequest, user=Depends(current_user)):
    book = book_for(user["id"], request.book_id)
    passages = relevant_passages(book["content"], request.question)
    context = "\n\n".join(passages)
    result = llm(f"書籍內容：\n{context}\n\n讀者問題：{request.question}", "你是基於來源內容回答的閱讀助理。只能依據提供的書籍內容，若找不到答案就明確說不知道。")
    return {"answer": result or f"根據書籍內容，最相關的段落是：\n\n{context[:1000]}", "mode": "llm" if result else "offline", "sources": passages}


@app.post("/api/ai/podcast-script")
def podcast_script(request: TextRequest, user=Depends(current_user)):
    prompt = f"請把以下內容改寫成約 3 分鐘、兩位主持人對談的繁體中文 Podcast 腳本，風格：{request.style}。\n\n{request.text[:14000]}"
    result = llm(prompt, "你是 ModernReader Podcast 編劇，保留原文事實，不要添加來源未提及的內容。")
    return {"script": result or f"主持人 A：歡迎收聽 ModernReader。今天我們要理解的內容是：\n\n{request.text[:1600]}\n\n主持人 B：以上是本段的重點整理。", "mode": "llm" if result else "offline"}


@app.post("/api/annotations")
def annotate(request: AnnotationRequest, user=Depends(current_user)):
    book_for(user["id"], request.book_id)
    with db() as connection:
        cursor = connection.execute("INSERT INTO annotations(user_id,book_id,paragraph_index,text,emotion,created_at) VALUES(?,?,?,?,?,?)", (user["id"], request.book_id, request.paragraph_index, request.text, request.emotion, now()))
    return {"id": cursor.lastrowid, "emotion": request.emotion}


@app.get("/api/annotations")
def annotations(book_id: int, user=Depends(current_user)):
    with db() as connection:
        rows = connection.execute("SELECT * FROM annotations WHERE user_id=? AND book_id=? ORDER BY paragraph_index", (user["id"], book_id)).fetchall()
    return {"annotations": [dict(row) for row in rows]}


@app.post("/api/tts")
def tts(request: TextRequest, user=Depends(current_user)):
    if not gTTS:
        raise HTTPException(503, "尚未安裝 gTTS")
    language = "zh-tw" if request.language.startswith("zh") else request.language.split("-")[0]
    output = io.BytesIO()
    gTTS(text=request.text[:3000], lang=language).write_to_fp(output)
    return Response(output.getvalue(), media_type="audio/mpeg", headers={"Content-Disposition": "inline; filename=modernreader.mp3"})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000")))
