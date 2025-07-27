FROM python:3.10-slim

EXPOSE 8080

WORKDIR /app

RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Remove supervisor and duplicate CMDs for a clean FastAPI-only container
# Use Uvicorn as the entrypoint, reading PORT from env (default 8080)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080"]

