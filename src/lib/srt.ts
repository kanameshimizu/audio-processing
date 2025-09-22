export type WhisperSegment = {
  id?: number;
  start: number; // 秒
  end: number;   // 秒
  text: string;
};

export function toSrtTime(sec: number): string {
  const h = Math.floor(sec / 3600).toString().padStart(2, "0");
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, "0");
  return `${h}:${m}:${s},${ms}`;
}

export function segmentsToSrt(segments: WhisperSegment[]): string {
  return segments
    .map((seg, i) => {
      const idx = (i + 1).toString();
      const period = `${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}`;
      const text = (seg.text || "").trim();
      return `${idx}\n${period}\n${text}\n`;
    })
    .join("\n");
}