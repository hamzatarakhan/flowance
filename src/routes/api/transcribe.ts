import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
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

          const formData = await request.formData();

          const openaiRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
          });

          const data = await openaiRes.json();
          if (!openaiRes.ok) {
            return Response.json(
              { error: data?.error?.message || "OpenAI error" },
              { status: openaiRes.status }
            );
          }

          return Response.json({ text: data.text || "" });
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
