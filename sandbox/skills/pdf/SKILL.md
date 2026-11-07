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
- Scanned pages have no text layer. Render them (`pdftoppm -r 200 -png in.pdf /mnt/data/tmp/page` or `pdf2image.convert_from_path(path, dpi=200)`) and run `pytesseract.image_to_string` on each image, with `lang='chi_sim'` for Chinese (`'chi_sim+eng'` when English also appears; the default is `eng`).

## Change
- Merge, split, reorder or rotate with pypdf: `PdfReader`, `PdfWriter`, `writer.add_page(page)`, `page.rotate(90)`.
- Keep the original: write a new file to `/mnt/data/outputs/`.

## Render
`pdftoppm -r 150 -png -f 1 -l 1 input.pdf /mnt/data/outputs/page` renders page 1 to `page-1.png`. Rendering is the best way to check what a page looks like.

## Create
- Reports with styles, tables and images: reportlab's `SimpleDocTemplate` with `Paragraph`, `Table` and `Image` flowables.
- Chinese text: Droid Sans Fallback covers CJK but has no Latin, digits or general punctuation (— “” ‘’ … ●), and reportlab has no per-glyph fallback, so register two fonts and wrap every run Droid lacks. The wrapper must skip existing markup — wrapping `<b>`/`</b>` fragments crashes Paragraph parsing:
  ```python
  pdfmetrics.registerFont(TTFont('Latin', '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
  pdfmetrics.registerFont(TTFont('CJK', '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf'))
  import re
  _CJK = '\u3000-\u303f\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uff01-\uff60'
  def zh(text):  # tag-safe mixed-text wrapping for Paragraph markup
      parts = re.split(r'(<[^>]*>)', text)
      for i, p in enumerate(parts):
          if p and p[0] != '<':
              parts[i] = re.sub('[^' + _CJK + ']+', lambda m: '<font face="Latin">' + m.group() + '</font>', p)
      return ''.join(parts)
  style = ParagraphStyle('zh', fontName='CJK', fontSize=12)
  Paragraph(zh('● 销售额<b>增长 12.5%</b>——“主力”回落'), style)
  ```
  `bulletText` bypasses zh(): set `bulletFontName='Latin'` when bullets are ●/•, and on a canvas use `setFont('Latin')` for mixed footer strings (or draw footers as Paragraphs) — a CJK-only font leaves those punctuation gaps silently blank. There is no CJK bold face installed: `<b>` only has effect inside DejaVu runs. Never pass `subsetAuto` to `TTFont` (it does not exist). The predefined `UnicodeCIDFont('STSong-Light')` embeds nothing and renders blank in poppler; the Noto CJK files are CFF-in-TTC and reportlab cannot embed them.
- Put matplotlib charts into a PDF as PNG images: charts from PNG embed cleanly and Chinese labels already render (see the charts skill), while matplotlib's own PDF backend cannot embed the image's CJK font files.
- Check every created PDF before delivering: render the first pages (`pdftoppm -r 100 -png -f 1 -l 3 report.pdf /mnt/data/tmp/check`), copy 1-3 pages into `/mnt/data/outputs/` so they come back as images, and look at the layout and Chinese text.
- From a Word or Markdown file on the full image: `soffice --headless --convert-to pdf --outdir /mnt/data/outputs input.docx`.
