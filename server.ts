import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "25mb" }));

// Initialize Gemini Client safely
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in environment variables.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Strict Banned Words Check List
const BANNED_WORDS = [
  "delve",
  "tapestry",
  "testament",
  "beacon",
  "game-changer",
  "fostering synergy",
  "paradigm shift",
  "in today's rapidly changing world",
  "holistic framework",
  "reach out to check in",
  "synergy",
];

// Helper to sanitize / validate model choice according to task guidelines:
// - gemini-3.1-pro-preview for complex tasks & high thinking & image understanding
// - gemini-3.5-flash for general tasks & search grounding
// - gemini-3.1-flash-lite for fast tasks
function resolveModel(userChoice?: string, taskType: 'complex' | 'general' | 'fast' = 'general'): string {
  if (userChoice === 'gemini-3.1-pro-preview' || userChoice?.includes('pro')) {
    return 'gemini-3.1-pro-preview';
  }
  if (userChoice === 'gemini-3.1-flash-lite' || userChoice?.includes('lite')) {
    return 'gemini-3.1-flash-lite';
  }
  if (userChoice === 'gemini-3.5-flash' || userChoice?.includes('flash')) {
    return 'gemini-3.5-flash';
  }

  // Fallback defaults by task type
  if (taskType === 'complex') return 'gemini-3.1-pro-preview';
  if (taskType === 'fast') return 'gemini-3.1-flash-lite';
  return 'gemini-3.5-flash';
}

// Helper to parse errors cleanly for client consumption
function formatApiError(error: any): { statusCode: number; message: string } {
  const errMsg = error?.message || String(error);
  
  if (errMsg.includes("GEMINI_API_KEY is missing")) {
    return {
      statusCode: 500,
      message: "Server Configuration Issue: GEMINI_API_KEY environment variable is missing. Please set your Gemini API key in the environment variables.",
    };
  }
  
  if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED") || errMsg.toLowerCase().includes("quota")) {
    return {
      statusCode: 429,
      message: "Gemini API rate limit or quota exceeded. Please wait a few seconds and try again.",
    };
  }

  if (errMsg.includes("400") || errMsg.includes("INVALID_ARGUMENT")) {
    return {
      statusCode: 400,
      message: `Invalid API Request: ${errMsg.length > 200 ? errMsg.slice(0, 200) + "..." : errMsg}`,
    };
  }

  if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE") || errMsg.includes("overloaded")) {
    return {
      statusCode: 503,
      message: "The Gemini AI model service is temporarily overloaded or unavailable. Please try again shortly.",
    };
  }

  return {
    statusCode: 500,
    message: errMsg || "An unexpected error occurred while processing your request.",
  };
}

// Helper to extract Google Search grounding sources
function extractGroundingSources(response: any) {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks || !Array.isArray(chunks)) return [];

  const sources: { title: string; url: string }[] = [];
  const seenUrls = new Set<string>();

  for (const chunk of chunks) {
    if (chunk?.web?.uri && !seenUrls.has(chunk.web.uri)) {
      seenUrls.add(chunk.web.uri);
      sources.push({
        title: chunk.web.title || chunk.web.uri,
        url: chunk.web.uri,
      });
    }
  }

  return sources;
}

