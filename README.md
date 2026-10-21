# 🎨 Team 262 — Frontend Client

User interface for the **Team 262** web application. Built as a Single Page Application (SPA) with React and Vite, packaged into an ultra-lightweight Nginx Alpine container for cloud deployment.

---

## 💻 Tech Stack

* **Library:** React (JSX)
* **Build Tool & Bundler:** Vite (with HMR)
* **Language:** JavaScript (ESModules)
* **Code Quality:** ESLint (`eslint.config.js`)
* **Package Manager:** npm
* **Production Web Server:** Nginx 1.27 (Alpine Linux)

---

## 🚀 Local Development Setup

### Prerequisites
* **Node.js:** v20 LTS or higher
* **npm:** v10 or higher

### Quick Start

1. **Install project dependencies:**
    ```bash
    npm install
    ```

2.  **Start the local development server:**
    ```Bash
    npm run dev
    ```

3. **Run ESLint code quality checks:**

    ```Bash
    npm run lint
    ```

4. **Build the production bundle (outputs to dist/):**

    ```Bash
    npm run build
    ```

5. **Preview the production bundle locally:**

    ```Bash
    npm run preview
    ```

---

## 🐳 Docker Containerization (Production Mode)
The project uses a **Multi-Stage** Dockerfile:

* **Stage 1 `(build)`**: Compiles React/Vite source code into static assets using node:20-alpine.

* **Stage 2 `(runtime)`**: Serves compiled static files from `/usr/share/nginx/html` using `nginx:1.27-alpine` (~25 MB image size).

### Build and Run Locally via Docker
1. **Build the production image:**

    ```Bash
    docker build -t team262-frontend:local .
    ```

2. **Start the container on port `8080`:**

    ```Bash
    docker run -d --name team262_frontend -p 8080:80 team262-frontend:local
    ```

3. **Verify container health and logs:**

    ```Bash
    docker ps
    docker logs team262_frontend
    ```
Open `http://localhost:8080` in your browser.

## 📖 Contribution & Git Flow Guidelines
Direct pushes to `main` and `develop` branches are restricted by Branch Protection Rules.

Please read our [CONTRIBUTING.md](CONTRIBUTING.md) guide for branch naming conventions (`feature/T2-XX-...`), Pull Request rules, and local setup instructions.
