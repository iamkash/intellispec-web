# OpenAI API Key Setup for AI Chatbot

## Quick Setup

### 1. Get Your OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/account/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

### 2. Set Environment Variable

#### Option A: Create .env file (Recommended)
Create a `.env` file in your project root:

```bash
# .env
REACT_APP_OPENAI_API_KEY=sk-your-actual-api-key-here
```

#### Option B: Set in your shell
```bash
# Windows (PowerShell)
$env:REACT_APP_OPENAI_API_KEY="sk-your-actual-api-key-here"

# Windows (Command Prompt)
set REACT_APP_OPENAI_API_KEY=sk-your-actual-api-key-here

# Mac/Linux
export REACT_APP_OPENAI_API_KEY="sk-your-actual-api-key-here"
```

### 3. Restart Your Development Server
```bash
npm start
# or
yarn start
```

## Verification

1. Open your browser's developer console (F12)
2. Navigate to the API 510 inspection form
3. Click the AI assistant button (robot icon)
4. Type a message and press Enter
5. You should see successful API calls instead of 401 errors

## Troubleshooting

### Error: "Incorrect API key provided"
- Make sure the API key starts with `sk-`
- Verify the environment variable is set correctly
- Restart your development server after setting the variable

### Error: "OpenAI API key is not configured"
- Check that you've created the `.env` file in the project root
- Ensure the variable name is exactly `REACT_APP_OPENAI_API_KEY`
- Make sure you've restarted the development server

### Error: "Rate limit exceeded"
- Your API key has usage limits
- Check your OpenAI account usage at https://platform.openai.com/usage

## Security Notes

- Never commit your API key to version control
- The `.env` file should be in your `.gitignore`
- API keys are only used in the browser for this application
- Consider using environment-specific keys for production

## API Usage

The AI chatbot uses these OpenAI services:
- **GPT-4o-mini**: For text analysis and form assistance
- **Whisper**: For voice transcription
- **GPT-4 Vision**: For image analysis

Estimated cost: ~$0.01-0.10 per inspection session 