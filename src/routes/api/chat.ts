import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env["OPENAI_API_KEY"];
          if (!apiKey) {
            return Response.json(
              { error: "OPENAI_API_KEY not configured" },
              { status: 500 }
            );
          }

          const { messages } = await request.json();

          const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              max_tokens: 4096,
              temperature: 0,
              messages,
            }),
          });

          const data = await openaiRes.json();
          if (!openaiRes.ok) {
            return Response.json(
              { error: data?.error?.message || "OpenAI error" },
              { status: openaiRes.status }
            );
          }

          const text = data.choices?.[0]?.message?.content || "";
          return Response.json({ text });
        } catch (error) {
          return Response.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
          );
        }
      },
    },
  },
});
