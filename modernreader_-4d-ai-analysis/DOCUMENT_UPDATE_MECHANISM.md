# ModernReader 文件定期更新機制

版本: v1.0  
最後更新: 2025-10-21  
維護者: ModernReader 專案團隊

---

## 📋 概述

本文件說明如何定期更新專案文件以保持同步，確保所有文件準確反映專案最新狀態。

### 文件生態系統

```text
                    ┌─────────────────────────┐
                    │  ANNUAL_PARTNERSHIP     │
                    │  _PLAN.md (對外)        │
                    │  - 合作計畫書           │
                    │  - KPI 與願景           │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
      ┌─────────▼────────┐  ┌───▼──────┐  ┌─────▼──────────┐
      │  CALENDAR.md     │  │  .ics    │  │  週報範本       │
      │  (內部規劃)      │  │  (工具)  │  │  (執行記錄)     │
      │  - 詳細時程      │  │          │  │                 │
      │  - 當前進度      │  │          │  │                 │
      └─────────┬────────┘  └────────┬─┘  └─────┬──────────┘
                │                    │            │
                │    ┌───────────────┴────────────┘
                │    │
        ┌───────▼────▼───────────┐
        │  MILESTONE_CHECKLIST   │
        │  (品質控管)            │
        │  - 檢查清單            │
        │  - 交付標準            │
        └────────────────────────┘
```

### 更新原則

- ✅ **由下往上更新**: 週報 → 行事曆 → 合作計畫書
- ✅ **定期同步**: 每週/每月/每學期固定時間更新
- ✅ **版本控制**: 使用 Git 追蹤所有變更
- ✅ **變更記錄**: 重要更新記錄在 CHANGELOG 或版本記錄

---

## 🔄 更新頻率與項目

### 每週更新（週一站會後）

**時機**: 每週一站會結束後 (10:00-11:00)

#### 1. 填寫週報（15 分鐘）

**文件**: `weekly-reports/YYYY-WXX.md`

```markdown
# 週報 - 2025 年第 X 週

## 📊 本週完成事項
- [x] ✅ 任務1: 完成 Widget 對接
  - 程式碼連結: PR #123

## 🎯 下週計畫
- [ ] 任務1: 開始 SDK 文件撰寫

## ⚠️ 遇到的問題
- 問題1: TypeScript 型別定義不完整
  - 當前狀態: 已解決

## 📈 KPI 追蹤
- 測試用戶數: 75 人 (目標: 50-100)
```

**檢查清單**:

- [ ] 本週完成事項已記錄
- [ ] 下週計畫已制定
- [ ] 遇到的問題已記錄
- [ ] KPI 數據已更新
- [ ] 檔案已儲存到 `weekly-reports/YYYY/`

#### 2. 更新行事曆當前位置（5 分鐘）

**文件**: `CALENDAR.md`

**操作**:

1. 找到上週的當前位置標記 `🔵`
2. 將上週標記改為一般格式
3. 在本週位置添加 `🔵` 標記

```markdown
<!-- 舊位置: 移除藍色標記 -->
| 第3週 | 10/13-10/19 | 合作夥伴對接 | 成果1 |

<!-- 新位置: 添加藍色標記 -->
| 🔵 第4週 | **10/20-10/26** | **與合作夥伴 widget 對接** | Partner Widget 範例 |
```

**檢查清單**:

- [ ] 上週標記已移除
- [ ] 本週標記已添加
- [ ] 本週任務已確認
- [ ] 變更已儲存

#### 3. 檢查下週任務（5 分鐘）

**文件**: `CALENDAR.md`

**操作**:

1. 查看下週計畫任務
2. 確認任務優先級 (P0-P3)
3. 如需調整，更新 CALENDAR.md

```markdown
| 第5週 | 10/27-11/02 | **SDK v1 初版開發** | SDK Alpha |
```

**檢查清單**:

- [ ] 下週任務清楚
- [ ] 優先級合理
- [ ] 可行性確認
- [ ] 需要協調的事項已記錄

---

### 每月更新（每月 1 日月度檢討後）

**時機**: 每月 1 日月度檢討會議後 (14:00-16:00)

#### 1. 彙整本月週報（30 分鐘）

**操作**:

