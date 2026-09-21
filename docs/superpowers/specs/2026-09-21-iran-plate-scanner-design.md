# Iranian Plate City Scanner — Design Specification

**Date:** 2026-09-21  
**Status:** Approved design; awaiting specification review

## 1. Purpose and success criteria

Build a personal-use, mobile-first web application that uses a phone's rear camera to continuously scan a standard white Iranian private-car registration plate. Once it recognizes a complete plate with sufficient confidence, it stops the camera preview and displays the city and province associated with the plate.

The experience should resemble QR-code scanning: the user points the live camera at a plate and does not need to capture a photo manually. The application must be free to operate, require no cloud account or API key, and keep all image processing on the device.

Success is a reliable result for clear, close, reasonably level, well-lit standard private plates, plus clear guidance when the plate cannot be read.

## 2. Scope

### Included

- Installable Progressive Web App (PWA), optimized for current mobile browsers.
- HTTPS camera permission flow and rear-camera live preview.
- Continuous, automatic plate candidate detection within an on-screen guide.
- In-browser image enhancement and OCR.
- Recognition of the normal white Iranian private-car plate format.
- Persian/Arabic digit normalization and Persian middle-letter recognition.
- Local city and province lookup from the complete regional identifier: the two-digit `IRAN` code and central Persian letter.
- Result freeze after a stable, valid recognition.
- Retry by scanning another plate.
- Plain-language camera, unsupported-browser, low-quality-image, and unknown/ambiguous-data states.
- An About screen that identifies the mapping-data source and its last review date.

### Explicitly excluded

- Manual code or plate lookup.
- Uploading images, videos, plate text, telemetry, or scan history to any server.
- Stored scan history, accounts, authentication, analytics, or a backend.
- Taxis, public/government, police, military, temporary, diplomatic, motorcycle, and other non-standard plate formats.
- Any claim to identify a vehicle owner or verify registration.

## 3. Product flow

1. The landing screen briefly explains that the app reads standard Iranian private plates on-device. The user selects **Start scanning**.
2. The browser requests access to the rear camera. On approval, a full-screen scanner shows the video preview, a centered plate guide, and a concise live status.
3. The scanner samples frames in the guide area, identifies plate-shaped candidates, enhances the candidate crop, and reads the plate text.
4. OCR output is normalized and parsed. A result is eligible only when it matches the supported plate format and its `(IRAN code, middle letter)` combination is represented in the bundled data.
5. The same eligible interpretation must recur over consecutive samples before it is accepted. This avoids freezing on a single blurred or incorrect OCR result.
6. The scanner stops and the result screen shows the normalized plate, city, province, and a short note that the result describes the issuing/registration region, not current vehicle location or ownership.
7. **Scan another** starts a new scanner session.

If recognition is not possible, the preview remains active and status text suggests a correction, such as moving closer, improving light, centering the plate, or holding the phone steady. Permission or browser failures show an explanation and retry action. There is no manual-entry fallback.

### Visual direction

The approved UI direction is **مسیر آبی** (Blue Route): a bright, calm, urban-navigation visual language inspired by Iranian road signs and wayfinding. The scanner uses a blue-gray live-camera treatment, a high-contrast pale guide frame, a turquoise scan-status indicator, and clear Persian RTL copy. The result screen should preserve this practical navigation feel rather than use a generic dashboard or decorative card-heavy layout.

## 4. Architecture

The app is a static client-side PWA. It is deployable to any HTTPS static host and has no application server.

### Scanner UI

Owns camera permission, selecting the rear-facing camera when available, video preview lifecycle, guide overlay, scan status, and result transition. It releases the media stream whenever scanning freezes, ends, or the page is hidden.

### Frame and plate-candidate processing

Samples frames at a bounded rate so the UI remains responsive. It limits analysis to the guide area and applies lightweight preprocessing (grayscale, contrast adjustment, perspective/shape checks, and crop preparation) before OCR. Candidate processing is isolated behind an interface so the implementation may improve detection without changing UI or lookup behavior.

