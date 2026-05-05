# Algorithms & Techniques Used in Vision Secure Exam Browser

A plain-English guide to every algorithm, technique, and logic pattern used in this project.


---


## 1. AUTHENTICATION & SECURITY


### 1.1 Password Hashing — bcrypt (10 salt rounds)

File: models/User.js

When a user registers, their plain-text password is never stored.
Instead, bcrypt generates a random "salt" (random text), mixes it with the password,
and runs it through a one-way hashing function 10 times.
The result is a scrambled string that cannot be reversed back to the original password.

Why 10 rounds — Each round doubles the computation time.
10 rounds takes about 100ms, fast enough for users but too slow for attackers trying millions of passwords.


### 1.2 JWT (JSON Web Token) — HS256

File: controllers/authController.js, middlewares/authMiddleware.js

After login, the server creates a small signed "pass" (the JWT) containing the user's ID, role,
and session version. It's signed using HMAC-SHA256 with a secret key. Every time the user
makes a request, this token is sent in the header and verified.

- Access Token expires in 1 hour.
- Refresh Token expires in 7 days and uses a separate secret key.


### 1.3 Refresh Token Rotation

File: controllers/authController.js → refresh()

Every time a refresh token is used, a brand new one is generated and the old one is thrown away.
If someone tries to reuse an old refresh token, the system assumes the token was stolen
and kills all sessions for that user.


### 1.4 Session Versioning

File: models/User.js, authMiddleware.js

Every user has a "sessionVersion" number in the database.
Each login bumps this number by 1. If a token's version doesn't match the database version,
it's rejected. This is how "logging out from all devices" works —
just bump the version and every old token becomes invalid.


### 1.5 Device Fingerprinting

File: controllers/authController.js

When a student logs in, their device ID is saved.
If someone tries to log in from a different device while an exam is active, the system blocks it
(unless they force-login). This prevents students from sharing login credentials during exams.


### 1.6 HMAC-SHA256 Deep Hashing

File: utils/securityUtils.js

Creates a unique hash from the user's browser fingerprint (user agent, platform, screen size).
This hash is used to verify that requests are coming from the same browser that started the session.


### 1.7 Anti-Replay Attack (Nonce Check)

File: utils/securityUtils.js

Every secure request includes a one-time-use random number (nonce).
After use, the nonce is stored in Redis for 5 minutes. If the same nonce appears again,
the request is rejected. This stops attackers from recording and replaying old requests.


### 1.8 Stale Request Detection (Timestamp Window)

File: utils/securityUtils.js

Each request includes a timestamp. If the timestamp is more than 2 minutes old,
the request is rejected. This prevents attackers from saving old requests and sending them later.


---


## 2. RATE LIMITING


### 2.1 Sliding Window Rate Limiter

File: middlewares/rateLimiter.js

Limits how many requests a user can make in a given time window.
Uses Redis as storage so rate limits work correctly even if the server is running on multiple machines.

    Limiter              Window         Student Limit    Admin Limit
    ─────────────────    ───────────    ─────────────    ───────────
    Code Execution       10 seconds     1 request        100 requests
    Telemetry            1 minute       20 requests      500 requests
    External Import      1 minute       5 requests       50 requests
    Autosave             30 seconds     20 requests      100 requests
    Secure Actions       1 minute       10 requests      10 requests
    Invite Verify        15 minutes     20 requests      20 requests
    Force Login          5 minutes      10 attempts      —


### 2.2 Combined Key Generator (IP + User ID)

File: middlewares/rateLimiter.js

Rate limits are tracked per IP + UserID combination instead of just IP.
This prevents one student in a hostel or college (shared IP) from accidentally
blocking everyone else on the same network.


---


## 3. EXAM GRADING


### 3.1 MCQ Grading — Direct Comparison

File: services/gradingService.js → gradeMCQ()

Simply compares the student's selected option number with the correct option number.
If they match, full marks. If not, zero. No partial marks.


### 3.2 Coding Question Grading — Test Case Execution via Judge0

File: services/gradingService.js → gradeCoding()

How it works step by step:

    Step 1 → Takes the student's code.
    Step 2 → Auto-detects the function name using regex pattern matching.
    Step 3 → Wraps the code with a "driver" that calls the function with the test input
             and prints the output.
    Step 4 → Sends the wrapped code to Judge0 (external code execution engine)
             to run it safely in a sandbox.
    Step 5 → Compares the output with the expected output using normalized string comparison
             (lowercased, whitespace trimmed).
    Step 6 → Marks are given proportionally.
             Example: 3 out of 4 test cases pass = 75% of the marks.


