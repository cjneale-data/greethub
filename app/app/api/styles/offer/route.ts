import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { allow } from "@/lib/intake/rate-limit";
import { styleOfferFor } from "@/lib/safety/style-offer";

const Body = z.object({ text: z.string().max(2000), product: z.enum(["card", "book"]).optional() });

/** Offer a generic style when the customer's text asks for a franchise look. Free: rules only, no model call, nothing logged. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allow(`style-offer:${ip}`, 60, 60_000)) return NextResponse.json({ offer: null }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ offer: null }, { status: 400 });
  return NextResponse.json({ offer: styleOfferFor(parsed.data.text, parsed.data.product) });
}
