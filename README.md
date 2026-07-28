# Eduvision Partnerships Engine

[![Built with Gemini 3 AI](https://img.shields.io/badge/AI-Gemini%203%20Models-8E44AD.svg)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38BDF8.svg)](https://tailwindcss.com/)
[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel%20Ready-000000.svg)](https://vercel.com/)

**Eduvision Partnerships Engine** is an enterprise-grade AI proposal drafting, diplomatic email outreach, and AI inbox thread manager built for **Eduvision Ghana** (`eduvisiongh.org`). Designed for high-stakes institutional engagements with ministries, international donors, NGOs, educational boards, and private partners, the platform leverages Google's **Gemini 3 model suite** (`gemini-3.1-pro-preview`, `gemini-3.5-flash`, and `gemini-3.1-flash-lite`) to generate authoritative, policy-compliant, and contextually grounded documentation.

---

## 🌟 Key Features

### 🏛️ Executive Proposal Drafter
- **Full Blank Letterhead Template Uploader:** Upload your complete pre-designed blank letterhead paper/sheet template file (PNG, JPG, SVG, WebP). The platform overlays proposal text onto your designed paper template with adjustable top, bottom, and side text padding, automatically duplicating the background across multi-page proposals.
- **Institutional Context Integration:** Upload `.docx` or `.txt` background documents or paste RFP mandates to automatically align proposal objectives with official frameworks.
- **Multimodal Document & Photo Scan Analysis (`gemini-3.1-pro-preview`):** Upload photo scans, physical document photos, or RFP paperwork. The multimodal vision model extracts key requirements, tables, and directives directly into your drafting context.
- **High Thinking Mode (`ThinkingLevel.HIGH`):** Enables deep step-by-step reasoning for intricate partnership frameworks, multi-million dollar grants, and governmental MOUs.
- **Google Search Grounding:** Integrates live web search to reference up-to-date policy directives, partner initiatives, and sector developments directly in proposals with verified source citations.

### ✉️ Diplomatic Outreach & Email Manager
- **Contextual Communication Protocols:** Supports initial outreach, proposal follow-ups, grant applications, MOU negotiations, and formal meeting requests.
- **Dynamic Response Engine:** Accepts incoming partner communications or feedback and generates formal, high-diplomacy responses referencing prior proposal terms.
- **Fast Micro-Tasks Bar (`gemini-3.1-flash-lite`):** Execute instantaneous actions including 3-bullet executive summaries, buzzword inspections, ultra-concise email polishes, and subject line generation.

### 📥 AI Inbox & Batch Gmail Thread Manager
- **Interactive Multi-Thread Processing:** Search, filter, and multi-select incoming partner email threads by subject line or read/unread status.
- **Batch AI Draft Generation:** Generate tailored executive AI responses across multiple selected threads simultaneously.
- **Direct Gmail Sync:** Posts generated drafts directly into your official connected Gmail account's 'Drafts' folder using authorized Google OAuth (`gmail.compose`).
- **Read / Unread Status Controls:** Filter threads by read/unread status and toggle unread indicators seamlessly.

### 🔐 Google OAuth 2.0 Auth Portal
- **Dedicated Sign-In & Auth Page:** Production-ready Google OAuth 2.0 authorization screen requesting `gmail.readonly` and `gmail.compose` scopes.
- **Executive Identity Status:** Tracks authenticated executive user profiles (`samuel.adjei@eduvisiongh.org`), granted scopes, and active session tokens.

---

## 🧠 Gemini 3 Architecture & Model Assignment

The system uses dedicated model tiers optimized for specific tasks:

| Model | Role / Capability | Feature Integration |
| :--- | :--- | :--- |
| **`gemini-3.1-pro-preview`** | High-Reasoning Executive Proposals & Vision | Deep proposal drafting with `ThinkingLevel.HIGH`, document scan OCR & photo analysis |
| **`gemini-3.5-flash`** | Grounded Generation & Real-Time Intelligence | Search-grounded proposal & email drafting with verified Google Search citations |
| **`gemini-3.1-flash-lite`** | Fast Micro-Tasks | Low-latency 3-bullet summaries, buzzword checks, and subject line generation |

All Gemini API calls are securely proxied through the server-side Express layer using `@google/genai` to safeguard API keys.

---

## 🛠️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, `motion/react`
- **Backend:** Node.js, Express (ESM / CJS bundled via `esbuild`, Vercel serverless function entrypoint)
- **AI SDK:** `@google/genai` (Official Google Gen AI TypeScript SDK)
- **Document Processing:** `docx` (Word export), `mammoth` (Word `.docx` reader)
- **Authentication:** Google OAuth 2.0 (`gmail.readonly`, `gmail.compose`)
- **Deployment:** Vercel (via `vercel.json` rewrites and `/api` serverless handler)

---

## 🚀 Vercel Production Deployment Guide

This repository is optimized for one-click deployment on **Vercel**.

### Step 1: Push Repository to GitHub
Ensure your code is committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Production ready release with Google OAuth and Vercel support"
git push origin main
```

### Step 2: Import Project in Vercel
1. Go to [Vercel Dashboard](https://vercel.com/new).
2. Click **Import Repository** and select `eduvision-partnerships-engine`.
3. Framework Preset: **Vite** (auto-detected).
4. Build Command: `npm run build`
5. Output Directory: `dist`

### Step 3: Configure Environment Variables in Vercel
In the Vercel deployment screen under **Environment Variables**, add:

| Variable Name | Description | Example / Location |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Required.** Google Gemini API Key | [Google AI Studio Keys](https://aistudio.google.com/app/apikey) |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Google Cloud Console Credentials |
| `NODE_ENV` | Environment mode | `production` |

### Step 4: Configure Google Cloud OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Gmail API**.
3. Create OAuth 2.0 Client Credentials (Web Application).
4. Add Authorized JavaScript Origins:
   - `https://your-project.vercel.app`
5. Add Authorized Redirect URIs:
   - `https://your-project.vercel.app/oauth/callback`
   - `http://localhost:3000/oauth/callback`
6. Copy the **Client ID** to `VITE_GOOGLE_CLIENT_ID` in Vercel environment settings.

---

## 💻 Local Development

1. **Clone & Install:**
   ```bash
   git clone https://github.com/eduvisiongh/eduvision-partnerships-engine.git
   cd eduvision-partnerships-engine
   npm install
   ```

2. **Setup Local Environment:**
   Copy `.env.example` to `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```

3. **Start Dev Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Test Production Build Locally:**
   ```bash
   npm run build
   npm start
   ```

---

## 📄 License & Institutional Attribution

Developed for **Eduvision Ghana** (`samuel.adjei@eduvisiongh.org`). All rights reserved.
