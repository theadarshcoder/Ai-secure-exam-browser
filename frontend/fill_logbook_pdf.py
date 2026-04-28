from __future__ import annotations

from datetime import date, timedelta
from io import BytesIO
from pathlib import Path
import math

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import black
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


INPUT_PDF = Path(r"C:\Users\adars\Downloads\OJL_Logbook_Section 1 & 2_FINAL (2).pdf")
OUTPUT_PDF = Path(
    r"C:\Users\adars\OneDrive\Desktop\code hub\OJT\Ai-secure-exam-browser\frontend\filled_OJL_Logbook_Adarsh_Pratap_Singh.pdf"
)


LEARNER = {
    "name": "Adarsh pratap singh",
    "registration": "251810700028",
    "start_date": "2nd February 2026",
    "program": "B. Tech CSE (AI/ML) 25-29",
    "semester": "2nd",
    "location": "Polaris School of Technology",
    "industry": "Futuretalks Services Private Limited",
    "designation": "Backend Developer Associate",
    "in_time": "3:30 PM",
    "out_time": "6:30 PM",
}


def ordinal(n: int) -> str:
    if 10 <= n % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def format_full_date(d: date) -> str:
    return f"{ordinal(d.day)} {d.strftime('%B %Y')}"


def generate_dates() -> list[date]:
    start = date(2026, 2, 2)
    end = date(2026, 4, 24)
    days: list[date] = []
    cur = start
    while cur <= end:
        if cur.weekday() != 6:
            days.append(cur)
        cur += timedelta(days=1)
    return days


