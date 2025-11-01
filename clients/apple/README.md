# ModernReader Apple Clients

SwiftUI code-sharing workspace targeting iPad, iPhone, macOS (via Catalyst), and Apple Watch.

## Structure
- `ModernReaderServices`: shared networking, auth, recommendation models.
- `ModernReaderUI`: main SwiftUI surfaces for iOS, iPadOS, macOS.
- `ModernReaderWatch`: watchOS companion extensions (emotion glance, quick actions).
- `Tests`: snapshot and interaction tests (expand with XCTest + ViewInspector).

## Usage
1. Open the folder in Xcode and create an app target that depends on these packages.
2. Configure bundle entitlements for camera/mic access (emotion sensing) and Core ML.
3. Set environment configuration (`API_BASE_URL`) via `.xcconfig`.

## Key Integrations
- **ARKit + RealityKit (iPad/iPhone)**: overlay translations, story elements.
- **Vision + Core ML**: on-device affect detection respecting privacy; fallback to server-side when consented.
- **Core Haptics**: narrative haptic cues; Apple Watch taps for pacing.
- **HealthKit (optional)**: track stress/attention proxies with explicit consent.

Refer to `Reader.me` for the full technical and ethical blueprint.
