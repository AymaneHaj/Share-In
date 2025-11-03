# backend/Dockerfile

# Use an official Python runtime as a parent image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port
EXPOSE 5000

# Command to run the application
# Railway will set PORT automatically, default to 5000 for local dev
# Use gunicorn for production (Railway), fallback to waitress for compatibility
CMD sh -c "if [ -n \"\$PORT\" ]; then gunicorn --bind 0.0.0.0:\$PORT --workers 2 --threads 2 --timeout 120 app:app; else waitress-serve --host=0.0.0.0 --port=5000 app:app; fi"