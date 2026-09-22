# Deployment guide

## Recommended free deployment

Deploy the frontend to **Vercel** and the API/ML model to **Render**.

This matches the architecture already in this repository:

- Vercel serves the Vite/React frontend from a global CDN.
- Render runs FastAPI, scikit-learn, XGBoost, and the checked-in model artifact at `data/models/otip_xgboost_source_model.pkl`.
- `render.yaml` declares the backend service, and `vercel.json` builds the frontend from the repository root.

For a project demo, this is the simplest free combination. Render's free web service has 512 MB RAM, sleeps after 15 minutes without inbound traffic, and can take about a minute to wake up. Its filesystem is ephemeral, so FIRMS cache files disappear after a restart; this app safely recreates them. It is not suitable for an always-on production service.

## Before deployment

1. Keep `data/models/otip_xgboost_source_model.pkl` committed. It is required for live ML classification.
2. Do not commit `.env` or API keys. Use `.env.example` only as a template.
3. Commit and push the deployment files to the GitHub repository connected to both hosts.

```bash
git add render.yaml vercel.json package.json .env.example DEPLOYMENT.md
git commit -m "chore: prepare deployment configuration"
git push origin HEAD
```

## 1. Deploy the backend on Render

1. Sign in to [Render](https://dashboard.render.com/) and select **New > Blueprint**.
2. Connect this GitHub repository and choose the branch you pushed.
3. Render discovers `render.yaml`. Create the `otip-backend` free web service.
4. During setup, enter these environment variables:

| Variable | Required | Value |
| --- | --- | --- |
| `FIRMS_MAP_KEY` | No | NASA FIRMS Map Key; omit it to run the demo-data fallback |
| `ORS_API_KEY` | No | OpenRouteService key for real route calculations |
| `FRONTEND_ORIGIN` | Yes after Vercel deploys | Your Vercel URL, for example `https://your-project.vercel.app` |

The other runtime settings, including Python 3.11, the health check, build command, model path, and CORS defaults, are already supplied in `render.yaml`.

5. Wait for the deploy to finish, then copy the service URL, such as `https://otip-backend.onrender.com`.
6. Verify it before connecting the frontend:

```bash
curl https://YOUR-RENDER-SERVICE.onrender.com/health
```

Expected fields include `"status":"ok"` and `"ml_model_available":true`.

If `ml_model_available` is `false`, check that the model file was pushed to GitHub and that Render's build logs do not show an XGBoost/scikit-learn installation error.

## 2. Deploy the frontend on Vercel

1. Sign in to [Vercel](https://vercel.com/new) and import the same GitHub repository.
2. Leave the project root as the repository root. Vercel uses `vercel.json` to install and build the `frontend` app.
3. In **Settings > Environment Variables**, add this for **Production** (and Preview if desired):

```text
VITE_API_BASE_URL=https://YOUR-RENDER-SERVICE.onrender.com
```

Do not add private API keys as `VITE_*` variables: Vite embeds those values into browser JavaScript. `VITE_MAPTILER_KEY` is the exception for the browser-restricted, read-only map tile key.

4. Deploy. Copy the Vercel URL.
5. Return to Render and set `FRONTEND_ORIGIN` to that exact Vercel URL. Save it and redeploy the backend once.

## 3. Release checks

1. Open the Vercel URL and confirm the map loads.
2. In the browser DevTools Network tab, ensure API requests go to the Render URL and do not fail with a CORS error.
3. Open `https://YOUR-RENDER-SERVICE.onrender.com/docs` to confirm FastAPI is reachable.
4. Test both modes:
   - Demo mode must work with no external keys.
   - Live mode requires `FIRMS_MAP_KEY`; routing accuracy additionally requires `ORS_API_KEY`.
5. After 15 idle minutes on Render free tier, refresh once and allow up to about a minute for the API to wake.

## Updating the app

Push changes to the connected branch. Render and Vercel will redeploy automatically. If you change `VITE_API_BASE_URL`, redeploy Vercel because Vite reads it during the frontend build.

## Local production smoke test

```bash
npm run build
docker compose up --build
```

Then visit `http://localhost` and `http://localhost:8000/health`. Provide API keys through a local `.env` file if you want to test live satellite data or real routing.
