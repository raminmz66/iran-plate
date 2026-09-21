# Iranian Plate City Scanner Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a public, installable, browser-only mobile PWA that continuously reads standard Iranian private-car plates and freezes on the mapped city and province.

**Architecture:** A React/TypeScript static PWA owns the camera UI and scanner state. OpenCV.js finds and rectifies plate-shaped crops, Tesseract.js runs Persian OCR in a browser worker, and small pure domain modules normalize, parse, validate, stabilize, and look up a result from a bundled `(IRAN code, middle letter)` dataset. No backend, image upload, scan persistence, or manual lookup exists.

**Tech Stack:** Node.js 22+, Vite 7, React 19, TypeScript 5, Vitest, React Testing Library, Playwright, `@techstark/opencv-js` 5.0.0-release.1, `tesseract.js` 7.0.0, `@tesseract.js-data/fas` 1.0.0, `vite-plugin-pwa` 1.3.0, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-21-iran-plate-scanner-design.md`

## Global Constraints

- Support only standard white Iranian private-car plates; reject all other plate types.
- Use the rear camera over HTTPS after an explicit user action.
- Keep all frame processing, OCR, lookup data, and results on-device; never upload, persist, log, or track a plate or frame.
- Resolve location from the complete regional identifier: two-digit `IRAN` code plus the central Persian letter.
- Do not provide a manual entry or lookup path.
- Freeze only after a valid interpretation recurs in consecutive samples; never guess an unknown location.
- Show every known location for an ambiguous code-and-letter pair.
- Release the media stream whenever scanning freezes, ends, or the document becomes hidden.
- Build an installable PWA with offline operation after its initial install/load.
- Use Persian, right-to-left UI copy; retain canonical ASCII digits only for internal lookup keys.

## Review Focus

- A permission rejection or a device without `facingMode: "environment"` must show a retryable error, never a blank preview. (Task 4)
- Persian and Arabic digit variants, zero-width characters, and OCR whitespace must normalize to the same lookup key. (Task 2)
- A shared regional code/letter must show all mapped cities, while an unknown code/letter must keep scanning rather than invent a city. (Task 3)
- A single sharp but incorrect OCR frame must not freeze the result; three matching eligible readings inside two seconds are required. (Task 6)
- Backgrounding, retrying, or freezing the app must stop every camera track and prevent an old async OCR result from updating a new scan session. (Tasks 4 and 7)

---

## File structure

```
.
├── .github/workflows/deploy.yml             # Build and deploy the static app to GitHub Pages
├── public/
│   ├── icons/                               # PWA and maskable icons
│   └── tessdata/fas.traineddata.gz          # Bundled Persian OCR model
├── scripts/copy-tessdata.mjs                # Copies the versioned model from node_modules
├── src/
│   ├── app/App.tsx                          # Top-level scanner/result/error state composition
│   ├── app/App.test.tsx
│   ├── camera/useCamera.ts                  # Camera lifecycle and rear-camera access
│   ├── camera/useCamera.test.tsx
│   ├── data/iranPrivatePlateLocations.json  # Reviewed location records keyed by code and letter
│   ├── data/locationSources.ts               # Source metadata and last-reviewed date
│   ├── domain/normalize.ts                   # OCR cleanup and numeral conversion
│   ├── domain/plateParser.ts                 # Private-plate parser and validity checks
│   ├── domain/locationLookup.ts              # Code-and-letter location resolution
│   ├── domain/stabilizer.ts                  # Consecutive-reading acceptance policy
│   ├── domain/*.test.ts                      # Pure-domain tests
│   ├── scanner/candidateDetector.ts          # OpenCV crop/rectangle detection
│   ├── scanner/candidateDetector.test.ts     # Geometry filtering tests
│   ├── scanner/ocrService.ts                 # Browser-worker Tesseract lifecycle and OCR request API
│   ├── scanner/ocrService.test.ts
│   ├── scanner/ScannerView.tsx               # Video, guide overlay, scan loop, status presentation
│   ├── scanner/ScannerView.test.tsx
│   ├── result/ResultView.tsx                 # Frozen resolved/ambiguous result screen
│   ├── result/ResultView.test.tsx
│   ├── styles.css                            # Mobile-first RTL visual system and states
│   ├── main.tsx                              # React and service-worker entry point
│   └── vite-env.d.ts
├── tests/e2e/scanner.spec.ts                 # Mobile browser flow with mocked camera/OCR
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts                            # React and PWA configuration
└── README.md                                 # Setup, privacy, limitations, and deployment guide
```

### Task 1: Create the React PWA foundation and public repository

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/styles.css`, `public/icons/icon.svg`, `scripts/copy-tessdata.mjs`, `README.md`, `.gitignore`
- Test: `src/app/App.test.tsx`

**Interfaces:**
- Produces: a Vite React application with `npm run dev`, `npm run test`, `npm run build`, and `npm run test:e2e`; `App` is rendered by `src/main.tsx`.
- Consumes: no application code from earlier tasks.

- [ ] **Step 1: Create the package manifest with fixed first-release dependencies and scripts.**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "node scripts/copy-tessdata.mjs && tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "@techstark/opencv-js": "5.0.0-release.1",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "tesseract.js": "7.0.0"
  },
  "devDependencies": {
    "@tesseract.js-data/fas": "1.0.0",
    "@playwright/test": "1.55.0",
    "@testing-library/react": "16.3.0",
    "@types/react": "19.1.0",
    "@types/react-dom": "19.1.0",
    "@vitejs/plugin-react": "5.0.0",
    "jsdom": "26.1.0",
    "typescript": "5.9.0",
    "vite": "7.1.0",
    "vite-plugin-pwa": "1.3.0",
    "vitest": "3.2.0"
  }
}
```

- [ ] **Step 2: Install dependencies and create the lockfile.**

Run: `npm install`

Expected: `package-lock.json` is created and `npm ls --depth=0` exits 0.

- [ ] **Step 3: Write the failing application smoke test.**

```tsx
import { render, screen } from '@testing-library/react'
import { App } from './App'

it('shows the privacy-focused start screen before camera access', () => {
  render(<App />)
  expect(screen.getByRole('button', { name: 'شروع اسکن' })).toBeVisible()
  expect(screen.getByText(/تصویر یا پلاک شما ذخیره نمی‌شود/)).toBeVisible()
})
```

- [ ] **Step 4: Implement the smallest `App` shell and RTL document setup needed to pass the smoke test.**

```tsx
export function App() {
  return <main dir="rtl"><p>تصویر یا پلاک شما ذخیره نمی‌شود.</p><button>شروع اسکن</button></main>
}
```

- [ ] **Step 5: Configure Vite PWA generation and bundled model copy.**

Use `VitePWA({ registerType: 'autoUpdate', manifest: { name: 'پلاک‌یاب ایران', short_name: 'پلاک‌یاب', display: 'standalone', lang: 'fa', dir: 'rtl', orientation: 'portrait', icons: [...] } })`. Make `copy-tessdata.mjs` copy `node_modules/@tesseract.js-data/fas/4.0.0_best_int/fas.traineddata.gz` to `public/tessdata/fas.traineddata.gz`.

- [ ] **Step 6: Run the first test and production build.**

Run: `npm run test -- src/app/App.test.tsx && npm run build`

Expected: both commands exit 0 and `dist/manifest.webmanifest` plus a service worker exist.

- [ ] **Step 7: Create the required public GitHub repository with GitHub CLI and push this baseline.**

Run: `git add . && git commit -m "feat: scaffold Iranian plate scanner PWA" && gh auth status && gh repo create iran-plate --public --source=. --remote=origin --push`

Expected: the GitHub CLI reports the new public repository URL, `origin` points to it, and `git status --short` is empty.

### Task 2: Implement plate normalization and private-plate parsing

**Files:**
- Create: `src/domain/types.ts`, `src/domain/normalize.ts`, `src/domain/plateParser.ts`, `src/domain/normalize.test.ts`, `src/domain/plateParser.test.ts`

**Interfaces:**
- Produces: `normalizeOcrText(raw: string): string` and `parsePrivatePlate(reading: OcrReading): ParseResult`.
- Defines: `OcrReading = { text: string; confidence: number }`, `PrivatePlate = { display: string; iranCode: string; middleLetter: string; identity: string }`, and `ParseResult = { kind: 'valid'; plate: PrivatePlate } | { kind: 'invalid'; reason: 'format' | 'confidence' }`.
- Consumes: no UI or camera code.

- [ ] **Step 1: Write failing normalization tests for all Persian/Arabic digit and whitespace variants.**

```ts
it.each([
  ['۱۲ ب ۳۴۵ ایران ۱۰', '12 ب 345 ایران 10'],
  ['١٢ب٣٤٥ ایران ١٠', '12 ب 345 ایران 10'],
])('normalizes %s', (input, expected) => {
  expect(normalizeOcrText(input)).toBe(expected)
})
```

- [ ] **Step 2: Run the normalization test to verify it fails.**

Run: `npm run test -- src/domain/normalize.test.ts`

Expected: FAIL because `normalizeOcrText` does not exist.

- [ ] **Step 3: Implement digit, whitespace, and zero-width-character normalization.**

```ts
const PERSIAN = '۰۱۲۳۴۵۶۷۸۹'
const ARABIC = '٠١٢٣٤٥٦٧٨٩'
export function normalizeOcrText(raw: string) {
  return [...raw.replace(/[\u200c\u200e\u200f]/g, ' ')]
    .map(char => PERSIAN.includes(char) ? String(PERSIAN.indexOf(char)) : ARABIC.includes(char) ? String(ARABIC.indexOf(char)) : char)
    .join('').replace(/\s+/g, ' ').trim()
}
```

- [ ] **Step 4: Write failing parser tests for a valid full reading and unsupported/low-confidence readings.**

```ts
it('extracts code and middle letter from a standard private plate reading', () => {
  expect(parsePrivatePlate({ text: '۱۲ ب ۳۴۵ ایران ۱۰', confidence: 88 })).toMatchObject({
    kind: 'valid', plate: { iranCode: '10', middleLetter: 'ب', identity: '10:ب' },
  })
})
it('rejects a reading below 78 confidence', () => {
  expect(parsePrivatePlate({ text: '۱۲ ب ۳۴۵ ایران ۱۰', confidence: 77 })).toEqual({ kind: 'invalid', reason: 'confidence' })
})
```

- [ ] **Step 5: Implement the minimal private-plate parser.**

Accept only `iranCode` matching `^\d{2}$`, one letter in the supported Persian private-plate alphabet, and exactly five or six other recognized digits. Build `display` using Persian digits and build `identity` as canonical ASCII `"${iranCode}:${middleLetter}"`.

- [ ] **Step 6: Run domain tests.**

Run: `npm run test -- src/domain/normalize.test.ts src/domain/plateParser.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit the pure parsing boundary.**

Run: `git add src/domain && git commit -m "feat: parse Iranian private plates"`

Expected: commit succeeds.

### Task 3: Add reviewed city/province lookup data

**Files:**
- Create: `src/data/iranPrivatePlateLocations.json`, `src/data/locationSources.ts`, `src/domain/locationLookup.ts`, `src/domain/locationLookup.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `PrivatePlate` from `src/domain/types.ts`.
- Produces: `lookupLocation(identity: string): LocationResolution`, where `LocationResolution = { kind: 'resolved'; locations: [PlateLocation] } | { kind: 'ambiguous'; locations: PlateLocation[] } | { kind: 'unknown'; locations: [] }` and `PlateLocation = { city: string; province: string; sourceId: string }`.

- [ ] **Step 1: Write lookup tests for resolved, ambiguous, and unknown identities.**

```ts
it('returns one location for a verified identity', () => {
  expect(lookupLocation('10:ب')).toMatchObject({ kind: 'resolved', locations: [{ city: 'تهران', province: 'تهران' }] })
})
it('keeps multiple verified locations explicit', () => {
  expect(lookupLocation('21:ل').kind).toBe('ambiguous')
})
it('does not invent a location for an unknown identity', () => {
  expect(lookupLocation('00:ب')).toEqual({ kind: 'unknown', locations: [] })
})
```

- [ ] **Step 2: Run lookup tests to verify they fail.**

Run: `npm run test -- src/domain/locationLookup.test.ts`

Expected: FAIL because `lookupLocation` does not exist.

- [ ] **Step 3: Define source metadata and the machine-readable record schema.**

```ts
export const locationSources = {
  pishkhanak: { title: 'Pishkhanak — Plate city finder', url: 'https://pishkhanak.com/tools/plate-city-finder', reviewedOn: '2026-09-21' },
  hamrahMechanic: { title: 'Hamrah Mechanic — province and city plate numbers', url: 'https://www.hamrah-mechanic.com/mag/iran-province-license-plate-numbers/', reviewedOn: '2026-09-21' },
  pedal: { title: 'Pedal — Iranian plate list by province and city', url: 'https://www.pedal.ir/training/21445-iran-vehicle-registration-plates-list/', reviewedOn: '2026-09-21' },
} as const
```

- [ ] **Step 4: Compile the complete standard-private-plate table from the three cited public sources.**

Store records as `{ "identity": "10:ب", "city": "تهران", "province": "تهران", "sourceId": "pishkhanak" }`. Cross-check every record against at least two sources. When sources disagree or one identity is shared, store every cited location rather than choosing one. Exclude non-private-car letters and color/special-plate data.

- [ ] **Step 5: Implement deterministic grouping and lookup.**

```ts
export function lookupLocation(identity: string): LocationResolution {
  const locations = records.filter(record => record.identity === identity)
  if (locations.length === 0) return { kind: 'unknown', locations: [] }
  return { kind: locations.length === 1 ? 'resolved' : 'ambiguous', locations }
}
```

- [ ] **Step 6: Add the data provenance and issuing-region caveat to the README.**

State that the result is public reference data for the plate's issuing/registration region, is not ownership or current-location data, and may change when authorities allocate codes.

- [ ] **Step 7: Run lookup tests and check the dataset for duplicate records.**

Run: `npm run test -- src/domain/locationLookup.test.ts && node -e "const r=require('./src/data/iranPrivatePlateLocations.json'); const k=r.map(x=>x.identity+'|'+x.city+'|'+x.province); if(new Set(k).size!==k.length) process.exit(1)"`

Expected: PASS and exit 0.

- [ ] **Step 8: Commit the reviewed lookup dataset.**

Run: `git add src/data src/domain/locationLookup.* README.md && git commit -m "feat: add Iranian plate location lookup"`

Expected: commit succeeds.

### Task 4: Implement safe camera access and lifecycle management

**Files:**
- Create: `src/camera/useCamera.ts`, `src/camera/useCamera.test.tsx`

**Interfaces:**
- Produces: `useCamera(): { status: CameraStatus; videoRef: RefObject<HTMLVideoElement | null>; start(): Promise<void>; stop(): void; error: CameraError | null }`.
- Defines: `CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'unavailable' | 'error'`.
- Consumes: `navigator.mediaDevices.getUserMedia` only after `start()`.

- [ ] **Step 1: Write failing tests for rear-camera constraints, permission denial, and track cleanup.**

```tsx
it('requests the rear camera only after start', async () => {
  const { result } = renderHook(() => useCamera())
  expect(getUserMedia).not.toHaveBeenCalled()
  await act(() => result.current.start())
  expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ video: { facingMode: { ideal: 'environment' } }, audio: false }))
})
it('stops every track when stop is called', async () => {
  const track = { stop: vi.fn() }
  mockCameraStream([track])
  const { result } = renderHook(() => useCamera())
  await act(() => result.current.start())
  act(() => result.current.stop())
  expect(track.stop).toHaveBeenCalledOnce()
})
```

- [ ] **Step 2: Run the camera tests to verify they fail.**

Run: `npm run test -- src/camera/useCamera.test.tsx`

Expected: FAIL because `useCamera` does not exist.

- [ ] **Step 3: Implement `useCamera` with explicit state mapping and stream cleanup.**

Use `{ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }`. Map `NotAllowedError` to `denied`, `NotFoundError` to `unavailable`, and all other errors to `error`. Call `track.stop()` for every track in `stop`, unmount cleanup, and a `visibilitychange` handler when `document.hidden` is true.

- [ ] **Step 4: Attach a ready stream to the video element and wait for metadata.**

Set `video.srcObject`, `video.playsInline = true`, `video.muted = true`, and await `video.play()` after metadata is available. Clear `srcObject` on stop.

- [ ] **Step 5: Run camera tests.**

Run: `npm run test -- src/camera/useCamera.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit camera lifecycle handling.**

Run: `git add src/camera && git commit -m "feat: manage rear camera scanning lifecycle"`

Expected: commit succeeds.

### Task 5: Detect and rectify plate-shaped candidate crops

**Files:**
- Create: `src/scanner/candidateDetector.ts`, `src/scanner/candidateDetector.test.ts`, `src/scanner/cv.d.ts`

**Interfaces:**
- Produces: `findBestPlateCrop(frame: ImageData, guide: DOMRect): PlateCrop | null`, where `PlateCrop = { image: ImageData; bounds: { x: number; y: number; width: number; height: number } }`.
- Consumes: a copied video frame from `ScannerView`; does not access DOM, camera, OCR, or lookup modules.

- [ ] **Step 1: Write failing geometry-filter tests.**

```ts
it('accepts a large quadrilateral with a private-plate aspect ratio', () => {
  expect(isPlausiblePlate({ area: 24000, width: 320, height: 80 }, 160000)).toBe(true)
})
it.each([{ width: 80, height: 240 }, { width: 120, height: 100 }, { width: 320, height: 25 }])(
  'rejects an implausible candidate %#', candidate => expect(isPlausiblePlate({ area: candidate.width * candidate.height, ...candidate }, 160000)).toBe(false),
)
```

- [ ] **Step 2: Run candidate tests to verify they fail.**

Run: `npm run test -- src/scanner/candidateDetector.test.ts`

Expected: FAIL because `isPlausiblePlate` does not exist.

- [ ] **Step 3: Implement the OpenCV contour pipeline.**

Resize the guide-area frame to at most 960 pixels wide; convert to grayscale; apply Gaussian blur, Canny edges, and `findContours`; approximate contours to four points. Accept only contours occupying 3–60% of the guide area with width/height ratio 2.5–6.0. Choose the largest accepted contour, apply a four-point perspective transform to a 640×160 crop, and return its `ImageData`. Delete every OpenCV `Mat`, `MatVector`, and contour object in `finally`.

- [ ] **Step 4: Implement geometry helpers without OpenCV so unit tests remain deterministic.**

```ts
export function isPlausiblePlate(candidate: { area: number; width: number; height: number }, guideArea: number) {
  const ratio = candidate.width / candidate.height
  return candidate.area >= guideArea * 0.03 && candidate.area <= guideArea * 0.6 && ratio >= 2.5 && ratio <= 6
}
```

- [ ] **Step 5: Run candidate tests.**

Run: `npm run test -- src/scanner/candidateDetector.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit plate-candidate detection.**

Run: `git add src/scanner/candidateDetector.* src/scanner/cv.d.ts && git commit -m "feat: detect plate-shaped camera crops"`

Expected: commit succeeds.

### Task 6: Add browser-worker OCR and stable recognition

**Files:**
- Create: `src/scanner/ocrService.ts`, `src/scanner/ocrService.test.ts`, `src/domain/stabilizer.ts`, `src/domain/stabilizer.test.ts`

**Interfaces:**
- Produces: `createOcrService(): OcrService`, with `recognize(crop: ImageData): Promise<OcrReading>` and `terminate(): Promise<void>`.
- Produces: `createStabilizer(now?: () => number): { observe(result: ValidLocatedPlate): ValidLocatedPlate | null; reset(): void }`.
- Defines: `ValidLocatedPlate = { plate: PrivatePlate; resolution: Exclude<LocationResolution, { kind: 'unknown' }> }`.
- Consumes: `PlateCrop`, parser, and lookup modules; Tesseract's internal worker only.

- [ ] **Step 1: Write failing OCR-service tests with a mocked Tesseract worker.**

```ts
it('configures Persian OCR for a single plate line', async () => {
  const service = await createOcrService()
  await service.recognize(new ImageData(10, 10))
  expect(worker.setParameters).toHaveBeenCalledWith(expect.objectContaining({ tessedit_pageseg_mode: '7' }))
  expect(worker.recognize).toHaveBeenCalled()
})
it('terminates the worker exactly once', async () => {
  const service = await createOcrService()
  await service.terminate()
  await service.terminate()
  expect(worker.terminate).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Write the failing stabilizer tests.**

```ts
it('emits only the third matching eligible reading inside two seconds', () => {
  const stable = createStabilizer(() => 1000)
  expect(stable.observe(plate10Be)).toBeNull()
  expect(stable.observe(plate10Be)).toBeNull()
  expect(stable.observe(plate10Be)).toEqual(plate10Be)
})
it('resets the count when the identity changes', () => {
  const stable = createStabilizer(() => 1000)
  stable.observe(plate10Be); stable.observe(plate10Be)
  expect(stable.observe(plate13Je)).toBeNull()
})
```

- [ ] **Step 3: Run OCR and stabilizer tests to verify failure.**

Run: `npm run test -- src/scanner/ocrService.test.ts src/domain/stabilizer.test.ts`

Expected: FAIL because the service and stabilizer do not exist.

- [ ] **Step 4: Implement the OCR service.**

Create one Tesseract worker with `createWorker('fas', 1, { langPath: '/tessdata', cacheMethod: 'write' })`. Set `tessedit_pageseg_mode: '7'` and a whitelist containing Persian digits, Arabic digits, ASCII digits, the supported middle letters, spaces, and `ایران`. Convert the returned `data.text` and `data.confidence` into `OcrReading`. Serialize `recognize` calls and guarantee `terminate` is idempotent.

- [ ] **Step 5: Implement the stabilizer acceptance rule.**

Keep only observations of the same `plate.identity` made within 2000 ms. Return the third matching `ValidLocatedPlate`; reset for different identity, expired interval, parser failure, or unknown lookup. Do not retain raw image data or OCR text.

- [ ] **Step 6: Run OCR and stabilization tests.**

Run: `npm run test -- src/scanner/ocrService.test.ts src/domain/stabilizer.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit recognition services.**

Run: `git add src/scanner/ocrService.* src/domain/stabilizer.* && git commit -m "feat: stabilize on-device Persian OCR"`

Expected: commit succeeds.

### Task 7: Compose the live scanner and frozen result flow

**Files:**
- Create: `src/scanner/ScannerView.tsx`, `src/scanner/ScannerView.test.tsx`, `src/result/ResultView.tsx`, `src/result/ResultView.test.tsx`
- Modify: `src/app/App.tsx`, `src/app/App.test.tsx`, `src/styles.css`

**Interfaces:**
- Consumes: `useCamera`, `findBestPlateCrop`, `OcrService`, parser, lookup, and stabilizer APIs.
- Produces: `ScannerView({ onRecognized(result): void; onExit(): void })` and `ResultView({ result: ValidLocatedPlate; onScanAnother(): void })`.

- [ ] **Step 1: Write failing scanner tests for delayed success and stale-session protection.**

```tsx
it('does not freeze until the third matching located plate', async () => {
  mockRecognition([plate10Be, plate10Be, plate10Be])
  render(<ScannerView onRecognized={onRecognized} onExit={vi.fn()} />)
  await waitFor(() => expect(onRecognized).toHaveBeenCalledWith(plate10Be))
})
it('ignores an OCR promise that resolves after scanning has ended', async () => {
  const deferred = mockDeferredRecognition()
  const { unmount } = render(<ScannerView onRecognized={onRecognized} onExit={vi.fn()} />)
  unmount(); deferred.resolve(plate10Be)
  await Promise.resolve()
  expect(onRecognized).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Write failing result-view tests for resolved and ambiguous data.**

```tsx
it('shows city and province for a resolved result', () => {
  render(<ResultView result={plate10Be} onScanAnother={vi.fn()} />)
  expect(screen.getByText('تهران')).toBeVisible()
  expect(screen.getByRole('button', { name: 'اسکن پلاک دیگر' })).toBeVisible()
})
it('shows every mapped location for an ambiguous result', () => {
  render(<ResultView result={ambiguous21Lam} onScanAnother={vi.fn()} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(2)
})
```

- [ ] **Step 3: Run scanner and result tests to verify failure.**

Run: `npm run test -- src/scanner/ScannerView.test.tsx src/result/ResultView.test.tsx`

Expected: FAIL because the views do not exist.

- [ ] **Step 4: Implement a bounded scan loop in `ScannerView`.**

After the camera is ready, capture at most one frame every 650 ms. Process only when no OCR request is in flight. Render the guide overlay and statuses `پلاک را داخل کادر نگه دارید`, `در حال خواندن…`, and `نور یا فاصله را بهتر کنید`. Tag every async request with an incrementing session ID; discard completion if it does not match the current session. On recognition, stop the loop, terminate OCR, stop camera tracks, and call `onRecognized` once.

- [ ] **Step 5: Implement `ResultView` and wire explicit retry in `App`.**

Show normalized plate text, city and province for `resolved`, or a labeled list of possible city/province pairs for `ambiguous`. Include the issuing-region disclaimer and one `اسکن پلاک دیگر` button. The retry button creates a new session and returns to the live scanner; do not add a manual field, upload control, or history.

- [ ] **Step 6: Add mobile RTL styling and accessible status semantics.**

Use `aria-live="polite"` for status changes, maintain a visible focus style, make the primary controls at least 44×44 CSS pixels, use `object-fit: cover` for the video, respect `prefers-reduced-motion`, and keep status text readable over the camera with a solid/translucent contrast layer.

- [ ] **Step 7: Run all component tests.**

Run: `npm run test -- src/app/App.test.tsx src/scanner/ScannerView.test.tsx src/result/ResultView.test.tsx`

Expected: PASS.

- [ ] **Step 8: Commit the complete scan/result interaction.**

Run: `git add src/app src/scanner/ScannerView.* src/result src/styles.css && git commit -m "feat: scan plates and show issuing location"`

Expected: commit succeeds.

### Task 8: Finish offline behavior, deployment, and end-to-end validation

**Files:**
- Create: `.github/workflows/deploy.yml`, `playwright.config.ts`, `tests/e2e/scanner.spec.ts`
- Modify: `vite.config.ts`, `README.md`

**Interfaces:**
- Consumes: built static `dist/` output.
- Produces: a GitHub Pages deployment workflow and an E2E suite that needs no physical camera.

- [ ] **Step 1: Write a failing mobile E2E test that mocks camera and OCR.**

```ts
test('requests camera only after start and freezes to a location after stable OCR', async ({ page }) => {
  await page.addInitScript(mockMediaDevicesAndOcr)
  await page.goto('/')
  await expect(page.getByText(/تصویر یا پلاک شما ذخیره نمی‌شود/)).toBeVisible()
  await page.getByRole('button', { name: 'شروع اسکن' }).click()
  await expect(page.getByText('تهران')).toBeVisible()
  await expect(page.getByRole('button', { name: 'اسکن پلاک دیگر' })).toBeVisible()
})
```

- [ ] **Step 2: Run the E2E test to verify it fails before configuration.**

Run: `npx playwright test tests/e2e/scanner.spec.ts`

Expected: FAIL because Playwright configuration and the development web server are absent.

- [ ] **Step 3: Configure Playwright for a mobile Chromium viewport and local Vite server.**

Set `use: { ...devices['Pixel 7'] }` and `webServer: { command: 'npm run dev -- --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: !process.env.CI }`. Mock `getUserMedia`, canvas frame extraction, candidate detection, and OCR at module boundaries; do not use a real plate image in the suite.

- [ ] **Step 4: Add PWA cache rules that keep the app and OCR model available offline.**

Configure Workbox precaching for built assets plus `tessdata/fas.traineddata.gz`, and cache-first handling for the Tesseract worker/core assets. Do not add runtime API caching because the app has no API.

- [ ] **Step 5: Add GitHub Pages deployment.**

Create a workflow triggered by pushes to `main`: checkout, `actions/setup-node@v4` with Node 22 and npm cache, `npm ci`, `npm run build`, `actions/upload-pages-artifact@v3` for `./dist`, then `actions/deploy-pages@v4`. Set Vite's `base` from `GITHUB_ACTIONS ? '/iran-plate/' : '/'` so asset URLs work on project Pages.

- [ ] **Step 6: Document local use, privacy, limitations, data updates, and Pages activation.**

README must document `npm install`, `npm run dev -- --host 0.0.0.0`, that phone testing needs the HTTPS GitHub Pages URL, how to enable Pages with **GitHub Actions** as source, supported plate limits, data-source review procedure, and no-upload/no-history privacy behavior.

- [ ] **Step 7: Run the complete verification suite.**

Run: `npm run lint && npm run test && npm run build && npx playwright test`

Expected: every command exits 0.

- [ ] **Step 8: Commit and push the deployable application.**

Run: `git add .github playwright.config.ts tests vite.config.ts README.md && git commit -m "feat: deploy plate scanner as offline PWA" && git push origin main`

Expected: the GitHub Actions workflow starts and the repository remains clean.

## Plan self-review

- **Spec coverage:** Tasks 1 and 8 implement installable static PWA, HTTPS deployment, and offline behavior. Tasks 4–7 implement explicit rear-camera access, continuous scanning, OCR, stabilization, freeze, retry, error handling, and track cleanup. Tasks 2–3 implement normalization, full code-and-letter mapping, data provenance, unknown rejection, and ambiguity display. No backend, upload, storage, analytics, manual lookup, or unsupported plate type is introduced.
- **Placeholder scan:** No `TBD`, `TODO`, deferred implementation, or unspecified error-handling steps remain. Each task contains exact files, interfaces, tests, commands, and commit actions.
- **Type consistency:** `OcrReading → ParseResult → PrivatePlate → LocationResolution → ValidLocatedPlate` is the sole recognition data path. `ScannerView` alone bridges camera/image work to those pure types.
- **Review focus coverage:** Permission/device and stream lifecycle are tested in Task 4; text normalization in Task 2; ambiguous/unknown location data in Task 3; repeat-reading confidence in Task 6; stale async results and retry behavior in Task 7.
