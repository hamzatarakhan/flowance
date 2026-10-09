import { createFileRoute } from "@tanstack/react-router";

type OAIPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
type OAIMessage = { role: string; content: string | OAIPart[] };

function toGeminiParts(content: string | OAIPart[]) {
  if (typeof content === 'string') return [{ text: content }];
  return content.map(p => {
    if (p.type === 'text') return { text: p.text };
    const [header, data] = p.image_url.url.split(',');
    const mimeType = header.replace('data:', '').replace(';base64', '');
    return { inlineData: { mimeType, data } };
  });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const key = process.env["GOOGLE_API_KEY"];
          if (!key) return Response.json({ error: "AI key not configured" }, { status: 500 });

          const { messages } = (await request.json()) as { messages: OAIMessage[] };
          const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: toGeminiParts(m.content),
          }));

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents, generationConfig: { temperature: 0.1, maxOutputTokens: 2048 } }),
            }
          );

          if (!res.ok) {
            const detail = await res.text().catch(() => '');
            const msg = res.status === 429
              ? 'تم تجاوز حد الطلبات، حاول بعد قليل'
              : `خطأ بالتحليل (${res.status}) ${detail.slice(0, 300)}`;
            return Response.json({ error: msg }, { status: res.status });
          }

          const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          return Response.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || '' });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
        }
      },
    },
  },
});