### 3.3 Auto-Wrap Student Code (Function Detection)

File: services/gradingService.js → wrapStudentCode()

If the student writes only a function (no console.log or print), the system automatically
detects the function name using regex and adds a print statement to call it.
This way, the student doesn't need to worry about input/output handling.

    JavaScript regex — Matches "function foo(", "const foo = (", "let foo = ("
    Python regex     — Matches "def foo("


### 3.4 Short Answer Grading — AI + Keyword Fallback

File: services/gradingService.js → gradeShortAnswer()

Uses a 3-tier fallback approach:

    Tier 1 — Gemini AI:
        Sends the question, expected answer, and student answer to Google's Gemini API.
        The AI returns suggested marks, confidence level, and reasoning.

    Tier 2 — OpenAI:
        If Gemini is not configured or fails, tries OpenAI GPT-3.5 Turbo with the same prompt.

    Tier 3 — Keyword Matching:
        If no AI is available, falls back to a keyword matching algorithm.

Important: All short answers are marked as "pending review" regardless of AI scoring.
A human reviewer always has the final say.


### 3.5 Keyword Matching Algorithm

File: services/gradingService.js → gradeWithKeywords()

How it works step by step:

    Step 1 → Removes all punctuation and special characters from both answers.
    Step 2 → Splits text into individual words.
    Step 3 → Removes common "stop words" (the, is, at, which, etc.) — 40+ words in the list.
    Step 4 → Only keeps words with 3 or more characters.
    Step 5 → Removes duplicate keywords from the expected answer.
    Step 6 → Counts how many expected keywords appear in the student's answer.
    Step 7 → Calculates a match ratio: matched / total expected keywords.
    Step 8 → Marks = ratio × max marks, rounded to nearest integer.

    Confidence levels:
        80%+ match   → high
        40-80% match → medium
        Below 40%    → low


### 3.6 React Lab Grading — Sandboxed DOM Testing

File: services/frontendGradingService.js

How it works step by step:

    Step 1 — Transpilation:
        Converts the student's JSX code to plain JavaScript using Babel.

    Step 2 — Security Check:
        Runs the transpiled code inside isolated-vm (a V8 sandbox with 128MB memory limit
        and 2-second timeout) to check for infinite loops or crashes.

    Step 3 — DOM Testing:
        Creates a virtual browser (JSDOM), injects the student's code, then runs each
        test case as a function that queries the DOM and returns true/false.

    Score is proportional to how many test cases pass.


### 3.7 String Normalization for Output Comparison

File: services/gradingService.js → normalize()

Before comparing student output with expected output, both strings are lowercased
and all consecutive whitespace is collapsed into a single space.
This prevents students from losing marks due to extra spaces or different capitalization.


---


## 4. STUDENT INTELLIGENCE & ANALYTICS


### 4.1 MongoDB Aggregation Pipeline

File: services/intelligenceService.js

Runs a single database query that computes everything in parallel using MongoDB's $facet operator:

    Overview             → Total exams, total percentage, passed exams, tab switches, all violations.
    Category Performance → Groups exams by category, calculates average score per category,
                           sorts best to worst.
    Recent Trend         → Gets the last 5 exam scores.
    Timeline             → Paginated exam history with full details.
    Total Count          → For pagination math.


### 4.2 Weighted Risk Scoring

File: services/intelligenceService.js

Calculates a 0 to 100 risk score for each student:

    Unverified identity    → +15 points
    Critical violation     → +5 points each
    High violation         → +3 points each
    Medium violation       → +2 points each
    Low violation          → +1 point each
    Each tab switch        → +0.5 points

    Formula: riskScore = (totalWeightedRisk / (totalExams × 10)) × 100, capped at 100

    Risk Levels:
        0 to 25   → Low
        26 to 60  → Medium
        61 to 100 → High


### 4.3 Improvement Trend Detection (Split-Half Comparison)

File: services/intelligenceService.js

    Step 1 → Takes the last 5 exam scores in chronological order.
    Step 2 → Splits them into two halves (first half and second half).
    Step 3 → Calculates the average of each half.
    Step 4 → If second half average is more than 5 points higher → "increasing".
    Step 5 → If second half average is more than 5 points lower → "declining".
    Step 6 → Otherwise → "stable".


### 4.4 Anomaly Detection (Score Spike Detection)

