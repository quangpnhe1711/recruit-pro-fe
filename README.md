# RecruitPro Frontend

## Environment

Production API calls are configured through `VITE_API_BASE_URL`.

- Local example: `.env.example`
- Production default: `.env.production`

Current production API target:

```env
VITE_API_BASE_URL=/api
```

## Scripts

```bash
npm run dev
npm run build
```

## Deploy

Deploy the frontend to Vercel. The committed `.env.production` file makes the app call `/api`, and `vercel.json` proxies that path to the Railway backend.
