from __future__ import annotations

from io import BytesIO
from pathlib import Path
import sys

from pypdf import PdfReader, PdfWriter
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from tools.fill_extra_days_trim import ENTRIES, build_overlay

SOURCE_PDF = Path(r"C:\Users\LENOVO\Downloads\OJT\full n Final OjJL.pdf")
IMAGE_PATH = Path(r"C:\Users\LENOVO\Downloads\IMG-20260507-WA0011.jpg (1).jpeg")
OUTPUT_PDF = ROOT / "full_n_Final_OjJL_with_feedback_inserted.pdf"

PAGE_WIDTH, PAGE_HEIGHT = A4
INSERT_AFTER_PAGE = 83  # 1-based: insert between 83 and 84


def build_image_page() -> PdfReader:
    packet = BytesIO()
    pdf = canvas.Canvas(packet, pagesize=(PAGE_WIDTH, PAGE_HEIGHT))

    image = ImageReader(str(IMAGE_PATH))
    img_width, img_height = image.getSize()

    scale = min(PAGE_WIDTH / img_width, PAGE_HEIGHT / img_height)
    draw_width = img_width * scale
    draw_height = img_height * scale
    x = (PAGE_WIDTH - draw_width) / 2
    y = (PAGE_HEIGHT - draw_height) / 2

    pdf.drawImage(image, x, y, width=draw_width, height=draw_height, preserveAspectRatio=True, mask="auto")
    pdf.save()
    packet.seek(0)
    return PdfReader(packet)


def main() -> None:
    reader = PdfReader(str(SOURCE_PDF))
    writer = PdfWriter()
    image_page = build_image_page().pages[0]
    overlays = {entry["page_index"]: build_overlay(entry) for entry in ENTRIES}
    removed_indices = set(range(83, 89))  # remove pages 84-89 (1-based)

    insert_index = INSERT_AFTER_PAGE  # zero-based insertion position after page 83

    for idx, page in enumerate(reader.pages):
        if idx == insert_index:
            writer.add_page(image_page)
        if idx in removed_indices:
            continue
        writer.add_page(page)
        if idx in overlays:
            writer.pages[-1].merge_page(overlays[idx].pages[0])

    if insert_index >= len(reader.pages):
        writer.add_page(image_page)

    with OUTPUT_PDF.open("wb") as f:
        writer.write(f)

    print(f"Created: {OUTPUT_PDF}")


if __name__ == "__main__":
    main()
