# Product Requirements Document (PRD)

## Inspectra AI — Visual Quality Inspection

| Field | Value |
|---|---|
| Document version | 1.0 |
| Status | Implemented (Next.js App Router) |
| Last updated | 2026-11-06 |
| Product owner | Hina Khan |
| Related documents | `docs/FINAL_IMPLEMENTATION_PLAN.md`, `docs/supabase-schema.sql`, `README.md` |

---

## 1. Executive summary

Inspectra AI is a web application for automated, first-pass visual quality inspection of
manufactured and workshop parts. A user uploads a product photograph or selects a preset sample,
optionally chooses a product category, and receives a structured inspection verdict:
**PASS**, **FAIL**, or **NEEDS_REVIEW**. Results include defect cards, severity, an estimated
confidence rating, and optional bounding boxes drawn over the inspected image. Every inspection
is stored in an audit history.

The product is an assistive screening prototype. It standardizes and documents visual checks but
does not replace certified industrial quality control or destructive testing.

---

## 2. Problem statement

Manual visual inspection is subjective, inconsistent, and often undocumented. Workshop
inspectors, QA leads, and evaluators need a fast, repeatable way to:

- screen product images for visible defects;
- record structured evidence of each inspection;
- browse and search past inspection records;
- demonstrate an automated inspection workflow without custom ML infrastructure.

Existing manual processes produce no traceable audit trail and make it difficult to compare
outcomes across categories, parts, or time.

---

## 3. Goals and success metrics

### Goals

1. Let a user run a complete image inspection in under a few clicks.
2. Return a structured verdict with defect details that a human can review.
3. Persist every inspection in a searchable audit history.
4. Support both cloud persistence (Supabase) and local demo persistence.
5. Keep API keys and privileged credentials server-side only.

### Success metrics

| Metric | Target |
|---|---|
| Inspection flow completion | Upload to verdict without manual intervention |
| Result structure | 100% of completed inspections return status, summary, confidence, limitations |
| Bounding-box validity | Only coordinates satisfying `0 <= ymin < ymax <= 1000` and `0 <= xmin < xmax <= 1000` are rendered |
| Audit history availability | Every saved inspection is retrievable by ID and visible in history |
| Secret exposure | Zero server secrets in client bundles |
| Build health | TypeScript typecheck and production build pass with zero errors |

---

## 4. Non-goals

- Certified metrology, dimensional measurement, or safety certification.
- Video, multi-camera, 3D, thermal, or X-ray inspection.
- Automated production-line integration or PLC control.
- User accounts, roles, multi-tenancy, or authentication (current MVP is public/anonymous).
- Billing, subscriptions, or usage quotas.
- Model training or fine-tuning.
- Replacing human sign-off for critical quality decisions.

---

## 5. Target users and personas

| Persona | Needs |
|---|---|
| QA lead / quality engineer | Consistent first-pass screening and traceable records |
| Workshop inspector | Fast image-based checks with clear pass/fail evidence |
| Manufacturing evaluator | Demonstration of an automated inspection workflow |
| Student / prototyping engineer | A working reference implementation for vision QC |

### Primary user stories

- As a QA lead, I want to upload a part photo and receive a structured verdict so that I can
  document a first-pass inspection.
- As an inspector, I want defect locations highlighted so that I can quickly verify the finding.
- As an evaluator, I want to try preset samples so that I can test the system without preparing
  images.
- As an auditor, I want to search and filter history so that I can trace past inspections.
- As an operator, I want to know whether records are stored locally or in Supabase so that I
  understand persistence behavior.

---

## 6. Scope (MVP)

The MVP consists of four screens and one supporting navigation shell:

1. **Dashboard** — `/`
2. **New Inspection** — `/inspect`
3. **Inspection Result** — `/results/[id]`
4. **Inspection History** — `/history`

Supporting capabilities:

- Image upload and preset sample selection.
- Product category selection.
- Gemini vision analysis.
- Defect severity and bounding-box presentation.
- Persistent audit history.
- Dual storage modes: Supabase or local disk.
- Storage-mode indicator and explanation modal.

---

## 7. Functional requirements

### 7.1 Dashboard (`/`)

