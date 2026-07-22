# 🚀 IntelliDev AI

### **Build • Debug • Analyze • Explain**

<p align="center">
  <strong>An AI-powered developer workspace that helps you understand code, analyze repositories, debug problems, and build software faster.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/FastAPI-Python-009688?style=for-the-badge&logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google" alt="Gemini"/>
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL"/>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-deployment">Deployment</a>
</p>

---

## 🧠 What is IntelliDev AI?

**IntelliDev AI** is a full-stack, AI-powered developer assistant designed to make software development more intelligent, productive, and accessible.

Instead of switching between multiple tools for understanding code, debugging errors, analyzing repositories, and asking technical questions, IntelliDev AI brings these capabilities together inside a unified developer workspace.

Powered by modern AI models and a scalable full-stack architecture, IntelliDev AI can help developers:

* 💬 Ask technical questions using natural language
* 🐛 Understand and debug code
* 🔍 Analyze complete projects and codebases
* 📂 Understand unfamiliar project structures
* 🐙 Analyze GitHub repositories
* 🧠 Generate explanations for complex code
* ⚡ Accelerate everyday development workflows

> **IntelliDev AI — Your intelligent companion for building, understanding, and improving software.**

---

# ✨ Features

## 💬 AI Chat Assistant

Interact with AI models through a modern conversational interface.

* Ask programming questions
* Get technical explanations
* Generate code snippets
* Understand programming concepts
* Troubleshoot development problems
* Receive contextual coding assistance

---

## 🧑‍💻 Code Intelligence

Use AI to understand and improve your code.

* Explain complex code
* Identify potential bugs
* Suggest improvements
* Refactor code
* Generate code snippets
* Improve readability and maintainability

---

## 📊 AI Project Explainer

Understand large and unfamiliar codebases faster.

IntelliDev AI can analyze project structures and provide insights into:

* Project architecture
* Directory structure
* Important files
* Technologies used
* Application flow
* Dependencies
* Key modules and components

This makes it easier for developers to onboard onto new projects and understand existing systems.

---

## 🐙 GitHub Repository Analyzer

Connect your development workflow with GitHub.

Analyze repositories to understand:

* Repository structure
* Source code organization
* Technologies and frameworks
* Important files
* Project architecture
* Overall functionality

> Built to reduce the time required to manually explore unfamiliar repositories.

---

## 🎨 Modern Developer Experience

Designed with a clean and modern developer-focused interface.

* ⚡ Next.js App Router
* 🎨 Tailwind CSS
* ✨ Framer Motion animations
* 🧩 Lucide Icons
* 📱 Responsive design
* 🌙 Modern developer workspace experience

---

## 🔐 Secure Authentication

User authentication and data management powered by:

* NextAuth
* Prisma ORM
* PostgreSQL
* Secure environment configuration

---

# 🏗️ Architecture

IntelliDev AI follows a modular full-stack architecture with a dedicated frontend and AI backend.

```text
                         ┌─────────────────────────┐
                         │        User             │
                         │   Developer Workspace   │
                         └────────────┬────────────┘
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │      Next.js Frontend   │
                         │                         │
                         │  • AI Chat              │
                         │  • Project Explorer     │
                         │  • GitHub Analyzer      │
                         │  • Authentication       │
                         └────────────┬────────────┘
                                      │
                               REST API / HTTP
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │      FastAPI Backend    │
                         │                         │
                         │  • AI Services          │
                         │  • Project Analysis     │
                         │  • GitHub Analysis      │
                         │  • API Endpoints        │
                         └────────────┬────────────┘
                                      │
                         ┌────────────┴────────────┐
                         ▼                         ▼
              ┌──────────────────┐     ┌──────────────────┐
              │   Google Gemini  │     │    PostgreSQL    │
              │    AI Models     │     │    Database      │
              └──────────────────┘     └──────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

| Technology        | Purpose                     |
| ----------------- | --------------------------- |
| **Next.js**       | Full-stack React framework  |
| **React**         | UI development              |
| **TypeScript**    | Type-safe development       |
| **Tailwind CSS**  | Styling and responsive UI   |
| **Framer Motion** | Animations and interactions |
| **Lucide Icons**  | UI icons                    |
| **NextAuth**      | Authentication              |
| **Prisma**        | Database ORM                |

## Backend

| Technology        | Purpose                        |
| ----------------- | ------------------------------ |
| **Python**        | Backend programming language   |
| **FastAPI**       | High-performance API framework |
| **Uvicorn**       | ASGI server                    |
| **Google Gemini** | AI-powered code assistance     |
| **REST APIs**     | Frontend-backend communication |

## Database

| Technology     | Purpose                               |
| -------------- | ------------------------------------- |
| **PostgreSQL** | Persistent application database       |
| **Prisma ORM** | Database access and schema management |

## Development & Deployment

* Git
* GitHub
* Docker-ready architecture
* Vercel
* Render / Railway

---

# 📂 Project Structure

```text
IntelliDev-AI/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── prisma/
│   ├── public/
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   └── main.py
│   │
│   ├── requirements.txt
│   └── .env
│
├── README.md
└── LICENSE
```

> The exact structure may vary depending on the latest implementation.

---

# 🚀 Getting Started

Follow these steps to run IntelliDev AI locally.

## 📋 Prerequisites

Make sure you have the following installed:

* **Node.js 18+**
* **Python 3.10+**
* **PostgreSQL**
* **Git**
* A **Google Gemini API Key**

---

## 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/IntelliDev-AI.git
cd IntelliDev-AI
```

