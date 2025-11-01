"""Placeholder script for initializing ModernReader databases."""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

# 建立資料庫引擎和基礎類別
Base = declarative_base()
engine = create_engine('sqlite:///modernreader.db')


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


if __name__ == "__main__":
    main()