| ID | Requirement | Priority |
|---|---|---|
| D-01 | Show total inspections, passed count, failed count, needs-review count, and pass rate | Must |
| D-02 | Show category coverage for Metal, Packaging, Electronics, and Fabric | Must |
| D-03 | Show the five most recent inspections with thumbnail, filename, category, timestamp, status, and defect count | Must |
| D-04 | Provide primary actions to start a new inspection and open full history | Must |
| D-05 | Allow clicking a recent inspection to open its result page | Must |
| D-06 | Show an empty state when no inspections exist | Must |

### 7.2 New Inspection (`/inspect`)

| ID | Requirement | Priority |
|---|---|---|
| I-01 | Allow file selection via click and drag-and-drop | Must |
| I-02 | Accept JPG, PNG, and WEBP images only | Must |
| I-03 | Enforce a 4 MB maximum file size in the browser and on the server | Must |
| I-04 | Show an instant local preview of the selected image | Must |
| I-05 | Allow replacing or clearing the selected image | Must |
| I-06 | Provide a product category selector with Auto Detect / General as default | Must |
| I-07 | Provide five preset demo samples with expected outcome and defect summary | Must |
| I-08 | Selecting a sample auto-fills the category and preview | Must |
| I-09 | Submit the image or sample for AI inspection and show processing stages | Must |
| I-10 | On success, navigate to the result page and log a success notification | Must |
| I-11 | On failure, show a clear inline error and an error notification | Must |
| I-12 | Prevent duplicate submissions while an inspection is running | Must |

### 7.3 Inspection Result (`/results/[id]`)

| ID | Requirement | Priority |
|---|---|---|
| R-01 | Show a prominent verdict banner for PASS, FAIL, or NEEDS_REVIEW | Must |
| R-02 | Show the inspection summary and inspection ID | Must |
| R-03 | Show the inspected image with optional bounding-box overlays | Must |
| R-04 | Allow toggling overlays on and off | Should |
| R-05 | Highlight the matching defect card when hovering a box, and vice versa | Should |
| R-06 | Show each defect's type, severity (Critical/Moderate/Minor), and description | Must |
| R-07 | Show a confidence percentage labeled as an assistive estimate | Must |
| R-08 | Show limitations and an explicit prototype disclaimer | Must |
| R-09 | Provide navigation to start another inspection or return to history | Must |
| R-10 | Render a not-found page for an unknown inspection ID | Must |

### 7.4 Inspection History (`/history`)

| ID | Requirement | Priority |
|---|---|---|
| H-01 | List all inspection records, newest first | Must |
| H-02 | Provide text search across filename, summary, and category | Must |
| H-03 | Provide status filters: All, Pass, Fail, Needs Review | Must |
| H-04 | Provide a category filter | Must |
| H-05 | Show thumbnail, filename, ID, category, status, defect count, summary, and date | Must |
| H-06 | Navigate to the result page from a row or the Details action | Must |
| H-07 | Delete a record after explicit confirmation | Must |
| H-08 | Refresh the list after deletion and show a notification | Must |
| H-09 | Show an empty state when filters match no records | Must |

### 7.5 Navigation and shell

| ID | Requirement | Priority |
|---|---|---|
| N-01 | Provide persistent navigation for Dashboard, New Inspection, and History | Must |
| N-02 | Show the active route in the navigation | Must |
| N-03 | Show the active storage mode badge | Must |
| N-04 | Explain storage mode, credentials, and Vercel persistence behavior in a modal | Should |
| N-05 | Display global success and error notifications | Must |
| N-06 | Provide a responsive mobile navigation strip | Must |
| N-07 | Show model name and persistence mode in the footer | Should |

### 7.6 API requirements

| Endpoint | Method | Requirement |
|---|---|---|
| `/api/health` | GET | Return status, storage mode, model, timestamp, and a Vercel local-mode warning when applicable |
| `/api/samples` | GET | Return the preset sample list |
| `/api/inspections` | GET | Return records with optional status, category, and search filters |
| `/api/inspections` | POST | Accept multipart `image` or `samplePath` plus `category`; run analysis; persist and return the record |
| `/api/inspections/[id]` | GET | Return one record with a fresh signed URL when using Supabase |
| `/api/inspections/[id]` | DELETE | Delete one record |
| `/uploads/[filename]` | GET | Serve locally stored images safely in local mode |

---

## 8. AI inspection logic

### 8.1 Status rules

