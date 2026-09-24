# VRMS Portfolio

One Node.js app: the Express backend serves both the React frontend and the
`/api` routes from the same origin, so the whole site needs a single Hostinger
web app.

- `backend/`: Express API, MySQL, and uploaded media (`/api/*`, `/static/*`)
- `frontend/`: React + Vite. The backend serves its production build (`frontend/dist`).
- `package.json`: installs both halves, builds the frontend, and starts the backend

## Local development

Run each half with live reload in its own terminal:

```bash
npm run dev:backend
```

```bash
npm run dev:frontend
```

Vite runs on http://localhost:5173 and forwards `/api` and `/static` to the
backend on port 5000. Set `FRONTEND_URL=http://localhost:5173` in `backend/.env`.

To run the production setup locally (with `FRONTEND_URL=http://localhost:5000`):

```bash
npm install
npm run build
npm start
```

`npm test` runs the backend tests.

## Deploying to Hostinger

Create one Node.js web app for `vrmsuliva.online` with these build settings:

| Setting          | Value                                               |
| ---------------- | --------------------------------------------------- |
| Framework preset | Express (use Other if Express is not accepted)      |
| Root directory   | `/`, the repo root (not `backend` or `frontend`)     |
| Node.js version  | 22                                                  |
| Build command    | `npm run build`                                     |
| Output directory | leave empty                                         |
| Entry file       | `backend/server.js`                                 |

Hostinger runs `npm install` (its `postinstall` step installs `backend/` and
`frontend/`), then the build, then starts `backend/server.js`.

Environment variables are the ones in `backend/.env.example`, with
`FRONTEND_URL=https://vrmsuliva.online`.

### Uploaded media

Hostinger replaces the deploy folder on every deploy. Media committed to git in
`backend/public/static/images` comes back each time, but images uploaded through
the admin pages are lost on the next deploy unless `MEDIA_ROOT` points to a
folder outside the deploy directory (see `backend/.env.example`).
