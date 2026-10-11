import { z } from "zod";
import { ArtStyleField } from "@greethub/shared";
import type { BriefForm } from "./types";

const str = (max: number) => z.string().max(max).default("");

export const BriefFormSchema: z.ZodType<BriefForm> = z.object({
  occasion: str(40),
  occasionOther: str(80),
  recipientName: str(60),
  relationship: str(60),
  tone: str(20),
  readingAge: str(10),
  pageCount: z.union([z.literal(24), z.literal(32)]).default(24),
  artStyle: z.union([ArtStyleField, z.literal("")]).default(""),
  storyIdea: str(2000),
  settingDetails: str(800),
  dedication: str(300),
  characters: z
    .array(
      z.object({
        id: z.string().regex(/^c_[a-z0-9]{4,16}$/),
        name: str(60),
        ageBand: str(20),
        role: str(80),
        pronouns: str(30),
        isPet: z.boolean().optional(),
      }),
    )
    .max(6),
}) as unknown as z.ZodType<BriefForm>;

export const StoryEditSchema = z.object({
  title: z.string().max(120).optional(),
  dedication: z.string().max(400).optional(),
  texts: z.record(z.string().regex(/^p\d{1,2}$/), z.string().max(2000)).optional(),
});

export const ProofApproveSchema = z.object({
  title: z.string().max(120),
  dedication: z.string().max(400).default(""),
  digitalCopy: z.boolean().default(false),
  acknowledged: z.boolean(),
});
