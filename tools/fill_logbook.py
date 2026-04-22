from __future__ import annotations

from datetime import date, timedelta
from io import BytesIO
from pathlib import Path
import textwrap

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(r"C:\Users\LENOVO\Downloads\OJT\week logbook.pdf")
OUTPUT_PDF = ROOT / "filled_week_logbook_feb2_to_apr24.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4

# Template coordinates inferred from existing filled pages.
DATE_X = 130
DATE_Y = 747
TIME_START_X = 402
TIME_END_X = 496
TIME_Y = 747
DEPARTMENT_X = 132
DEPARTMENT_Y = 718
DESIGNATION_X = 379
DESIGNATION_Y = 719

DESCRIPTION_BOX = (81, 641, 58, 5, 26)
ACTIVITIES_BOX = (78, 450, 54, 4, 26)
LEARNING_BOX = (77, 299, 54, 2, 26)
REFERENCE_BOX = (76, 157, 50, 3, 26)
OUTCOME_BOX = (347, 166, 25, 3, 26)

FIRST_DAILY_PAGE_INDEX = 7  # PDF page 8 = 2 Feb 2026


def wrap_lines(text: str, width: int, max_lines: int) -> list[str]:
    lines = textwrap.wrap(
        text,
        width=width,
        break_long_words=False,
        break_on_hyphens=False,
    )
    return lines[:max_lines]


def draw_lines(pdf: canvas.Canvas, lines: list[str], x: float, y: float, step: float) -> None:
    for idx, line in enumerate(lines):
        pdf.drawString(x, y - idx * step, line)


def daterange(start: date, end: date) -> list[date]:
    dates: list[date] = []
    current = start
    while current <= end:
        if current.weekday() != 6:  # Skip Sundays
            dates.append(current)
        current += timedelta(days=1)
    return dates


