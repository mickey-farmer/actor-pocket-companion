export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function openrouterChatCompletion(
  messages: ChatMessageInput[],
  opts?: { temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(
      'OPENROUTER_API_KEY is not set. Add it to your environment variables.'
    );
  }
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-5';

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts?.temperature ?? 0.7,
  };
  if (opts?.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Actor Pocket Companion',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(
      `OpenRouter request failed (${res.status}): ${errText.slice(0, 500)}`
    );
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('OpenRouter returned an unexpected response shape.');
  }
  return content;
}

/**
 * Extracts the first {...} JSON object from a string, tolerating stray
 * prose or markdown code fences around it (models don't always respect
 * response_format perfectly).
 */
export function extractJsonObject(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('Could not find a JSON object in the model response.');
  }
  return JSON.parse(candidate.slice(start, end + 1));
}
