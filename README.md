# 🚀 YanToDoList - Cloud-Sync Todo Application

A modern, full-stack todo list application with cloud synchronization, user authentication, and advanced task recommendation algorithms. Built with Next.js 15, TypeScript, PostgreSQL, and NextAuth.js.

## ✨ Features

### 📝 **Task Management**
- ✅ Create, edit, and delete todos
- 🎯 Set priorities (Low, Medium, High)
- � Due dates with overdue tracking
- ✔️ Task completion tracking
- � Rich task metadata and statistics
- 📤 Export tasks to JSON files
- 📥 Import tasks from backup files

### 🔐 **Authentication & Cloud Sync**
- 🔑 Email/Password authentication
- � Google OAuth integration
- 🔒 Secure password hashing
- ☁️ **Cloud storage** - Tasks saved to PostgreSQL database
- 🔄 **Real-time sync** across devices (5-second polling)
- 📱 **Multi-device support** - Sign in on any device
- � **Automatic backups** - Never lose your data

### � **Smart Recommendations (YanAlgorithm)**
  - Task priority
  - Due dates and urgency
  - Task age and weight

### 🎨 **Modern UI/UX**

 [x] Instant client-side number generation
- Task statistics dashboard
- Overdue task tracking
- Completion rates
- Priority distribution
- Debug panel ("Stats for Nerds")
- Algorithm transparency

## �️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Authentication**: NextAuth.js (Credentials + OAuth)
- **Database**: PostgreSQL with Prisma ORM
- **Data Fetching**: SWR for optimistic updates
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Deployment**: Vercel-ready

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database (Vercel Postgres, Neon, or local)
- npm, yarn, pnpm, or bun

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd yantodolist
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your values:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/yantodolist"
   NEXTAUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32
   NEXTAUTH_URL="http://localhost:3000"
   
   # Optional: Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

### Database Management Tools

```bash
# View database in Prisma Studio
npx prisma studio

# Create new migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset
```

## 🚀 Deployment to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

**Quick Steps:**
1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
4. Deploy
5. Run database migrations
6. Configure Google OAuth (optional)

## 📖 Usage Guide

### Creating an Account

1. Click **"Sign In"** button in the header
2. Switch to **"Sign Up"** tab
3. Enter your name, email, and password (min 6 characters)
4. Click **"Sign Up"** to create account
5. You'll be automatically signed in

### Using Google OAuth

1. Click **"Continue with Google"**
2. Select your Google account
3. Grant permissions
4. Instant sign-in with cloud sync enabled

### Managing Tasks

- **Add Task**: Enter title, optionally set priority and due date, click "Add"
- **Complete Task**: Click the checkbox next to the task
- **Edit Priority**: Click the priority badge to cycle through Low → Medium → High
- **Set/Edit Due Date**: Click the calendar icon or existing date
- **Delete Task**: Click the trash icon

### Cloud Synchronization

- **Automatic Sync**: Tasks sync every 5 seconds when signed in
- **Multi-Device**: Changes appear on all your devices automatically
- **Offline Support**: Local changes sync when connection restored
- **Conflict Resolution**: Last-write-wins strategy

### Smart Task Recommendations

1. Enable **"Advanced Task Recommendations"** in settings (⚙️ icon)
2. Click **"Suggest Task"** to get AI-powered recommendation
3. Tasks weighted by priority, urgency, and age
4. Recommended task and timestamp persist across refreshes
5. Dismiss or mark complete directly from recommendation

### YanAlgorithm Features

Enable **"Stats for Nerds"** to access:

#### Weight Calculations
- See how each task is weighted
- View probability percentages
- Understand selection algorithm

#### Custom Configuration
- **Categories**: Adjust number of categories (2-10)
- **Custom Base**: Override calculated base value
- **Half Weight Mode**: Use 50% of weight for more randomness
- **Real-time Updates**: See probability changes instantly

#### Algorithm Modes
1. **Standard**: Uses full calculated weight from tasks
2. **Half Weight**: Divides weight by 2 for balanced distribution
3. **Custom Base**: User-defined base (0.1 - 20.0)

### Data Import/Export

#### Export Tasks
1. Click Export button
2. Downloads JSON file: `yan-todolist-export-YYYY-MM-DD-HH-mm.json`
3. Includes all tasks with metadata
4. Use for backups or data migration

#### Import Tasks
1. Click Import button
2. Select JSON export file
3. Choose: **Add to existing** or **Replace all tasks**
4. Validates data before importing

**Note**: With cloud sync, import/export is mainly for:
- Moving between accounts
- Offline backups
- Data migration
- Sharing task lists

## 🧮 YanAlgorithm Deep Dive

### Weight Calculation Formula

For each task:
```
weight = (1 / days_until_due) × priority_multiplier

Where:
- days_until_due = days between now and due date (min: 1)
- priority_multiplier = { high: 2, medium: 1, low: 0.5 }
- Tasks with no due date get moderate weight (1/7)
```

### Random Selection Process

1. Calculate sum of all weights
2. Generate random value: `0 → sum`
3. Iterate through tasks cumulatively
4. Select task when random < cumulative weight
5. Higher weight = higher selection probability

### Half Weight Mode

When enabled:
- Calculated base is divided by 2
- Reduces weight disparity
- More balanced selection
- Good for variety in recommendations

## 🔐 Security Features

- **Password Security**: Bcrypt hashing with 10 rounds
- **Session Management**: Secure JWT tokens via NextAuth
- **HTTPS Required**: Production enforces secure connections
- **CSRF Protection**: Built-in via NextAuth
- **SQL Injection Prevention**: Prisma parameterized queries
- **XSS Protection**: React automatic escaping
- **Environment Secrets**: Sensitive data in environment variables

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Todos
- `GET /api/todos` - Get all user's todos
- `POST /api/todos` - Create new todo
- `PATCH /api/todos/[id]` - Update todo
- `DELETE /api/todos/[id]` - Delete todo

All todo endpoints require authentication.

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes | `postgresql://...` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | ✅ Yes | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Application URL | ✅ Yes | `http://localhost:3000` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ❌ No | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | ❌ No | From Google Cloud Console |

### Database Schema

```prisma
model User {
  id       String   @id @default(cuid())
  email    String   @unique
  password String?  // Optional for OAuth
  name     String?
  todos    Todo[]
  accounts Account[]
  sessions Session[]
}

model Todo {
  id          String   @id @default(cuid())
  title       String
  description String?
  completed   Boolean  @default(false)
  priority    String   @default("medium")
  dueDate     DateTime?
  userId      String
  user        User     @relation(...)
}
```

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Ethan Yan Xu**
- Portfolio: [ethanyanxu.com](https://ethanyanxu.com)
- GitHub: [@OoEthanoO](https://github.com/OoEthanoO)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting and Postgres
- Prisma for excellent ORM
- NextAuth.js for authentication
- All open-source contributors

---

**Made with ❤️ by Ethan Yan Xu**
