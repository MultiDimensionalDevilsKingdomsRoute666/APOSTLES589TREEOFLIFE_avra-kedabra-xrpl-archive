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

## Deploying to Netlify

The repo includes a `netlify.toml` (build command `npm run build`, publish
directory `dist`, SPA fallback redirect). To deploy:

1. In Netlify, "Add new site" → "Import an existing project" → connect the
   `Ghostrayu/xrplmemoscanner` GitHub repo.
2. Netlify will read `netlify.toml` automatically — no manual build settings
   needed. Click deploy.

Alternatively, via the Netlify CLI:

```
npx netlify-cli deploy --build --prod
```

(requires `netlify login` first).
