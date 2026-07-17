# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: specs/signup-onboarding.spec.ts >> Signup & Onboarding Flow >> TC-F1-02: Input state persistence when navigating back
- Location: e2e/specs/signup-onboarding.spec.ts:34:7

# Error details

```
Error: browserContext.newPage: Executable doesn't exist at /Users/abdulaziz/Library/Caches/ms-playwright/ffmpeg-1011/ffmpeg-mac
╔═════════════════════════════════════════════════════════════════╗
║ Video rendering requires ffmpeg binary.                         ║
║ Downloading it will not affect any of the system-wide settings. ║
║ Please run the following command:                               ║
║                                                                 ║
║     npx playwright install ffmpeg                               ║
║                                                                 ║
║ <3 Playwright Team                                              ║
╚═════════════════════════════════════════════════════════════════╝
```