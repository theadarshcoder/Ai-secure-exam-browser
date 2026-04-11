# Secure Exam Browser - Vision

An enterprise-grade, secure, and scalable exam proctoring and assessment platform.

## 🚀 Technical Architecture

We have designed the system to be **highly scalable and crash-proof** by using a hybrid data persistence strategy:

- **Redis for Caching**: Every exam session's progress (answers, time remaining, etc.) is cached in Redis for high-speed, real-time access.
- **Database Fallback**: A background synchronization process ensures that data is persisted to MongoDB, providing a robust fallback mechanism in case of session interruptions.
- **Request Tracing**: Every request is tagged with a unique UUID (`X-Request-Id`), allowing for end-to-end distributed tracing and easier debugging.

> [!NOTE]
> **Scalability Statement**: "We are using Redis for caching with DB fallback for scalability."

## 🛡️ Security Features

- **Tab Switch Detection**: Visual lockdown (Blur + Grayscale) and socket broadcasting on tab switching/minimizing.
- **RCE Prevention**: Strict verification of active exam sessions before executing code via Judge0.
- **Role Hardening**: Strict registration controls to prevent role spoofing.
- **Rate Limiting**: Intelligent brute-force protection using `express-rate-limit`.

## 🗺️ Technical Roadmap (Future Optimizations)

Our goal is to evolve into a **distributed, highly performant** architecture:

### Phase 2: Database Scalability (Optimization)
**Problem**: Currently, the `ExamSession` document stores all `answers` and `questionResults`. For exams with 100+ questions, this can result in heavy documents that hit MongoDB's 16MB limit.

**Solution: Split Data Strategy**
1. **New Collection**: `ExamAnswer`
   - Fields: `sessionId`, `questionId`, `answer`, `result`, `marks`.
2. **Decoupled Flow**: Instead of saving one large document, progress will be saved per-question as individual records.
3. **API Evolution**: Implement discrete `saveAnswer()`, `getAnswers()`, and `submitExam()` endpoints to minimize payload sizes and increase scalability.

---
*Built with ❤️ for secure assessments.*