DAILY_TOPICS = [
    {
        "objective": "Understand the secure exam platform architecture and backend workflow.",
        "work": "Reviewed the overall module flow covering auth, exams, monitoring, and result management.",
        "learning": "A well-planned backend structure improves security, maintainability, and integration readiness.",
        "notes": ["architecture notes", "module flow list", "backend checklist"],
        "outcome": "Built a clear foundation for the secure exam backend workflow.",
    },
    {
        "objective": "Review environment setup and backend dependency planning for the project.",
        "work": "Checked API flow requirements, service usage, and the backend support expected by frontend modules.",
        "learning": "Clean dependency planning helps avoid confusion when scaling backend services.",
        "notes": ["setup notes", "API dependency list", "service planning"],
        "outcome": "Organized the initial backend setup approach for the project.",
    },
    {
        "objective": "Study authentication flow and role-based access requirements.",
        "work": "Reviewed login handling, session flow, and role separation for Admin, Mentor, and Student users.",
        "learning": "RBAC is critical for protecting secure academic systems from privilege misuse.",
        "notes": ["RBAC notes", "role matrix", "auth flow map"],
        "outcome": "Strengthened understanding of secure role-based backend access.",
    },
    {
        "objective": "Plan user identity, token, and session management logic.",
        "work": "Analyzed JWT usage, session storage expectations, and device-aware login behavior.",
        "learning": "Stable session design is necessary for uninterrupted and secure exam access.",
        "notes": ["token notes", "session cases", "device binding points"],
        "outcome": "Mapped a stronger approach for session and identity handling.",
    },
    {
        "objective": "Review middleware and authorization checks for protected features.",
        "work": "Studied route protection, validation flow, and access control handling across secure modules.",
        "learning": "Centralized middleware reduces repeated logic and improves enforcement consistency.",
        "notes": ["middleware notes", "guard checklist", "validation review"],
        "outcome": "Improved the security model around protected backend operations.",
    },
    {
        "objective": "Examine exam creation and publishing workflow from the backend perspective.",
        "work": "Reviewed draft save, exam publish, invite generation, and deployment-ready data handling.",
        "learning": "Reliable exam publishing depends on clean validation and predictable response flow.",
        "notes": ["publish notes", "draft logic", "exam flow checklist"],
        "outcome": "Clarified the service flow behind secure exam creation.",
    },
    {
        "objective": "Study question management logic for different assessment types.",
        "work": "Reviewed support needs for MCQ, short answer, coding, and React lab question structures.",
        "learning": "Flexible schemas are important when one system handles multiple question formats.",
        "notes": ["question notes", "schema review", "editor mapping"],
        "outcome": "Built a better understanding of backend-ready question handling.",
    },
    {
        "objective": "Review validation requirements for question data and exam scheduling.",
        "work": "Checked metadata flow, timing constraints, and backend-side readiness for form submission.",
        "learning": "Good validation reduces runtime issues and protects assessment integrity.",
        "notes": ["validation notes", "timing checks", "form constraints"],
        "outcome": "Strengthened validation awareness for exam management features.",
    },
    {
        "objective": "Analyze invite token and candidate onboarding logic.",
        "work": "Reviewed secure invite verification, device checks, and candidate entry conditions for exams.",
        "learning": "Controlled entry flows help prevent unauthorized access and link misuse.",
        "notes": ["invite notes", "token checks", "candidate flow"],
        "outcome": "Improved understanding of secure exam invitation handling.",
    },
    {
        "objective": "Study identity verification support from the backend side.",
        "work": "Reviewed upload endpoints, candidate verification flow, and secure storage expectations for face and ID images.",
        "learning": "Identity services must combine reliability, privacy, and traceability.",
        "notes": ["ID verification notes", "upload review", "storage plan"],
        "outcome": "Clarified backend needs for candidate identity verification.",
    },
    {
        "objective": "Review file upload handling and verification asset management.",
        "work": "Studied image upload requests, status responses, and safe handling of verification documents.",
        "learning": "Upload services must be protected, validated, and easy to audit.",
        "notes": ["upload checklist", "asset handling", "security review"],
        "outcome": "Improved the backend strategy for file and image processing.",
    },
    {
        "objective": "Analyze real-time monitoring requirements for live exams.",
        "work": "Reviewed event streaming, session updates, and the data needed for real-time proctoring support.",
        "learning": "Live exam systems depend on timely event delivery and stable session state.",
        "notes": ["monitoring notes", "live event list", "session update map"],
        "outcome": "Built stronger insight into live backend monitoring flow.",
    },
    {
        "objective": "Study session telemetry and candidate activity logging.",
        "work": "Reviewed how gaze, noise, tab switch, and device-related events can be recorded and tracked.",
        "learning": "Detailed telemetry helps with both proctoring decisions and later review.",
        "notes": ["telemetry notes", "activity types", "logging checklist"],
        "outcome": "Strengthened the understanding of backend event logging.",
    },
    {
        "objective": "Review trust scoring and session risk evaluation flow.",
        "work": "Analyzed how activity signals can support trust score, flags, and risk-level updates.",
        "learning": "Scoring logic should stay explainable and consistent across sessions.",
        "notes": ["trust score notes", "risk logic", "signal mapping"],
        "outcome": "Clarified the logic behind risk-aware backend decisions.",
    },
    {
        "objective": "Study WebSocket and room-based messaging requirements.",
        "work": "Reviewed real-time room joins, help requests, admin actions, and live alert delivery.",
        "learning": "Socket-based systems need careful event design and state synchronization.",
        "notes": ["socket notes", "room flow", "message event list"],
        "outcome": "Improved understanding of real-time communication services.",
    },
    {
        "objective": "Review block, unblock, flag, and terminate operations for live sessions.",
        "work": "Analyzed the backend actions required to control candidate sessions during exams.",
        "learning": "Operational controls must be secure, fast, and fully traceable.",
        "notes": ["admin action notes", "control flow", "moderation checklist"],
        "outcome": "Strengthened the design view for live session control APIs.",
    },
    {
        "objective": "Study audit logging and accountability support.",
        "work": "Reviewed audit log needs for admin actions, candidate events, and backend activity traces.",
        "learning": "Audit logs improve debugging, compliance, and operational visibility.",
        "notes": ["audit notes", "traceability list", "log review"],
        "outcome": "Made the accountability layer of the platform more structured.",
    },
    {
        "objective": "Review dashboard statistics and reporting requirements.",
        "work": "Analyzed endpoints needed for results, live sessions, health cards, and admin summaries.",
        "learning": "Useful dashboards depend on clean aggregation and reliable backend metrics.",
        "notes": ["dashboard notes", "stats checklist", "report fields"],
        "outcome": "Improved understanding of analytics-ready backend responses.",
    },
    {
        "objective": "Study result processing and evaluation support.",
        "work": "Reviewed result retrieval, evaluation APIs, and grading-related service expectations.",
        "learning": "Assessment systems must keep scoring flow accurate and review-friendly.",
        "notes": ["result notes", "grading flow", "evaluation checklist"],
        "outcome": "Clarified the backend responsibilities in result management.",
    },
    {
        "objective": "Analyze coding assessment execution support.",
        "work": "Reviewed code run flow, submission handling, and response needs for coding questions.",
        "learning": "Automated judging depends on stable request handling and consistent result output.",
        "notes": ["coding API notes", "run flow", "submission review"],
        "outcome": "Strengthened understanding of coding evaluation backend support.",
    },
    {
        "objective": "Review short-answer review flow for mentors.",
        "work": "Studied session detail access, grading updates, and mentor-side evaluation support logic.",
        "learning": "Review workflows need both flexibility and clear data traceability.",
        "notes": ["mentor review notes", "grading update flow", "session detail list"],
        "outcome": "Improved the review design for evaluated answers.",
    },
    {
        "objective": "Study candidate result visibility and publication logic.",
        "work": "Reviewed result publish flow, access control, and final response visibility for students.",
        "learning": "Published results should remain secure, accurate, and role-aware.",
        "notes": ["publish result notes", "access review", "visibility checks"],
        "outcome": "Clarified the service flow for controlled result release.",
    },
    {
        "objective": "Review system health and admin operations support.",
        "work": "Analyzed backend needs for health checks, admin settings, and operational endpoints.",
        "learning": "Operational dashboards depend on lightweight and trustworthy health responses.",
        "notes": ["health notes", "ops checklist", "admin support flow"],
        "outcome": "Improved understanding of platform operations support.",
    },
    {
        "objective": "Study candidate and user management service requirements.",
        "work": "Reviewed add user, remove user, bulk import, and candidate verification backend flows.",
        "learning": "User management needs strong validation and safe role separation.",
        "notes": ["user management notes", "bulk import list", "verification checks"],
        "outcome": "Strengthened the user administration service design.",
    },
    {
        "objective": "Review API error handling and defensive responses.",
        "work": "Studied failure cases, authorization errors, and user-safe backend response practices.",
        "learning": "Clear errors improve debugging while protecting the system from information leaks.",
        "notes": ["error handling notes", "response review", "failure cases"],
        "outcome": "Improved awareness of safer backend error behavior.",
    },
    {
        "objective": "Analyze performance and data flow optimization needs.",
        "work": "Reviewed repeated service calls, state sync needs, and opportunities for cleaner response handling.",
        "learning": "Performance tuning starts with understanding where data moves most often.",
        "notes": ["performance notes", "response flow", "optimization ideas"],
        "outcome": "Identified areas where backend flow can be made more efficient.",
    },
    {
        "objective": "Review integration between secure frontend flow and backend services.",
        "work": "Checked how login, invite, exam, verification, and monitoring modules depend on service contracts.",
        "learning": "Well-matched contracts reduce frontend-backend mismatch during execution.",
        "notes": ["integration notes", "contract review", "module linkage"],
        "outcome": "Built stronger system-level understanding across connected modules.",
    },
    {
        "objective": "Study security hardening points in the platform backend.",
        "work": "Reviewed role checks, input validation, audit traces, and sensitive action handling.",
        "learning": "Security becomes stronger when checks are consistent at every service layer.",
        "notes": ["security notes", "hardening list", "check coverage"],
        "outcome": "Improved the security-oriented backend review process.",
    },
    {
        "objective": "Review final integration behavior across core modules.",
        "work": "Revisited authentication, exam management, verification, telemetry, and results as one connected system.",
        "learning": "Full-system review helps expose weak links between otherwise stable modules.",
        "notes": ["final review notes", "integration checklist", "module summary"],
        "outcome": "Consolidated the backend understanding of the secure exam platform.",
    },
    {
        "objective": "Prepare documentation and wrap-up notes for completed backend work.",
        "work": "Compiled daily learnings into structured technical notes for review and viva preparation.",
        "learning": "Clear documentation makes project understanding easier to present and defend.",
        "notes": ["documentation notes", "viva points", "backend summary"],
        "outcome": "Completed a clean backend-oriented summary of the OJL work.",
    },
]


