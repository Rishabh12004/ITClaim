"""
ITClaim Professional PDF Generator
Run: python generate_pdf.py
Requires: pip install reportlab
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, HRFlowable,
    Table, TableStyle, PageBreak, KeepTogether
)
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.pdfgen import canvas as pdfcanvas
from reportlab.lib.colors import HexColor
import math

# ─── Color Palette ───────────────────────────────────────────────────────────
BG          = HexColor('#0F1117')
CARD        = HexColor('#1A1D27')
CARD2       = HexColor('#22263A')
TEAL        = HexColor('#00D4AA')
AMBER       = HexColor('#F5A623')
RED         = HexColor('#FF4D4D')
WHITE       = HexColor('#FFFFFF')
GREY        = HexColor('#CCCCCC')
DIM         = HexColor('#8B90A7')
BORDER      = HexColor('#2A2F45')
DARKEST     = HexColor('#0A0D14')

PAGE_W, PAGE_H = A4
MARGIN = 40
CONTENT_W = PAGE_W - 2 * MARGIN

# ─── Total Pages ─────────────────────────────────────────────────────────────
TOTAL_PAGES = 7

# ─── Canvas Helpers ──────────────────────────────────────────────────────────
def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16)/255 for i in (0, 2, 4))

def draw_bg(c, doc):
    c.setFillColor(BG)
    c.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

def draw_header(c, doc):
    draw_bg(c, doc)
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawString(MARGIN, PAGE_H - 28, 'ITClaim — Technical Overview')

def draw_footer(c, doc):
    page_num = doc.page
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(PAGE_W / 2, 22, f'Page {page_num} of {TOTAL_PAGES}')

def on_cover(c, doc):
    draw_bg(c, doc)
    draw_footer(c, doc)

def on_later(c, doc):
    draw_header(c, doc)
    draw_footer(c, doc)

# ─── Rounded Rect Helper ─────────────────────────────────────────────────────
def rounded_rect(c, x, y, w, h, r=6, fill_color=CARD, stroke_color=BORDER, stroke_width=1):
    c.setFillColor(fill_color)
    c.setStrokeColor(stroke_color)
    c.setLineWidth(stroke_width)
    c.roundRect(x, y, w, h, r, fill=1, stroke=1)

def arrow_right(c, x, y, length=30, color=TEAL):
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.5)
    c.line(x, y, x + length - 6, y)
    # arrowhead
    p = c.beginPath()
    p.moveTo(x + length, y)
    p.lineTo(x + length - 7, y + 4)
    p.lineTo(x + length - 7, y - 4)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

def arrow_down(c, x, y, length=25, color=TEAL):
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.5)
    c.line(x, y, x, y - length + 6)
    p = c.beginPath()
    p.moveTo(x, y - length)
    p.lineTo(x - 4, y - length + 7)
    p.lineTo(x + 4, y - length + 7)
    p.close()
    c.drawPath(p, fill=1, stroke=0)

# ─── Style Helpers ───────────────────────────────────────────────────────────
def style(name, font='Helvetica', size=10, color=GREY, align=TA_LEFT,
          leading=None, spaceBefore=0, spaceAfter=4, bold=False):
    fn = 'Helvetica-Bold' if bold else font
    return ParagraphStyle(
        name=name,
        fontName=fn,
        fontSize=size,
        textColor=color,
        alignment=align,
        leading=leading or size * 1.4,
        spaceBefore=spaceBefore,
        spaceAfter=spaceAfter,
        backColor=None,
    )

S_BODY      = style('body', size=10, color=GREY, leading=16)
S_DIM       = style('dim', size=9, color=DIM, leading=14)
S_CAPTION   = style('caption', size=8, color=DIM)
S_HEADING   = style('heading', size=18, color=WHITE, bold=True, spaceBefore=10, spaceAfter=4)
S_SUBHEAD   = style('subhead', size=13, color=TEAL, bold=True, spaceBefore=4, spaceAfter=8)
S_TEAL_BIG  = style('tealbig', size=22, color=TEAL, bold=True, align=TA_CENTER)
S_WHITE_SM  = style('whitesm', size=8, color=DIM, align=TA_CENTER)
S_MONO      = style('mono', font='Courier', size=8, color=TEAL, leading=13)
S_MONO_BODY = style('monobody', font='Courier', size=8, color=GREY, leading=13)
S_CALLOUT   = style('callout', size=11, color=WHITE, leading=18, align=TA_CENTER,
                    spaceBefore=6, spaceAfter=6)
S_CENTER    = style('center', size=10, color=GREY, align=TA_CENTER)
S_LABEL     = style('label', size=9, color=DIM, spaceBefore=2)

def hr():
    return HRFlowable(width='85%', thickness=1, color=TEAL, spaceAfter=10, spaceBefore=4)

def section(title):
    return [
        Paragraph(title, S_HEADING),
        hr(),
    ]

def subhead(text):
    return Paragraph(text, S_SUBHEAD)

# ─── Custom DocTemplate ──────────────────────────────────────────────────────
class ITClaimDoc(BaseDocTemplate):
    def __init__(self, filename, **kwargs):
        super().__init__(filename, **kwargs)
        cover_frame = Frame(
            MARGIN, MARGIN, CONTENT_W, PAGE_H - 2*MARGIN,
            id='cover', showBoundary=0
        )
        later_frame = Frame(
            MARGIN, MARGIN + 20, CONTENT_W, PAGE_H - 2*MARGIN - 40,
            id='later', showBoundary=0
        )
        self.addPageTemplates([
            PageTemplate(id='Cover', frames=[cover_frame], onPage=on_cover),
            PageTemplate(id='Later', frames=[later_frame], onPage=on_later),
        ])

    def afterFlowable(self, flowable):
        pass

# ─── PAGE 1: Cover ───────────────────────────────────────────────────────────
def build_cover(c, page_w, page_h):
    """Draw cover page directly on canvas."""
    # Background
    c.setFillColor(BG)
    c.rect(0, 0, page_w, page_h, fill=1, stroke=0)

    # Top label
    c.setFont('Helvetica', 9)
    c.setFillColor(DIM)
    c.drawString(MARGIN, page_h - 55, 'P R O D U C T   O V E R V I E W')

    # Main title
    c.setFont('Helvetica-Bold', 56)
    c.setFillColor(TEAL)
    c.drawCentredString(page_w / 2, page_h - 140, 'ITClaim')

    # Tagline
    c.setFont('Helvetica', 17)
    c.setFillColor(WHITE)
    c.drawCentredString(page_w / 2, page_h - 175, 'Stop overpaying GST. Claim what\'s yours.')

    # Teal rule
    c.setStrokeColor(TEAL)
    c.setLineWidth(1.2)
    c.line(MARGIN, page_h - 195, page_w - MARGIN, page_h - 195)

    # Problem statement
    problem_text = [
        "In India, every GST-registered freelancer and small business owner pays 18% GST on",
        "business expenses. By law, this can be reclaimed as Input Tax Credit (ITC) — but most",
        "never do. The process is complex, invoices get lost, and the government portal is",
        "impossible to navigate. The result: thousands of rupees silently overpaid every year.",
    ]
    c.setFont('Helvetica', 11)
    c.setFillColor(DIM)
    y = page_h - 225
    for line in problem_text:
        c.drawCentredString(page_w / 2, y, line)
        y -= 17

    # Stat boxes
    box_w = 155
    box_h = 90
    box_y = page_h - 400
    gap = (CONTENT_W - 3 * box_w) / 2
    x_start = MARGIN

    stats = [
        ('₹50,000', 'avg. unclaimed ITC\nper freelancer / year'),
        ('6.3 Cr+', 'GST registered\nbusinesses in India'),
        ('18%', 'GST paid on every\nbusiness expense'),
    ]

    for i, (big, small) in enumerate(stats):
        bx = x_start + i * (box_w + gap)
        c.setFillColor(CARD)
        c.setStrokeColor(BORDER)
        c.setLineWidth(1)
        c.roundRect(bx, box_y, box_w, box_h, 8, fill=1, stroke=1)

        c.setFont('Helvetica-Bold', 26)
        c.setFillColor(TEAL)
        c.drawCentredString(bx + box_w / 2, box_y + box_h - 38, big)

        c.setFont('Helvetica', 9)
        c.setFillColor(DIM)
        lines = small.split('\n')
        ly = box_y + 30
        for ln in reversed(lines):
            c.drawCentredString(bx + box_w / 2, ly, ln)
            ly += 14

    # URL at bottom
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(TEAL)
    c.drawCentredString(page_w / 2, 48, 'it-claim.vercel.app')

    # Footer
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(page_w / 2, 22, f'Page 1 of {TOTAL_PAGES}')


# ─── PAGE 2: The Problem (canvas) ────────────────────────────────────────────
def build_problem(c, page_w, page_h):
    draw_bg(c, None)
    # Header
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawString(MARGIN, page_h - 28, 'ITClaim — Technical Overview')

    y = page_h - 60

    # Section heading
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'The Problem')
    y -= 10
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 18

    # Subheading
    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(TEAL)
    c.drawString(MARGIN, y, 'Why Freelancers Lose Thousands Every Year')
    y -= 22

    paragraphs = [
        ("What is GST Input Tax Credit?",
         "GST (Goods & Services Tax) is charged at 18% on most business services and products in India. "
         "When you buy a laptop, pay your Airtel bill, or subscribe to AWS — you pay 18% GST on top. "
         "The law allows registered businesses to deduct this GST paid (called Input Tax Credit) from the "
         "GST they collect from their own clients. In theory, you should never double-pay GST."),
        ("Why Freelancers Don't Claim It",
         "The reality is very different. Most freelancers (1) don't know which expenses qualify, "
         "(2) lose paper invoices or forget to download digital ones, (3) find the government GSTN portal "
         "confusing and intimidating, (4) miss the monthly filing deadline after which the ITC is "
         "permanently forfeited, and (5) can't afford a CA just to handle expense tracking."),
        ("The Financial Impact",
         "A freelancer earning ₹10–15 LPA typically pays GST on ₹2–3 lakh of business expenses annually. "
         "That's ₹36,000–₹54,000 in GST paid — most of which is legally reclaimable. Instead, it quietly "
         "flows back to the government. Nationally, an estimated ₹1–2 lakh crore in ITC goes unclaimed "
         "every single year. This is not a niche problem. It is a systemic failure affecting crores of "
         "small business owners."),
    ]

    for title, body in paragraphs:
        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(TEAL)
        c.drawString(MARGIN, y, title)
        y -= 14

        words = body.split()
        line = ''
        c.setFont('Helvetica', 10)
        c.setFillColor(GREY)
        for word in words:
            test = (line + ' ' + word).strip()
            if c.stringWidth(test, 'Helvetica', 10) < CONTENT_W:
                line = test
            else:
                c.drawString(MARGIN, y, line)
                y -= 14
                line = word
        if line:
            c.drawString(MARGIN, y, line)
            y -= 14
        y -= 8

    # Flow diagram
    y -= 10
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'The ITC Gap — How Money Is Lost')
    y -= 25

    flow_items = [
        ('Freelancer pays\nGST on expenses', '₹54,000/yr'),
        ('Should deduct from\nGST collected', '₹54,000 credit'),
        ('Instead pays\nfull amount', 'Missed!'),
        ('Govt quietly\nkeeps difference', '₹54,000 lost'),
    ]
    box_w = 102
    box_h = 58
    total = len(flow_items) * box_w + (len(flow_items) - 1) * 20
    start_x = (page_w - total) / 2

    for i, (label, amount) in enumerate(flow_items):
        bx = start_x + i * (box_w + 20)
        fill = CARD if i < 2 else HexColor('#2A1A1A')
        stroke = TEAL if i < 2 else RED
        c.setFillColor(fill)
        c.setStrokeColor(stroke)
        c.setLineWidth(1.2)
        c.roundRect(bx, y - box_h, box_w, box_h, 6, fill=1, stroke=1)

        # Amount
        c.setFont('Helvetica-Bold', 11)
        c.setFillColor(TEAL if i < 2 else RED)
        c.drawCentredString(bx + box_w / 2, y - 20, amount)

        # Label
        lines = label.split('\n')
        c.setFont('Helvetica', 8)
        c.setFillColor(GREY)
        ly = y - 34
        for ln in lines:
            c.drawCentredString(bx + box_w / 2, ly, ln)
            ly -= 12

        # Arrow
        if i < len(flow_items) - 1:
            ax = bx + box_w + 2
            ay = y - box_h / 2
            arrow_right(c, ax, ay, length=20, color=TEAL)

    y -= box_h + 20

    # Callout box
    cbox_h = 52
    c.setFillColor(DARKEST)
    c.setStrokeColor(TEAL)
    c.setLineWidth(1.5)
    c.roundRect(MARGIN, y - cbox_h, CONTENT_W, cbox_h, 8, fill=1, stroke=1)

    callout = (
        '"The government owes small businesses money. The process of collecting it is so painful that '
        'most people give up — and the government quietly keeps it."'
    )
    c.setFont('Helvetica-Oblique', 10)
    c.setFillColor(WHITE)
    words = callout.split()
    line = ''
    cy = y - 16
    for word in words:
        test = (line + ' ' + word).strip()
        if c.stringWidth(test, 'Helvetica-Oblique', 10) < CONTENT_W - 30:
            line = test
        else:
            c.drawCentredString(page_w / 2, cy, line)
            cy -= 14
            line = word
    if line:
        c.drawCentredString(page_w / 2, cy, line)

    # Footer
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(page_w / 2, 22, f'Page 2 of {TOTAL_PAGES}')


# ─── PAGE 3: The Solution (canvas) ───────────────────────────────────────────
def build_solution(c, page_w, page_h):
    draw_bg(c, None)
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawString(MARGIN, page_h - 28, 'ITClaim — Technical Overview')

    y = page_h - 60
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'The Solution')
    y -= 10
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 18

    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(TEAL)
    c.drawString(MARGIN, y, 'ITClaim — Built for India\'s Freelancers')
    y -= 18

    intro = (
        "ITClaim is a full-stack web application that eliminates the pain of GST Input Tax Credit recovery. "
        "It automates the three hardest parts: knowing what's claimable, collecting invoices, and "
        "tracking deadlines — so freelancers can focus on their work instead of tax paperwork."
    )
    c.setFont('Helvetica', 10)
    c.setFillColor(GREY)
    words = intro.split()
    line = ''
    for word in words:
        test = (line + ' ' + word).strip()
        if c.stringWidth(test, 'Helvetica', 10) < CONTENT_W:
            line = test
        else:
            c.drawString(MARGIN, y, line)
            y -= 14
            line = word
    if line:
        c.drawString(MARGIN, y, line)
        y -= 22

    features = [
        ('Smart Expense Logging', 'Log any business expense. ITClaim instantly tells you if it\'s GST-claimable, not claimable, or needs a CA review — with a plain-English reason why.'),
        ('Invoice Scanner (OCR)', 'Upload a photo of any invoice. Tesseract.js OCR reads the vendor name, amount, and GST number automatically. No manual typing required.'),
        ('ITC Dashboard', 'See your total claimable ITC this month in one big number. Know exactly how much you\'re saving vs. how much you were overpaying before.'),
        ('Deadline Reminders', 'GST filing is due by the 20th of every month. Miss it and that ITC is gone forever. ITClaim shows a live countdown and alerts you in time.'),
        ('Monthly PDF Reports', 'Export a clean PDF report of all your ITC for the month. Share it directly with your CA. No more digging through bank statements.'),
    ]

    icons = ['🧾', '📄', '💰', '⏰', '📊']
    card_h = 58
    card_gap = 10

    for i, (title, desc) in enumerate(features):
        cx = MARGIN
        cy = y - card_h
        c.setFillColor(CARD)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.8)
        c.roundRect(cx, cy, CONTENT_W, card_h, 6, fill=1, stroke=1)

        # Teal left accent bar
        c.setFillColor(TEAL)
        c.rect(cx, cy, 3, card_h, fill=1, stroke=0)

        # Title
        c.setFont('Helvetica-Bold', 11)
        c.setFillColor(WHITE)
        c.drawString(cx + 18, cy + card_h - 20, f'{icons[i]}  {title}')

        # Description — word wrap
        c.setFont('Helvetica', 9)
        c.setFillColor(GREY)
        words = desc.split()
        line = ''
        dy = cy + card_h - 34
        for word in words:
            test = (line + ' ' + word).strip()
            if c.stringWidth(test, 'Helvetica', 9) < CONTENT_W - 22:
                line = test
            else:
                c.drawString(cx + 18, dy, line)
                dy -= 12
                line = word
        if line:
            c.drawString(cx + 18, dy, line)

        y -= card_h + card_gap

    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(page_w / 2, 22, f'Page 3 of {TOTAL_PAGES}')


# ─── PAGE 4: How It Works (canvas) ───────────────────────────────────────────
def build_howitworks(c, page_w, page_h):
    draw_bg(c, None)
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawString(MARGIN, page_h - 28, 'ITClaim — Technical Overview')

    y = page_h - 60
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'How It Works')
    y -= 10
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 18

    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(TEAL)
    c.drawString(MARGIN, y, 'Three Steps to Reclaim Your GST')
    y -= 30

    # 3-step flow
    steps = [
        ('Step 1', 'Log Your Expense',
         'Enter vendor name, amount\nand GST paid. Upload\ninvoice photo optionally.'),
        ('Step 2', 'Get ITC Classification',
         'Rules engine checks against\nGST law. Returns:\n✅ Claimable  ❌ Not Claimable  ⚠️ Review'),
        ('Step 3', 'Save the Difference',
         'Dashboard shows total ITC.\nFile before the 20th.\nPay less to the government.'),
    ]

    box_w = 155
    box_h = 100
    arrow_gap = 20
    total_w = 3 * box_w + 2 * arrow_gap
    sx = (page_w - total_w) / 2

    for i, (step, title, desc) in enumerate(steps):
        bx = sx + i * (box_w + arrow_gap)
        c.setFillColor(CARD)
        c.setStrokeColor(TEAL)
        c.setLineWidth(1.2)
        c.roundRect(bx, y - box_h, box_w, box_h, 8, fill=1, stroke=1)

        c.setFont('Helvetica', 8)
        c.setFillColor(DIM)
        c.drawCentredString(bx + box_w / 2, y - 14, step)

        c.setFont('Helvetica-Bold', 11)
        c.setFillColor(WHITE)
        c.drawCentredString(bx + box_w / 2, y - 28, title)

        c.setStrokeColor(TEAL)
        c.setLineWidth(0.5)
        c.line(bx + 12, y - 35, bx + box_w - 12, y - 35)

        c.setFont('Helvetica', 8.5)
        c.setFillColor(GREY)
        lines = desc.split('\n')
        ly = y - 50
        for ln in lines:
            c.drawCentredString(bx + box_w / 2, ly, ln)
            ly -= 13

        if i < 2:
            arrow_right(c, bx + box_w + 3, y - box_h / 2, length=18)

    y -= box_h + 30

    # ITC Classification Table
    c.setFont('Helvetica-Bold', 12)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'ITC Classification Logic')
    y -= 6
    c.setStrokeColor(TEAL)
    c.setLineWidth(0.8)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 16

    headers = ['Category', 'Examples', 'ITC Status']
    rows = [
        ('Internet & Cloud', 'Airtel, AWS, Vercel, GitHub', '✅ Claimable'),
        ('Hardware', 'Laptop, Monitor, Mouse, Keyboard', '✅ Claimable'),
        ('Software / SaaS', 'Adobe, Figma, Notion, Zoom', '✅ Claimable'),
        ('Food & Beverages', 'Swiggy, Zomato, Restaurants', '❌ Not Claimable'),
        ('Cab Rides', 'Uber, Ola, Rapido', '❌ Not Claimable'),
        ('Phone Bill', 'Airtel, Jio Postpaid', '⚠️ Needs Review'),
        ('Home Electricity', 'Any provider', '⚠️ Needs Review'),
    ]

    col_w = [CONTENT_W * 0.25, CONTENT_W * 0.45, CONTENT_W * 0.30]
    row_h = 22
    tx = MARGIN

    # Header row
    c.setFillColor(TEAL)
    c.rect(tx, y - row_h, CONTENT_W, row_h, fill=1, stroke=0)
    c.setFont('Helvetica-Bold', 9)
    c.setFillColor(DARKEST)
    cx_pos = tx
    for j, h in enumerate(headers):
        c.drawString(cx_pos + 6, y - row_h + 7, h)
        cx_pos += col_w[j]
    y -= row_h

    for i, row in enumerate(rows):
        fill = CARD if i % 2 == 0 else CARD2
        c.setFillColor(fill)
        c.rect(tx, y - row_h, CONTENT_W, row_h, fill=1, stroke=0)
        c.setFont('Helvetica', 9)

        # Status color
        status = row[2]
        cx_pos = tx
        for j, cell in enumerate(row):
            if j == 2:
                if '✅' in cell:
                    c.setFillColor(TEAL)
                elif '❌' in cell:
                    c.setFillColor(RED)
                else:
                    c.setFillColor(AMBER)
                c.setFont('Helvetica-Bold', 9)
            else:
                c.setFillColor(GREY)
                c.setFont('Helvetica', 9)
            c.drawString(cx_pos + 6, y - row_h + 7, cell)
            cx_pos += col_w[j]
        y -= row_h

    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(page_w / 2, 22, f'Page 4 of {TOTAL_PAGES}')


# ─── PAGE 5: Architecture (canvas) ───────────────────────────────────────────
def build_architecture(c, page_w, page_h):
    draw_bg(c, None)
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawString(MARGIN, page_h - 28, 'ITClaim — Technical Overview')

    y = page_h - 60
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'Architecture & High-Level Design')
    y -= 10
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 18

    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(TEAL)
    c.drawString(MARGIN, y, 'System Overview')
    y -= 20

    # Draw a layer
    def draw_layer(c, y, label, sub_boxes, layer_h=80):
        # Outer layer box
        c.setFillColor(HexColor('#141720'))
        c.setStrokeColor(BORDER)
        c.setLineWidth(1)
        c.roundRect(MARGIN, y - layer_h, CONTENT_W, layer_h, 6, fill=1, stroke=1)

        # Layer label
        c.setFont('Helvetica-Bold', 8)
        c.setFillColor(DIM)
        c.drawString(MARGIN + 8, y - 12, label)

        # Sub boxes
        n = len(sub_boxes)
        sub_w = (CONTENT_W - 24 - (n - 1) * 10) / n
        sx = MARGIN + 10
        sub_y = y - layer_h + 8
        sub_h = layer_h - 22

        for title, subtitle in sub_boxes:
            c.setFillColor(CARD)
            c.setStrokeColor(TEAL)
            c.setLineWidth(0.8)
            c.roundRect(sx, sub_y, sub_w, sub_h, 5, fill=1, stroke=1)

            c.setFont('Helvetica-Bold', 9)
            c.setFillColor(WHITE)
            c.drawCentredString(sx + sub_w / 2, sub_y + sub_h - 18, title)

            c.setFont('Helvetica', 8)
            c.setFillColor(DIM)
            c.drawCentredString(sx + sub_w / 2, sub_y + 10, subtitle)

            sx += sub_w + 10

        return y - layer_h

    layer1_y = y
    y = draw_layer(c, y, 'CLIENT LAYER', [
        ('React + Vite', 'Frontend UI'),
        ('Tesseract.js', 'OCR (browser-based)'),
        ('Recharts + jsPDF', 'Charts & Export'),
    ])

    # Arrow down
    arrow_mid = page_w / 2
    arrow_down(c, arrow_mid, y, length=28)
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(arrow_mid + 40, y - 14, 'HTTPS / REST API')
    y -= 30

    y = draw_layer(c, y, 'APPLICATION LAYER', [
        ('Express.js API', 'Route handlers'),
        ('JWT Middleware', 'Authentication'),
        ('ITC Rules Engine', 'itcRules.js'),
    ])

    arrow_down(c, arrow_mid, y, length=28)
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(arrow_mid + 40, y - 14, 'Mongoose ODM')
    y -= 30

    y = draw_layer(c, y, 'DATA LAYER', [
        ('MongoDB Atlas', 'Users, Expenses, Reports'),
        ('Multer + Storage', 'Invoice images'),
    ])

    y -= 20

    # Deployment Architecture
    c.setFont('Helvetica-Bold', 12)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'Deployment Architecture')
    y -= 6
    c.setStrokeColor(TEAL)
    c.setLineWidth(0.8)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 16

    col_w2 = CONTENT_W / 2 - 6
    deploy_h = 100

    # Vercel card
    c.setFillColor(CARD)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.roundRect(MARGIN, y - deploy_h, col_w2, deploy_h, 6, fill=1, stroke=1)
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(TEAL)
    c.drawString(MARGIN + 10, y - 18, 'Frontend — Vercel')
    pts_v = [
        'Auto-deploys from GitHub main branch',
        'Global CDN for fast load times',
        'Free tier — zero hosting cost',
        'Custom domain support',
    ]
    c.setFont('Helvetica', 9)
    c.setFillColor(GREY)
    py = y - 34
    for pt_text in pts_v:
        c.drawString(MARGIN + 14, py, f'• {pt_text}')
        py -= 14

    # Render card
    rx = MARGIN + col_w2 + 12
    c.setFillColor(CARD)
    c.setStrokeColor(BORDER)
    c.setLineWidth(0.8)
    c.roundRect(rx, y - deploy_h, col_w2, deploy_h, 6, fill=1, stroke=1)
    c.setFont('Helvetica-Bold', 11)
    c.setFillColor(TEAL)
    c.drawString(rx + 10, y - 18, 'Backend — Render')
    pts_r = [
        'Node.js server, always-on endpoint',
        'Auto-deploys on GitHub push',
        'Free tier (spins down on idle)',
        'Environment variables secured',
    ]
    c.setFont('Helvetica', 9)
    c.setFillColor(GREY)
    py = y - 34
    for pt_text in pts_r:
        c.drawString(rx + 14, py, f'• {pt_text}')
        py -= 14

    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(page_w / 2, 22, f'Page 5 of {TOTAL_PAGES}')


# ─── PAGE 6: Data Models (canvas) ────────────────────────────────────────────
def build_datamodels(c, page_w, page_h):
    draw_bg(c, None)
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawString(MARGIN, page_h - 28, 'ITClaim — Technical Overview')

    y = page_h - 60
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'Data Models')
    y -= 10
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 18

    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(TEAL)
    c.drawString(MARGIN, y, 'MongoDB Schema Design')
    y -= 20

    user_schema = [
        ('name:', 'String', 'required'),
        ('email:', 'String', 'unique'),
        ('password:', 'String', 'bcrypt hashed'),
        ('gstin:', 'String', 'optional'),
        ('businessName:', 'String', ''),
        ('createdAt:', 'Date', 'auto'),
    ]

    expense_schema = [
        ('userId:', 'ObjectId', '→ User ref'),
        ('vendorName:', 'String', ''),
        ('amount:', 'Number', 'excl. GST'),
        ('gstPaid:', 'Number', ''),
        ('category:', 'Enum', 'internet|software|hardware...'),
        ('itcStatus:', 'Enum', 'claimable|not_claimable|review'),
        ('itcReason:', 'String', 'plain-English explanation'),
        ('confidence:', 'Enum', 'high|medium|low'),
        ('invoiceUrl:', 'String', 'file path'),
        ('invoiceDate:', 'Date', ''),
        ('filingMonth:', 'String', 'YYYY-MM format'),
        ('createdAt:', 'Date', 'auto'),
    ]

    col_w = CONTENT_W / 2 - 8

    def draw_schema(c, bx, by, title, rows, schema_h):
        c.setFillColor(DARKEST)
        c.setStrokeColor(TEAL)
        c.setLineWidth(1.2)
        c.roundRect(bx, by - schema_h, col_w, schema_h, 6, fill=1, stroke=1)

        # Title bar
        c.setFillColor(HexColor('#001F18'))
        c.roundRect(bx, by - 24, col_w, 24, 6, fill=1, stroke=0)
        c.rect(bx, by - 24, col_w, 12, fill=1, stroke=0)

        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(TEAL)
        c.drawString(bx + 10, by - 16, title)

        # Opening brace
        c.setFont('Courier', 9)
        c.setFillColor(DIM)
        c.drawString(bx + 10, by - 36, '{')

        ry = by - 50
        for field, ftype, comment in rows:
            c.setFont('Courier-Bold', 8)
            c.setFillColor(TEAL)
            c.drawString(bx + 20, ry, field)

            fw = c.stringWidth(field, 'Courier-Bold', 8)
            c.setFont('Courier', 8)
            c.setFillColor(AMBER)
            c.drawString(bx + 20 + fw + 4, ry, ftype)

            if comment:
                tw = c.stringWidth(ftype, 'Courier', 8)
                c.setFont('Courier', 8)
                c.setFillColor(DIM)
                c.drawString(bx + 20 + fw + tw + 10, ry, f'// {comment}')

            ry -= 14

        c.setFont('Courier', 9)
        c.setFillColor(DIM)
        c.drawString(bx + 10, ry, '}')

    user_h = len(user_schema) * 14 + 60
    exp_h = len(expense_schema) * 14 + 60
    max_h = max(user_h, exp_h)

    draw_schema(c, MARGIN, y, 'User Schema', user_schema, user_h)
    draw_schema(c, MARGIN + col_w + 16, y, 'Expense Schema', expense_schema, exp_h)

    y -= max_h + 20

    # Key Design Decisions
    c.setFont('Helvetica-Bold', 12)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'Key Design Decisions')
    y -= 8
    c.setStrokeColor(TEAL)
    c.setLineWidth(0.8)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 18

    decisions = [
        ('Filing month as string', 'Stored as "YYYY-MM" for fast grouping, deadline calculation, and human-readable queries — avoids complex date range operations.'),
        ('ITC status computed at write time', 'Classification runs once when the expense is saved, not on every dashboard query. This keeps the dashboard instant.'),
        ('Confidence score stored', 'Stored alongside the ITC status so users know when a result is certain vs. when they should double-check with a CA.'),
    ]

    for title, body in decisions:
        c.setFillColor(TEAL)
        c.circle(MARGIN + 5, y + 2, 3, fill=1, stroke=0)

        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(WHITE)
        c.drawString(MARGIN + 14, y, title)

        c.setFont('Helvetica', 9)
        c.setFillColor(GREY)
        words = body.split()
        line = ''
        y -= 14
        for word in words:
            test = (line + ' ' + word).strip()
            if c.stringWidth(test, 'Helvetica', 9) < CONTENT_W - 14:
                line = test
            else:
                c.drawString(MARGIN + 14, y, line)
                y -= 12
                line = word
        if line:
            c.drawString(MARGIN + 14, y, line)
        y -= 18

    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(page_w / 2, 22, f'Page 6 of {TOTAL_PAGES}')


# ─── PAGE 7: Impact & Closing (canvas) ───────────────────────────────────────
def build_impact(c, page_w, page_h):
    draw_bg(c, None)
    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawString(MARGIN, page_h - 28, 'ITClaim — Technical Overview')

    y = page_h - 60
    c.setFont('Helvetica-Bold', 18)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'Impact')
    y -= 10
    c.setStrokeColor(TEAL)
    c.setLineWidth(1)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 18

    c.setFont('Helvetica-Bold', 13)
    c.setFillColor(TEAL)
    c.drawString(MARGIN, y, 'Who This Is Built For')
    y -= 20

    personas = [
        ('The Freelancer', 'UI/UX Designer',
         'Bills ₹80,000/month to corporate clients. Registered for GST but never claims ITC. ITClaim saves them ~₹3,200/month — ₹38,400 per year.'),
        ('The Consultant', 'Independent Tech Consultant',
         'Runs a one-person firm. Buys cloud, software, and coworking subscriptions. Leaves ~₹40,000/year unclaimed without ITClaim.'),
        ('The Micro-Agency', '3-Person Design Studio',
         'Multiple team expenses, no CA on retainer. ITClaim replaces a ₹5,000/month accountant for basic ITC tracking and filing prep.'),
    ]

    p_w = (CONTENT_W - 20) / 3
    p_h = 115
    px = MARGIN

    for persona, subtitle, desc in personas:
        c.setFillColor(CARD)
        c.setStrokeColor(BORDER)
        c.setLineWidth(0.8)
        c.roundRect(px, y - p_h, p_w, p_h, 6, fill=1, stroke=1)

        # Teal top bar
        c.setFillColor(TEAL)
        c.roundRect(px, y - 28, p_w, 28, 6, fill=1, stroke=0)
        c.rect(px, y - 28, p_w, 14, fill=1, stroke=0)

        c.setFont('Helvetica-Bold', 10)
        c.setFillColor(DARKEST)
        c.drawCentredString(px + p_w / 2, y - 18, persona)

        c.setFont('Helvetica', 8)
        c.setFillColor(DIM)
        c.drawCentredString(px + p_w / 2, y - p_h + 8, subtitle)

        c.setFont('Helvetica', 8.5)
        c.setFillColor(GREY)
        words = desc.split()
        line = ''
        dy = y - 44
        for word in words:
            test = (line + ' ' + word).strip()
            if c.stringWidth(test, 'Helvetica', 8.5) < p_w - 16:
                line = test
            else:
                c.drawCentredString(px + p_w / 2, dy, line)
                dy -= 12
                line = word
        if line:
            c.drawCentredString(px + p_w / 2, dy, line)

        px += p_w + 10

    y -= p_h + 20

    # Big callout
    cbox_h = 68
    c.setFillColor(DARKEST)
    c.setStrokeColor(TEAL)
    c.setLineWidth(2)
    c.roundRect(MARGIN, y - cbox_h, CONTENT_W, cbox_h, 8, fill=1, stroke=1)

    callout = '"If just 1% of India\'s 6.3 crore GST registered businesses used ITClaim and each saved ₹20,000/year — that\'s ₹12,600 crore returned to small businesses annually."'
    c.setFont('Helvetica-BoldOblique', 10)
    c.setFillColor(WHITE)
    words = callout.split()
    line = ''
    cy = y - 18
    for word in words:
        test = (line + ' ' + word).strip()
        if c.stringWidth(test, 'Helvetica-BoldOblique', 10) < CONTENT_W - 30:
            line = test
        else:
            c.drawCentredString(page_w / 2, cy, line)
            cy -= 16
            line = word
    if line:
        c.drawCentredString(page_w / 2, cy, line)

    y -= cbox_h + 22

    # Built By
    c.setFont('Helvetica-Bold', 12)
    c.setFillColor(WHITE)
    c.drawString(MARGIN, y, 'Built By')
    y -= 6
    c.setStrokeColor(TEAL)
    c.setLineWidth(0.8)
    c.line(MARGIN, y, MARGIN + CONTENT_W * 0.85, y)
    y -= 18

    built_text = (
        'ITClaim was designed and built by Rishabh Hirwe, a final year Computer Science & Engineering student. '
        'This project is a genuine attempt to solve a real problem faced by millions of Indian freelancers and small businesses. '
        'It is live and fully functional at it-claim.vercel.app — free to use, with no CA required. '
        'Rishabh is actively looking for opportunities and would love to bring this same energy to Presolv360.'
    )
    c.setFont('Helvetica', 10)
    c.setFillColor(GREY)
    words = built_text.split()
    line = ''
    for word in words:
        test = (line + ' ' + word).strip()
        if c.stringWidth(test, 'Helvetica', 10) < CONTENT_W:
            line = test
        else:
            c.drawString(MARGIN, y, line)
            y -= 14
            line = word
    if line:
        c.drawString(MARGIN, y, line)
    y -= 30

    # Closing line
    c.setFont('Helvetica-Oblique', 11)
    c.setFillColor(DIM)
    c.drawCentredString(page_w / 2, y, 'ITClaim — because the government shouldn\'t profit from complexity.')

    # URL
    c.setFont('Helvetica-Bold', 10)
    c.setFillColor(TEAL)
    c.drawCentredString(page_w / 2, y - 20, 'it-claim.vercel.app')

    c.setFont('Helvetica', 8)
    c.setFillColor(DIM)
    c.drawCentredString(page_w / 2, 22, f'Page 7 of {TOTAL_PAGES}')


# ─── Main ─────────────────────────────────────────────────────────────────────
def generate():
    output = 'ITClaim_Product_Overview.pdf'
    c = pdfcanvas.Canvas(output, pagesize=A4)
    w, h = A4

    # Page 1
    build_cover(c, w, h)
    c.showPage()

    # Page 2
    build_problem(c, w, h)
    c.showPage()

    # Page 3
    build_solution(c, w, h)
    c.showPage()

    # Page 4
    build_howitworks(c, w, h)
    c.showPage()

    # Page 5
    build_architecture(c, w, h)
    c.showPage()

    # Page 6
    build_datamodels(c, w, h)
    c.showPage()

    # Page 7
    build_impact(c, w, h)
    c.showPage()

    c.save()
    print(f'✅  PDF saved → {output}')


if __name__ == '__main__':
    generate()