// API Route: Generate Proposal
app.post("/api/generate-proposal", async (req, res) => {
  try {
    const {
      targetOrg,
      baseContext,
      customInstructions,
      modelChoice,
      useThinkingMode,
      useSearchGrounding,
      uploadedImage,
    } = req.body;

    if (!targetOrg) {
      return res.status(400).json({ error: "Target organization is required." });
    }

    const ai = getAiClient();

    // Determine model
    let model = resolveModel(modelChoice, useThinkingMode || uploadedImage ? 'complex' : 'general');
    if (useThinkingMode || uploadedImage) {
      model = 'gemini-3.1-pro-preview';
    } else if (useSearchGrounding && model !== 'gemini-3.1-pro-preview') {
      model = 'gemini-3.5-flash';
    }

    const systemPrompt = `
ROLE: Senior Director of Global Partnerships at Eduvision (Eduvision Ghana - eduvisiongh.org). You have 15+ years of experience securing high-stakes institutional, corporate, and diplomatic partnerships across Africa and internationally. You write with diplomatic authority, absolute clarity, and data-backed realism.

PRIMARY TASK: Draft a tailored, data-driven, and highly persuasive partnership proposal for a target organization. The draft must read as if crafted by a seasoned Ghanaian executive—grounded, practical, respectful, and completely free of artificial intelligence tropes or generic corporate buzzwords.

BACKGROUND DATA:
- Target Organization: ${targetOrg}
- Base Context & Uploaded Docs: ${baseContext || "None provided. Rely on Eduvision's core mission of STEM, digital skills, and teacher capacity building in West Africa."}
- User Directives & Key Intent: ${customInstructions || "Establish a strategic multi-year partnership with clear co-funding and milestone deliverables."}

PROPOSAL STRUCTURE REQUIREMENTS:

SECTION 1: EXECUTIVE BRIEF & CONTEXT
- Concise statement of partnership intent and mutual strategic benefit
- Clear, unvarnished framing of the education/development problem being addressed
- High-level overview of the proposed intervention and collaboration model

SECTION 2: DATA-BACKED VALUE PROPOSITION & PROVEN TRACK RECORD
- Concrete metrics, verifiable baseline data, and historical evidence of Eduvision's work (e.g. 15,000+ students trained, 450+ teachers certified, 88% retention)
- Direct alignment between Eduvision’s operational capacity and the target organization’s strategic mandate
- Explicit, quantifiable return on investment (ROI) or institutional impact for the recipient

SECTION 3: SCOPE OF WORK & IMPLEMENTATION FRAMEWORK
- Phased execution timeline with clear key performance indicators (KPIs)
- Clear division of roles and resource allocation (Eduvision vs. Target Partner)
- Monitoring, evaluation, and reporting framework

SECTION 4: RISK MITIGATION & GOVERNANCE
- Candid assessment of potential operational, logistical, or financial risks
- Practical mitigation strategies and long-term sustainability plans

SECTION 5: IMMEDIATE ACTION ITEMS
- Numbered, sequential next steps to move from proposal to agreement
- Proposed timeline for exploratory alignment call and draft MoU review

STYLE & LANGUAGE CONSTRAINTS:
1. Tone: Natural, respectful, diplomatic, direct, and grounded in professional business English (West African & International executive standard).
2. Forbidden AI Vocabulary (STRICTLY BANNED): Do NOT use "delve", "tapestry", "testament", "beacon", "game-changer", "fostering synergy", "in today's rapidly changing world", "holistic framework", "paradigm shift", "synergy".
3. Formatting: Standard Markdown structured for clean printing on official black-and-white Eduvision letterhead. No inline emojis, no colored text highlights, no decorative dividers. Clean line breaks, standard bold headers, and bullet points only.
4. Precision over Fluff: Every claim must be tied to operational feasibility, evidence, or clear logical deduction. No exaggerated marketing speak.
`;

    const userPromptText = `
Generate the official partnership proposal for: ${targetOrg}.
Custom User Directives: ${customInstructions || "No additional directives"}
Context provided: ${baseContext || "Standard Eduvision Ghana partnership context"}
`;

    // Construct Config according to feature guidelines
    const config: any = {
      systemInstruction: systemPrompt,
      temperature: 0.3,
    };

    // Enable High Thinking Mode if requested or using gemini-3.1-pro-preview for complex task
    if (useThinkingMode || model === 'gemini-3.1-pro-preview') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
      // CRITICAL: Do NOT set maxOutputTokens for thinking mode
    }

    // Enable Google Search Grounding if requested
    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    // Prepare contents (multimodal if image uploaded)
    let contents: any;
    if (uploadedImage && uploadedImage.base64) {
      const cleanBase64 = uploadedImage.base64.replace(/^data:image\/\w+;base64,/, "");
      contents = {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: uploadedImage.mimeType || "image/jpeg",
            },
          },
          { text: userPromptText + "\n[Note: An image/photo has been attached above. Extract and integrate relevant visual/document details into the proposal draft.]" },
        ],
      };
    } else {
      contents = userPromptText;
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    const proposalText = response.text || "Failed to generate proposal content.";
    const groundingSources = extractGroundingSources(response);

    res.json({
      proposal: proposalText,
      modelUsed: model,
      thinkingEnabled: !!config.thinkingConfig,
      searchGrounded: !!useSearchGrounding,
      groundingSources,
    });
  } catch (error: any) {
    console.error("Proposal Generation Error:", error);
    const { statusCode, message } = formatApiError(error);
    res.status(statusCode).json({ error: message });
  }
});