def build_entry(day_index: int, work_date: date) -> dict[str, object]:
    topic = DAILY_TOPICS[day_index % len(DAILY_TOPICS)]
    return {
        "date": format_full_date(work_date),
        "objective": topic["objective"],
        "work": topic["work"],
        "learning": topic["learning"],
        "notes": topic["notes"],
        "outcome": topic["outcome"],
    }


def wrap_text(text: str, font_name: str, font_size: float, max_width: float) -> list[str]:
    words = text.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = word if not current else f"{current} {word}"
        if stringWidth(candidate, font_name, font_size) <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def fit_text(text: str, font_name: str, font_size: float, max_width: float, max_lines: int) -> tuple[list[str], float]:
    size = font_size
    while size >= 9:
        lines = wrap_text(text, font_name, size, max_width)
        if len(lines) <= max_lines:
            return lines, size
        size -= 0.5
    lines = wrap_text(text, font_name, 9, max_width)[:max_lines]
    return lines, 9


def draw_block(c: canvas.Canvas, *, text: str, x: float, y: float, width: float, max_lines: int, base_size: float = 12.8, line_gap: float = 26) -> None:
    lines, size = fit_text(text, "Helvetica", base_size, width, max_lines)
    effective_gap = line_gap if size >= 12 else 22
    c.setFont("Helvetica", size)
    current_y = y
    for line in lines:
        c.drawString(x, current_y, line)
        current_y -= effective_gap