1. 收集本月所有週報
2. 統計 KPI 達成狀況
3. 整理主要成果與問題
4. 準備月度總結

```markdown
# 2025-10 月度總結

## 📊 KPI 達成狀況
- 測試用戶數: 75 / 50-100 (達標 ✅)
- 功能完成度: 3 / 5 (進行中 ⏳)

## 🎉 主要成果
1. 完成 Widget 對接 (PR #123, #125)
2. 開始 NCKU MI2S 實驗室合作

## ⚠️ 主要問題
1. TypeScript 型別定義挑戰 → 已解決
2. 效能優化需求 → 下月處理

## 📈 趨勢分析
- 使用者成長穩定 (↑)
- 開發速度符合預期 (→)
```

**檢查清單**:

- [ ] 本月所有週報已檢視
- [ ] KPI 統計完成
- [ ] 主要成果已整理
- [ ] 問題與解決方案已記錄

#### 2. 更新 CALENDAR.md 完成狀態（20 分鐘）

**文件**: `CALENDAR.md`

**操作**:

1. 標記已完成的里程碑 (✅)
2. 調整未來計畫（如需要）
3. 更新重要日期（如有變動）

```markdown
<!-- 更新完成狀態 -->
| 第1週 | 9/1-9/7 | ✅ 新學期報到、團隊分工 | 已完成 |
| 第2週 | 9/8-9/14 | ✅ 需求討論、環境設定 | 已完成 |

<!-- 調整未來計畫（如需要）-->
| 第6週 | 11/3-11/9 | SDK v1 開發（調整為2週） | SDK Alpha |
| 第7週 | 11/10-11/16 | **加入 NCKU MI2S** | 實驗室入會 |
```

**檢查清單**:

- [ ] 已完成里程碑已標記 ✅
- [ ] 未來計畫已檢視
- [ ] 必要調整已進行
- [ ] 重要日期準確

#### 3. 更新 .ics 日曆檔案（15 分鐘）

**文件**: `ModernReader_Calendar.ics`

**操作**（如有日期變動）:

1. 開啟 .ics 文件
2. 更新變動事件的日期
3. 測試匯入到 Google Calendar

```ics
BEGIN:VEVENT
UID:modernreader-2025-11-10@modernreader.ai
DTSTART;TZID=Asia/Taipei:20251110T090000
SUMMARY:🎯 加入 NCKU MI2S 實驗室
END:VEVENT
```

**檢查清單**:

- [ ] 變動事件已更新
- [ ] DTSTART/DTEND 日期正確
- [ ] 測試匯入成功
- [ ] 舊版本已備份

#### 4. 局部更新 ANNUAL_PARTNERSHIP_PLAN.md（15 分鐘）

**文件**: `ANNUAL_PARTNERSHIP_PLAN.md`

**操作**:

1. 更新「當前進度」段落（如有）
2. 更新 KPI 達成狀況
3. 更新版本記錄

```markdown
## 當前進度 (2025-10)

- ✅ 合作夥伴 Widget 對接完成
- ⏳ SDK v1 開發進行中
- ⏳ NCKU MI2S 實驗室準備中

## 2. 年度願景與 KPI

### 2025 下學期目標（大一下）
- 測試用戶：累積 75 位（目標 50-100，達標 ✅）
```

**檢查清單**:

- [ ] 當前進度段落已更新
- [ ] KPI 數據最新
- [ ] 版本記錄已添加
- [ ] 變更已 commit

---

### 每學期更新（期初/期末）

#### 期初更新（開學第 1 週）

**時機**: 開學第 1 週，期初會議後

##### 1. 更新學期 KPI（30 分鐘）

**文件**: `ANNUAL_PARTNERSHIP_PLAN.md`

**操作**:

```markdown
## 2. 年度願景與 KPI

### 2025 下學期目標（大一下）← 更新學期
- 測試用戶：累積 50-100 位早期測試者
- 穿戴整合：完成 Apple Watch 基礎整合
- 功能開發：完成 5 個核心功能模組

### 2025 上學期成果（大一上）← 新增上學期總結
- ✅ 測試用戶：75 位（超標達成）
- ✅ 合作夥伴：2 個 Widget 對接完成
- ⏳ 穿戴整合：Apple Watch SDK 研究中
```

