---
name: pdf
description: Extract text and tables from PDFs, merge, split or rotate pages, render pages to images, and create PDFs. Always read this guide before creating a PDF: Chinese text requires the two-font pattern (DejaVu for digits/Latin plus Droid for CJK) because a single CJK font silently renders digits blank.
---

# PDF

## Read
- Text with layout: `pdfplumber.open(path)`, then `page.extract_text()` per page.
- Chinese and other CJK text extracts as-is: the text layer carries Unicode, so reading needs no fonts.
- Tables: `page.extract_tables()`; check the result, because merged cells and headers often need cleanup in pandas.
- Command line: `pdftotext -layout input.pdf -` prints text quickly.
- Scanned pages have no text layer. Render them (`pdftoppm -r 200 -png in.pdf /mnt/data/tmp/page` or `pdf2image.convert_from_path(path, dpi=200)`) and run `pytesseract.image_to_string` on each image, with `lang='chi_sim'` for Chinese (`'chi_sim+eng'` when English also appears; the default is `eng`). The `pdftoppm` path is an output **prefix without an extension**: poppler names the images `page-1.png`, `page-2.png` itself, so adding `.png` to the prefix gives `page.png-1.png`.

## Change
- Merge, split, reorder or rotate with pypdf: `PdfReader`, `PdfWriter`, `writer.add_page(page)`, `page.rotate(90)`.
- Keep the original: write a new file to `/mnt/data/outputs/`.

## Render
`pdftoppm -r 150 -png -f 1 -l 1 input.pdf /mnt/data/outputs/page` renders page 1 to `page-1.png`. Rendering is the best way to check what a page looks like.

## Create
- Reports with styles, tables and images: reportlab's `SimpleDocTemplate` with `Paragraph`, `Table` and `Image` flowables.
- Chinese text: Droid Sans Fallback covers CJK but has no Latin, digits or general punctuation (— “” ‘’ … ●), and reportlab has no per-glyph fallback, so register two fonts and wrap every run Droid lacks. The wrapper must skip existing markup — wrapping `<b>`/`</b>` fragments crashes Paragraph parsing:
  ```python
  from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
  from reportlab.lib.styles import ParagraphStyle
  from reportlab.pdfbase import pdfmetrics
  from reportlab.pdfbase.ttfonts import TTFont
  from reportlab.platypus import Paragraph
  import re
  pdfmetrics.registerFont(TTFont('Latin', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
  pdfmetrics.registerFont(TTFont('CJK', '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf'))
  _CJK = '\u3000-\u303f\u3300-\u33ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff01-\uff60'
  def zh(text):  # tag-safe mixed-text wrapping for Paragraph markup
      parts = re.split(r'(<[^>]*>)', text)
      for i, p in enumerate(parts):
          if p and p[0] != '<':
              parts[i] = re.sub('[^' + _CJK + ']+', lambda m: '<font face="Latin">' + m.group() + '</font>', p)
      return ''.join(parts)
  style = ParagraphStyle('zh', fontName='CJK', fontSize=12)
  Paragraph(zh('● 销售额<b>增长 12.5%</b>——“主力”回落'), style)
  ```
  Names used outside the snippet need their own imports too: `TA_*` alignment constants come from `reportlab.lib.enums` and are not builtins — a copied name without its import raises `NameError`.
  `bulletText` bypasses zh(): set `bulletFontName='Latin'` when bullets are ●/•, and on a canvas use `setFont('Latin')` for mixed footer strings (or draw footers as Paragraphs) — a CJK-only font leaves those punctuation gaps silently blank. If digits or Latin words come back as empty boxes in a rendered PDF, some text skipped the split: never draw a mixed string in the CJK font directly. CJK compatibility symbols such as ㎡ (U+3300-U+33FF) are drawn by Droid but not by DejaVu, which is why that block is part of the CJK range above. If some other character still renders blank or boxed in a page image, neither font has it: rewrite it as plain words (平方米, 千瓦时). There is no CJK bold face installed, and do not "fix" that by moving Chinese into DejaVu runs so `<b>` works — DejaVu has no CJK glyphs, so the text silently disappears (white headers vanish into their own fill background). Keep CJK in the CJK font: in Paragraphs emphasise with size or colour instead of bold; on a canvas fake weight while keeping the font via `setTextRenderMode(2)` (fill and stroke) with a line width of about 0.2-0.3 pt. The value of `<font face>` must name a font registered earlier in the same program, so keep the `registerFont` lines together with the imports. Never pass `subsetAuto` to `TTFont` (it does not exist). The predefined `UnicodeCIDFont('STSong-Light')` embeds nothing and renders blank in poppler; the Noto CJK files are CFF-in-TTC and reportlab cannot embed them.
- Put matplotlib charts into a PDF as PNG images: charts from PNG embed cleanly and Chinese labels already render (see the charts skill), while matplotlib's own PDF backend cannot embed the image's CJK font files.
- Images and files from earlier runs are in `/mnt/data/uploads/`, never in `outputs/`: a run's returned files are the only thing that survives into the next run, so list `uploads/` to get exact names before opening them (processes, variables and scratch files always start empty).
- Check every created PDF before delivering: render the first pages with `pdftoppm -r 100 -png -f 1 -l 3 /mnt/data/outputs/report.pdf /mnt/data/tmp/check`, copy 1-3 pages into `/mnt/data/outputs/` so they come back as images, and look at the layout and Chinese text. The last argument is an output **prefix without an extension**: poppler appends `-1.png`, `-2.png` itself, so a prefix written as `check.png` yields `check.png-1.png` and a search for `check-*.png` then finds nothing. Keep every option before the two paths and give each one its space (`-r 100`, never `-r100`), and run it as a list with `check=True` so a usage error fails loudly instead of leaving zero pages and no message:
  ```python
  import glob, shutil, subprocess
  subprocess.run(['pdftoppm', '-r', '100', '-png', '-f', '1', '-l', '3',
                  '/mnt/data/outputs/report.pdf', '/mnt/data/tmp/check'], check=True)
  pages = sorted(glob.glob('/mnt/data/tmp/check-*.png'))
  assert pages, 'pdftoppm rendered nothing: re-check the PDF path and the prefix'
  for page in pages:
      shutil.copy(page, '/mnt/data/outputs/')
  ```
- From a Word or Markdown file on the full image: `soffice --headless --convert-to pdf --outdir /mnt/data/outputs input.docx`.