### OCR and plate parser

Runs in the browser, preferably in a worker to avoid blocking the preview. It converts Persian and Arabic numeral variants to canonical values, recognizes the middle Persian letter, rejects malformed/private-plate-incompatible results, and returns a structured plate object rather than UI text.

### Recognition stabilizer

Collects recent parsed candidates. It emits a scan result only after the same valid regional identifier and plate interpretation satisfy the configured consecutive-frame threshold. A timeout does not create a result; it leaves scanning active with guidance.

### Regional location lookup

Uses a bundled, versioned data file keyed by two-digit `IRAN` code and Persian middle letter. Each record includes province, city or county, source URL, source title, and last-reviewed date. The initial dataset will be compiled and cross-checked from public plate-code tables that list both the code and letter, including:

- [Pishkhanak — Plate city finder](https://pishkhanak.com/tools/plate-city-finder)
- [Hamrah Mechanic — province and city plate numbers](https://www.hamrah-mechanic.com/mag/iran-province-license-plate-numbers/)
- [Pedal — Iranian plate list by province and city](https://www.pedal.ir/training/21445-iran-vehicle-registration-plates-list/)

Conflicting, shared, or unverified combinations are retained as explicit multiple-location records. The UI must label them as ambiguous and show all mapped locations; it must not select one arbitrarily. The application must make clear that this public reference data can change as authorities allocate new codes and letters.

## 5. Data contracts

### Parsed plate

The OCR/parser boundary returns either a parse failure or a structured object containing canonical digits, `middleLetter`, `iranCode`, a display string, and parser confidence. It does not expose raw camera frames beyond the processing pipeline.

### Lookup result

A lookup returns `resolved`, `ambiguous`, or `unknown` status. A resolved result carries exactly one city and province. An ambiguous result carries all known city/province candidates and a source-review note. `unknown` cannot freeze the scanner as a successful city result.

## 6. Privacy and permissions

- Camera frames are used in memory solely for the current scan and are discarded immediately after processing.
- No images, video, OCR results, or plate strings are transmitted, persisted, logged, or tracked.
- The app requests camera access only after a user action.
- The app does not function on non-secure origins except local development, because browsers require a secure context for camera access.

## 7. Error handling and user messaging

- **Camera denied:** explain how to enable permission and offer to retry.
- **No usable camera:** explain that a rear camera is needed and show the app's supported-device limitation.
- **Low-quality/unstable reading:** retain the live scan and provide short actionable guidance; do not show a likely city.
- **Unsupported plate appearance:** state that only standard white private plates are supported and retain scan guidance.
- **Unknown or ambiguous data:** never silently guess. For known ambiguity, show each mapped location only after a stable plate read; for unknown data, ask the user to try another view.
- **Unexpected OCR/processing failure:** reset the worker/session safely, preserve a useful message, and let the user restart scanning.

## 8. Testing and acceptance checks

### Automated tests

- Normalize Persian and Arabic digit variants into canonical values.
- Parse valid standard private plates and reject malformed or unsupported forms.
- Look up resolved, ambiguous, and unknown code-and-letter combinations.
- Require repeated matching observations before emitting a result.
- Verify that unknown data and low-confidence readings cannot freeze to a city result.
- Verify scanner state transitions: initial, requesting permission, scanning, recognized/frozen, retrying, and error.

### Browser and device checks

- Rear camera is selected where the browser provides one.
- Permission acceptance, denial, and revoked-permission states are correct.
- A clear real plate freezes to the expected location after stable recognition.
- Moving the phone or showing a blurred/non-plate image does not freeze incorrectly.
- **Scan another** releases and reacquires the camera correctly.
- The installed PWA and normal browser tab both behave correctly on a physical phone.

## 9. Delivery and repository plan

After this specification and the subsequent implementation plan are reviewed and approved, create a **public GitHub repository** with the GitHub CLI (`gh`). The static PWA, source dataset, tests, and deployment instructions will be maintained there. Public-repository creation is deferred until that approval gate; no external project has been created during design.
