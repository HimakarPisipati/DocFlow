# Windows Setup Instructions for DocFlow Backend

Since you are running this on Windows, you will need to install a few system dependencies manually or using a package manager like [Chocolatey](https://chocolatey.org/) or [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/).

## 1. Poppler (Required for `pdf2image`)
Poppler is needed to convert PDFs to images.
- **Using Conda**: If you use Anaconda/Miniconda, you can install it via: `conda install -c conda-forge poppler`
- **Manual**: 
  1. Download the latest binary from [oschwartz10612 version](https://github.com/oschwartz10612/poppler-windows/releases/)
  2. Extract it to `C:\poppler`
  3. Add `C:\poppler\Library\bin` to your system's PATH environment variable.

## 2. Ghostscript (Required for advanced PDF manipulation)
- **Using Winget**: `winget install -e --id ArtifexSoftware.GhostScript`
- **Using Chocolatey**: `choco install ghostscript`
- **Manual**: Download the installer from the [Ghostscript downloads page](https://ghostscript.com/releases/gsdnld.html).

## 3. LibreOffice (Required for Office-to-PDF conversion)
- **Using Winget**: `winget install -e --id TheDocumentFoundation.LibreOffice`
- **Using Chocolatey**: `choco install libreoffice-fresh`
- **Manual**: Download from the [LibreOffice download page](https://www.libreoffice.org/download/download-libreoffice/).
- **Note**: Ensure that LibreOffice is installed at `C:\Program Files\LibreOffice\program\soffice.exe`, as the backend will look for it there. If you install it elsewhere, you will need to update the path in `app.py`.

## 4. OCR (Future Implementation)
When you are ready to implement OCR, you will need to install Tesseract OCR for Windows.
- **Using Winget**: `winget install -e --id UB-Mannheim.TesseractOCR`
- **Manual**: Download the installer from [UB-Mannheim Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki).
- **Note**: You will also need to add `C:\Program Files\Tesseract-OCR` to your PATH or point `pytesseract.pytesseract.tesseract_cmd` to the executable in your code.