def choose_phase(day: date) -> dict[str, object]:
    if day <= date(2026, 2, 21):
        return {
            "focus": "backend foundation and security-ready server planning",
            "work_items": [
                "refined Express folder and route structure",
                "prepared env handling strategy",
                "organized auth and error middleware flow",
            ],
            "learning": [
                "clean structure helps scaling and testing",
                "secure config planning prevents future setup issues",
            ],
            "references": [
                "Node.js docs",
                "Express.js reference",
                "architecture notes",
            ],
            "outcome": "backend base plan became clearer.",
        }
    if day <= date(2026, 2, 28):
        return {
            "focus": "database design, auth flow, and core backend models",
            "work_items": [
                "worked on user, exam, and session schemas",
                "refined JWT auth flow and role mapping",
                "prepared request validation rules",
            ],
            "learning": [
                "schema design affects performance and maintainability",
                "role checks should stay centralized in middleware",
            ],
            "references": [
                "MongoDB docs",
                "Mongoose reference",
                "JWT auth notes",
            ],
            "outcome": "core data model and auth direction were finalized.",
        }
    if day <= date(2026, 3, 7):
        return {
            "focus": "exam module implementation and CRUD API development",
            "work_items": [
                "implemented exam create and update logic",
                "worked on MCQ and coding question structure",
                "tested validation and controller flow",
            ],
            "learning": [
                "controller logic should stay separate from validation",
                "flexible question schema supports mixed-format exams",
            ],
            "references": [
                "Postman",
                "Express routing notes",
                "exam builder notes",
            ],
            "outcome": "exam management APIs became stable.",
        }
    if day <= date(2026, 3, 14):
        return {
            "focus": "session lifecycle, submission flow, and answer persistence",
            "work_items": [
                "worked on exam start and submit endpoints",
                "handled answer storage and timing checks",
                "reviewed objective result calculation flow",
            ],
            "learning": [
                "timing logic must be reliable and fair",
                "submission flow should avoid duplicate writes",
            ],
            "references": [
                "MongoDB checks",
                "session flow notes",
                "API testing notes",
            ],
            "outcome": "core exam session flow became complete.",
        }
    if day <= date(2026, 3, 21):
        return {
            "focus": "RBAC refinement, mentor/admin APIs, and audit logic",
            "work_items": [
                "refined Admin, Mentor, and Student permissions",
                "worked on result and stats endpoints",
                "added audit and activity tracing support",
            ],
            "learning": [
                "fine-grained role checks reduce overlap",
                "audit logs help debugging and accountability",
            ],
            "references": [
                "RBAC design notes",
                "dashboard API checklist",
                "security middleware notes",
            ],
            "outcome": "role-based backend access became stronger.",
        }
    if day <= date(2026, 3, 31):
        return {
            "focus": "real-time monitoring, telemetry flow, and backend security",
            "work_items": [
                "worked on Socket.IO events for violation alerts",
                "connected backend with proctoring payloads",
                "reviewed rate limiting and request protection",
            ],
            "learning": [
                "real-time monitoring needs clear event structure",
                "rate limiting is important for auth routes",
            ],
            "references": [
                "Socket.IO docs",
                "rate limit notes",
                "telemetry design sheet",
            ],
            "outcome": "backend proctoring flow became real-time ready.",
        }
    if day <= date(2026, 4, 7):
        return {
            "focus": "exam engine hardening, draft support, and coding execution APIs",
            "work_items": [
                "worked on save-draft and exam update logic",
                "integrated coding execution API support",
                "handled validation and fallback for coding questions",
            ],
            "learning": [
                "external APIs need graceful fallback handling",
                "draft workflows need clear status separation",
            ],
            "references": [
                "Judge0 notes",
                "coding test cases",
                "cockpit API mapping",
            ],
            "outcome": "coding exam backend became more usable.",
        }
    if day <= date(2026, 4, 12):
        return {
            "focus": "result evaluation, import/export logic, and system stability fixes",
            "work_items": [
                "worked on result evaluation and answer mapping",
                "improved CSV import for users and questions",
                "reviewed backend stability issues",
            ],
            "learning": [
                "small mapping bugs can break result flow",
                "bulk import should normalize source data",
            ],
            "references": [
                "result service notes",
                "CSV import samples",
                "bug tracking notes",
            ],
            "outcome": "evaluation and bulk data flow became stable.",
        }
    if day <= date(2026, 4, 19):
        return {
            "focus": "Redis hardening, scraping support, eKYC, and Cloudinary integration",
            "work_items": [
                "worked on backend caching and connection hardening",
                "implemented coding-platform question import support",
                "added eKYC and file upload handling",
            ],
            "learning": [
                "file uploads need validation and defensive guards",
                "third-party integrations should fail safely",
            ],
            "references": [
                "Redis notes",
                "Cloudinary docs",
                "import test URLs",
            ],
            "outcome": "advanced backend features were integrated reliably.",
        }
    return {
        "focus": "final backend polish, admin controls, and deployment readiness",
        "work_items": [
            "reviewed final security and admin controls",
            "fixed notification and results integration bugs",
            "validated final APIs and cleaned responses",
        ],
        "learning": [
            "final polish improves reliability and presentation",
            "deployment readiness needs stable configs",
        ],
        "references": [
            "project README",
            "final API documentation",
            "integration testing notes",
        ],
        "outcome": "backend became cleaner and demo-ready.",
    }


