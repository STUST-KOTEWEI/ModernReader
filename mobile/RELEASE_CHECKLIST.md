# ModernReader Mobile Release Checklist

## Capacitor App

The existing Capacitor wrapper is the mobile delivery shell. Before release, copy the built React output into the Capacitor `webDir`, set the production API URL, and run `npx cap sync`.

```bash
cd web/frontend
npm run build
rm -rf ../../mobile/web
cp -R dist ../../mobile/web
cd ../../mobile
npm install
npx cap sync
```

Change the production app identity in `capacitor.config.ts` before release:

```ts
appId: 'com.modernreader.app',
appName: 'ModernReader',
```

## Apple Watch

Apple Watch development cannot be compiled or signed in this Linux environment. On a Mac with Xcode:

1. Open the Capacitor iOS workspace.
2. Add a Watch App target named `ModernReader Watch`.
3. Enable HealthKit only for the minimum required read permissions.
4. Send consented heart-rate summaries to the backend over the authenticated iOS app session.
5. Test on a real iPhone and Apple Watch before TestFlight.

Do not ship a claim that the app detects emotions or diagnoses stress. The feature should only adapt reading pace or suggest a break.

## Store submission

| Store | Required before submission |
|---|---|
| Apple App Store | Apple Developer account, Mac/Xcode, signing certificates, App Store Connect metadata, privacy answers, HealthKit justification |
| Google Play | Play Console account, Android signing key, AAB, Data Safety form, privacy policy, content rating |

## Podcast MP3

The backend now exposes `POST /api/podcast`. It creates TTS narration and mixes a locally generated low-volume ambient layer with FFmpeg. For a commercial release, replace the generated layer with a properly licensed music track and document the license.
