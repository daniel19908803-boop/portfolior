# My Portfolio — Gabriel Fonseca

A single-page portfolio built from scratch with Next.js, React, Tailwind CSS, and Three.js. The default language is Brazilian Portuguese.

## Run locally

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000.

For a production preview:

```sh
npm run build
npm run preview
```

The production build exports to `out/`, which can be served by a static host. No API keys or server are required for the current experience. Root `index.html` files are generated in `out/`; edit the React source in `app/`.

## Included

- Three-second GF monogram introduction with circular ripples.
- Three.js particles that assemble into Gabriel Fonseca, react to the cursor, and float above an animated ocean. A text fallback remains available without WebGL.
- Silent, local project showcase video behind the hero.
- Fixed glass navigation, magnetic logo and links, and a section-aware glowing underline.
- Separate biography and technology views, based on the supplied professional profile.
- Portuguese, English, Spanish, Japanese, Russian, French, German, and Italian interface and biography translations. Project descriptions are available in Portuguese and English; other locales display English descriptions. Technology and project names remain proper names.
- Four illustrated color themes, a motion toggle, and persisted local preferences. System reduced-motion preferences are respected.
- Twenty projects matched in order to the seven supplied project reference screenshots, initially six visible, with category filters and show more/less. Native dialogs display the original uncropped images, with keyboard navigation and full-resolution links.
- Responsive contact form with browser validation, spam protection, and email delivery through Netlify Forms.
- Local fonts, original project images, and optimized WebP card thumbnails; no runtime translation service, analytics, or third-party image requests.

## Contact details and project content

1. The contact form submits to Netlify Forms and sends notifications to `gabriel.fonseca2000@outlook.com`. The visitor’s email is the reply-to address. Manage delivery recipients in Netlify under **Forms → Submission notifications**; `app/site.config.js` controls the public email link and profile URLs. The static form definition is in `public/contact-form.html`. Form detection must remain enabled in Netlify. Submission errors preserve the entered message and offer a direct email link; success appears only after Netlify accepts the submission.
2. Project images in `public/projects/01.png` through `20.png` (with original JPG/WebP extensions where applicable) match the card order in `project1.jpg` through `project7.jpg`. The Instagram Automation image is included as project 05. Cards load optimized WebP versions from `public/projects/thumbnails/`; clicking loads the original file.
3. Update project names, descriptions, status, technology tags, and image paths in `app/projects.js`. The reference screenshots establish the project titles and their LIVE, GITHUB, or PRIVATE labels. Private source code is identified in the dialog; no project URLs are inferred from badge labels.
4. Replace `public/project-reel.webm` with a real showcase, or regenerate it from the first six previews with `node scripts/create-reel.mjs`.

The project gallery uses the supplied assets from the adjacent `ref_image/project image` folder. The public contact email is `gabriel.fonseca2000@outlook.com`.

## Source map

| File | Purpose |
| --- | --- |
| `app/page.jsx` | Layout and client-side interactions |
| `app/OceanScene.jsx` | Three.js particle name, stars, and ocean |
| `app/globals.css` | Tailwind entry, design, themes, and responsiveness |
| `app/content.js` | Eight languages and technology groups |
| `app/projects.js` | Twenty matched projects and translated gallery labels |
| `app/site.config.js` | Public contact and video configuration |
| `public/projects/` | Original project images, optimized thumbnails, and legacy concept artwork used by the hero reel |
| `public/themes/` | Four theme selection images |

## Verification

`npm run build` checks the production compilation and static export. To run the interaction checks, start the production preview, then run `node scripts/qa.mjs`. That script uses installed Google Chrome on Windows through the DevTools protocol and writes screenshots and a report into ignored `.preview/`.

The browser checks cover the intro, Three.js, video and font loading, all eight languages, four themes, project expansion and filtering, image dialogs, contact validation, submission encoding, loading, failure and retry, section navigation, mobile settings, reduced motion, preference persistence, and overflow at widths from 320 to 1920 pixels. Contact requests are intercepted during browser QA, so checks do not send emails. Set `QA_BASE_URL` to test a preview on a different port.

## Netlify deployment

The repository includes a pinned Netlify CLI and `netlify.toml`. Netlify builds with `npm run build` on Node.js 24 and publishes the static `out/` directory. The local `.netlify/` account/site link is ignored by Git.

Netlify project: [gabriel-fonseca-portfolio](https://gabriel-fonseca-portfolio.netlify.app). The connected repository is `daniel19908803-boop/portfolior`, with `main` as the production branch.

To connect a fresh local checkout to this existing project:

```sh
npx netlify login
npx netlify link --id 5b896c8f-5fd5-4e9a-911c-ee414389d9aa
```

Pushing commits to `main` automatically builds and deploys the site; Netlify manages the Git integration without a separate GitHub Actions workflow. Build settings are versioned in `netlify.toml`. Use `npm run deploy:setup` only when configuring a new project or repairing its Git integration.

For an on-demand draft or production deployment from this checkout:

```sh
npm run deploy:preview
npm run deploy
```

Both commands build before uploading. To validate the Netlify build configuration without connecting an account, run `npx netlify build --offline`.

See the [Netlify CLI continuous deployment guide](https://docs.netlify.com/api-and-cli-guides/cli-guides/get-started-with-cli/#continuous-deployment) for the account authorization flow.
