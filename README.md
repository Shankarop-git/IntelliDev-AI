# IntelliDev AI 🚀

IntelliDev AI is a full-stack, AI-powered developer assistant designed to help engineers analyze code, manage projects, and communicate with large language models seamlessly.

## 🌟 Features

- **AI Chat Interface**: Interactive chat with language models (powered by Google Gemini) for code assistance.
- **Project Explainer**: Automatically analyze and summarize project structures and codebases.
- **GitHub Integration**: Direct hooks into GitHub for analyzing remote repositories.
- **Modern UI**: Built with Next.js, Tailwind CSS, Framer Motion, and Lucide Icons for a beautiful, responsive experience.
- **Secure Authentication**: Integrated with Next-Auth and Prisma for robust user management.

## 🏗️ Architecture

This project is organized as a monorepo containing a separated frontend and backend:

### Frontend (`/frontend`)
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS, Framer Motion
- **Database ORM**: Prisma (PostgreSQL)
- **Authentication**: Next-Auth
- **Language**: TypeScript

### Backend (`/backend`)
- **Framework**: FastAPI (Python)
- **AI Integration**: Google GenAI (Gemini)
- **Server**: Uvicorn

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- PostgreSQL Database

### 1. Backend Setup
Navigate to the backend directory, install dependencies, and start the server:
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The backend API will be available at `http://localhost:8000`.

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install the required NPM packages:
```bash
cd frontend
npm install
```

Configure your environment variables by creating a `.env` file in the frontend folder:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXTAUTH_SECRET="your_random_secure_secret"
```

Initialize the database schema and start the Next.js development server:
```bash
npx prisma db push
npm run dev
```
The web application will be available at `http://localhost:3000`.

## 📦 Deployment Guide

### Backend Deployment (e.g., Render, Railway)
1. Create a Web Service and connect your GitHub repository.
2. Set the root directory to `backend`.
3. Build command: `pip install -r requirements.txt`.
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
5. Set your `CORS_ORIGINS` environment variable to match your frontend domain.

### Frontend Deployment (e.g., Vercel)
1. Import your GitHub repository to Vercel.
2. Set the root directory to `frontend`.
3. Add your `DATABASE_URL` and `NEXT_PUBLIC_API_URL` to the Environment Variables settings.
4. Deploy! Vercel will automatically run the `postinstall: prisma generate` script and build your Next.js application.
