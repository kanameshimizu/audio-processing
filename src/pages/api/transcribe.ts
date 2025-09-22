import type { APIRoute } from "astro";
import OpenAI from "openai";

// 環境変数をデバッグ
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || (() => {
    throw new Error('OPENAI_API_KEY environment variable is required');
  })()
});

export const prerender = false; // API はサーバー実行

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const mode = (form.get("mode") || "transcribe").toString();
    const timestamps = (form.get("timestamps") || "both").toString();

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: "file is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const granularities: ("word" | "segment")[] = [];
    if (timestamps === "word" || timestamps === "both") granularities.push("word");
    if (timestamps === "segment" || timestamps === "both") granularities.push("segment");

    if (mode === "translate_en") {
      const res = await client.audio.translations.create({
        model: "whisper-1",
        file,
        ...(granularities.length
          ? { response_format: "verbose_json", timestamp_granularities: granularities }
          : {}),
      } as any);

      return new Response(JSON.stringify(res), {
        headers: { "content-type": "application/json" },
      });
    }

    const res = await client.audio.transcriptions.create({
      model: "whisper-1",
      file,
      ...(granularities.length
        ? { response_format: "verbose_json", timestamp_granularities: granularities }
        : {}),
    } as any);

    return new Response(JSON.stringify(res), {
      headers: { "content-type": "application/json" },
    });
  } catch (err: any) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "internal error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};