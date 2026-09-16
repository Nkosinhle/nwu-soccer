# 🚀 Setup Guide — NWU Soccer Institute PMS

Follow these steps **in order**. The app will not work without a database connection.

---

## Step 1 — Get a FREE MongoDB Database (Atlas)

Your PC does not have MongoDB installed. Use the free cloud version:

1. Go to **https://cloud.mongodb.com** and sign up for free
2. Click **"Build a Database"** → choose **M0 FREE** tier → any region → Create
3. **Database Access** tab → Add New Database User
   - Username: `nwuadmin`
   - Password: choose something (write it down!)
   - Role: **Atlas Admin** → Add User
4. **Network Access** tab → Add IP Address → **Allow Access from Anywhere** → Confirm
5. **Database** tab → Connect → **Drivers** → copy the connection string

It looks like:
```
mongodb+srv://nwuadmin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 2 — Create your .env.local file

In your project folder, create a file called **`.env.local`** (not `.env.example`) with:

```env
MONGODB_URI=mongodb+srv://nwuadmin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/nwu-soccer?retryWrites=true&w=majority
NEXTAUTH_SECRET=any-long-random-string-here-change-this
NEXTAUTH_URL=http://localhost:3000
```

Replace:
- `YOUR_PASSWORD` with the password you chose in Step 1
- `cluster0.xxxxx` with your actual cluster address from the connection string

---

## Step 3 — Install dependencies

Open terminal in the project folder and run:

```bash
npm install
```

---

## Step 4 — Seed the database

```bash
npm run db:seed
```

You should see:
```
✅ Connected!
👥 Created 4 staff users (password verified ✓)
🛡  Created 3 squads
⚽ Created 12 players
...
╔══════════════════════════════════════════╗
║          SEED COMPLETE!                  ║
╚══════════════════════════════════════════╝
```

---

## Step 5 — Add your logo

Copy your `soccer-logo.jpg` into:
```
public/images/soccer-logo.jpg
```

---

## Step 6 — Start the app

```bash
npm run dev
```

Open **http://localhost:3000**

Login with any demo account — password is `password123`:
- `admin@nwu.ac.za`
- `coach@nwu.ac.za`
- `physio@nwu.ac.za`
- `support@nwu.ac.za`
- `player@nwu.ac.za`

---

## ❓ Common Errors

| Error | Fix |
|-------|-----|
| `Cannot find module 'dotenv'` | Run `npm install` first |
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB not running. Use Atlas (Step 1) |
| `Invalid email or password` | Run `npm run db:seed` first |
| `<password> in URI` | You forgot to replace placeholder in `.env.local` |
| Logo not showing | Put `soccer-logo.jpg` in `public/images/` folder |
| Middleware warning | Safe to ignore — Next.js 16 renamed it internally |
