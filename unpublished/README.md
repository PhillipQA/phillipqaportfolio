# Unpublished pages

Files in this folder are kept in the repository but are **not** published. Next.js only publishes what is in `public/` and `app/`.

## QA Services page (`services/`)

Switched off for now, so https://phillipqa.com/services/ and https://phillipqa.com/services/inquiry.html return a 404 page.

To bring it back:

1. Move the folder back: `git mv unpublished/services public/services`
2. In `components/site-header.tsx`, set `SHOW_SERVICES` to `true` so the **QA Services** link returns to the menu.
3. In `public/services/index.html`, change the **Portfolio** link (it still points to `https://phillipqa.github.io/phillipqaportfolio/`) to `https://phillipqa.com/`.
4. Merge to `main`. The site redeploys automatically.
