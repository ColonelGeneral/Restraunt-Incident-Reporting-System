import { env } from '../config/env.js';

type GeminiAnalysis = {
  summary: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
};

const severityKeywords: Array<{ keywords: string[]; severity: GeminiAnalysis['severity'] }> = [
  { keywords: ['fire', 'injury', 'collapse', 'critical', 'spill'], severity: 'Critical' },
  { keywords: ['broken', 'down', 'severe', 'unsafe', 'contamination'], severity: 'High' },
  { keywords: ['delay', 'missing', 'slow', 'late', 'shortage'], severity: 'Medium' }
];

function inferFallbackAnalysis(description: string): GeminiAnalysis {
  const normalizedDescription = description.toLowerCase();
  const match = severityKeywords.find(({ keywords }) => keywords.some((keyword) => normalizedDescription.includes(keyword)));

  return {
    summary: `Manager summary: ${description.trim().slice(0, 180)}`,
    category: normalizedDescription.includes('delivery')
      ? 'Delivery Delay'
      : normalizedDescription.includes('inventory')
        ? 'Inventory'
        : normalizedDescription.includes('kitchen')
          ? 'Kitchen Equipment'
          : 'Other',
    severity: match?.severity ?? 'Low'
  };
}

export async function analyzeIncidentDescription(description: string): Promise<GeminiAnalysis> {
  if (!env.GEMINI_API_KEY) {
    return inferFallbackAnalysis(description);
  }

  const prompt = [
    'Analyze the following restaurant incident description and return JSON only.',
    'Fields: summary, category, severity.',
    'Allowed categories: POS Issue, Delivery Delay, Inventory, Kitchen Equipment, Customer Complaint, Staff Related, Other.',
    'Allowed severities: Low, Medium, High, Critical.',
    `Description: ${description}`
  ].join('\n');

  const response = await fetch(
    `${env.GEMINI_API_URL}/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    return inferFallbackAnalysis(description);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const rawText = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

  try {
    const parsed = JSON.parse(rawText) as GeminiAnalysis;
    return {
      summary: parsed.summary ?? inferFallbackAnalysis(description).summary,
      category: parsed.category ?? 'Other',
      severity: parsed.severity ?? 'Low'
    };
  } catch {
    return inferFallbackAnalysis(description);
  }
}