# vNick.io

Personal site and blog of Nick — infrastructure architect. Dark, cinematic design
with a 3D server rack (three.js) that rotates and unpacks as you scroll.
Built with [Astro](https://astro.build), hosted on GitHub Pages at
[vnick.io](https://vnick.io).

## Writing a post

Posts live in `src/content/posts/` as Markdown (`.md`) or MDX (`.mdx`) files.
The file name becomes the URL slug: `my-post.md` → `/writing/my-post`.

Every post starts with frontmatter:

```markdown
---
title: "Designing DR across two cloud regions"
description: "One-line summary shown in lists, RSS and meta tags."
date: 2026-09-21
topic: infrastructure   # one of: infrastructure | production | build
draft: false            # true = visible in dev, excluded from production builds
---

Post body in Markdown…
```

- `topic` maps the post to one of the three home-page story sections.
- Keep `draft: true` while writing; drafts render locally (`npm run dev`) but are
  excluded from `npm run build`, RSS and the sitemap.
- The home page "Latest writing" list and `/writing` are generated from these
  files automatically — newest first, no manual list to edit.

## Running locally

```powershell
npm install        # first time only
npm run dev        # dev server, defaults to http://localhost:4321
npm run build      # production build into dist/
npm run preview    # serve the production build locally
```

## Deploying

Deployment is automatic: pushing to `main` runs the GitHub Actions workflow in
`.github/workflows/deploy.yml`, which builds the site with the official
`withastro/action` and publishes it to GitHub Pages.

One-time repo setup (already done if the site is live):

1. GitHub repo → **Settings → Pages** → Source: **GitHub Actions**.
2. Same page → Custom domain: **vnick.io** (and verify the domain under your
   account's Pages settings).
3. DNS: point the apex `vnick.io` at GitHub Pages' A/AAAA records and `www` at
   `<username>.github.io` via CNAME (check GitHub's "Managing a custom domain"
   docs for current IPs).

`public/CNAME` (containing `vnick.io`) rides along with every deploy as a
belt-and-braces copy of the custom-domain setting.
