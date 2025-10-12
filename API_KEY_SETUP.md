# API Key Setup Guide

## OpenAI API Key Configuration

### 1. Get Your OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the generated API key (starts with `sk-`)

### 2. Environment Variables Setup

Create a `.env` file in your project root with the following content:

```bash
# OpenAI Configuration
REACT_APP_OPENAI_API_KEY=sk-your_actual_api_key_here

# Optional Configuration
REACT_APP_OPENAI_BASE_URL=https://api.openai.com/v1
REACT_APP_OPENAI_TIMEOUT=30000
REACT_APP_OPENAI_RETRIES=3
```

### 3. Security Best Practices

✅ **DO:**
- Use environment variables for API keys
- Add `.env` to your `.gitignore` file
- Use different API keys for development and production
- Rotate API keys regularly
- Set up API key usage limits in OpenAI dashboard

❌ **DON'T:**
- Hardcode API keys in your source code
- Commit API keys to version control
- Share API keys publicly
- Use the same API key across multiple projects

### 4. Using the Configuration

The application automatically loads the API key from environment variables. You can access it in your code:

```typescript
import { getOpenAIConfig } from './utils/config';

const openaiConfig = getOpenAIConfig();
// Use in your components
```

### 5. Validation

The application includes configuration validation. If the API key is missing, you'll see an error message.

### 6. Development vs Production

- **Development**: Use `.env.local` for local development
- **Production**: Set environment variables in your hosting platform (Vercel, Netlify, etc.)

### 7. Troubleshooting

If you're having issues:

1. Check that your `.env` file is in the project root
2. Verify the API key starts with `sk-`
3. Restart your development server after adding the `.env` file
4. Check the browser console for configuration errors 