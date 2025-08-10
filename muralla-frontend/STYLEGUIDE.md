### Frontend UI Style Guide

This project uses Tailwind CSS with class-based dark mode. The Bank Account screen is the visual reference for analytics pages.

Core principles
- Consistent page shell: use `PageHeader` for title/description and action buttons. Page root should be `p-6 space-y-6`.
- Cards: use shared `Card`, `CardHeader`, `CardTitle`, `CardContent`. Avoid raw divs for panels.
- Stats: use `StatCard` with gradient background variants: blue, green, red, purple. Prefer 4-up grid for summaries.
- Tabs: use `Tabs` for top navigation between sections. Do not implement ad‑hoc tab bars.
- Tables: header row with subtle borders; zebra hover only. Use semibold for key numbers. Respect dark classes.
- Buttons: primary actions use `bg-primary-600 hover:bg-primary-700 text-white rounded-lg`. Secondary: `btn-outline`.
- Inputs: prefer the `.input` utility from `index.css`.

Dark and light themes
- Dark mode toggled via `document.documentElement.classList.toggle('dark')` (already wired in `App.tsx`).
- Always include both light and dark classes on surfaces, borders, and text.

Layout patterns
- Page section spacing: wrap groups in `space-y-6`.
- Grids: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6` for stat summaries.

Do
- Reuse `PageHeader`, `Tabs`, `StatCard`, and `Card`.
- Keep typography: titles `text-3xl font-bold`, section titles `text-lg font-medium`.

Don’t
- Hand-roll different header/tabs styles.
- Use arbitrary colors; stick to Tailwind theme tokens and provided gradient patterns.


