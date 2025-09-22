import type { APIRoute } from "astro";
import OpenAI from "openai";

const client = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || (() => {
    throw new Error('OPENAI_API_KEY environment variable is required');
  })()
});

export const prerender = false; // API はサーバー実行

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const text = form.get("text")?.toString();
    const voice = (form.get("voice") || "alloy").toString() as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
    const model = (form.get("model") || "tts-1").toString() as "tts-1" | "tts-1-hd";
    const format = (form.get("format") || "mp3").toString() as "mp3" | "opus" | "aac" | "flac";

    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // テキストの長さチェック（OpenAI APIの制限は4096文字）
    if (text.length > 4096) {
      return new Response(JSON.stringify({ error: "テキストは4096文字以下にしてください" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const response = await client.audio.speech.create({
      model,
      voice,
      input: text,
      response_format: format,
    });

    // 音声データをArrayBufferとして取得
    const audioBuffer = await response.arrayBuffer();
    
    // Content-Typeを設定
    const contentType = {
      mp3: "audio/mpeg",
      opus: "audio/opus", 
      aac: "audio/aac",
      flac: "audio/flac"
    }[format];

    return new Response(audioBuffer, {
      headers: { 
        "content-type": contentType,
        "content-disposition": `attachment; filename="speech.${format}"`
      },
    });

  } catch (err: any) {
    console.error("TTS API Error:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "internal error" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
};