**檢查清單**:

- [ ] 新學期 KPI 已設定
- [ ] 上學期成果已總結
- [ ] 目標具體可衡量
- [ ] 已與指導教授確認

##### 2. 更新 CALENDAR.md 學期計畫（1 小時）

**文件**: `CALENDAR.md`

**操作**:

1. Archive 上學期內容（可選）
2. 確認新學期每週任務
3. 標記重要里程碑
4. 調整時程（如需要）

```markdown
### 2025 下學期（2月-6月）← 新學期區塊

#### 📆 2月（開學準備）

| 週次 | 日期範圍 | 核心任務 | 交付成果 |
|------|----------|----------|----------|
| 🔵 第1週 | **2/17-2/23** | **期初會議** | 學期計畫確認 |
| 第2週 | 2/24-3/2 | SDK v1 繼續開發 | SDK Beta |
```

**檢查清單**:

- [ ] 上學期內容已整理
- [ ] 新學期任務已規劃
- [ ] 重要里程碑已標記
- [ ] 時程合理可行

##### 3. 更新 .ics 日曆（30 分鐘）

**文件**: `ModernReader_Calendar.ics`

**操作**:

1. 添加新學期重要事件
2. 更新週期性會議（如有變動）
3. 重新匯入到 Google Calendar

```ics
<!-- 新增期初會議 -->
BEGIN:VEVENT
UID:modernreader-2026-02-17@modernreader.ai
DTSTART;TZID=Asia/Taipei:20260217T100000
SUMMARY:📅 2025下學期期初會議
END:VEVENT
```

**檢查清單**:

- [ ] 新學期事件已添加
- [ ] 週期會議已檢查
- [ ] 匯入測試成功

##### 4. 準備新學期範本（15 分鐘）

**文件**: `weekly-reports/YYYY/`

**操作**:

1. 建立新學期資料夾
2. 準備第一週週報範本
3. 檢視 MILESTONE_CHECKLIST.md

```bash
mkdir -p weekly-reports/2026/
cp WEEKLY_REPORT_TEMPLATE.md weekly-reports/2026/2026-W01.md
```

**檢查清單**:

- [ ] 新學期資料夾已建立
- [ ] 範本已準備
- [ ] 檢查清單已檢視

#### 期末更新（期末考前 2 週）

**時機**: 期末考前 2 週，期末報告準備期

##### 1. 撰寫學期成果總結（2 小時）

**文件**: `semester-reports/YYYY-SX-summary.md`

**內容**:

```markdown
# 2025 上學期成果總結

## 📊 KPI 達成狀況
- 測試用戶數: 75 / 50-100 (達標 150% ✅)
- 完成功能: 3 / 5 (進行中 60% ⏳)
- 合作夥伴: 2 / 1 (超標 200% ✅)

## 🎉 主要成果
1. **技術成果**
   - 完成基礎閱讀器功能
   - 完成 2 個 Widget 對接
   - Apple Watch SDK 研究

2. **合作成果**
   - 加入 NCKU MI2S 實驗室
   - 建立 2 個合作夥伴關係

3. **學習成果**
   - 掌握 React + TypeScript
   - 學習 WebSocket 實時通訊
   - 了解 WebXR 基礎

## ⚠️ 主要挑戰
1. **技術挑戰**
   - TypeScript 型別系統學習曲線陡峭
   - WebSocket 連線穩定性問題

2. **時間管理**
   - 課業與專題平衡困難
   - 預估時間常常不準

## 📈 經驗總結
- ✅ 做得好: 定期週報、積極溝通
- ⚠️ 需改進: 時間預估、技術研究深度

## 🎯 下學期目標
- 完成 SDK v1 GA
- 穿戴裝置整合
- 使用者成長至 200-500 人
```

**檢查清單**:

- [ ] KPI 達成狀況已統計
- [ ] 主要成果已整理
- [ ] 挑戰與解決方案已記錄
- [ ] 經驗總結已撰寫
- [ ] 下學期目標已規劃

##### 2. 更新 ANNUAL_PARTNERSHIP_PLAN.md（1 小時）

**文件**: `ANNUAL_PARTNERSHIP_PLAN.md`

**操作**:

