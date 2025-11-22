"""Database bootstrap script - 初始化所有資料庫表格"""
import sys
from pathlib import Path

# 添加 app 到路徑
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db.database import engine
from app.models.base import Base

# 導入所有模型以確保它們被註冊到 Base.metadata
from app.models import (  # noqa: F401
    catalog,
    consent,
    epaper,
    recommendation,
    session,
    user,
    email_verification,
)


def main():
    """初始化資料庫並建立所有表格"""
    print("🚀 開始初始化資料庫...")
    
    # 建立所有表格
    Base.metadata.create_all(bind=engine)
    
    print("✅ 資料庫表格建立完成！")
    print("\n已建立的表格：")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")
    
    print("\n🎉 資料庫初始化完成！")
    print("📍 數據庫位置: ./modernreader.db")


if __name__ == "__main__":
    main()
