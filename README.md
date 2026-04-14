# Vision — Secure AI-Powered Exam Browser & Proctoring Platform

Vision is a modern, highly secure, and feature-rich examination platform designed to host programming and theoretical assessments. It provides a robust, anti-cheat environment built to handle live, real-time proctoring, AI-assisted grading, and identity verification seamlessly.

This platform bridges the gap between students giving remote exams and mentors/admins requiring strict supervision, ensuring 100% academic integrity.

## 🚀 Key Features (0 to 100%)

### 1. 🛡️ Military-Grade Anti-Cheat & Proctoring
- **Strict Lockdown:** Exam sessions operate in a forced fullscreen mode. Exiting fullscreen logs a severe violation.
- **Tab & Window Tracking:** Built-in visibility listeners track if a student switches tabs or opens another app. High-severity violations trigger immediate background webcam snapshots.
- **Violation Thresholds:** Customizable thresholds where the exam is automatically terminated if a student breaches the violation limit.
- **Copy-Paste Restrictions:** Right-click, copy, paste, and developer console shortcuts are completely disabled during an active exam.

### 2. 📷 Smart eKYC & Identity Verification
- **Pre-Exam Verification:** Before entering an exam, students must pass through an identity verification gateway.
- **Dual Photo Capture:** Students capture a live selfie (face scan) followed by a physical ID Card photo using the built-in HTML5 camera sequence.
- **Mentorship Approval:** These photos are stored securely and appear on the Admin Dashboard natively so administrators can selectively approve or revoke candidate access.

### 3. ☁️ Lifetime-Free Cloud Storage Engine
- Integrated natively with **Cloudinary** for scalable, zero-cost media storage.
- Random interval face snapshots and violation-triggered screenshots are silently captured, optimized, and uploaded to a dedicated `vision/` vault.
- CSV imports and image uploads do not choke the local server.

### 4. 👨‍💻 Real-Time Exam App (Exam Cockpit)
- Contains a live **Code Editor** powered by Judge0 for instantaneous Code Compilation and execution in dozens of languages.
- Allows Multiple Choice Questions (MCQs), Subjective/Short Answers, and Code Questions inside the same exam.
- **Live Mentor Chat:** Students can trigger a "Get Help" signal to live mentors via WebSockets, allowing silent assistance without breaking proctoring rules.

### 5. 👑 Multi-Tiered Dashboards

#### **Admin Dashboard:**
- Complete global oversight of the application.
- Live system health, aggregated statistics, and complete Audit logs tracking who did what.
- Role-based User Management (Invite Mentors, Super Mentors, restrict access).
- "Candidates" verification board to review eKYC images.

#### **Mentor Dashboard:**
- Mentors can create custom exams, import questions, and set passing marks.
- Live View: Watch students taking exams in real-time, view their current violation counts, and force-terminate malicious sessions instantly.
- Manual Grading: A beautiful interface to review and manually grade subjective code or short answers.

### 6. 🪄 Workflow Automation & Question Scrapers
- **One-Click Imports:** Bulk import users via simple CSV files.
- **Automated Grading:** For MCQs, the system instantly calculates and stores results in the DB.
- **Smart LeetCode / CodeChef Scraper:** A powerful scraper tool allows mentors to paste a LeetCode problem URL. The system visits the URL, extracts the problem description, hidden test cases, and memory limits, and formats it directly into the Exam Builder!

### 7. ⚡ Backend Architecture
- **Express + Node.js** robust API layer.
- **Redis Caching:** Rapid API responses and rate-limiting using Redis to prevent DDoS and spam registrations.
- **Queue System (Bull):** Complex tasks like grading huge codebase responses are pushed to a background task queue so the platform never freezes.

---

## 🛠️ Tech Stack

**Frontend Framework:**
* React 18 (Vite)
* Tailwind CSS (Custom sleek UI with conditional rendering & animations)
* Framer Motion (Fluid transitions)
* Monaco Editor (Code formatting inside the browser)
* Lucide React (Iconography)

**Backend Architecture:**
* Node.js & Express.js
* MongoDB via Mongoose (Persistent Storage)
* Redis (Caching & Rate Limiting queues)
* Socket.IO (Real-time Live Proctoring)

**External Services:**
* **Cloudinary:** Zero-cost image hosting & media optimization.
* **Judge0 CE:** Remote code execution and grading engine.
* **Puppeteer / Cheerio:** Problem scraping from coding spheres.

---

## 💻 How to Run Locally

### Prerequisites
Before running, assure you have **Node.js**, **MongoDB**, and optionally **Redis** running locally.

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
    ```bash
    cd backend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Create a `.env` file referencing your local/cloud configurations (MongoDB URI, Cloudinary Keys, Redis URL, JWT Secret).
4. Start the server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup
1. Open a second terminal and navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Create a `.env` file pointing `VITE_API_URL` to your backend port.
4. Run the UI:
    ```bash
    npm run dev
    ```

Visit `http://localhost:5173` to experience the ultimate Vision platform!

---

## 🔐 Security Information & Best Practices
- Passwords are salt hashed before storing (Bcrypt).
- Use `helmet` and standard CORS restrictions to keep APIs sanitized.
- Rate limits block brute force attempts for login endpoints.
- Ensure the Frontend always initiates audio/video permissions politely—browsers block silent camera triggers otherwise.

*Built with precision and passion for next-gen academic integrity.*
