# Running the App

1. Install dependencies (first time only):

   ```
   npm install
   ```

2. Start the dev server:

   ```
   npm run dev
   ```

3. Open the URL it prints (usually http://localhost:5173) in your browser.

Stop the server with `Ctrl+C` in the terminal.

This runs the scanner itself. The donate button in the footer won't work
under plain `npm run dev`, since it calls a Netlify Function that Vite alone
doesn't serve. To test that too, run it through the Netlify CLI instead:

```
npx netlify-cli dev
```

This proxies both the Vite dev server and `netlify/functions/donate.cjs`,
and reads `XAMAN_API_KEY`/`XAMAN_API_SECRET` from a local `.env.local` file
(gitignored — never commit it). Open the URL it prints (usually
http://localhost:8888) and click "DONATING" in the footer.

## Deploying to Netlify

The repo includes a `netlify.toml` (build command `npm run build`, publish
directory `dist`, functions directory `netlify/functions`, SPA fallback
redirect). To deploy:

1. In Netlify, "Add new site" → "Import an existing project" → connect the
   `Ghostrayu/xrplmemoscanner` GitHub repo.
2. In Site configuration → Environment variables, add `XAMAN_API_KEY` and
   `XAMAN_API_SECRET` (same values as your local `.env.local`). Do **not**
   prefix either with `VITE_` — that tells Vite to inline the value into the
   public client bundle, which must never happen to these.
3. Netlify will read `netlify.toml` automatically — no manual build settings
   needed. Click deploy.

Without step 2 the site still builds and the scanner works fine — only the
donate button's function will return a 500 (missing credentials).

Alternatively, via the Netlify CLI:

```
npx netlify-cli deploy --build --prod
```

(requires `netlify login` first).
