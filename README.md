# Eduvision Partnerships Engine

[![Built with Gemini 3 AI](https://img.shields.io/badge/AI-Gemini%203%20Models-8E44AD.svg)](https://deepmind.google/technologies/gemini/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0-61DAFB.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38BDF8.svg)](https://tailwindcss.com/)

**Eduvision Partnerships Engine** is an enterprise-grade AI proposal drafting and diplomatic email outreach suite built for **Eduvision Ghana**. Designed for high-stakes institutional engagements with ministries, international donors, NGOs, educational boards, and private partners, the platform leverages Google's **Gemini 3 model suite** (`gemini-3.1-pro-preview`, `gemini-3.5-flash`, and `gemini-3.1-flash-lite`) to generate authoritative, policy-compliant, and contextually grounded documentation.

---

## 🌟 Key Features

### 🏛️ Executive Proposal Drafter
- **Full Blank Letterhead Template Uploader:** Upload your complete pre-designed blank letterhead paper/sheet template file (PNG, JPG, SVG, WebP). The platform overlays proposal text onto your designed paper template with adjustable top, bottom, and side text padding, automatically duplicating the blank letterhead template background across every single page sheet for multi-page proposals.
- **Institutional Context Integration:** Upload `.docx` or `.txt` background documents or paste RFP mandates to automatically align proposal objectives with official frameworks.
- **Official Letterhead Engine:** Generates proposals on official letterheads with custom blank templates or default headers, contact info, and executive signatories.
- **Multimodal Document & Photo Scan Analysis (`gemini-3.1-pro-preview`):** Upload photo scans, physical document photos, or RFP paperwork. The multimodal vision model extracts key requirements, tables, and directives directly into your drafting context.
- **High Thinking Mode (`ThinkingLevel.HIGH`):** Enables deep step-by-step reasoning for intricate partnership frameworks, multi-million dollar grants, and governmental MOUs.
- **Google Search Grounding:** Integrates live web search to reference up-to-date policy directives, partner initiatives, and sector developments directly in proposals with verified source citations.

### ✉️ Diplomatic Outreach & Email Manager
- **Contextual Communication Protocols:** Supports initial outreach, proposal follow-ups, grant applications, MOU negotiations, and formal meeting requests.
- **Dynamic Response Engine:** Accepts incoming partner communications or feedback and generates formal, high-diplomacy responses referencing prior proposal terms.
- **Fast Micro-Tasks Bar (`gemini-3.1-flash-lite`):** Execute instantaneous actions including 3-bullet executive summaries, buzzword inspections, ultra-concise email polishes, and subject line generation.

### 🛡️ Strategic Policy & Quality Controls
- **Banned Word Filter:** Automatically scans drafts for non-executive or overused buzzwords (e.g., *synergy, game-changer, revolutionary, seamless, leverage, paradigm shift, holistic, empower*) to uphold executive tone.
- **Word `.docx` Export:** One-click download of fully styled Word documents with official Eduvision Ghana letterhead formatting.
- **PDF Verification Overlay & Print View:** Clean browser print view and overlay verification to review letterheads before sending.
- **History & Preset Manager:** Save drafts locally, re-load prior engagements, or select pre-configured partnership templates (e.g., Ministry Digital Literacy, TVET Expansion, EdTech Infrastructure).

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

## 🏗️ Tech Stack

- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, `motion/react`
- **Backend:** Node.js, Express (ESM / CJS bundled via `esbuild`)
- **AI SDK:** `@google/genai` (Official Google Gen AI TypeScript SDK)
- **Document Processing:** `docx` (Word export), `mammoth` (Word `.docx` reader)
- **Error Protection:** Full React `<ErrorBoundary>` and standardized API error formatting

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A valid **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/eduvisiongh/eduvision-partnerships-engine.git
   cd eduvision-partnerships-engine
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root based on `.env.example`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

---

## 📖 Usage Guide

### 1. Drafting an Executive Proposal
1. Navigate to the **Proposal Drafter** tab.
2. *(Optional)* Click **Upload Custom Letterhead** to upload your institutional header banner image/logo and set custom organization details, reference prefixes, or signature seals.
3. Select your desired **Gemini Model** (`gemini-3.1-pro-preview` or `gemini-3.5-flash`).
4. Toggle **High Thinking Mode** for complex institutional proposals or **Google Search Grounding** for live web citations.
5. Enter the **Target Organization** (e.g., *Ministry of Education, Ghana*) and **Core Objective**.
6. *(Optional)* Upload background context files (`.docx` / `.txt`) or scan images using the **Photo Scan Analyzer**.
7. Click **Generate Executive Proposal**.
8. Use the **Fast Micro-Tasks** bar for 3-bullet summaries, inspect banned words, or click **Download Word (.docx)** to export your custom branded letterhead document.

### 2. Managing Diplomatic Email Outreach
1. Navigate to the **Diplomatic Outreach** tab.
2. Choose your **Outreach Type** (e.g., *Initial Partnership Outreach*, *MOU Negotiation*).
3. Provide the core objective or paste incoming partner feedback to auto-draft a response.
4. Click **Generate Diplomatic Email**.
5. Use **Ultra-Concise Polish** or **3 Subject Line Options** to quickly customize before copying or exporting.

---

## 📄 License & Attribution

Developed for **Eduvision Ghana** (`samuel.adjei@eduvisiongh.org`). All rights reserved.
