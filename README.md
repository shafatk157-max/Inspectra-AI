# AI Visual Quality Inspection

Automated vision-AI quality control for manufacturing and workshop parts. Upload or select a
sample image, run a server-side Gemini vision inspection, review structured PASS / FAIL /
NEEDS_REVIEW results with defect cards and bounding-box overlays, and keep a persistent audit
history.

Built with **Next.js (App Router)**, React 19, Tailwind CSS 4, Google Gemini via
`@google/genai`, and optional Supabase storage.

## Getting started

**Prerequisites:** Node.js 20.9+ (developed on Node 26) and npm.

```bash
npm install
cp .env.example .env.local
# add GEMINI_API_KEY to .env.local
npm run dev
```

Open http://localhost:3000.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | yes | Gemini API key (server-side only) |
| `GEMINI_VISION_MODEL` | no | Vision model, default `gemini-3.5-flash` |
| `SUPABASE_URL` | no | Enables Supabase persistence when set with the service role key |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Server-only privileged key; never exposed to the browser |
| `SUPABASE_ANON_KEY` | no | Reserved for client-side Supabase usage |

## Storage modes

- **Supabase** (preferred for production): records go to the `inspections` table and images to
  the private `inspection-images` bucket. Images are served through short-lived signed URLs.
  Provision the schema with `docs/supabase-schema.sql`.
- **Local persistent** (default when Supabase is not configured): records go to
  `data/inspections.json` and images to `data/uploads/`. On first run three demo seed records
  are created.

> **Vercel:** the serverless filesystem is ephemeral. Local mode still works locally or in a
> persistent Node/Docker host, but configure Supabase on Vercel to keep records and images.
> `/api/health` reports the active mode and includes a warning when local mode runs on Vercel.

Uploads are limited to **4 MB** (JPG, PNG, WEBP) to stay within serverless request limits.

## Routes

| Route | Purpose |
|---|---|
| `/` | Dashboard with KPIs, category coverage, and recent inspections |
| `/inspect` | Upload/drag-drop or preset sample, category selection, run inspection |
| `/history` | Audit log with search, status, and category filters |
| `/results/[id]` | Verdict, defect cards, confidence, bounding-box overlays |

## API

| Endpoint | Methods |
|---|---|
| `/api/health` | `GET` |
| `/api/samples` | `GET` |
| `/api/inspections` | `GET` (filters), `POST` (multipart image or sample) |
| `/api/inspections/[id]` | `GET`, `DELETE` |
| `/uploads/[filename]` | `GET` (local-mode images) |

## Scripts

```bash
npm run dev      # Next.js dev server
npm run build    # production build
npm start        # production server
npm run lint     # TypeScript typecheck (tsc --noEmit)
npm run clean    # remove .next
```

## Project structure

```
app/                 Next.js routes, layout, API handlers
components/          Client view components and shell
lib/                 Types, Gemini client, validation, storage adapters
public/samples/      Preset demo images
data/                Local persistence (JSON + uploads)
docs/                Supabase schema and implementation notes
```

## Notes

- Existing pre-migration local records were preserved in `data/inspections.legacy.json` and are
  not read by the app.
- Inspection results are assistive first-pass screening only and do not replace certified
  industrial quality control.
