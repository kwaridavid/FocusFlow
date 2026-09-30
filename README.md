# FocusFlow

Plan. Focus. Get Things Done.

A local-first productivity app: tasks, notes, calendar, Pomodoro focus mode, dashboard and streaks.
No accounts and no backend. Data is stored in the browser's localStorage.

## Structure

```
index.html        App shell and task dialog
assets/styles.css Styles (light and dark themes)
assets/app.js     App logic (routing, views, storage, timer)
vercel.json       Vercel config (static site, security headers)
```

## Run locally

Open `index.html` in a browser, or run `npx serve .`

## Deploy to Vercel

1. `git init && git add . && git commit -m "FocusFlow MVP"`
2. Create a GitHub repository and push: `git remote add origin <url> && git push -u origin main`
3. In Vercel, choose Add New > Project and import the repository.
4. Framework Preset: Other. Leave the build command and output directory empty. Deploy.
