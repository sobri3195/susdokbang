FROM python:3.11-slim

WORKDIR /app
COPY distributed/requirements.txt /app/distributed/requirements.txt
RUN pip install --no-cache-dir -r /app/distributed/requirements.txt

COPY distributed /app/distributed
WORKDIR /app/distributed
CMD ["python", "worker.py"]
