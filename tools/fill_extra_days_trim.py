from __future__ import annotations

from io import BytesIO
from pathlib import Path
import textwrap

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import black
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(r"C:\Users\LENOVO\Downloads\OJT\full n Final OjJL.pdf")
OUTPUT_PDF = ROOT / "full_n_Final_OjJL_extra_filled_trimmed.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4

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


ENTRIES = [
    {
        "page_index": 78,  # page 79
        "date": "25th April 2026",
        "description": (
            "Today I worked on final system testing and bug fixing for the Vision secure exam platform. "
            "My focus was to identify small integration issues and make the full workflow more stable."
        ),
        "activities": (
            "Tested end-to-end login and dashboard flows. Fixed small API response mismatches. "
            "Reviewed error handling in critical modules. Rechecked submission and result flow."
        ),
        "learning": (
            "Minor integration bugs can affect the complete user experience. Final testing is as important as development."
        ),
        "references": [
            "Postman",
            "API documentation",
            "bug tracking notes",
        ],
        "outcome": "Stable end-to-end testing was completed with important bug fixes.",
    },
    {
        "page_index": 79,  # page 80
        "date": "27th April 2026",
        "description": (
            "Today I focused on project presentation and demo preparation. My goal was to summarize the backend work clearly "
            "and organize screenshots, architecture flow, and feature highlights for final explanation."
        ),
        "activities": (
            "Prepared project PPT structure. Selected architecture and dashboard screenshots. "
            "Summarized backend modules and security features. Organized content for final demo sequence."
        ),
        "learning": (
            "Good presentation makes technical work easier to explain. Clear sequencing improves demo confidence."
        ),
        "references": [
            "Project PPT draft",
            "README",
            "architecture notes",
        ],
        "outcome": "A demo-ready presentation draft was prepared successfully.",
    },
    {
        "page_index": 80,  # page 81
        "date": "28th April 2026",
        "description": (
            "Today I worked on final documentation and repository cleanup. My focus was to ensure that project files, "
            "module explanations, and technical notes stayed clear for evaluation and handover."
        ),
        "activities": (
            "Updated documentation references. Reviewed backend folder organization. "
            "Checked API explanations and feature mapping. Cleaned final supporting notes for project submission."
        ),
        "learning": (
            "Documentation improves maintainability and project understanding. Clean repositories support smoother evaluation."
        ),
        "references": [
            "README",
            "API notes",
            "submission checklist",
        ],
        "outcome": "Project documentation and submission material became more polished.",
    },
    {
        "page_index": 81,  # page 82
        "date": "29th April 2026",
        "description": (
            "Today I carried out the final project review and dry run. My goal was to validate the main features, confirm "
            "demo flow, and make the project ready for final mentor review."
        ),
        "activities": (
            "Performed final feature walkthrough. Rechecked authentication, dashboards, and result flows. "
            "Verified presentation sequence and explanations. Closed remaining small pending issues."
        ),
        "learning": (
            "A complete dry run helps expose final gaps before evaluation. Review work improves confidence and clarity."
        ),
        "references": [
            "Final PPT",
            "project report",
            "review notes",
        ],
        "outcome": "The complete project was finalized and made ready for review.",
    },
]


def wrap_lines(text: str, width: int, max_lines: int) -> list[str]:
    return textwrap.wrap(text, width=width, break_long_words=False, break_on_hyphens=False)[:max_lines]


def draw_lines(pdf: canvas.Canvas, lines: list[str], x: float, y: float, step: float) -> None:
    for idx, line in enumerate(lines):
        pdf.drawString(x, y - idx * step, line)


def build_overlay(entry: dict[str, object]) -> PdfReader:
    packet = BytesIO()
    pdf = canvas.Canvas(packet, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    pdf.setFillColor(black)

    pdf.setFont("Helvetica", 11.5)
    pdf.drawString(DATE_X, DATE_Y, str(entry["date"]))

    pdf.setFont("Helvetica", 10.5)
    pdf.drawString(TIME_START_X, TIME_Y, "3:30 PM")
    pdf.drawString(TIME_END_X, TIME_Y, "6:30 PM")
    pdf.drawString(DEPARTMENT_X, DEPARTMENT_Y, "Computer Science Engineering")
    pdf.drawString(DESIGNATION_X, DESIGNATION_Y, "Backend Developer Associate")

    pdf.setFont("Helvetica", 13)
    draw_lines(pdf, wrap_lines(str(entry["description"]), DESCRIPTION_BOX[2], DESCRIPTION_BOX[3]), DESCRIPTION_BOX[0], DESCRIPTION_BOX[1], DESCRIPTION_BOX[4])
    draw_lines(pdf, wrap_lines(str(entry["activities"]), ACTIVITIES_BOX[2], ACTIVITIES_BOX[3]), ACTIVITIES_BOX[0], ACTIVITIES_BOX[1], ACTIVITIES_BOX[4])
    draw_lines(pdf, wrap_lines(str(entry["learning"]), LEARNING_BOX[2], LEARNING_BOX[3]), LEARNING_BOX[0], LEARNING_BOX[1], LEARNING_BOX[4])
    draw_lines(pdf, list(entry["references"]), REFERENCE_BOX[0], REFERENCE_BOX[1], REFERENCE_BOX[4])
    draw_lines(pdf, wrap_lines(str(entry["outcome"]), OUTCOME_BOX[2], OUTCOME_BOX[3]), OUTCOME_BOX[0], OUTCOME_BOX[1], OUTCOME_BOX[4])

    pdf.save()
    packet.seek(0)
    return PdfReader(packet)


def main() -> None:
    reader = PdfReader(str(SOURCE_PDF))
    writer = PdfWriter()

    # Remove pages 84-89 (1-based), i.e. indices 83-88.
    removed_indices = set(range(83, 89))

    overlays = {entry["page_index"]: build_overlay(entry) for entry in ENTRIES}

    for idx, page in enumerate(reader.pages):
        if idx in removed_indices:
            continue
        writer.add_page(page)
        if idx in overlays:
            writer.pages[-1].merge_page(overlays[idx].pages[0])

    with OUTPUT_PDF.open("wb") as f:
        writer.write(f)

    print(f"Created: {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
