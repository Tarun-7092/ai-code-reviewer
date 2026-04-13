import Groq from "groq-sdk";
import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";

const groq = new Groq({ apiKey: config.groqApiKey });

const SYSTEM_PROMPT = `
You are an expert code reviewer with deep knowledge of security, performance,
clean code principles, and language-specific best practices.

Always respond with valid JSON only — no markdown, no explanation outside the JSON object.

Required response schema:
{
  "summary": "2-3 sentence overall assessment",
  "scores": {
    "readability": <0-10>,
    "performance": <0-10>,
    "security": <0-10>,
    "maintainability": <0-10>,
    "bestPractices": <0-10>
  },
  "issues": [
    {
      "line": <number|null>,
      "severity": "critical"|"warning"|"suggestion",
      "category": "security"|"performance"|"readability"|"maintainability"|"best-practice"|"bug"|"style",
      "title": "Short issue title",
      "description": "Detailed explanation",
      "suggestion": "Concrete fix",
      "codeContext": "Problematic snippet (optional)"
    }
  ],
  "positives": ["Things done well"],
  "refactoredSnippet": "Key refactored section (optional, null if not needed)"
}

Severity:   critical=security holes/crashes | warning=bugs/perf | suggestion=style/readability
Score guide: 9-10 excellent | 7-8 good | 5-6 average | 3-4 poor | 0-2 critical issues
Scoring calibration:
- Start from 10
- Deduct:
  - critical: -2 to -3 (max 2 full impact)
  - warning: -0.5 to -1 (reduced impact after 2 issues)
  - suggestion: -0.1 to -0.3
- Use diminishing penalties for multiple issues in same category
- Do not penalize the same root cause multiple times
- Scores should rarely go below 3 unless code is severely broken
- Readable and structured code should keep readability above 6
`.trim();

const buildUserPrompt = (fileName, language, code) => `
Review the following ${language} code from: \`${fileName}\`

\`\`\`${language}
${code}
\`\`\`

Focus on: security vulnerabilities, performance, readability, maintainability, and ${language} best practices.
Return only valid JSON.
`.trim();

/**
 * Send code to Groq and receive a structured review.
 * @param {string} fileName
 * @param {string} language
 * @param {string} code
 * @returns {Promise<{ data: object, tokensUsed: number, model: string }>}
 */
export const getAIReview = async (fileName, language, code) => {
  const model = config.groqModel;

  try {
    logger.debug(`🤖 Sending ${fileName} to Groq (${model})...`);

    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(fileName, language, code) },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const tokensUsed = completion.usage?.total_tokens || 0;

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error("Groq returned malformed JSON.");
    }

    logger.debug(`✅ Review complete. Tokens used: ${tokensUsed}`);
    return { data, tokensUsed, model };
  } catch (err) {
    if (err.status === 429) throw new Error("Groq rate limit reached. Please try again shortly.");
    if (err.status === 401) throw new Error("Invalid Groq API key.");
    throw new Error(`AI service error: ${err.message}`);
  }
};

/**
 * Verify Groq connectivity.
 */
export const pingAI = async () => {
  const res = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: 'Reply in JSON format: {"status":"ok"}' }],
    max_tokens: 20,
    response_format: { type: "json_object" },
  });
  return JSON.parse(res.choices[0].message.content);
};
