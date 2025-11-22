# Synn — Electron App (Glass UI)

Quick steps to run locally:

1. Install dependencies

```bash
npm install
```

2. Run the app

```bash
npm start
```

Notes:
- This project uses Electron with a frameless, transparent window. The UI uses Tailwind via CDN in `index.html`.
- If you want to enable development tools, uncomment the `win.webContents.openDevTools()` line in `main.js`.