| Status | Condition |
|---|---|
| PASS | Clear, identifiable product with no visible structural, dimensional, or surface defects |
| FAIL | One or more confirmed visual defects are detected |
| NEEDS_REVIEW | Blurry, poorly lit, obstructed, low-resolution, unrecognizable, or ambiguous evidence |

Defect presence forces FAIL. A claimed PASS with defects is normalized to FAIL.

### 8.2 Severity

| Severity | Definition |
|---|---|
| Critical | Compromises structural integrity, pressure seal, electrical safety, or core function |
| Moderate | Noticeable defect affecting performance, assembly, or aesthetic quality |
| Minor | Superficial cosmetic flaw not affecting utility |

Severity values are normalized to the three-level scale.

### 8.3 Bounding boxes

- Format: `[ymin, xmin, ymax, xmax]`, normalized to 0–1000.
- Validation: all values numeric, within 0–1000, `ymin < ymax`, and `xmin < xmax`.
- Invalid boxes are discarded; the defect description is retained.
- The UI positions overlays using percentages so they scale with the image.

### 8.4 Confidence and limitations

- Confidence is an AI-estimated heuristic between 0.10 and 1.00.
- Confidence is labeled as assistive and not a calibrated industrial measurement.
- Every result includes limitations related to viewpoint, lighting, resolution, or single-view
  2D analysis.

### 8.5 Model configuration

- Model is configurable via `GEMINI_VISION_MODEL`, defaulting to `gemini-3.8-flash`.
- Transient 429/503 failures are retried.
- Fallback models are attempted if the primary model remains unavailable.
- Malformed model output is converted into a NEEDS_REVIEW result rather than a crash.

---

## 9. Data model

### Inspection record

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique inspection identifier |
| `image_name` | string | Original uploaded or sample filename |
| `image_path` | string | Storage path or local relative path |
| `image_url` | string | Signed Supabase URL or local URL |
| `product_category` | string | Selected category |
| `status` | enum | `PASS`, `FAIL`, `NEEDS_REVIEW` |
| `defects` | array | Defect type, severity, description, optional `box_2d` |
| `summary` | string | Human-readable inspection explanation |
| `estimated_confidence` | number | 0.10–1.00 assistive confidence |
| `limitations` | string | Assessment limitations |
| `created_at` | ISO timestamp | Inspection time |

### Defect item

| Field | Type | Description |
|---|---|---|
| `type` | string | Defect category, e.g. Surface Gouge, Solder Bridge |
| `severity` | enum | `Critical`, `Moderate`, `Minor` |
| `description` | string | Specific finding |
| `box_2d` | number[4] | Optional normalized bounding box |

---

## 10. Storage and persistence

### Supabase mode

- Activated when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.
- Records stored in the `inspections` table.
- Images stored in the private `inspection-images` bucket.
- Images served through short-lived signed URLs generated server-side.
- The service-role key never reaches the browser.
- Schema and policies are defined in `docs/supabase-schema.sql`.

### Local persistent mode

- Activated when Supabase is not configured.
- Records stored in `data/inspections.json`.
- Images stored in `data/uploads/` and served through `/uploads/[filename]`.
- Three demo seed records are created on first run.
- Local mode is intended for development and persistent Node/Docker hosts.

### Vercel behavior

- Vercel's filesystem is ephemeral and not suitable for local persistence.
- Local mode remains available but `/api/health` reports a warning.
- Production deployments should configure Supabase for durable records and images.

---

## 11. Non-functional requirements

### Security

- API keys and Supabase service-role credentials remain server-side.
- No secrets in client bundles or repository.
- MIME type and file-size validation on both client and server.
- Path traversal prevention for sample and upload file access.
- Private Supabase bucket with signed URLs.
- Destructive actions require confirmation.

### Performance

- Dashboard and history render from server-side data without a client round trip.
- Uploads are limited to 4 MB to stay within serverless request limits.
- Inspection latency is dominated by the Gemini request; the UI communicates progress.

### Reliability

- Gemini transient errors are retried with model fallbacks.
- Invalid model output degrades to NEEDS_REVIEW.
- Supabase errors surface as explicit failures rather than silent fallback.
- Unknown inspection IDs return HTTP 404.

### Accessibility and UX

