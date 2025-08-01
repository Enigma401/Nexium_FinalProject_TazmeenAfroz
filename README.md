# Resume Tailor - AI-Powered Resume Builder

> 🚀 Create ATS-friendly resumes tailored to job descriptions using advanced AI technology.

## ✨ Features

- **🤖 AI-Powered Resume Generation**: Uses Google Gemini, OpenRouter, and Mistral AI
- **📄 ATS-Friendly Output**: Optimized for Applicant Tracking Systems
- **🎨 Beautiful Dark Theme**: Professional dark green/black aesthetic
- **🔐 Secure Authentication**: Supabase authentication with Google OAuth
- **💾 Resume Storage**: MongoDB integration for resume management
- **📱 Responsive Design**: Works on desktop and mobile

## 🛠️ Tech Stack

- **Next.js 15.4.5** with TypeScript
- **Supabase** for authentication
- **MongoDB** for data storage
- **Multiple AI APIs** with fallback logic
- **Tailwind CSS** for styling
- **Shadcn/ui** components

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd resume-tailor
npm install
```

### 2. Environment Variables
```bash
cp .env.example .env.local
```

Fill in your API keys in `.env.local`:
- Supabase project URL and keys
- MongoDB connection string
- At least one AI API key (Gemini recommended)

### 3. Run Development Server
```bash
npm run dev
```

## 📦 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - And others from `.env.example`

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── create/         # Resume creation
│   └── dashboard/      # User dashboard
├── components/         # UI components
├── lib/               # Utilities
└── types/             # TypeScript types
```

## 🎯 Usage

1. **Sign Up**: Create account or sign in with Google
2. **Create**: Paste resume text and job description
3. **AI Process**: AI extracts and optimizes content
4. **Download**: Get ATS-friendly PDF resume
5. **Save**: Store versions in dashboard

## 🔧 API Keys Setup

### Required
- **Supabase**: Authentication and user management
- **MongoDB**: Resume storage
- **AI API**: At least one (Gemini recommended for free tier)

### Optional
- **OpenRouter**: Access to multiple AI models
- **Mistral AI**: Alternative AI processing
- **Hugging Face**: Additional AI capabilities

## 📞 Support

For issues or questions:
- Open a GitHub issue
- Check the deployment guide
- Review environment variables setup

---

**Built with ❤️ and AI**