// API Route: Generate Diplomatic Email
app.post("/api/generate-email", async (req, res) => {
  try {
    const {
      emailMode,
      threadInput,
      userIntent,
      proposalRef,
      modelChoice,
      useThinkingMode,
      useSearchGrounding,
    } = req.body;

    if (!userIntent) {
      return res.status(400).json({ error: "User intent/objective is required." });
    }

    const ai = getAiClient();

    let model = resolveModel(modelChoice, useThinkingMode ? 'complex' : 'general');
    if (useThinkingMode) {
      model = 'gemini-3.1-pro-preview';
    } else if (useSearchGrounding && model !== 'gemini-3.1-pro-preview') {
      model = 'gemini-3.5-flash';
    }

    const emailSystemPrompt = `
ROLE: You are the Chief Communications & Stakeholder Officer for Eduvision (Eduvision Ghana - eduvisiongh.org). You specialize in executive-level correspondence, cold/warm diplomatic outreach, and subtle thread negotiation with institutional partners, government officials, and corporate sponsors.

PRIMARY TASK: Draft a concise, high-converting outreach email or thread response that drives immediate action while maintaining diplomatic poise.

BACKGROUND DATA:
- Outreach Mode: ${emailMode || "Cold / Warm Outreach"}
- Conversation Context / Thread: ${threadInput || "None (New Cold/Warm Outreach)"}
- User Core Intent / Message: ${userIntent}
- Proposal / Reference Details: ${proposalRef || "General Eduvision Ghana partnership overview"}

EMAIL STRUCTURE REQUIREMENTS:

1. SUBJECT LINE: Direct, professional, non-promotional, and clear (max 7-9 words). Format as: Subject: [Subject Text]
2. SALUTATION: Formal and culturally/professionally appropriate (e.g. Dear Dr. [Name] / Dear Honorable Director).
3. OPENING (1-2 sentences): Direct context hook acknowledging the previous interaction or recipient's current priorities.
4. CORE MESSAGE (2-3 short paragraphs): 
   - State the core proposition clearly without ambiguity.
   - Ground the value in 1 key data point or clear mutual benefit.
   - Address any friction points or recipient feedback candidly and constructively.
5. CALL TO ACTION (1 sentence): Low-friction, precise next step with clear timeline flexibility.
6. SIGN-OFF: Professional signature block template for Eduvision Ghana.

STYLE & LANGUAGE CONSTRAINTS:
1. Conciseness: Maximum 150-220 words. Concise, clear, and focused.
2. Tone: Warm, respectful, direct, and diplomatic.
3. Zero Fluff: STRICTLY BANNED words & phrases: "I hope this email finds you well", "game-changer", "synergy", "delve", "reach out to check in", "tapestry", "paradigm shift". Get straight to the point gracefully.
`;

    const userPromptText = `
Mode: ${emailMode}
User Core Objective: ${userIntent}
Thread Context: ${threadInput || "N/A"}
Proposal Data Reference: ${proposalRef || "N/A"}
`;

    const config: any = {
      systemInstruction: emailSystemPrompt,
      temperature: 0.2,
    };

    if (useThinkingMode || model === 'gemini-3.1-pro-preview') {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    if (useSearchGrounding) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model,
      contents: userPromptText,
      config,
    });

    const emailText = response.text || "Failed to generate email content.";
    const groundingSources = extractGroundingSources(response);

    res.json({
      email: emailText,
      modelUsed: model,
      thinkingEnabled: !!config.thinkingConfig,
      searchGrounded: !!useSearchGrounding,
      groundingSources,
    });
  } catch (error: any) {
    console.error("Email Generation Error:", error);
    const { statusCode, message } = formatApiError(error);
    res.status(statusCode).json({ error: message });
  }
});

