"""
合併書籍目錄 - 將公開圖書館資料與現有目錄整合
"""

import json
from pathlib import Path
from datetime import datetime


def load_json(filepath: str):
    """讀取 JSON 檔案"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(data, filepath: str):
    """儲存 JSON 檔案"""
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def merge_catalogs():
    """合併所有書籍目錄"""
    base_dir = Path('/Users/kedewei/modernreader/data/catalogs')

    # 讀取現有目錄
    existing_books = []
    if (base_dir / 'sample_books.json').exists():
        existing_data = load_json(str(base_dir / 'sample_books.json'))
        # 處理不同格式
        if isinstance(existing_data, list):
            existing_books = existing_data
        elif isinstance(existing_data, dict):
            existing_books = existing_data.get('items', [])
        print(f"✓ 讀取現有目錄: {len(existing_books)} 本書")

    # 讀取公開圖書館資料
    public_books = []
    if (base_dir / 'public_library_books.json').exists():
        public_data = load_json(str(base_dir / 'public_library_books.json'))
        public_books = public_data.get('books', [])
        print(f"✓ 讀取公開圖書館資料: {len(public_books)} 本書")

    # 合併（避免重複）
    all_books = existing_books.copy()
    existing_ids = {book.get('id') for book in existing_books if 'id' in book}

    # 為舊書籍添加 ID（如果缺少）
    for i, book in enumerate(all_books):
        if 'id' not in book:
            book['id'] = f"indigenous_{i+1:03d}"
            existing_ids.add(book['id'])

    for book in public_books:
        if book.get('id') not in existing_ids:
            all_books.append(book)

    print(f"✓ 合併後總計: {len(all_books)} 本書")

    # 儲存合併結果
    merged_data = {
        'metadata': {
            'generated_at': datetime.now().isoformat(),
            'total_items': len(all_books),
            'description': '合併原住民語書籍與公開圖書館館藏',
            'sources': [
                '國立公共資訊圖書館 (NLPI)',
                '南台科技大學圖書館 (STUST)',
                '台北市立圖書館 (TPML)',
                '高雄市立圖書館 (KSML)',
                'Indigenous Language Collection'
            ]
        },
        'items': all_books
    }

    # 備份原始檔案
    if (base_dir / 'sample_books.json').exists():
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = base_dir / f'sample_books.backup.{timestamp}.json'
        original = load_json(str(base_dir / 'sample_books.json'))
        save_json(original, str(backup_file))
        print(f"✓ 備份原始檔案: {backup_file.name}")

    # 儲存合併結果
    save_json(merged_data, str(base_dir / 'sample_books.json'))
    print(f"✓ 已更新: {base_dir / 'sample_books.json'}")

    # 統計資訊
    print("\n" + "="*60)
    print("📊 目錄統計")
    print("="*60)

    # 按來源統計
    sources = {}
    for book in all_books:
        metadata = book.get('metadata', {})
        source = metadata.get('source', book.get('source', 'Unknown'))
        sources[source] = sources.get(source, 0) + 1

    print("\n來源分佈:")
    for source, count in sorted(sources.items(), key=lambda x: -x[1]):
        print(f"  • {source}: {count} 本")

    # 按主題統計
    topics = {}
    for book in all_books:
        for topic in book.get('topics', []):
            topics[topic] = topics.get(topic, 0) + 1

    print("\n熱門主題 (前10):")
    for topic, count in sorted(topics.items(), key=lambda x: -x[1])[:10]:
        print(f"  • {topic}: {count} 本")

    # 按語言統計
    languages = {}
    for book in all_books:
        lang = book.get('language', 'unknown')
        languages[lang] = languages.get(lang, 0) + 1

    print("\n語言分佈:")
    lang_names = {
        'zh': '中文',
        'en': '英文',
        'ja': '日文',
        'amis': '阿美語',
        'atayal': '泰雅語',
        'paiwan': '排灣語',
        'rukai': '魯凱語',
        'seediq': '賽德克語',
        'tao': '達悟語',
        'unknown': '未知'
    }
    for lang, count in sorted(languages.items(), key=lambda x: -x[1]):
        lang_name = lang_names.get(lang, lang)
        print(f"  • {lang_name}: {count} 本")

    print("="*60)


if __name__ == '__main__':
    merge_catalogs()
