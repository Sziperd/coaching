from pathlib import Path
from decimal import Decimal
from io import BytesIO
from PIL import Image, ImageOps
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfdoc import PDFString
from reportlab.lib.utils import ImageReader
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from pypdf import PdfReader

ROOT = Path('/Users/patrykpiwowarczyk/Documents/coaching')
TMP = ROOT / 'tmp/pdfs/delegacja'
OUT = ROOT / 'output/pdf/Business_Travel_Expense_Report_November_2026.pdf'
FONT = Path('/Users/patrykpiwowarczyk/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/libreoffice-headless/libreoffice/LibreOfficeDev.app/Contents/Resources/fonts/truetype')
for name, filename in [('Sans', 'NotoSans-Regular.ttf'), ('Bold', 'NotoSans-Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(FONT / filename)))
NAVY = HexColor('#172E42')
TEAL = HexColor('#147A78')
GREY = HexColor('#5A6874')
LINE = HexColor('#DCE4E9')
PALE = HexColor('#F2F6F8')
W, H = A4
M = 42
C = W - 2*M
c = canvas.Canvas(str(OUT), pagesize=A4, pageCompression=1)
c.setTitle('Business Travel Expense Report - November 2026')
c.setAuthor('Patryk Piwowarczyk')
c.setSubject('Nine expense items totalling PLN 633.95, with eleven supporting documents')
c.setCreator('Business Travel Expense Report')
c._doc.Catalog.Lang = PDFString('en-GB')

rows = [
    ('Motorway vignette', '02 Nov 2026', '58.33', '2', [2]),
    ('Fuel', '05 Nov 2026', '262.13', '3', [3]),
    ('Lunch', '03 Nov 2026', '37.47', '4-5', [4,5]),
    ('Hotel environmental tax', '03 Nov 2026', '15.57', '6', [6]),
    ('Dinner', '03 Nov 2026', '10.50', '7', [7]),
    ('Lunch', '04 Nov 2026', '54.15', '8', [8]),
    ('Dinner', '04 Nov 2026', '68.33', '9', [9]),
    ('Hangar - admission and equipment hire', '04 Nov 2026', '87.64', '10', [10]),
    ('Lunch', '05 Nov 2026', '39.83', '11-12', [11,12]),
]
assert sum(Decimal(r[2]) for r in rows) == Decimal('633.95')
czk_amounts = ['300.00', '-', '198.00*', '80.00', '54.00', '275.00', '347.00', '445.00', '204.00']

docs = [
    (2926, 1, 'Motorway vignette', 'Electronic vignette receipt', 'CZK 300.00 | Payment date: 02 Nov 2026', 'IMG_2926.jpg'),
    (2919, 2, 'Fuel', 'BP Europa SE - receipt', 'PLN 262.13 | 05 Nov 2026', 'IMG_2919.HEIC'),
    (2928, 3, 'Lunch', 'Tusto Titanium - restaurant receipt', 'CZK 195.00 | 03 Nov 2026', 'IMG_2928.jpg'),
    (2929, 3, 'Lunch - service fee', 'Piano Payments - Qerko service fee receipt', 'CZK 3.00 | 03 Nov 2026', 'IMG_2929.jpg'),
    (2927, 4, 'Hotel environmental tax', 'Clarion Hotel Brno - bank transaction confirmation', 'CZK 80.00 / PLN 15.57 | Transaction date: 03 Nov 2026', 'IMG_2927.jpg'),
    (2922, 5, 'Dinner', 'RELAY / Lagardere Travel Retail - receipt', 'CZK 54.00 | 03 Nov 2026', 'IMG_2922.HEIC'),
    (2925, 6, 'Lunch', 'Restaurant receipt', 'CZK 275.00 | 04 Nov 2026', 'IMG_2925.HEIC'),
    (2924, 7, 'Dinner', 'Restaurant receipt and card payment confirmation', 'CZK 347.00 | 04 Nov 2026', 'IMG_2924.HEIC'),
    (2921, 8, 'Hangar - admission and equipment hire', 'VerticalBlock s.r.o. - receipt DD753277', 'CZK 445.00 | 04 Nov 2026', 'IMG_2921.HEIC'),
    (2920, 9, 'Lunch', 'Pokhara - restaurant receipt', 'CZK 204.00 | 05 Nov 2026', 'IMG_2920.HEIC'),
    (2923, 9, 'Lunch - payment confirmation', 'Pokhara - card payment confirmation', 'CZK 204.00 | 05 Nov 2026', 'IMG_2923.HEIC'),
]

def text(x, y, value, size=10, font='Sans', color=NAVY):
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawString(x, y, value)

def right(x, y, value, size=10, font='Sans', color=NAVY):
    c.setFillColor(color)
    c.setFont(font, size)
    c.drawRightString(x, y, value)

def paragraph(value, x, y_top, width=C, size=9, color=GREY, leading=14):
    style = ParagraphStyle('p', fontName='Sans', fontSize=size, leading=leading, textColor=color)
    p = Paragraph(value, style)
    _, h = p.wrap(width, 500)
    p.drawOn(c, x, y_top-h)
    return y_top-h

def footer(page):
    c.setStrokeColor(LINE)
    c.line(M, 39, W-M, 39)
    text(M, 24, 'Business travel expenses | November 2026', 8, color=GREY)
    right(W-M, 24, f'{page} / 12', 8, color=GREY)

# Summary page.
c.bookmarkPage('summary')
c.addOutlineEntry('Expense summary - PLN 633.95', 'summary', level=0)
c.setFillColor(TEAL)
c.rect(M, H-56, 32, 4, stroke=0, fill=1)
text(M, H-81, 'SUPPORTING SCHEDULE TO THE MONTHLY INVOICE', 9, 'Bold', TEAL)
text(M, H-118, 'Business Travel Expense Report', 24, 'Bold')
text(M, H-142, 'November 2026', 12, color=GREY)
text(M, H-174, 'Expense summary and supporting documentation', 10, color=GREY)

top = H-208
c.setFillColor(NAVY)
c.roundRect(M, top-30, C, 30, 4, stroke=0, fill=1)
text(M+10, top-20, 'No.', 9, 'Bold', white)
text(M+37, top-20, 'Expense', 9, 'Bold', white)
text(M+253, top-20, 'Date', 8, 'Bold', white)
right(M+C-128, top-20, 'PLN', 9, 'Bold', white)
right(M+C-50, top-20, 'CZK', 9, 'Bold', white)
right(M+C-10, top-20, 'Page', 8, 'Bold', white)
for i, (label, date, amount, pages, targets) in enumerate(rows, start=1):
    y = top-30-(i-1)*33
    c.setFillColor(PALE if i%2 else white)
    c.rect(M, y-33, C, 33, stroke=0, fill=1)
    text(M+10, y-21, str(i), 9, color=GREY)
    text(M+37, y-21, label, 9)
    text(M+253, y-21, date, 8, color=GREY)
    right(M+C-128, y-21, amount, 10, 'Bold')
    right(M+C-50, y-21, czk_amounts[i-1], 10, 'Bold')
    right(M+C-10, y-21, pages, 9, color=TEAL)
    c.linkRect('', f'page{targets[0]}', (M+C-42, y-31, M+C-5, y-2), thickness=0)

total_y = top-30-len(rows)*33-14
c.setFillColor(TEAL)
c.roundRect(M, total_y-57, C, 57, 5, stroke=0, fill=1)
text(M+15, total_y-33, 'TOTAL REIMBURSEMENT REQUESTED', 10, 'Bold', white)
right(W-M-15, total_y-37, 'PLN 633.95', 23, 'Bold', white)
y = total_y-78
y = paragraph('Reimbursement currency: PLN. Original transaction amounts are shown in CZK where applicable. A dash indicates an expense incurred in PLN.', M, y, size=8.5, leading=13)
y = paragraph('* Item 3: meal receipt CZK 195.00 and Qerko service fee CZK 3.00; total CZK 198.00. Reimbursement requested: PLN 37.47.', M, y-10, size=8.5, leading=13)
assert y > 55, y
footer(1)
c.showPage()

for page, (num, position, title, subtitle, detail, filename) in enumerate(docs, start=2):
    c.bookmarkPage(f'page{page}')
    c.addOutlineEntry(f'{page-1:02d}. {title}', f'page{page}', level=0)
    text(M, H-39, f'SUPPORTING DOCUMENT {page-1:02d} OF 11  |  EXPENSE ITEM {position:02d}', 8, 'Bold', TEAL)
    text(M, H-65, title, 17, 'Bold')
    text(M, H-83, subtitle, 9, color=GREY)
    text(M, H-100, detail, 8, color=GREY)
    c.setStrokeColor(LINE)
    c.line(M, H-111, W-M, H-111)
    src = TMP / f'IMG_{num}.jpg' if num < 2926 else Path('/Users/patrykpiwowarczyk/Downloads') / f'IMG_{num}.jpg'
    with Image.open(src) as opened:
        im = ImageOps.exif_transpose(opened).convert('RGB')
        im.thumbnail((1700, 2200), Image.Resampling.LANCZOS)
        buffer = BytesIO()
        im.save(buffer, 'JPEG', quality=70, optimize=True)
        buffer.seek(0)
        box = (M, 69, C, H-192)
        scale = min(box[2]/im.width, box[3]/im.height)
        iw, ih = im.width*scale, im.height*scale
        ix = box[0]+(box[2]-iw)/2
        iy = box[1]+(box[3]-ih)/2
        c.drawImage(ImageReader(buffer), ix, iy, width=iw, height=ih)
    text(M, 51, 'Original supporting document', 7, color=GREY)
    right(W-M, 51, 'Back to expense summary', 7, color=TEAL)
    c.linkRect('', 'summary', (W-M-105, 46, W-M, 62), thickness=0)
    footer(page)
    c.showPage()
c.save()
reader = PdfReader(OUT)
assert len(reader.pages) == 12
summary = reader.pages[0].extract_text()
assert 'PLN 633.95' in summary
assert all(label in summary for label, *_ in rows)
assert all(len(page.images) == 1 for page in reader.pages[1:])
print(f'Created: {OUT}\nPages: {len(reader.pages)}\nSize: {OUT.stat().st_size/1024/1024:.2f} MB\nSummary bottom: {y:.1f} pt')
