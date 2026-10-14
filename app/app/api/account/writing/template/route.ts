import { templateSvg } from "@/lib/writing/glyphs";

/** The printable handwriting sheet. Holds nothing personal, so it is open to anyone. */
export function GET() {
  return new Response(templateSvg(), {
    headers: { "Content-Type": "image/svg+xml", "Content-Disposition": 'inline; filename="greethub-handwriting-sheet.svg"', "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" },
  });
}