---

# ⚙️ Backend Setup

Navigate to the backend:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

Backend API:

```text
http://localhost:8000
```

FastAPI Swagger documentation:

```text
http://localhost:8000/docs
```

---

# 💻 Frontend Setup

Open a new terminal and navigate to:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/intellidev"
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXTAUTH_SECRET="your_secure_random_secret"
```

Generate Prisma Client:

```bash
npx prisma generate
```

Push the database schema:

```bash
npx prisma db push
```

Start the development server:

```bash
npm run dev
```

Open your browser:

```text
http://localhost:3000
```

---

# 🔐 Environment Variables

## Backend

```env
GEMINI_API_KEY=your_gemini_api_key
```

## Frontend

```env
DATABASE_URL="your_postgresql_database_url"
NEXT_PUBLIC_API_URL="http://localhost:8000"
NEXTAUTH_SECRET="your_secure_random_secret"
```

> ⚠️ Never commit `.env` files or API keys to GitHub.

Add the following to your `.gitignore`:

```gitignore
.env
.env.local
.env.production
venv/
__pycache__/
node_modules/
.next/
```

---

# 🔌 API

The backend exposes REST APIs through FastAPI.

### Base URL

```text
http://localhost:8000
```

### API Documentation

```text
http://localhost:8000/docs
```

The Swagger UI can be used to explore and test available endpoints.

Example API workflow:

```text
Frontend
   │
   │ HTTP Request
   ▼
FastAPI Backend
   │
   ├──► AI Service
   │       │
   │       └──► Google Gemini
   │
   ├──► Project Analyzer
   │
   └──► GitHub Analyzer
   │
   ▼
Response
   │
   ▼
Next.js Frontend
```

---

# 🚢 Deployment

IntelliDev AI can be deployed using separate frontend and backend services.

## Frontend — Vercel

Recommended for the Next.js application.

1. Push your project to GitHub.
2. Import the repository into Vercel.
3. Set the project root directory to:

```text
frontend
```

4. Configure environment variables.
5. Deploy the application.

---

## Backend — Render / Railway

Deploy the FastAPI backend as a web service.

### Root Directory

```text
backend
```

### Build Command

```bash
pip install -r requirements.txt
```

### Start Command

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After deployment, update the frontend environment variable:

```env
NEXT_PUBLIC_API_URL="https://your-backend-url.com"
```

Also configure CORS on the backend to allow requests from your deployed frontend.

---

# 🔒 Security

Security is an important part of IntelliDev AI.

Best practices include:

* Environment-based secret management
* API key protection
* Secure authentication
* Database-backed user management
* CORS configuration
* No sensitive credentials committed to GitHub

> **Never expose your Gemini API key, database credentials, or authentication secrets in your source code.**

---

# 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

### 1. Fork the repository

```bash
git clone https://github.com/YOUR_USERNAME/IntelliDev-AI.git
```

### 2. Create a new branch

```bash
git checkout -b feature/your-feature
```

### 3. Make your changes

### 4. Commit your changes

```bash
git commit -m "Add: your feature"
```

### 5. Push your branch

```bash
git push origin feature/your-feature
```

### 6. Open a Pull Request

---

# ⭐ Support

If you find **IntelliDev AI** useful or interesting:

⭐ Star this repository
🍴 Fork the project
🐛 Report issues
💡 Suggest new features
🤝 Contribute to the project

---

<p align="center">
  <sub>IntelliDev AI — Build • Debug • Analyze • Explain</sub>
</p>
