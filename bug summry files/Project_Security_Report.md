# 🛡️ VISION: Enterprise Exam Security Hardening Report

## 1. Executive Summary
Is phase me humne VISION platform ko ek simple web-app se upgrade karke ek **Hardened Hybrid Proctoring System** me convert kiya hai. Hamara main goal tha **"Zero-Trust Security"** — yaani backend kisi bhi request par tab tak bharosa nahi karega jab tak wo hamare verified **Secure Browser (Electron)** se na aayi ho.

---

## 2. The Hybrid Architecture
Humne ek **Dual-Layer Defense** design kiya hai:
1.  **Frontend (React)**: Standard UI for exam delivery.
2.  **Secure Client (Electron)**: Ek specialized container jo OS-level access control provide karta hai.
3.  **Backend (Node.js/Express + Redis)**: Jo har request ko dynamic signatures (HMAC) ke liye verify karta hai.

---

## 3. Key Security Features (V1 to V6)

### 🚀 A. Secure Client Enforcement (Mandatory Electron)
- Exam sirf hamare custom Electron browser me hi chal sakta hai.
- Chrome, Firefox ya Postman se aane wali requests ko backend **403 Forbidden** mark kar deta hai.

### 🔐 B. V4/V5 Hardened Verification Layer
Humne 4-way verification implement kiya hai:
1.  **Deep Fingerprinting**: `User-Agent + Platform + Screen Resolution` ka unique hash.
2.  **Anti-Replay Nonces**: Redis ka use karke hum har request ko unique banate hain. Ek baar use hone wala "Nonce" dubara use nahi ho sakta (prevents packet sniffing).
3.  **Clock-Sync (Timestamping)**: 2-minute window check. Purani requests (replay attacks) automatically fail ho jati hain.
4.  **Baseline Binding**: Exam start hone ke waqt ka screen resolution save ho jata hai. Agar student monitor badalta hai ya window resize karta hai, toh system use flag kar deta hai.

### 📱 C. Electron Hardening (OS-Level)
- **Screenshot/Recording Block**: `setContentProtection(true)` se screen capture black ho jata hai.
- **Navigation Lock**: User URL change nahi kar sakta, menu-bar disabled hai.
- **Zoom Lock**: Ctrl+/- disabled hai taaki proctoring camera hide na ho sake.

### 💓 D. Live Heartbeat & Liveness Binding
- Student ka browser har 30 sec me backend ko "I am here" signal bhejta hai.
- Agar heartbeat 90 sec tak nahi aati, toh backend use **Disconnected/Security Breach** mark karke session block kar deta hai.

---

## 4. Admin Live Monitoring & Risk Engine
Mentors ke liye humne ek **Real-time Dashboard** banaya hai jo ye features deta hai:
- **Risk Scoring**: 0-100 scale par student ka cheating probability score (based on violations).
- **Live Status**: Pulse animation for active students.
- **Direct Control**: Admin ek click me kisi bhi student ka exam terminate ya block kar sakta hai.
- **Heatmap**: Red (Critical), Amber (Suspicious), aur Green (Safe) coding based on risk analysis.

---

## 5. Technical Flow (Mentor ke liye Quick Explain)
1.  **Electron App** hardware details (Fingerprint) read karta hai.
2.  **Preload Script** ek HMAC-SHA256 hash generate karta hai using a `SECRET_KEY`.
3.  **Frontend Interceptor** har request me Nonce, Timestamp aur Hash inject karta hai.
4.  **Backend Middleware** Redis se nonce verify karta hai aur secret key se hash re-calculate karta hai.
5.  **Validation Success** hone par hi database update hota hai, warna session turant flag ho jata hai.

---

## 🏁 Conclusion
Ye system ab sirf web security par nahi, balki **Environmental Security** par kaam karta hai. Ye spoofing, replay attacks, aur browser-level cheating ko effectively prevent karta hai.

**Current Status**: 🧪 Trial Run Phase (Ready for Validation).