1. 更新當前進度
2. 更新 KPI 達成狀況
3. 添加學期成果
4. 更新版本記錄

```markdown
## 2. 年度願景與 KPI

### 2025 上學期成果（大一上）
- ✅ 測試用戶：75 位（目標 50-100，達標 150%）
- ✅ 合作夥伴：2 個（目標 1 個，超標 200%）
- ⏳ 穿戴整合：研究階段（預計下學期完成）

### 2025 下學期目標（大一下）← 確認/調整
- 測試用戶：累積 100-200 位
- 完成 SDK v1 GA
- Apple Watch 基礎整合上線

---

## 12. 附錄：版本記錄

### v1.2 (2026-01-15) - 期末更新
- 新增 2025 上學期成果總結
- 更新 2025 下學期 KPI 目標
- 調整合作夥伴拓展計畫
```

**檢查清單**:

- [ ] 學期成果已添加
- [ ] 下學期目標已確認
- [ ] 版本記錄已更新
- [ ] 變更已 commit 並 push

##### 3. 整理本學期週報（30 分鐘）

**操作**:

1. 確認所有週報完整
2. 彙整 KPI 趨勢
3. 準備期末報告素材

```bash
# 列出本學期所有週報
ls weekly-reports/2025/2025-W*.md

# 統計 KPI 數據
grep "測試用戶數" weekly-reports/2025/*.md
```

**檢查清單**:

- [ ] 所有週報已檢視
- [ ] KPI 趨勢已分析
- [ ] 素材已準備
- [ ] 檔案已備份

##### 4. 準備期末報告（依 MILESTONE_CHECKLIST.md）

**文件**: `MILESTONE_CHECKLIST.md` - 期中期末檢查清單

**操作**:

- [ ] 檢視「期中期末檢查清單」
- [ ] 準備簡報（-P14D 開始）
- [ ] 準備 Demo（-P7D 完成）
- [ ] 完成所有檢查項目

---

### 年度更新（學年結束）

**時機**: 大約每年 6 月（學年結束）

#### 1. 撰寫年度總結報告（4 小時）

**文件**: `annual-reports/YYYY-summary.md`

**內容**:

```markdown
# 2025 年度總結報告（大一）

## 📊 年度 KPI 總覽
| 指標 | 目標 | 達成 | 達成率 |
|------|------|------|--------|
| 測試用戶數 | 50-100 | 150 | 150% ✅ |
| 功能完成度 | 5 | 6 | 120% ✅ |
| 合作夥伴 | 1-2 | 3 | 150% ✅ |

## 🎉 年度十大成果
1. 完成基礎閱讀器平台
2. 加入 NCKU MI2S 實驗室
3. 建立 3 個合作夥伴關係
...

## 📈 技術成長
- React + TypeScript 進階
- WebSocket 實時通訊
- WebXR 入門
- 穿戴裝置整合基礎

## 💡 專案管理經驗
- 定期週報有效追蹤進度
- 里程碑檢查清單提升品質
- 合作夥伴溝通技巧

## 🎯 下學年目標
- 使用者成長至 500+ 人
- 完成 WebXR Beta
- 發布 SDK v2.0
```

**檢查清單**:

- [ ] KPI 總覽已統計
- [ ] 年度成果已整理
- [ ] 技術成長已總結
- [ ] 經驗已記錄
- [ ] 下學年目標已規劃

#### 2. 大版本更新 ANNUAL_PARTNERSHIP_PLAN.md（2 小時）

**文件**: `ANNUAL_PARTNERSHIP_PLAN.md`

**操作**:

1. 新增年度成果章節
2. 更新未來展望
3. 調整合作方案（如需要）
4. 大版本號更新（v1.x → v2.0）

```markdown
## 附錄 A：2025 年度成果回顧（大一）

### 技術成果
- ✅ 基礎閱讀器平台（React + TypeScript）
- ✅ Widget 整合機制（3 個合作夥伴）
- ⏳ 穿戴裝置整合（研究階段）

### 合作成果
- ✅ NCKU MI2S 實驗室合作
- ✅ 3 個合作夥伴 Widget 對接

### 使用者成果
- ✅ 150 位測試用戶（超標 150%）
- ✅ 每週活躍用戶 80+ 人

---

## 12. 附錄：版本記錄

### v2.0 (2026-06-30) - 大一年度總結版
- 新增 2025 年度成果回顧（附錄 A）
- 更新 2026 學年目標與 KPI
- 調整合作方案定價（基於實際經驗）
- 更新技術架構圖（反映實際實作）
```