File: services/intelligenceService.js

    Step 1 → Calculates the student's historical average (excluding the latest exam).
    Step 2 → If the latest score is more than 25 points above the historical average,
             it flags a "Sudden Score Spike" anomaly.
    Step 3 → The threshold (25 points) is configurable via system settings.


### 4.5 Cheating Pattern Detection

File: services/intelligenceService.js

    If total tab switches > (total exams × 5) → "High Tab Switching"
    If average weighted risk per exam > 3     → "Frequent Rule Violations"
    Otherwise                                 → "Consistent"


### 4.6 Risk Level Classification

File: utils/helpers.js → getRiskInfo()

    0 violations    → Clean, Low risk, Score 100
    1-2 violations  → Minor, Low risk
    3-5 violations  → Moderate, Medium risk
    6-9 violations  → Serious, High risk
    10+ violations  → Critical risk


---


## 5. CACHING & PERFORMANCE


### 5.1 Three-Layer Cache (L1 → L2 → L3)

File: middlewares/authMiddleware.js, services/cacheService.js

Every authentication check goes through 3 layers:

    L1 — In-Memory (NodeCache)
        5-second TTL. Fastest. Stored in the server's RAM.

    L2 — Redis
        24-hour TTL. Shared across all server instances.
        Stores session version and permissions.

    L3 — MongoDB
        The source of truth.
        Only hit if both L1 and L2 miss.


### 5.2 Request Coalescing (Thundering Herd Protection)

File: middlewares/authMiddleware.js

If 100 requests from the same user arrive at the same millisecond, only the first one
hits the database. All others wait for and reuse the result of the first request.
Uses an inFlightRequests Map to track pending promises.


### 5.3 Cache Pre-Warming (Cold Start Prevention)

File: services/cacheService.js → preWarmCache()

When the server starts up, it immediately loads frequently-used data
(global settings, active exam metadata) into Redis.
This prevents the first users after a restart from experiencing slow responses.


### 5.4 SCAN-Based Pattern Deletion

File: services/cacheService.js → clearPattern()

When clearing cache by pattern (e.g., all keys for a specific user), uses Redis SCAN command
instead of KEYS. SCAN processes keys in small batches (100 at a time), which prevents
blocking the Redis server. KEYS would scan everything at once and freeze all other operations.


### 5.5 Pipeline Batch Deletion

File: services/cacheService.js → clearPattern()

Groups delete commands into batches of 100 and sends them as a single Redis pipeline.
This reduces network round trips from 100 individual calls to 1 batched call.


---


## 6. REAL-TIME MONITORING


### 6.1 Telemetry Buffering (Write Coalescing)

File: services/cacheService.js, services/healthMonitor.js

Instead of writing every single telemetry event to MongoDB immediately, events are pushed
to a Redis list. Every 30 seconds, the health monitor flushes the entire buffer to MongoDB
in one bulk insert. This reduces database write pressure during exams.


### 6.2 Atomic Pop-and-Clear (Redis Transaction)

File: services/cacheService.js → popAllTelemetryLogs()

Uses Redis MULTI command to atomically read all buffered logs AND delete the buffer
in one operation. This prevents race conditions where new logs could be lost between
reading and clearing.


### 6.3 Mass Disconnect Detection

File: services/healthMonitor.js

Tracks the number of connected students per exam. If more than 20 students disconnect
within 10 seconds, it triggers a "SERVER_OVERLOAD" critical alert.
Uses a simple comparison: previousCount - currentCount > 20.


### 6.4 Network Spike Detection

File: services/healthMonitor.js

Counts socket disconnections per exam in 10-second windows. If more than 15 disconnections
happen in one window, a "NETWORK_SPIKE" alert is sent. The counter resets every 10 seconds.


### 6.5 Alert Deduplication (Cooldown Timer)

File: services/healthMonitor.js

Prevents alert spam by tracking the last time each type of alert was sent per exam.

    Mass Disconnect cooldown → 60 seconds
    Network Spike cooldown   → 30 seconds
    High Errors cooldown     → 60 seconds


### 6.6 OS-Level Metrics Collection

File: services/healthMonitor.js

Uses Node.js "os" module to collect:

    CPU load average (1-minute)
    Memory usage percentage = (totalMemory - freeMemory) / totalMemory × 100


---


## 7. CODE EXECUTION


### 7.1 Judge0 Integration with Endpoint Failover

File: services/judge0.js

Sends student code to Judge0 (a sandboxed code execution API) for safe execution.
If the primary endpoint times out or fails, it automatically tries the next endpoint in the list.
Supports 8 languages: JavaScript, Python, C++, Java, C, TypeScript, Go, Rust.


