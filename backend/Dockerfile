FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    gcc g++ libpq-dev curl poppler-utils unzip \
    && rm -rf /var/lib/apt/lists/*

# Install AWS CLI v2
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/aws /tmp/awscliv2.zip

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/chroma_db /app/model_cache /app/docs

RUN chmod +x /app/start.sh

EXPOSE 8000

CMD ["/app/start.sh"]
