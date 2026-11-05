# Brand family

Third-party brand logos as icons: `<aha-icon name="brand-<id>">`, one per entry in `logo/manifest.json` that has a line logo. They follow the icon rules (stroke by size, `currentColor` ink, sizes 12, 16, 24 and 32).

From Phosphor Icons Regular (MIT), the stroke source `raw/regular/<name>.svg` at https://github.com/phosphor-icons/core/tree/2b75f3ad12b420c9504ef05df8d2564a28f8500e/raw/regular, fetched 2026-11-04, with Phosphor's 256 bounding box dropped, dots filled, transforms baked into the path and the ink set to #4A4A4A (21):
- brand-google: google-logo
- brand-microsoft-powerpoint: microsoft-powerpoint-logo
- brand-microsoft-teams: microsoft-teams-logo
- brand-chatgpt: open-ai-logo
- brand-slack: slack-logo
- brand-microsoft-excel: microsoft-excel-logo
- brand-microsoft-word: microsoft-word-logo
- brand-pdf: file-pdf
- brand-google-drive: google-drive-logo
- brand-microsoft-onedrive: cloud
- brand-paypal: paypal-logo
- brand-stripe: stripe-logo
- brand-youtube: youtube-logo
- brand-facebook: facebook-logo
- brand-instagram: instagram-logo
- brand-linkedin: linkedin-logo
- brand-x: x-logo
- brand-reddit: reddit-logo
- brand-medium: medium-logo
- brand-tiktok: tiktok-logo
- brand-whatsapp: whatsapp-logo

Stand-ins drawn in the same line style (256 grid, 16-unit stroke, round caps and joins) because Phosphor has no logo for the brand; the same shapes as `logo/line/<id>.svg` (10):
- brand-microsoft
- brand-google-slides
- brand-zoom
- brand-model-context-protocol
- brand-canva
- brand-zapier
- brand-d2l-brightspace
- brand-cornerstone-ondemand
- brand-claude
- brand-g2

`logo/line/<id>.svg` (the CSS mask files) and `logo/original/` (the brand's own colours) stay where they are.

## Licence

Phosphor Icons, MIT License, Copyright (c) 2023 Phosphor Icons. Full text in `../system/PHOSPHOR-CREDITS.md`.