def draw_list(c: canvas.Canvas, *, items: list[str], x: float, y: float, width: float, max_lines: int = 3, base_size: float = 12.8, line_gap: float = 26) -> None:
    lines: list[str] = []
    size = base_size
    while size >= 9:
        lines = []
        for item in items:
            wrapped = wrap_text(item, "Helvetica", size, width)
            lines.extend(wrapped[:1])
        if len(lines) <= max_lines:
            break
        size -= 0.5
    lines = lines[:max_lines]
    effective_gap = line_gap if size >= 12 else 22
    c.setFont("Helvetica", size)
    current_y = y
    for line in lines:
        c.drawString(x, current_y, line)
        current_y -= effective_gap


def cover_overlay(width: float, height: float) -> BytesIO:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height))
    c.setFillColor(black)

    c.setFont("Helvetica", 12)
    c.drawString(177, 284, LEARNER["name"])
    c.drawString(170, 254, LEARNER["registration"])
    c.drawString(452, 254, LEARNER["start_date"])
    c.drawString(167, 224, LEARNER["program"])
    c.drawString(147, 194, LEARNER["semester"])
    c.drawString(257, 194, LEARNER["location"])
    c.drawString(212, 164, LEARNER["industry"])

    c.save()
    buffer.seek(0)
    return buffer


def daily_overlay(width: float, height: float, entry: dict[str, object]) -> BytesIO:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=(width, height))
    c.setFillColor(black)

    c.setFont("Helvetica", 11)
    c.drawString(130, 747, str(entry["date"]))

    c.setFont("Helvetica", 10.5)
    c.drawString(402, 747, LEARNER["in_time"])
    c.drawString(496, 747, LEARNER["out_time"])
    c.drawString(132, 718, LEARNER["program"])

    c.setFont("Helvetica", 9.4)
    c.drawString(379, 719, LEARNER["designation"])

    draw_block(
        c,
        text=str(entry["objective"]),
        x=81,
        y=641,
        width=420,
        max_lines=4,
    )
    draw_block(
        c,
        text=str(entry["work"]),
        x=78,
        y=450,
        width=420,
        max_lines=3,
    )
    draw_block(
        c,
        text=str(entry["learning"]),
        x=77,
        y=299,
        width=420,
        max_lines=2,
    )
    draw_list(
        c,
        items=list(entry["notes"]),
        x=76,
        y=157,
        width=210,
        max_lines=3,
    )
    draw_block(
        c,
        text=str(entry["outcome"]),
        x=347,
        y=166,
        width=170,
        max_lines=3,
    )

    c.save()
    buffer.seek(0)
    return buffer


def main() -> None:
    reader = PdfReader(str(INPUT_PDF))
    writer = PdfWriter()

    dates = generate_dates()
    entries = [build_entry(i, d) for i, d in enumerate(dates)]

    daily_start_index = 7  # physical page 8

    for idx, page in enumerate(reader.pages):
        if idx == 2:
            overlay_pdf = PdfReader(cover_overlay(float(page.mediabox.width), float(page.mediabox.height)))
            page.merge_page(overlay_pdf.pages[0])
        elif daily_start_index <= idx < daily_start_index + len(entries):
            entry = entries[idx - daily_start_index]
            overlay_pdf = PdfReader(daily_overlay(float(page.mediabox.width), float(page.mediabox.height), entry))
            page.merge_page(overlay_pdf.pages[0])
        writer.add_page(page)

    OUTPUT_PDF.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PDF.open("wb") as f:
        writer.write(f)

    print(f"Created: {OUTPUT_PDF}")
    print(f"Entries filled: {len(entries)}")


if __name__ == "__main__":
    main()
