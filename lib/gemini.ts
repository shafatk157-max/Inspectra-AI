import { GoogleGenAI, Type } from '@google/genai';
import { GEMINI_VISION_MODEL } from './server-config';
import type { DefectItem, InspectionStatus, ProductCategory } from './types';
import {
  normalizeSeverity,
  normalizeStatus,
  validateBoundingBox,
} from './validation';

export interface VisionAnalysis {
  status: InspectionStatus;
  summary: string;
  estimated_confidence: number;
  limitations: string;
  defects: DefectItem[];
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  if (!client) {
    client = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout: 22000,
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return client;
}

function isThinkingLevelError(err: any): boolean {
  const message = String(err?.message || err || '').toLowerCase();
  return (
    message.includes('thinking level') ||
    message.includes('thinking_level') ||
    message.includes('thinkingconfig')
  );
}

async function callGeminiWithRetry(
  params: Record<string, unknown>
): Promise<any> {
  const ai = getClient();
  const modelsToTry = [params.model, 'gemini-flash-latest'].filter(
    Boolean
  ) as string[];

  const uniqueModels = Array.from(new Set(modelsToTry));
  const baseConfig = (params.config as Record<string, unknown>) || {};

  let lastError: unknown;
  for (const model of uniqueModels) {
    try {
      return await ai.models.generateContent({
        ...params,
        model,
        config: {
          ...baseConfig,
          thinkingConfig: { thinkingLevel: 'low' },
        },
      } as any);
    } catch (err: any) {
      lastError = err;
      console.warn(
        `[Gemini API] Request failed with model ${model}: ${err?.message || err}`
      );

      if (isThinkingLevelError(err)) {
        try {
          return await ai.models.generateContent({
            ...params,
            model,
            config: { ...baseConfig, thinkingConfig: undefined },
          } as any);
        } catch (retryErr: any) {
          lastError = retryErr;
          console.warn(
            `[Gemini API] Retry without thinkingConfig failed with model ${model}: ${retryErr?.message || retryErr}`
          );
        }
      }
    }
  }
  throw lastError;
}

const SYSTEM_INSTRUCTION = `You are an expert industrial quality control inspector.
Your task is to analyze product images for manufacturing, assembly, or surface defects.

STRICT STATUS EVALUATION RULES:
1. "PASS": The image is clear, the product is identifiable, and no visible structural, dimensional, or surface defects are observed.
2. "FAIL": One or more clear, confirmed visual defects (e.g. scratches, gouges, dents, cracks, solder bridges, missing parts, tears, stains) are detected.
3. "NEEDS_REVIEW": The image is blurry, poorly lit, obstructed, too low-resolution, not a recognizable product, or visual evidence is ambiguous and cannot be reliably evaluated.

DEFECT SEVERITY CLASSIFICATION:
- "Critical": Compromises structural integrity, pressure seal, electrical safety, or core function.
- "Moderate": Noticeable defect affecting performance, assembly, or aesthetic quality.
- "Minor": Superficial cosmetic flaw (e.g., light hairline scuff) not affecting product utility.

BOUNDING BOXES:
- If a defect is clearly localized, provide "box_2d": [ymin, xmin, ymax, xmax] scaled 0 to 1000.
- ymin must be less than ymax, and xmin must be less than xmax.
- If defect location cannot be precisely bounded, omit the bounding box.

CONFIDENCE:
- Provide an estimated confidence score between 0.00 and 1.00 reflecting your assessment certainty.

LIMITATIONS:
- Explicitly state camera angle, lighting, or 2D single-view limitations.`;

export async function runVisionInspection(params: {
  imageBuffer: Buffer;
  mimeType: string;
  category: ProductCategory | string;
}): Promise<VisionAnalysis> {
  const { imageBuffer, mimeType, category } = params;
  const base64Data = imageBuffer.toString('base64');

  const systemInstruction = `${SYSTEM_INSTRUCTION}
Category context: "${category}".`;

  const promptText = `Perform a comprehensive visual quality inspection on this ${category} image.
Inspect surfaces, edges, joints, markings, and overall integrity.
Return your evaluation strictly in the requested JSON structure.`;

  const geminiResponse = await callGeminiWithRetry({
    model: GEMINI_VISION_MODEL,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: promptText,
        },
      ],
    },
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: {
            type: Type.STRING,
            description: 'Inspection outcome: PASS, FAIL, or NEEDS_REVIEW',
          },
          summary: {
            type: Type.STRING,
            description: 'Detailed yet concise inspection explanation',
          },
          estimated_confidence: {
            type: Type.NUMBER,
            description: 'AI estimated confidence rating from 0.0 to 1.0',
          },
          limitations: {
            type: Type.STRING,
            description: 'Assessment limitations based on single-view photo',
          },
          defects: {
            type: Type.ARRAY,
            description: 'List of observed defects (empty if PASS)',
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description:
                    'Category of defect, e.g. Surface Gouge, Solder Bridge, Crack',
                },
                severity: {
                  type: Type.STRING,
                  description: 'Severity: Critical, Moderate, or Minor',
                },
                description: {
                  type: Type.STRING,
                  description:
                    'Specific description of the defect location and appearance',
                },
                box_2d: {
                  type: Type.ARRAY,
                  description:
                    'Normalized bounding box [ymin, xmin, ymax, xmax] between 0 and 1000',
                  items: { type: Type.INTEGER },
                },
              },
              required: ['type', 'severity', 'description'],
            },
          },
        },
        required: ['status', 'summary', 'estimated_confidence', 'defects'],
      },
    },
  });

  const rawJsonText = geminiResponse.text || '{}';
  let parsedResult: any;
  try {
    parsedResult = JSON.parse(rawJsonText);
  } catch {
    parsedResult = {
      status: 'NEEDS_REVIEW',
      summary:
        'Visual analysis returned unstructured output. Manual inspection recommended.',
      estimated_confidence: 0.5,
      limitations: 'Single-view photo inspection.',
      defects: [],
    };
  }

  const rawDefects = Array.isArray(parsedResult.defects)
    ? parsedResult.defects
    : [];

  const validatedDefects: DefectItem[] = rawDefects.map((d: any) => {
    const item: DefectItem = {
      type: String(d.type || 'Unspecified Defect').trim(),
      severity: normalizeSeverity(d.severity),
      description: String(d.description || '').trim(),
    };
    const validBox = validateBoundingBox(d.box_2d);
    if (validBox) item.box_2d = validBox;
    return item;
  });

  const finalStatus = normalizeStatus(
    parsedResult.status,
    validatedDefects.length > 0
  );
  const finalConfidence =
    typeof parsedResult.estimated_confidence === 'number'
      ? Math.max(0.1, Math.min(1.0, parsedResult.estimated_confidence))
      : 0.85;

  return {
    status: finalStatus,
    summary:
      parsedResult.summary || 'Visual quality analysis complete.',
    estimated_confidence: finalConfidence,
    limitations:
      parsedResult.limitations ||
      'Assessment is based solely on the uploaded 2D image.',
    defects: validatedDefects,
  };
}
