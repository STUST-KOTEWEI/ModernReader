# ModernReader - Environment Setup

## Required Environment Variables

Create a `.env.local` file in the `web/` directory:

```bash
# OpenAI API Key (required for LLM features)
OPENAI_API_KEY=sk-your-api-key-here

# NextAuth Secret (required for authentication)
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth (optional, for real Google login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## How to Get API Keys

### OpenAI API Key
1. Visit https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key and paste it into `.env.local`

### NextAuth Secret
Generate a random secret:
```bash
openssl rand -base64 32
```

### Google OAuth (Optional)
1. Visit https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` as redirect URI

## Testing Without API Keys

The app will work in "mock mode" without API keys:
- **Story Gen**: Returns a pre-written story
- **AI Chat**: Returns a fixed response
- **Google Login**: Simulated (no real OAuth)

To enable real LLM features, add your `OPENAI_API_KEY`.
