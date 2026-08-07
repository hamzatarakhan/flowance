import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env["LOVABLE_API_KEY"];
          if (!apiKey) {
            return Response.json({ error: "AI key not configured" }, { status: 500 });
          }

          const { messages } = (await request.json()) as { messages: unknown[] };

          const res = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-3.6-flash",
                messages,
              }),
            }
          );

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            const msg =
              res.status === 429
                ? "تم تجاوز حد الطلبات، حاول بعد قليل"
                : res.status === 402
                  ? "انتهى رصيد الذكاء الاصطناعي"
                  : `خطأ بالتحليل (${res.status}) ${detail.slice(0, 300)}`;
            return Response.json({ error: msg }, { status: res.status });
          }

          const data = (await res.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          return Response.json({
            text: data.choices?.[0]?.message?.content || "",
          });
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
