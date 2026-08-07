import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const openaiKey = process.env["OPENAI_API_KEY"];
          const lovableKey = process.env["LOVABLE_API_KEY"];
          if (!openaiKey && !lovableKey) {
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

          const mime = (file.type || "").split(";")[0] ?? "";
          const ext =
            ({
              "audio/webm": "webm",
              "audio/mp4": "mp4",
              "audio/mpeg": "mp3",
              "audio/wav": "wav",
              "audio/ogg": "ogg",
            } as Record<string, string>)[mime] ?? "webm";

          const lang = incoming.get("language");
          const rawPrompt = incoming.get("prompt");
          const prompt =
            typeof rawPrompt === "string" && rawPrompt.trim()
              ? rawPrompt.trim()
              : "تسجيل صوتي باللهجة العربية عن المصاريف والفواتير والمبالغ بالدينار أو الريال أو الدولار. اكتب النص بالعربية الفصحى فقط.";
          const providers = [
            ...(openaiKey ? [{
              url: "https://api.openai.com/v1/audio/transcriptions",
              key: openaiKey,
              model: "gpt-4o-transcribe",
              headers: { Authorization: `Bearer ${openaiKey}` },
            }] : []),
            ...(lovableKey ? [{
              url: "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
              key: lovableKey,
              model: "openai/gpt-4o-transcribe",
              headers: { "Lovable-API-Key": lovableKey },
            }] : []),
            ...(lovableKey ? [{
              url: "https://ai.gateway.lovable.dev/v1/audio/transcriptions",
              key: lovableKey,
              model: "openai/gpt-4o-mini-transcribe",
              headers: { "Lovable-API-Key": lovableKey },
            }] : []),
          ];

          let lastStatus = 500;
          let lastDetail = "";
          for (const provider of providers) {
            const upstream = new FormData();
            upstream.append("model", provider.model);
            upstream.append("file", file, `recording.${ext}`);
            upstream.append("language", typeof lang === "string" && /^[a-z]{2}$/.test(lang) ? lang : "ar");
            upstream.append("prompt", prompt);
            const res = await fetch(provider.url, {
              method: "POST",
              headers: provider.headers,
              body: upstream,
            });
            if (res.ok) {
              const data = (await res.json()) as { text?: string };
              return Response.json({ text: data.text || "" });
            }
            lastStatus = res.status;
            lastDetail = await res.text().catch(() => "");
            if (res.status !== 400 && res.status !== 401 && res.status !== 403) break;
          }
          return Response.json(
            { error: `فشل تحويل الصوت (${lastStatus}) ${lastDetail.slice(0, 300)}` },
            { status: lastStatus }
          );
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