### 7.2 Execution Timeout

File: services/judge0.js

Every code execution request has a 10-second hard timeout.
If Judge0 doesn't respond within 10 seconds, the request fails fast
and moves to the next endpoint.


---


## 8. EXTERNAL PROBLEM IMPORT


### 8.1 LeetCode GraphQL Scraper

File: utils/helpers.js → parseLeetCode()

    Step 1 → Extracts the problem slug from the URL.
    Step 2 → Sends a GraphQL query to LeetCode's API to fetch the problem title,
             HTML content, example test cases, difficulty, and topic tags.
    Step 3 → Uses Cheerio (HTML parser) to clean the HTML into readable text.
    Step 4 → Uses regex to extract expected outputs from <pre> blocks
             by matching text between "Output:" and "Explanation:".
    Step 5 → Auto-assigns marks based on difficulty: Easy = 2, Medium = 5, Hard = 10.


### 8.2 CodeChef HTML Scraper

File: utils/helpers.js → parseCodeChef()

    Step 1 → Fetches the problem page HTML using a browser-like User-Agent header.
    Step 2 → Uses Cheerio to extract the problem title and statement.
    Step 3 → If the URL is a course link (/learn/course/), it auto-converts to
             the public practice URL.
    Step 4 → Validates that the extracted content is at least 50 characters long.


---


## 9. BACKGROUND JOB PROCESSING


### 9.1 Redis-Based Job Queues

File: queues/codeGradingQueue.js, frontendGradingQueue.js, intelligenceQueue.js, inviteEmailQueue.js

Heavy operations (code grading, React lab grading, intelligence reports, email sending)
are pushed into Redis-backed queues. Worker processes pick up jobs and process them
asynchronously so the main API stays fast.


### 9.2 Intelligence Report Pre-computation

File: queues/intelligenceWorker.js

After a student submits an exam, a background job pre-computes their full intelligence report
and stores it in Redis cache. When an admin later opens the student's dashboard,
the data loads instantly from cache instead of running a heavy database aggregation.


---


## 10. FRONTEND ALGORITHMS


### 10.1 Performance Trend Visualization

File: pages/StudentIntelligenceDashboard.jsx

Takes the student's exam timeline data, reverses it to chronological order,
formats dates to "Month Day" format, and plots scores as a smooth area chart with gradient fill.


### 10.2 PDF Export (html2canvas + jsPDF)

File: pages/StudentIntelligenceDashboard.jsx

    Step 1 → Scrolls the page to the top.
    Step 2 → Uses html2canvas to take a screenshot of the entire dashboard at 1.2x scale.
    Step 3 → Converts the screenshot to JPEG format.
    Step 4 → Uses jsPDF to create a multi-page A4 PDF, splitting the image across pages
             if it's taller than one page.
    Step 5 → Hides UI-only elements (buttons, toggles) and shows PDF-only headers
             during capture.


---


## 11. DATA STRUCTURES USED

    Structure        Where Used                    Why
    ─────────────    ────────────────────────      ─────────────────────────────────────────
    HashMap/Object   Violations breakdown,         O(1) lookup for counting and permission
                     role permissions              checks

    Set              Stop words list,              O(1) membership check, auto-removes
                     keyword deduplication         duplicates

    Array            Test cases, exam timeline,    Ordered collection for sequential
                     chart data                    processing

    Map              In-flight request tracking    Key-value with any type as key,
                                                   better for dynamic keys

    Redis List       Telemetry buffer              FIFO queue for buffering write operations

    Redis String     Session cache,                Simple key-value with TTL for auto-expiry
                     nonce tracking


---


## 12. DESIGN PATTERNS USED

    Pattern                     Where Used              What it Does
    ────────────────────────    ──────────────────      ────────────────────────────────────
    Singleton                   Redis connection        Only one connection is created
                                                        and reused everywhere

    Strategy                    Grading service         Different grading strategies for each
                                                        question type (MCQ, Coding, Short, Lab)

    Chain of Responsibility     Short answer grading    Tries Gemini → OpenAI → Keywords,
                                                        stopping at first success

    Observer                    Socket.IO events        Real-time events broadcast to all
                                                        connected admins

    Queue / Worker              Background jobs         Separates heavy work from the
                                                        request-response cycle

    Cache-Aside                 Auth middleware          Check cache first, fall back to DB,
                                                        then update cache

    Circuit Breaker             Judge0 failover         If one endpoint fails, automatically
                                                        switches to the next


---

Last updated: May 2026
