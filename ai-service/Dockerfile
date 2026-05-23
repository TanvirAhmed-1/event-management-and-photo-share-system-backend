# Use Python 3.10 slim image
FROM python:3.10-slim

# Install system dependencies required for OpenCV and DeepFace
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY app.py .

# Expose port 7860 (Hugging Face default port)
EXPOSE 7860

# Run Flask application with gunicorn on port 7860
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "app:app"]
