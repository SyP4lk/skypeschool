# Public Home (Restored)

- Route group: `client/app/(public)`
- Styles concatenated into `home.css` from original archive CSS.
- Assets copied to `client/public/legacy/home_assets` and URLs rewritten.
- Page HTML injected via `dangerouslySetInnerHTML` for 1:1 look.

## How to use

1. Copy `client/app/(public)` and `client/public/legacy/home_assets` into your repo.
2. Start Next.js and open `/` (it renders `(public)/page.tsx`).
3. If you still need admin at `/admin`, it stays untouched.

