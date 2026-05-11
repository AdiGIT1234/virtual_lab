FROM python:3.12-slim

# Install AVR toolchain (avr-gcc, avr-libc, binutils-avr, avr-objcopy)
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        gcc-avr \
        avr-libc \
        binutils-avr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

EXPOSE 10000

# Shell form so $PORT (injected by Render) is expanded at runtime
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
