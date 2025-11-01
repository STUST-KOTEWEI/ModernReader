"""FastAPI entrypoint for ModernReader backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.api import routes
from app.core.config import settings
from app.core.security import SecurityMiddleware
from app.db.database import engine
from app.models import Base


def create_app() -> FastAPI:
    app = FastAPI(
        title="ModernReader API",
        description=(
            "🔒 世界級安全防護的 CARE 多感官閱讀平台\n\n"
            "安全特性:\n"
            "- OWASP Top 10 防護\n"
            "- TLS 1.3 加密傳輸\n"
            "- 速率限制與 DDoS 防護\n"
            "- 完整審計日誌\n"
            "- 輸入驗證與清理\n"
            "- 安全標頭注入\n"
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )
    
    # 世界級安全中介層
    app.add_middleware(SecurityMiddleware)
    
    # CORS 設定 (生產環境應限制來源)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5176",
            "http://localhost:3000",
            "https://tend-email-stat-supplements.trycloudflare.com",
            # 生產環境加入真實域名
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Process-Time"],
    )
    
    # 信任主機保護 (防 Host Header Injection)
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=[
            "localhost",
            "127.0.0.1",
            "*.trycloudflare.com",
            # 生產環境加入真實域名
        ]
    )
    
    # GZip 壓縮
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # 初始化資料庫
    Base.metadata.create_all(bind=engine)
    
    # 註冊路由
    routes.register(app)
    
    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.API_HOST, port=settings.API_PORT)
