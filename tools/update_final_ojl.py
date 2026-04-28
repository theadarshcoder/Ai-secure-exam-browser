from __future__ import annotations

from io import BytesIO
from pathlib import Path
from datetime import date, timedelta

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import white, black
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
SOURCE_PDF = Path(r"C:\Users\LENOVO\Downloads\Final ojl.pdf")
OUTPUT_PDF = ROOT / "Final_ojl_updated.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4

PAGE3_FIELDS = [
    ("Vinit Jangir", 190, 286),
    ("251810700297", 182, 255),
    ("2nd February, 2026", 420, 255),
    ("B. Tech CSE (AI/ML) 25-29", 180, 225),
    ("2nd", 145, 195),
    ("Polaris School of Technology", 265, 195),
    ("Futuretalks Services Private Limited", 255, 165),
]

PAGE3_CONTACT = [
    ("+91 7688930772", 150, 82),
    ("vinit.p25@medhaviskillsuniversity.edu.in", 360, 82),
]

DAILY_PAGE_START = 7   # PDF page 8
DAILY_PAGE_END = 77    # PDF page 78
DEPARTMENT_MASK = (128, 714, 150, 16)
DEPARTMENT_TEXT = ("Computer Science Engineering", 132, 718)
DATE_MASK = (116, 744, 122, 16)
DATE_X = 130
DATE_Y = 747


def ordinal(n: int) -> str:
    if 10 <= n % 100 <= 20:
        suffix = "th"
    else:
        suffix = {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{suffix}"


def working_days(start: date, end: date) -> list[date]:
    days: list[date] = []
    current = start
    while current <= end:
        if current.weekday() != 6:
            days.append(current)
        current += timedelta(days=1)
    return days


def build_page3_overlay() -> PdfReader:
    packet = BytesIO()
    pdf = canvas.Canvas(packet, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))
    pdf.setFillColor(black)
    pdf.setFont("Helvetica", 11.5)

    for text, x, y in PAGE3_FIELDS:
        pdf.drawString(x, y, text)

    pdf.setFont("Helvetica", 10.2)
    for text, x, y in PAGE3_CONTACT:
        pdf.drawString(x, y, text)

    pdf.save()
    packet.seek(0)
    return PdfReader(packet)


def build_department_overlay() -> PdfReader:
    packet = BytesIO()
    pdf = canvas.Canvas(packet, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))

    pdf.setFillColor(white)
    pdf.rect(*DEPARTMENT_MASK, fill=1, stroke=0)

    pdf.setFillColor(black)
    pdf.setFont("Helvetica", 10.5)
    pdf.drawString(DEPARTMENT_TEXT[1], DEPARTMENT_TEXT[2], DEPARTMENT_TEXT[0])

    pdf.save()
    packet.seek(0)
    return PdfReader(packet)


def build_date_overlay(day: date) -> PdfReader:
    packet = BytesIO()
    pdf = canvas.Canvas(packet, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))

    pdf.setFillColor(white)
    pdf.rect(*DATE_MASK, fill=1, stroke=0)

    pdf.setFillColor(black)
    pdf.setFont("Helvetica", 11.5)
    pdf.drawString(DATE_X, DATE_Y, f"{ordinal(day.day)} {day.strftime('%B %Y')}")

    pdf.save()
    packet.seek(0)
    return PdfReader(packet)


def main() -> None:
    reader = PdfReader(str(SOURCE_PDF))
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    page3_overlay = build_page3_overlay()
    writer.pages[2].merge_page(page3_overlay.pages[0])

    department_overlay = build_department_overlay()
    days = working_days(date(2026, 2, 2), date(2026, 4, 24))
    for offset, idx in enumerate(range(DAILY_PAGE_START, DAILY_PAGE_END + 1)):
        writer.pages[idx].merge_page(department_overlay.pages[0])
        date_overlay = build_date_overlay(days[offset])
        writer.pages[idx].merge_page(date_overlay.pages[0])

    with OUTPUT_PDF.open("wb") as f:
        writer.write(f)

    print(f"Created: {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
