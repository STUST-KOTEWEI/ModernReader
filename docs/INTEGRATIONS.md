# ModernReader 外部裝置整合規格

## Apple Watch / HealthKit

目前先定義資料邊界，不讀取或保存原始健康資料。未來 iOS App 應只傳送經使用者同意的匿名化摘要，例如：

```json
{
  "session_id": "reading-session-id",
  "heart_rate_bpm": 76,
  "heart_rate_variability_ms": 42,
  "captured_at": "2026-09-10T15:00:00Z",
  "consent_scope": "reading-adaptation"
}
```

系統只應將資料用於調整朗讀速度、休息提醒與感官強度，不應診斷情緒、心理或醫療狀態。需要 Apple Developer 帳號、Xcode/macOS、iPhone、Apple Watch 與 HealthKit 使用者授權後才能實作。

## 觸覺裝置

建議以 Bluetooth Low Energy GATT 或 Web Bluetooth 做第一個外接協議。裝置應提供 `intensity`（0–1）、`duration_ms`、`pattern` 與 `safety_limit`；所有命令必須有逾時與使用者可關閉的總開關。

```json
{
  "device": "haptic-band",
  "pattern": "gentle-pulse",
  "intensity": 0.25,
  "duration_ms": 600
}
```

## 嗅覺與電子紙

嗅覺裝置和電子紙沒有通用標準，因此 ModernReader 後端目前只保留抽象事件，不直接控制任何未驗證設備。接入前必須取得廠商 SDK、電氣安全資料、最大輸出限制與清潔／耗材規格。

## App 上架阻塞項目

| 項目 | 必要條件 |
|---|---|
| iOS | Apple Developer、Xcode/macOS、App Privacy 標示、HealthKit 審查說明 |
| Android | Google Play Console、簽署金鑰、Data Safety 表單 |
| HealthKit | 實際 Apple 裝置、權限說明、健康資料最小化政策 |
| 硬體 | 實體設備、SDK、測試樣機與安全測試 |
