# Deployment Guide for YanToDoList

This guide will help you deploy YanToDoList to Vercel with a PostgreSQL database.

## Prerequisites

- A Vercel account
- A PostgreSQL database (we recommend Vercel Postgres or Neon)

## Step 1: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to your Vercel dashboard
2. Select your project or create a new one
3. Go to the "Storage" tab
4. Click "Create Database" and select "Postgres"
5. Follow the prompts to create your database
6. Copy the `DATABASE_URL` from the `.env.local` tab

### Option B: Neon (Free Tier Available)

1. Go to [neon.tech](https://neon.tech)
2. Create an account and new project
3. Copy your connection string
4. Use it as your `DATABASE_URL`

## Step 2: Environment Variables

In your Vercel project settings, add the following environment variables:

```env
DATABASE_URL="your-postgres-connection-string"
NEXTAUTH_SECRET="your-generated-secret"
NEXTAUTH_URL="https://your-vercel-domain.vercel.app"
```

### Generate NEXTAUTH_SECRET

Run this command in your terminal:
```bash
openssl rand -base64 32
```

### Optional: Google OAuth

If you want Google sign-in:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/callback/google`
6. Copy the Client ID and Client Secret

Add to Vercel environment variables:
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Step 3: Database Migration

After deploying to Vercel, you need to run the database migration:

1. Install Vercel CLI if you haven't:
   ```bash
   npm i -g vercel
   ```

2. Link your project:
   ```bash
   vercel link
   ```

3. Pull environment variables:
   ```bash
   vercel env pull .env
   ```

4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

5. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

   Or if this is the first time:
   ```bash
   npx prisma migrate dev --name init
   ```

## Step 4: Deploy

```bash
vercel --prod
```

## Local Development

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your local environment variables

3. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

4. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Management

### View your database:
```bash
npx prisma studio
```

### Reset database (WARNING: Deletes all data):
```bash
npx prisma migrate reset
```

### Create a new migration:
```bash
npx prisma migrate dev --name your_migration_name
```

## Troubleshooting

### Database Connection Issues

- Make sure your DATABASE_URL is correct
- Check if your database allows connections from Vercel's IP ranges
- For Vercel Postgres, the connection string is automatically configured

### Authentication Issues

- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your deployment URL
- For Google OAuth, ensure redirect URIs are correctly configured

### Migration Issues

- If migrations fail, check your DATABASE_URL has proper permissions
- Make sure you're using PostgreSQL (not MySQL or SQLite)
- Try running `npx prisma db push` for quick prototyping

## Security Notes

- Never commit `.env` files
- Rotate NEXTAUTH_SECRET periodically
- Use strong passwords for database users
- Enable SSL for database connections in production