def build_day_entry(day: date) -> dict[str, list[str] | str]:
    phase = choose_phase(day)
    focus = phase["focus"]
    work_items = list(phase["work_items"])
    learning = list(phase["learning"])
    references = phase["references"]
    outcome = phase["outcome"]

    rotate_by = day.day % max(len(work_items), 1)
    work_items = work_items[rotate_by:] + work_items[:rotate_by]

    lead_templates = [
        f"Today I worked on {focus} for the Vision secure exam platform.",
        f"Today I continued backend work focused on {focus} in the Vision project.",
        f"Today my backend task was centered around {focus} for the Vision platform.",
    ]
    support_templates = [
        "My goal was to keep the implementation secure, modular, and integration-ready.",
        "I focused on keeping the backend logic organized, secure, and easy to integrate.",
        "This work helped keep the backend stable and aligned with the complete project flow.",
    ]
    description = " ".join(
        [
            lead_templates[day.toordinal() % len(lead_templates)],
            support_templates[day.toordinal() % len(support_templates)],
        ]
    )

    activities = " ".join(item[0].upper() + item[1:] + "." for item in work_items)
    learning_text = " ".join(item[0].upper() + item[1:] + "." for item in learning)
    outcome_prefixes = [
        "By the end of the day,",
        "As a result,",
        "Overall,",
    ]
    outcome = f"{outcome_prefixes[day.toordinal() % len(outcome_prefixes)]} {outcome[0].lower() + outcome[1:]}"

    return {
        "date": f"{day.day} {day.strftime('%b %Y')}",
        "description": wrap_lines(description, DESCRIPTION_BOX[2], DESCRIPTION_BOX[3]),
        "activities": wrap_lines(activities, ACTIVITIES_BOX[2], ACTIVITIES_BOX[3]),
        "learning": wrap_lines(learning_text, LEARNING_BOX[2], LEARNING_BOX[3]),
        "references": list(references)[: REFERENCE_BOX[3]],
        "outcome": wrap_lines(outcome, OUTCOME_BOX[2], OUTCOME_BOX[3]),
    }


def build_overlay(
    entry: dict[str, list[str] | str], include_body: bool = True, include_date: bool = True
) -> PdfReader:
    packet = BytesIO()
    pdf = canvas.Canvas(packet, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    pdf.setFont("Helvetica", 13)

    if include_date:
        pdf.drawString(DATE_X, DATE_Y, str(entry["date"]))
    pdf.setFont("Helvetica", 10.5)
    pdf.drawString(TIME_START_X, TIME_Y, "3:30 PM")
    pdf.drawString(TIME_END_X, TIME_Y, "6:30 PM")
    pdf.drawString(DEPARTMENT_X, DEPARTMENT_Y, "B.Tech CSE (AI/ML) 25-29")
    pdf.drawString(DESIGNATION_X, DESIGNATION_Y, "Backend Developer Associate")
    pdf.setFont("Helvetica", 13)
    if include_body:
        draw_lines(pdf, entry["description"], DESCRIPTION_BOX[0], DESCRIPTION_BOX[1], DESCRIPTION_BOX[4])
        draw_lines(pdf, entry["activities"], ACTIVITIES_BOX[0], ACTIVITIES_BOX[1], ACTIVITIES_BOX[4])
        draw_lines(pdf, entry["learning"], LEARNING_BOX[0], LEARNING_BOX[1], LEARNING_BOX[4])
        draw_lines(pdf, entry["references"], REFERENCE_BOX[0], REFERENCE_BOX[1], REFERENCE_BOX[4])
        draw_lines(pdf, entry["outcome"], OUTCOME_BOX[0], OUTCOME_BOX[1], OUTCOME_BOX[4])

    pdf.save()
    packet.seek(0)
    return PdfReader(packet)


def main() -> None:
    reader = PdfReader(str(SOURCE_PDF))
    writer = PdfWriter()

    working_days = daterange(date(2026, 2, 2), date(2026, 4, 24))
    existing_filled_days = 12  # 2 Feb to 14 Feb, Sundays already skipped

    for index, page in enumerate(reader.pages):
        writer.add_page(page)

    for day_index, day in enumerate(working_days[:existing_filled_days]):
        page_index = FIRST_DAILY_PAGE_INDEX + day_index
        overlay_reader = build_overlay(
            {"date": f"{day.day} {day.strftime('%b %Y')}"},
            include_body=False,
            include_date=False,
        )
        writer.pages[page_index].merge_page(overlay_reader.pages[0])

    for day_index, day in enumerate(working_days[existing_filled_days:], start=existing_filled_days):
        page_index = FIRST_DAILY_PAGE_INDEX + day_index
        overlay_reader = build_overlay(build_day_entry(day))
        writer.pages[page_index].merge_page(overlay_reader.pages[0])

    with OUTPUT_PDF.open("wb") as f:
        writer.write(f)

    print(f"Created: {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
