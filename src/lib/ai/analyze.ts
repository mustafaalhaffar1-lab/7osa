import "server-only";
import { estimateValue } from "@/lib/domain/valuation";
import type { ConditionGrade } from "@/lib/domain/enums";

/**
 * Photo -> item draft. One interface, two implementations:
 *
 *  - With ANTHROPIC_API_KEY set, Claude looks at the photo and identifies the product,
 *    writes a description, and proposes a price range.
 *  - Without a key, we fall back to the deterministic estimator (pure + tested) using
 *    whatever the seller typed. The UI is identical either way, so the feature always
 *    works and gets sharper the moment a key is added.
 */

export interface AnalyzeInput {
  /** data: URL or public URL of the seller's photo (optional in fallback mode). */
  imageBase64?: string;
  imageMediaType?: string;
  /** Seller-provided hints (used as-is by the fallback, as context by Claude). */
  title?: string;
  brand?: string;
  category?: string;
  retailPrice?: number;
  conditionGrade?: ConditionGrade;
}

export interface ItemDraft {
  title: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  conditionGrade: ConditionGrade;
  description: string;
  estimateMin: number;
  estimateMax: number;
  confidence: number;
  /** True when a vision model produced this draft. */
  fromVision: boolean;
  notes?: string;
}

const MODEL = "claude-sonnet-4-5";

export function visionEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function fallbackDraft(input: AnalyzeInput): ItemDraft {
  const condition = input.conditionGrade ?? "excellent";
  const v = estimateValue({
    category: input.category,
    conditionGrade: condition,
    brand: input.brand,
    retailPrice: input.retailPrice,
  });
  const name = [input.brand, input.title].filter(Boolean).join(" ").trim() || "Your item";
  return {
    title: input.title ?? "",
    brand: input.brand ?? null,
    model: null,
    category: input.category ?? null,
    conditionGrade: condition,
    description: `${name} in ${condition.replace("_", " ")} condition. Professionally inspected, cleaned, and photographed by Hoosa before listing.`,
    estimateMin: v.estimateMin,
    estimateMax: v.estimateMax,
    confidence: v.confidence,
    fromVision: false,
    notes: v.basis,
  };
}

/** Analyze a photo (or seller hints) into a draft listing. Never throws — falls back. */
export async function analyzeItem(input: AnalyzeInput): Promise<ItemDraft> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || !input.imageBase64) return fallbackDraft(input);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        tools: [
          {
            name: "item_draft",
            description: "Return the identified second-hand item and a resale price range in AED.",
            input_schema: {
              type: "object",
              properties: {
                title: { type: "string", description: "Short product name, no marketing fluff" },
                brand: { type: ["string", "null"] },
                model: { type: ["string", "null"] },
                category: {
                  type: "string",
                  enum: ["Electronics", "Small Appliances", "Home & Kitchen", "Furniture (compact)", "Sports & Outdoor"],
                },
                conditionGrade: { type: "string", enum: ["new", "like_new", "excellent", "good", "fair"] },
                description: { type: "string", description: "2-3 honest sentences a buyer would find useful" },
                estimateMin: { type: "number", description: "Low end of a realistic UAE resale price in AED" },
                estimateMax: { type: "number", description: "High end of a realistic UAE resale price in AED" },
                confidence: { type: "number", description: "0-1 confidence in the identification" },
              },
              required: [
                "title", "category", "conditionGrade", "description",
                "estimateMin", "estimateMax", "confidence",
              ],
            },
          },
        ],
        tool_choice: { type: "tool", name: "item_draft" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: input.imageMediaType || "image/jpeg",
                  data: input.imageBase64,
                },
              },
              {
                type: "text",
                text:
                  "Identify this second-hand item for a UAE managed-resale marketplace. " +
                  "Judge condition from what you can actually see and be conservative. " +
                  "Price it for the Dubai second-hand market in AED." +
                  (input.title ? ` The seller says it is: ${input.title}.` : "") +
                  (input.retailPrice ? ` They say it retailed around AED ${input.retailPrice}.` : ""),
              },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return fallbackDraft(input);
    const json = (await res.json()) as {
      content?: { type: string; name?: string; input?: Record<string, unknown> }[];
    };
    const tool = json.content?.find((c) => c.type === "tool_use" && c.name === "item_draft");
    const out = tool?.input as Partial<ItemDraft> | undefined;
    if (!out?.title || out.estimateMin == null || out.estimateMax == null) return fallbackDraft(input);

    return {
      title: String(out.title),
      brand: (out.brand as string) ?? null,
      model: (out.model as string) ?? null,
      category: (out.category as string) ?? input.category ?? null,
      conditionGrade: (out.conditionGrade as ConditionGrade) ?? "excellent",
      description: String(out.description ?? ""),
      estimateMin: Math.round(Number(out.estimateMin)),
      estimateMax: Math.round(Number(out.estimateMax)),
      confidence: Number(out.confidence ?? 0.7),
      fromVision: true,
    };
  } catch {
    return fallbackDraft(input);
  }
}
