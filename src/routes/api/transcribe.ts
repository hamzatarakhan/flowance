import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const key = process.env["GOOGLE_API_KEY"];
          if (!key) return Response.json({ error: "AI key not configured" }, { status: 500 });

          const incoming = await request.formData();
          const file = incoming.get("file");
          if (!file || typeof file === "string") {
            return Response.json({ error: "لم يتم إرسال ملف صوتي" }, { status: 400 });
          }
          if (file.size < 1024) {
            return Response.json({ error: "التسجيل فارغ أو قصير جداً، حاول مرة أخرى" }, { status: 400 });
          }

          const mime = (file.type || "audio/webm").split(";")[0];
          const audioBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");

          const prompt = "استمع إلى هذا التسجيل الصوتي وحوّله إلى نص بالعربية فقط. اكتب كل ما تسمعه بدقة دون أي تعليق إضافي.";

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ role: "user", parts: [{ inlineData: { mimeType: mime, data: audioBase64 } }, { text: prompt }] }],
                generationConfig: { temperature: 0 },
              }),
            }
          );

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            return Response.json(
              { error: `فشل تحويل الصوت (${res.status}) ${detail.slice(0, 300)}` },
              { status: res.status }
            );
          }

          const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
          return Response.json({ text: data.candidates?.[0]?.content?.parts?.[0]?.text || "" });
        } catch (error) {
          return Response.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
        }
      },
    },
  },
});
