# RecruitPro Frontend

## Environment

Production API calls are configured through `VITE_API_BASE_URL`.

- Local example: `.env.example`
- Production default: `.env.production`

Current production API target:

```env
VITE_API_BASE_URL=https://recruit-pro-production.up.railway.app/api
```

## Scripts

```bash
npm run dev
npm run build
```

## Deploy

Deploy the frontend to Vercel. The committed `.env.production` file lets the production build call the Railway backend without extra code changes.
