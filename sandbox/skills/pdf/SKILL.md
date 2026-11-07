---
name: pdf
description: Extract text and tables from PDFs, merge, split or rotate pages, render pages to images, and create PDFs.
---

# PDF

## Read
- Text with layout: `pdfplumber.open(path)`, then `page.extract_text()` per page.
- Chinese and other CJK text extracts as-is: the text layer carries Unicode, so reading needs no fonts.
- Tables: `page.extract_tables()`; check the result, because merged cells and headers often need cleanup in pandas.
- Command line: `pdftotext -layout input.pdf -` prints text quickly.
- Scanned pages have no text layer. Render them (`pdftoppm -r 200 -png in.pdf /mnt/data/tmp/page` or `pdf2image.convert_from_path(path, dpi=200)`) and run `pytesseract.image_to_string` on each image, with `lang='chi_sim'` for Chinese (`'chi_sim+eng'` when English also appears; the default is `eng`).
- When the chat model can see images, saved rendered pages are returned to it directly (up to 4 per run): for a few pages, save them to `/mnt/data/outputs/` and read them yourself; keep pytesseract for long documents or text-only models.

## Change
- Merge, split, reorder or rotate with pypdf: `PdfReader`, `PdfWriter`, `writer.add_page(page)`, `page.rotate(90)`.
- Keep the original: write a new file to `/mnt/data/outputs/`.

## Render
`pdftoppm -r 150 -png -f 1 -l 1 input.pdf /mnt/data/outputs/page` renders page 1 to `page-1.png`. Rendering is the best way to check what a page looks like.

## Create
- Reports with styles, tables and images: reportlab's `SimpleDocTemplate` with `Paragraph`, `Table` and `Image` flowables.
- Chinese text: the built-in fonts are Latin-only, so register one first. Embedding is the reliable choice: `pdfmetrics.registerFont(TTFont('CJK', '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf'))` (from `reportlab.pdfbase` and `reportlab.pdfbase.ttfonts`) and use `fontName='CJK'` in every style. Do not use the Noto CJK files: they are CFF outlines inside a TTC, which reportlab cannot embed. The predefined `UnicodeCIDFont('STSong-Light')` needs no file but embeds nothing, so renderers without a matching system font (e.g. poppler) can show it blank.
- Put matplotlib charts into a PDF as PNG images: charts from PNG embed cleanly and Chinese labels already render (see the charts skill), while matplotlib's own PDF backend cannot embed the image's CJK font files.
- From a Word or Markdown file on the full image: `soffice --headless --convert-to pdf --outdir /mnt/data/outputs input.docx`.