- All interactive controls are keyboard reachable.
- Focus styles are provided for primary actions.
- Images include alt text.
- Status is conveyed by text and icon, not color alone.
- Layout is responsive from mobile to desktop.
- Terminology and disclaimers are explicit about assistive AI limitations.

### Compatibility

- Next.js App Router, React 19, Tailwind CSS 4.
- Node.js 20.9 or newer.
- Modern evergreen browsers.
- Deployment target: Vercel, with optional self-hosted Node/Docker for local persistence.

---

## 12. Primary user flows

### Flow A — Upload and inspect

1. Open `/inspect`.
2. Select a category (optional).
3. Upload a JPG/PNG/WEBP up to 4 MB or choose a demo sample.
4. Submit the inspection.
5. View the verdict, defects, confidence, and overlays on `/results/[id]`.
6. Navigate to another inspection or to history.

### Flow B — Review history

1. Open `/history`.
2. Search or filter by status and category.
3. Open a record to view details.
4. Delete a record after confirmation if needed.

### Flow C — Storage awareness

1. Click the storage badge in the navigation.
2. Read whether Supabase or local storage is active.
3. Follow the provided credentials guidance if cloud persistence is desired.

---

## 13. Acceptance criteria

- [ ] All four routes render successfully and are directly linkable.
- [ ] An inspection can be run from an uploaded image or a preset sample.
- [ ] A completed inspection shows verdict, summary, defects, confidence, limitations, and overlays.
- [ ] History lists saved inspections and supports search plus status/category filters.
- [ ] Deleting a record removes it from history and the result route returns 404.
- [ ] Server rejects unsupported file types and files over 4 MB.
- [ ] Supabase mode persists records and images and returns signed URLs.
- [ ] Local mode persists records and images across restarts.
- [ ] `/api/health` reports the correct mode and a warning for local mode on Vercel.
- [ ] TypeScript typecheck and production build pass.
- [ ] No secrets are committed or shipped to the client.

---

## 14. Risks and constraints

| Risk | Impact | Mitigation |
|---|---|---|
| AI misclassification | Incorrect quality decision | Present as assistive; require human review for critical decisions |
| Poor image quality | Unreliable verdict | NEEDS_REVIEW status and explicit limitations |
| Ephemeral Vercel filesystem | Lost local records | Require Supabase in production; health warning |
| Serverless request limit | Large uploads rejected | 4 MB cap enforced on client and server |
| Gemini rate limits/outages | Failed inspections | Retry with model fallbacks; clear error messages |
| No authentication | Anyone with the URL can use or delete records | Treat as demo; add auth before production use |
| Supabase misconfiguration | Failed persistence | Explicit 5xx errors; schema and policy guide provided |

---

## 15. Future enhancements

- Authentication and role-based access control.
- Per-user inspection ownership and audit trails.
- Batch image inspection.
- Direct-to-storage uploads for larger files.
- Object detection model comparison or ensemble scoring.
- Exportable PDF/CSV inspection reports.
- Webhooks or MES/ERP integration.
- Threshold configuration per product category.
- Calibration and drift monitoring.
- Internationalization and unit preferences.

---

## 16. Open questions

1. Should authentication be required before public production use?
2. Should inspection records be scoped per user or organization?
3. What retention policy should apply to images and audit records?
4. Which product categories and defect taxonomies should be formally supported?
5. Is a paid Gemini tier guaranteed for production reliability?

---

## Appendix A — Product categories

- Auto Detect / General
- Metal Part
- Bottle / Packaging
- Electronic Component
- Clothing / Fabric
- Other

## Appendix B — Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Gemini vision API access |
| `GEMINI_VISION_MODEL` | No | Model ID, default `gemini-3.8-flash` |
| `SUPABASE_URL` | No | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Server-only privileged key |
| `SUPABASE_ANON_KEY` | No | Reserved for client-side Supabase usage |
| `APP_URL` | No | Deployment URL |

## Appendix C — Preset demo samples

| Sample | Category | Expected outcome |
|---|---|---|
| Machined Shaft Collar (Gouge & Dent) | Metal Part | FAIL |
| Precision Ball Bearing (Flawless) | Metal Part | PASS |
| HDPE Container (Shoulder Fracture) | Bottle / Packaging | FAIL |
| SMD Circuit Board (Solder Bridge) | Electronic Component | FAIL |
| Industrial Canvas Swatch (Tear & Stain) | Clothing / Fabric | FAIL |