**檢查清單**:

- [ ] 年度成果已添加
- [ ] 未來展望已更新
- [ ] 合作方案已調整
- [ ] 版本號已升級（v2.0）
- [ ] 變更已 commit 並 push

#### 3. 歸檔本學年文件（1 小時）

**操作**:

```bash
# 建立年度歸檔資料夾
mkdir -p archives/2025/

# 移動/複製週報
cp -r weekly-reports/2025/ archives/2025/weekly-reports/

# 歸檔學期報告
cp semester-reports/2025-*.md archives/2025/

# 歸檔年度總結
cp annual-reports/2025-summary.md archives/2025/

# 建立歸檔索引
cat > archives/2025/README.md << EOF
# 2025 年度歸檔

## 📁 內容
- weekly-reports/: 全年 32 週週報
- 2025-S1-summary.md: 上學期總結
- 2025-S2-summary.md: 下學期總結
- 2025-summary.md: 年度總結

## 📊 年度 KPI
- 測試用戶: 150 人 (達標 150%)
- 功能完成: 6 個 (達標 120%)
- 合作夥伴: 3 個 (達標 150%)
EOF
```

**檢查清單**:

- [ ] 歸檔資料夾已建立
- [ ] 週報已歸檔
- [ ] 學期報告已歸檔
- [ ] 年度總結已歸檔
- [ ] 索引文件已建立
- [ ] 歸檔已 push 到 Git

---

## 🛠️ 更新工具與腳本

### 自動化腳本（建議）

#### 1. 週報範本生成腳本

**檔案**: `scripts/create-weekly-report.sh`

```bash
#!/bin/bash
# 自動生成本週週報範本

YEAR=$(date +%Y)
WEEK=$(date +%V)
REPORT_DIR="weekly-reports/$YEAR"
REPORT_FILE="$REPORT_DIR/$YEAR-W$WEEK.md"

# 建立資料夾
mkdir -p "$REPORT_DIR"

# 複製範本
if [ ! -f "$REPORT_FILE" ]; then
  cp WEEKLY_REPORT_TEMPLATE.md "$REPORT_FILE"
  # 替換日期
  START_DATE=$(date -d "monday this week" +%Y-%m-%d)
  END_DATE=$(date -d "sunday this week" +%Y-%m-%d)
  sed -i "s/YYYY-MM-DD ~ YYYY-MM-DD/$START_DATE ~ $END_DATE/g" "$REPORT_FILE"
  echo "✅ 週報範本已建立: $REPORT_FILE"
else
  echo "⚠️  週報已存在: $REPORT_FILE"
fi
```

**使用方式**:

```bash
chmod +x scripts/create-weekly-report.sh
./scripts/create-weekly-report.sh
```

#### 2. CALENDAR.md 當前位置更新腳本

**檔案**: `scripts/update-calendar-position.sh`

```bash
#!/bin/bash
# 自動更新 CALENDAR.md 當前位置標記

CALENDAR_FILE="CALENDAR.md"
CURRENT_WEEK=$(date +%V)

# 移除舊標記
sed -i 's/🔵 第/第/g' "$CALENDAR_FILE"
sed -i 's/\*\*\(第[0-9]*週\)\*\*/\1/g' "$CALENDAR_FILE"

# 添加新標記（簡化版，實際需要更複雜的邏輯）
# TODO: 實作週次對應邏輯

echo "✅ CALENDAR.md 當前位置已更新"
```

#### 3. KPI 統計腳本

**檔案**: `scripts/stats-kpi.sh`

```bash
#!/bin/bash
# 統計本月 KPI 數據

YEAR=$(date +%Y)
MONTH=$(date +%m)
REPORT_DIR="weekly-reports/$YEAR"

echo "📊 $YEAR-$MONTH KPI 統計"
echo "========================"

# 統計測試用戶數
echo "測試用戶數趨勢:"
grep -h "測試用戶數" "$REPORT_DIR"/*-W*.md | tail -n 4

# 統計完成功能
echo ""
echo "功能完成度:"
grep -h "完成功能模組" "$REPORT_DIR"/*-W*.md | tail -n 4

echo ""
echo "✅ 統計完成"
```

