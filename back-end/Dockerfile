FROM python:3.11-slim

# Install LibreOffice and other dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all source files
COPY . .

# Run Gunicorn. Render automatically provides the PORT environment variable.
CMD gunicorn app:app --bind 0.0.0.0:$PORT