// API Route: Image Analysis (Multimodal Document & Photo Understanding with gemini-3.1-pro-preview)
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType, prompt, targetOrg } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Image data (imageBase64) is required." });
    }

    const ai = getAiClient();
    // Must use gemini-3.1-pro-preview for image understanding
    const model = "gemini-3.1-pro-preview";

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const systemPrompt = `
ROLE: Senior Institutional Document Analyst & Visual Intelligence Officer for Eduvision Ghana.
TASK: Analyze the uploaded document, letterhead photo, signed MoU scan, or organizational flyer. Extract critical details, verify formatting, identify key stakeholders, and provide strategic recommendations for inclusion in a formal partnership proposal for ${targetOrg || "the target organization"}.

STRUCTURED ANALYSIS FORMAT:
1. DOCUMENT TYPE & VISUAL VERIFICATION (Letterhead authenticity, document classification, formatting structure)
2. KEY EXTRACTED ENTITIES & MANDATES (Organization name, leadership titles, budget figures, project priorities)
3. STRATEGIC PARTNERSHIP ALIGNMENTS (Where Eduvision Ghana's STEM/capacity building aligns with this document)
4. PROPOSAL INCLUSION RECOMMENDATIONS (3 actionable bullet points to paste directly into proposal context)
`;

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType || "image/jpeg",
            },
          },
          { text: prompt || `Analyze this image in detail for our partnership proposal with ${targetOrg || "the target organization"}.` },
        ],
      },
      config: {
        systemInstruction: systemPrompt,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
      },
    });

    const analysis = response.text || "No analysis generated.";

    res.json({
      analysis,
      modelUsed: model,
    });
  } catch (error: any) {
    console.error("Image Analysis Error:", error);
    const { statusCode, message } = formatApiError(error);
    res.status(statusCode).json({ error: message });
  }
});

// API Route: Fast AI Assistant (gemini-3.1-flash-lite for instant, high-speed micro-tasks)
app.post("/api/fast-assistant", async (req, res) => {
  try {
    const { action, text, targetOrg } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text content is required." });
    }

    const ai = getAiClient();
    // MUST use gemini-3.1-flash-lite for fast tasks
    const model = "gemini-3.1-flash-lite";

    let systemInstruction = "You are a ultra-fast executive communications assistant for Eduvision Ghana.";
    let prompt = text;

    if (action === "summarize") {
      systemInstruction = "Summarize the given proposal or email draft in exactly 3 crisp executive bullet points.";
      prompt = `Provide a 3-bullet executive summary:\n\n${text}`;
    } else if (action === "inspect_buzzwords") {
      systemInstruction = `Inspect text for AI buzzwords: ${BANNED_WORDS.join(", ")}. Identify any occurrences and provide clean executive replacements.`;
      prompt = `Inspect and suggest clean replacements for banned buzzwords:\n\n${text}`;
    } else if (action === "generate_subject_lines") {
      systemInstruction = "Generate 3 punchy, high-open executive subject lines (max 7 words each) for diplomatic outreach.";
      prompt = `Generate 3 subject lines for outreach to ${targetOrg || "partner"}:\n\n${text}`;
    } else if (action === "polish_email") {
      systemInstruction = "Rapidly polish this email draft for maximum diplomatic tone, conciseness (under 180 words), and zero fluff.";
      prompt = `Polish this email draft:\n\n${text}`;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const result = response.text || "Operation completed.";

    res.json({
      result,
      modelUsed: model,
    });
  } catch (error: any) {
    console.error("Fast Assistant Error:", error);
    const { statusCode, message } = formatApiError(error);
    res.status(statusCode).json({ error: message });
  }
});

// Global Express Fallback Error Middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Unhandled Express Error:", err);
  if (res.headersSent) {
    return next(err);
  }
  const { statusCode, message } = formatApiError(err);
  res.status(statusCode).json({ error: message });
});

// Start Server / Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Eduvision Partnerships Engine running on http://localhost:${PORT}`);
  });
}

startServer();

