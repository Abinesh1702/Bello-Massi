#!/usr/bin/env bash
# Rebuild the consolidated HTML / PDF / DOCX editions from docs/workflow/*.md.
# Needs: python3 (Pillow, pdfplumber, pypdf, lxml), pandoc, mermaid-cli (mmdc), Playwright (Chromium), LibreOffice.
set -euo pipefail
cd "$(dirname "$0")"
python3 build_md.py      # combine chapters, render Mermaid -> out/mm/*.svg|png
python3 build_html.py    # dist/…html (screen) + out/print-*.html
python3 build_pdf.py     # dist/…pdf (cover, contents with page numbers, headers/footers, bookmarks)
python3 build_docx.py    # dist/…docx (cover, contents, headers/footers, page numbers)
