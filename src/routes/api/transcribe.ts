import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env["LOVABLE_API_KEY"];
          if (!apiKey) {
            return Response.json(
              { error: "AI key not configured" },
              { status: 500 }
            );
          }

          const incoming = await request.formData();
          const file = incoming.get("file");
          if (!file || typeof file === "string") {
            return Response.json({ error: "لم يتم إرسال ملف صوتي" }, { status: 400 });
          }
          if (file.size < 1024) {
            return Response.json(
              { error: "التسجيل فارغ أو قصير جداً، حاول مرة أخرى" },
              { status: 400 }
            );
          }

          const mime = (file.type || "").split(";")[0];
          const ext =
            ({
              "audio/webm": "webm",
              "audio/mp4": "mp4",
              "audio/mpeg": "mp3",
              "audio/wav": "wav",
              "audio/ogg": "ogg",
            } as Record<string, string>)[mime] ?? "webm";

          const upstream = new FormData();
          upstream.append("model", "openai/gpt-4o-mini-transcribe");
          upstream.append("file", file, `recording.${ext}`);
          const lang = incoming.get("language");
          if (typeof lang === "string" && /^[a-z]{2}$/.test(lang)) {
            upstream.append("language", lang);
          }

          const res = await fetch(
            "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
            {
              method: "POST",
              headers: { Authorization: `Bearer ${apiKey}` },
              body: upstream,
            }
          );

          if (!res.ok) {
            const detail = await res.text().catch(() => "");
            return Response.json(
              { error: `فشل تحويل الصوت (${res.status}) ${detail.slice(0, 300)}` },
              { status: res.status }
            );
          }

          const data = (await res.json()) as { text?: string };
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