---

## ✅ 更新檢查清單

### 每週檢查（週一）

- [ ] 填寫上週週報
- [ ] 更新 CALENDAR.md 當前位置
- [ ] 檢視下週任務
- [ ] 執行 `scripts/create-weekly-report.sh`

### 每月檢查（1 日）

- [ ] 彙整本月週報
- [ ] 更新 CALENDAR.md 完成狀態
- [ ] 更新 .ics 日曆（如有變動）
- [ ] 局部更新 ANNUAL_PARTNERSHIP_PLAN.md
- [ ] 執行 `scripts/stats-kpi.sh`

### 每學期檢查

**期初（第 1 週）:**

- [ ] 更新學期 KPI
- [ ] 更新 CALENDAR.md 學期計畫
- [ ] 更新 .ics 日曆
- [ ] 準備新學期範本

**期末（考前 2 週）:**

- [ ] 撰寫學期成果總結
- [ ] 更新 ANNUAL_PARTNERSHIP_PLAN.md
- [ ] 整理本學期週報
- [ ] 準備期末報告

### 每年檢查（6 月）

- [ ] 撰寫年度總結報告
- [ ] 大版本更新 ANNUAL_PARTNERSHIP_PLAN.md
- [ ] 歸檔本學年文件
- [ ] 準備下學年規劃

---

## 📋 快速參考

### 文件更新頻率總覽

| 文件 | 更新頻率 | 負責人 | 預估時間 |
|------|----------|--------|----------|
| 週報 | 每週一 | 本人 | 15 分鐘 |
| CALENDAR.md | 每週一 + 每月 1 日 | 本人 | 5-20 分鐘 |
| .ics 日曆 | 每月 1 日（如需要） | 本人 | 15 分鐘 |
| ANNUAL_PARTNERSHIP_PLAN.md | 每月 1 日 + 期末 | 本人 | 15-60 分鐘 |
| MILESTONE_CHECKLIST.md | 里程碑前 2 週 | 本人 | 依檢查清單 |
| 學期總結 | 期末 | 本人 | 2 小時 |
| 年度總結 | 6 月 | 本人 | 4 小時 |

### Git Commit 訊息範例

```bash
# 週報
git commit -m "docs: add weekly report 2025-W04"

# 行事曆
git commit -m "docs: update calendar current position to W04"

# 月度更新
git commit -m "docs: monthly update (2025-10) - KPI & progress"

# 學期總結
git commit -m "docs: add semester summary 2025-S1"

# 年度總結
git commit -m "docs: add annual summary 2025 & update to v2.0"
```

---

## 🔗 相關文件

- [ANNUAL_PARTNERSHIP_PLAN.md](./ANNUAL_PARTNERSHIP_PLAN.md) - 合作計畫書
- [CALENDAR.md](./CALENDAR.md) - 完整行事曆
- [WEEKLY_REPORT_TEMPLATE.md](./WEEKLY_REPORT_TEMPLATE.md) - 週報範本
- [MILESTONE_CHECKLIST.md](./MILESTONE_CHECKLIST.md) - 里程碑檢查清單
- [ModernReader_Calendar.ics](./ModernReader_Calendar.ics) - iCalendar 格式行事曆

---

## 📝 版本記錄

- **v1.0** (2025-10-21)
  - 初始版本
  - 定義每週/每月/每學期/每年更新機制
  - 提供更新檢查清單
  - 建議自動化腳本

---

**維護者**: ModernReader 專案團隊  
**最後更新**: 2025-10-21  
**下次檢視**: 每月 1 日月度檢討時

---

## 💡 更新原則總結

1. **由下往上**: 週報 → 行事曆 → 合作計畫書
2. **定期固定**: 每週一、每月 1 日、期初/期末、年度
3. **版本控制**: 所有變更都 commit 到 Git
4. **保持同步**: 確保所有文件反映最新狀態
5. **經驗累積**: 定期總結經驗與教訓

**記住**: 定期更新不是負擔，而是確保專案成功的關鍵！✨
