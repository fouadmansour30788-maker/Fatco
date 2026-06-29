# Deploying FATCO CRM (Vercel + Neon Postgres)

The app runs on **Postgres** in production. These steps take you from local code to a
live URL. Total time ~15–20 minutes.

---

## 1. Create the database (Neon — free)

1. Go to **https://neon.tech** and sign up (GitHub login is easiest).
2. Create a new **Project** (any name, e.g. `fatco-crm`). Pick the region closest to
   Tripoli (e.g. **EU / Frankfurt**).
3. After it's created, open **Dashboard → Connect** and copy the
   **Pooled connection** string. It looks like:
   ```
   postgresql://user:password@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Keep this — it's your `DATABASE_URL`.

## 2. Put the code on GitHub

From the project folder:

```bash
git add -A
git commit -m "FATCO CRM ready for deploy"
gh repo create fatco-crm --private --source=. --push
```

(Or create a repo on github.com and `git push` to it.)

## 3. Deploy on Vercel

1. Go to **https://vercel.com**, sign up / log in (GitHub).
2. **Add New → Project → Import** your `fatco-crm` repo.
3. Framework preset is auto-detected (Next.js). Before clicking Deploy, add
   **Environment Variables**:

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | the Neon pooled string from step 1 |
   | `AUTH_SECRET` | a long random string (see below) |
   | `NEXT_PUBLIC_APP_URL` | your Vercel URL, e.g. `https://fatco-crm.vercel.app` |

   Generate `AUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. Click **Deploy**. First deploy takes a couple of minutes.

> **Database setup is done separately, not during the build** (build-time connections to a
> sleeping serverless DB are flaky). Apply the schema once from your machine with the
> Neon `DATABASE_URL` in `.env`:
> ```bash
> npm run db:deploy
> ```

> You can set `NEXT_PUBLIC_APP_URL` after the first deploy once you know the URL,
> then redeploy.

## 4. Create the first owner / seed data

The database is empty after migration. Two options:

**A. Load the demo data** (customers, items, sales — good for a first look):
```bash
# locally, with DATABASE_URL pointing at Neon:
npm run db:seed
```
Then sign in with `admin@fatco.com` / `fatco123` — **change this password immediately**
from the Staff screen, or delete the demo users and create your own owner.

**B. Start clean with just one owner** — run this once (locally, with the Neon
`DATABASE_URL` in `.env`):
```bash
node -e "(async()=>{const b=require('bcryptjs');const {PrismaPg}=require('@prisma/adapter-pg');const {PrismaClient}=require('./app/generated/prisma/client');const p=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});await p.user.create({data:{name:'Owner',email:'YOUR@EMAIL.com',role:'OWNER',passwordHash:await b.hash('YOUR_PASSWORD',10)}});console.log('owner created');process.exit(0)})()"
```

## 5. Done

- **Public landing:** `https://your-app.vercel.app/`
- **Staff:** `/login`
- **Customer portal:** `/portal/login`

Every `git push` to the main branch auto-deploys.

---

## Local development against Postgres

Local dev now also uses Postgres. Easiest: create a **second Neon branch** (e.g. `dev`)
and use its connection string in your local `.env`. Then:

```bash
npm install
npm run db:deploy   # apply migrations
npm run db:seed     # optional demo data
npm run dev
```

## Notes

- **Vercel free (Hobby) tier is for non-commercial use.** Fine for demos; for live
  business use consider Vercel **Pro** (~$20/mo).
- To enable **WhatsApp reminders**, add `WHATSAPP_TOKEN` + `WHATSAPP_PHONE_ID`
  (from a verified Meta WhatsApp Business account) as Vercel env vars and redeploy.
- Schema changes: run `npm run db:migrate -- --name your_change` locally to create the
  migration, then apply it to production with `npm run db:deploy` (with the production
  `DATABASE_URL` in `.env`). Commit the new folder under `prisma/migrations/` and push.
