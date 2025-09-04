# Use an official Python image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set working directory inside the container
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    libmariadb-dev \
    libmariadb-dev-compat \
    pkg-config \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the app
COPY . .

# Collect static files (optional if using collectstatic)
# RUN python manage.py collectstatic --noinput

# Entrypoint: override in docker-compose
CMD ["gunicorn", "illusion_classroom.wsgi:application", "-b", "0.0.0.0:8000", "-w", "3"]
