---
name: word-documents
description: Create, convert and edit Word (.docx) documents with python-docx, and pandoc on the full image.
---

# Word documents

## From Markdown
- On the full image (`pandoc` is on the PATH), write the content as Markdown and convert: `pandoc input.md -o /mnt/data/outputs/<name>.docx`. Pandoc maps headings, lists, tables, links and emphasis to native Word styles; add `--reference-doc=<template>.docx` to reuse an uploaded document's styles.
- Otherwise build the document with python-docx as below. For a Markdown document the user only wants to download, the chat's document panel already exports Word files.

## Edit an existing document
- Open with `docx.Document("/mnt/data/uploads/<name>.docx")` and save to outputs under a new name; uploads are read-only.
- Text is split into runs, so a phrase can span several runs. Replace text within a paragraph by rebuilding its runs, and keep the first run's formatting.
- Tables: `document.tables`, then `table.cell(row, column).text`.
- Keep the user's styles: assign existing style names (`paragraph.style = "Heading 2"`) instead of setting fonts directly.

## Create from scratch
Use python-docx for precise layout: `document.add_heading`, `add_paragraph(style="List Bullet")`, `add_table(rows, cols, style="Table Grid")`, `add_picture(path, width=Inches(6))`, `add_page_break()`.

## Text inside images
- A .docx is a zip: embedded pictures live under `word/media/`. Extract them to `/mnt/data/tmp/` (`zipfile.ZipFile(path).namelist()` and `read()`), OCR each with pytesseract (`lang='chi_sim'`, save the image to `outputs/` only when the user should see it), and merge those quotes with the text-layer reads.
- Old binary .doc files: python-docx and pandoc cannot read them; convert first with `soffice --headless --convert-to docx --outdir /mnt/data/tmp file.doc`, then apply the same flows to the converted file.

## Check
- Files from earlier runs are in `/mnt/data/uploads/`, never in `outputs/`: a run's returned files are the only thing that survives into the next run, so reopen them from `uploads/` (list it for exact names).
- Reopen the output and print its paragraphs (`[p.text for p in Document(path).paragraphs]`) to confirm the change before reporting it.
- Layout check on the full image: `soffice --headless --convert-to pdf --outdir /mnt/data/tmp report.docx`, render pages with `pdftoppm` into `/mnt/data/outputs/` and look at them before delivering.
- Font substitution is expected: the sandbox ships Liberation, DejaVu, Noto CJK and Droid only, so a document's own fonts (SimSun/宋体, Microsoft YaHei/微软雅黑, DengXian/等线, Calibri) are absent and LibreOffice substitutes them. Page breaks may then shift against Word — that is substitution, not a defect. Judge the pages on overlaps, overflowing text and blank pages; do not "fix" pagination drift.
