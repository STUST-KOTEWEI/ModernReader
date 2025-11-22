# localhost.run 永久固定域名設定指南

你已經生成了 SSH key！現在需要註冊並上傳 key。

## 步驟 1：註冊 localhost.run 免費帳號

訪問：https://admin.localhost.run/register

填寫：
- Email
- 密碼

註冊後會收到驗證郵件。

## 步驟 2：上傳 SSH Public Key

1. 登入後到：https://admin.localhost.run/keys

2. 點擊 "Add SSH Key"

3. 複製你的公鑰（已經在 MODERNREADEER.pub）：
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC4QssF3kessjCEexvdvXV4m9kthv+oY+mB3fwr7MuzSIg8qDohXkjwPilOqmzzAJUIkMrTw8D89DXAhpaMwLhs6YhguCSQ/lqHgRQnDRZIG/k2k0+hPM1vOA22aod2QjTghd5M9GQ39h3v6H4WK4WWbojNxsRHM2a9hCOObUKgzxcLh82a4tHKAjhr/HHC9pbYKCw0Yy1Q4QMvRkEmM3fyxRhIyUh+gwpjxj+WM3C+OKgF6N8wi4lk0iyrYo1Mps1dLaSUOq3Hao56rDVIsAL0jeFnhLV2z+9KRuqazaGDokBRwIii5o95l+hsPtWVnYRj2i+vOYmhOBU3JUGDd6MJGdGpdvoUjO0xnN/P6ytVn25S5WwktrbfabHf/mAL9m3zb3ggxfI3dDClbg5IHA5L9i768kZlZ6zUDTFjoQx8gvHQvoKNV0iG6cPq+nFrVgVhIUCPgC9k+V/d36Lm2v2UBjy+QmWTacmW58fv46NZ8LgljT6gyrT+khyRSh97fb0= kedewei@MacBook-Air.local
```

4. 給這個 key 一個名稱（例如：MacBook Air）

5. 儲存

## 步驟 3：獲得你的永久域名

註冊並上傳 key 後，你會得到一個**基於你帳號的固定子域名**，例如：
- `kedewei.lhr.life`
- `modernreader-dev.lhr.life`

這個域名會**永久固定**，不管你重啟多少次 tunnel！

## 步驟 4：啟動認證後的 tunnel

```bash
# 使用你的私鑰連接（應該會自動識別 ~/.ssh/id_rsa）
ssh -R 80:localhost:5173 localhost.run
```

如果 SSH key 在其他位置：
```bash
ssh -i ~/MODERNREADEER -R 80:localhost:5173 localhost.run
```

完成後告訴我，我會幫你更新所有配置！

---

## 替代方案：如果不想註冊

如果你不想註冊帳號，我們可以：

### 方案 1：使用當前的臨時域名
- 目前: https://583df2c6c6bdd9.lhr.life
- 缺點：每次重啟會變
- 優點：立即可用

### 方案 2：改用 ngrok 付費版（$8/月）
- 固定域名
- 更穩定
- 需付費

### 方案 3：Cloudflare Named Tunnel（免費但需登入）
- 永久免費
- 固定域名
- 需要 Cloudflare 帳號

你想：
A) 註冊 localhost.run（推薦，完全免費且快速）
B) 用當前臨時域名繼續（但每次重啟要改）
C) 改用其他方案

?
