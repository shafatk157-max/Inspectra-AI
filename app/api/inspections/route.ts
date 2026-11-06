import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '@/lib/constants';
import { runVisionInspection } from '@/lib/gemini';
import {
  getStorageMode,
  listInspections,
  saveInspection,
} from '@/lib/store';
import type { ProductCategory } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const inspections = await listInspections({
      status: searchParams.get('status') || '',
      category: searchParams.get('category') || '',
      search: searchParams.get('search') || '',
    });

    return Response.json({
      inspections,
      storageMode: getStorageMode(),
    });
  } catch (err: any) {
    console.error('Error fetching inspection history:', err);
    return Response.json(
      {
        error:
          err?.message || 'Failed to retrieve inspection records.',
      },
      { status: 500 }
    );
  }
}

function mimeTypeForName(name: string): string {
  const ext = path.extname(name).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const category = String(
      formData.get('category') || 'Auto Detect / General'
    ).trim() as ProductCategory;
    const samplePath = String(formData.get('samplePath') || '').trim();

    let imageBuffer: Buffer;
    let originalName: string;
    let mimeType: string;

    if (samplePath) {
      const safeName = path.basename(samplePath);
      const localPath = path.join(
        process.cwd(),
        'public',
        'samples',
        safeName
      );
      if (!fs.existsSync(localPath)) {
        return Response.json(
          { error: `Preset sample image not found at ${samplePath}` },
          { status: 404 }
        );
      }
      imageBuffer = fs.readFileSync(localPath);
      originalName = safeName;
      mimeType = mimeTypeForName(safeName);
    } else {
      const file = formData.get('image');
      if (!(file instanceof File)) {
        return Response.json(
          { error: 'No image file or preset sample was provided.' },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return Response.json(
          { error: 'File size exceeds the 4 MB limit.' },
          { status: 400 }
        );
      }
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return Response.json(
          {
            error:
              'Unsupported file format. Please upload JPG, PNG, or WEBP images.',
          },
          { status: 400 }
        );
      }
      imageBuffer = Buffer.from(await file.arrayBuffer());
      originalName = file.name || 'upload.jpg';
      mimeType = file.type;
    }

    const analysis = await runVisionInspection({
      imageBuffer,
      mimeType,
      category,
    });

    const inspectionId = randomUUID();
    const timestamp = new Date().toISOString();

    const record = await saveInspection({
      id: inspectionId,
      imageName: originalName,
      imageBuffer,
      mimeType,
      category,
      status: analysis.status,
      defects: analysis.defects,
      summary: analysis.summary,
      estimated_confidence: analysis.estimated_confidence,
      limitations: analysis.limitations,
      created_at: timestamp,
    });

    return Response.json(
      {
        success: true,
        inspection: record,
        storageMode: getStorageMode(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error during visual quality inspection:', err);
    let errorMsg =
      err?.message ||
      'An unexpected error occurred during inspection analysis.';
    try {
      const parsed = JSON.parse(errorMsg);
      if (parsed?.error?.message) {
        errorMsg = parsed.error.message;
      }
    } catch {
      // not JSON, keep as is
    }
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
