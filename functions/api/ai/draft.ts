// Cloudflare Pages Function: AI Review Draft Generator
// Runs server-side. Keeps API secrets secure. Grounded in customer facts.

interface Env {
  AI_API_KEY?: string;
  AI_PROVIDER?: string;
  AI_MODEL?: string;
}

interface DraftRequestBody {
  businessName: string;
  category: string;
  experienceTags: string[];
  customerNotes?: string;
  tone?: 'warm' | 'enthusiastic' | 'professional' | 'brief';
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    const body: DraftRequestBody = await request.json();
    const { businessName, category, experienceTags, customerNotes, tone = 'warm' } = body;

    if (!businessName) {
      return new Response(JSON.stringify({ error: 'businessName is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = env.AI_API_KEY;
    const provider = env.AI_PROVIDER || 'template';

    // If an API key is available and provider is set to gemini
    if (apiKey && provider === 'gemini') {
      try {
        const prompt = `You are a helpful assistant helping a customer draft an authentic Google Review for "${businessName}" (${category || 'Local Business'}).
STRICT GROUNDING RULES:
1. ONLY use facts and impressions explicitly provided by the customer.
2. DO NOT invent dishes, services, claims, or events not mentioned.
3. Tone: ${tone}.
4. Indian hospitality context: Natural, courteous, polite, and genuine.

Customer selected highlights: ${experienceTags.length > 0 ? experienceTags.join(', ') : 'Positive visit'}
Customer notes: ${customerNotes || 'None provided'}

Provide 3 distinct review drafts (one short & punchy, one balanced, one detailed).
Format as JSON array of 3 strings: ["draft1", "draft2", "draft3"]. Output valid JSON only without markdown code blocks.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData: any = await geminiRes.json();
          const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            try {
              const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              if (Array.isArray(parsed) && parsed.length > 0) {
                return new Response(JSON.stringify({ drafts: parsed, source: 'ai' }), {
                  headers: { 'Content-Type': 'application/json' },
                });
              }
            } catch (e) {
              // Fallback to template if JSON parsing failed
            }
          }
        }
      } catch (aiErr) {
        console.error('AI Provider call failed, falling back to deterministic templates:', aiErr);
      }
    }

    // Deterministic High-Quality Fallback (Zero cost, no API key needed, strictly grounded)
    const templates = generateGroundedTemplates(businessName, category, experienceTags, customerNotes, tone);

    return new Response(JSON.stringify({ drafts: templates, source: 'template' }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function generateGroundedTemplates(
  businessName: string,
  category: string,
  tags: string[],
  notes?: string,
  tone: string = 'warm'
): string[] {
  const highlights = tags.length > 0 ? tags.join(' and ') : 'pleasant experience';
  const cleanNotes = notes ? notes.trim() : '';
  const noteSuffix = cleanNotes ? ` In particular, ${cleanNotes}.` : '';

  if (tone === 'brief') {
    return [
      `Had a great visit at ${businessName}. Really appreciated the ${highlights.toLowerCase()}!${noteSuffix}`,
      `Great experience at ${businessName} today. Loved the ${highlights.toLowerCase()}.${noteSuffix} Recommended!`,
      `Very good visit to ${businessName}. Standout aspects were the ${highlights.toLowerCase()}.${noteSuffix}`,
    ];
  }

  if (tone === 'enthusiastic') {
    return [
      `Had a wonderful visit to ${businessName}! The ${highlights.toLowerCase()} really stood out.${noteSuffix} Truly impressed by the hospitality and standard!`,
      `Absolutely loved our time at ${businessName}! Wonderful ${highlights.toLowerCase()} made our visit truly memorable.${noteSuffix} Will certainly be coming back!`,
      `Top-notch experience at ${businessName}! The ${highlights.toLowerCase()} exceeded our expectations.${noteSuffix} Kudos to the team!`,
    ];
  }

  if (tone === 'professional') {
    return [
      `Visiting ${businessName} was a very positive experience. I was particularly impressed with the ${highlights.toLowerCase()}.${noteSuffix} The establishment maintains commendable standards.`,
      `Commendable service and experience at ${businessName}. Appreciated the ${highlights.toLowerCase()}.${noteSuffix} Consistently professional standard.`,
      `Had an enjoyable visit to ${businessName}. The ${highlights.toLowerCase()} were handled with high quality and care.${noteSuffix}`,
    ];
  }

  // Default 'warm'
  return [
    `Had a truly pleasant visit to ${businessName}. The ${highlights.toLowerCase()} made our time there very enjoyable.${noteSuffix} Thank you to the team!`,
    `Really appreciated our experience at ${businessName}! The ${highlights.toLowerCase()} was lovely.${noteSuffix} Definitely a place worth visiting.`,
    `Such a nice time at ${businessName}. We were delighted with the ${highlights.toLowerCase()}.${noteSuffix} Looking forward to our next visit!`,
  ];
}
