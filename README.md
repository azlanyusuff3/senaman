# SENAMAN — Personal Home Trainer

A mobile-first **PWA untuk senaman di rumah**, dengan **perut/core** sebagai fokus utama. Dibina untuk penggunaan peribadi: **tiada login, tiada backend, tiada langganan**.

## Apa dah ada

- Home dashboard dan body map yang boleh ditekan untuk pilih kawasan badan
- 24 senaman terpilih — core, belakang, dada, bahu, lengan, kaki dan treadmill
- Hanya bodyweight, dumbbell dan treadmill
- Panduan dalam Bahasa Melayu dengan tips teknik
- Animated three-frame guide menggunakan Workout Guide jika aset tersedia
- Pautan video YouTube demonstrasi terpilih, carian video untuk selebihnya
- 8 preset workout, core workout generator, rest timer, pause/skip/previous
- Voice coach optional melalui browser speech synthesis
- Rekod workout, streak dan minit disimpan dalam localStorage
- Export rekod JSON, offline shell dan PWA install support

## Run locally

Requires Node.js 20.19+ (Node 22 recommended).

```bash
npm install
npm run dev
```

Buka URL Vite yang terpapar. Untuk production:

```bash
npm run build -- --base=/senaman/
npm run preview
```

## Deploy percuma (GitHub Pages)

Workflow `.github/workflows/deploy.yml` disediakan untuk branch `main`. Dalam GitHub repository, pergi **Settings > Pages > Build and deployment > Source: GitHub Actions**. Repo private mungkin memerlukan pelan GitHub yang menyokong Pages; jika tak tersedia, host melalui Cloudflare Pages atau Netlify (free tier bergantung syarat semasa).

> Repo mungkin kekal private; jangan kongsi fail/data peribadi. PWA Pages memerlukan HTTPS untuk service worker.

## Attribution & legal

- **Exercise animation**: [Bryl Lim's Workout Guide](https://github.com/bryllim/workout-guide). Source artwork partly based on [Everkinetic](https://github.com/everkinetic/data). Visual assets licensed **CC BY-SA 4.0**. Assets are loaded via CDN and animated with CSS; no SVG binaries copied into this repository. Attribution must remain.
- **Code/data framework** in Workout Guide is MIT; this project uses links to the asset CDN, not source code copied from the library.
- **Videos**: YouTube content belongs to respective creators. The app links to their original videos; no video is downloaded, copied or hosted.
- Exercise descriptions and workout flows in this repository are authored for Senaman. This is **not medical advice**, and timer/counts are illustrative.

## Limitations

- Offline app shell works after installation/first successful visit. Remote animation can be available offline only after the service worker has cached it; YouTube needs internet.
- Generic anatomical body map is a **stylized original interactive diagram**, not a medical-grade 3D body.
- For some exercise slugs, Workout Guide might not include an animation; fallback icon and written instructions remain available.
- PWA does not control a treadmill or measure form automatically.
- Generated workouts target a *rough duration*, not necessarily exact minutes. Recover between demanding sessions.

## Next iteration

Test exercise asset mappings individually and curate 40–60 validated 3-frame visual demos; add exercise-specific progress (reps/weights) and optionally use the MIT `@musclemap/react` library for a precise body map. Improve offline download of selected media after verifying asset provenance.

## Personal data

No account and no server sync. Data stays on the browser's localStorage. Use **Progress → Export** before clearing browser site data or changing device.
