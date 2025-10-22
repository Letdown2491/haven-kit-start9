# Dockerfile for Haven Start9 Package
# Packages the Haven Nostr relay for Start9
# Haven is a Go binary that reads configuration from .env file

# Build stage: Download Haven from GitHub releases
FROM debian:bookworm-slim as downloader

ARG HAVEN_VERSION=v1.1.0
ARG TARGETARCH

RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /tmp

# Download Haven binary for the target architecture
RUN if [ "$TARGETARCH" = "amd64" ]; then \
        HAVEN_ARCH="x86_64"; \
    elif [ "$TARGETARCH" = "arm64" ]; then \
        HAVEN_ARCH="arm64"; \
    else \
        echo "Unsupported architecture: $TARGETARCH"; exit 1; \
    fi && \
    curl -L -o haven.tar.gz "https://github.com/bitvora/haven/releases/download/${HAVEN_VERSION}/haven_Linux_${HAVEN_ARCH}.tar.gz" && \
    tar -xzf haven.tar.gz && \
    rm haven.tar.gz

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    tzdata \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 appuser

# Create Haven directory structure
RUN mkdir -p /haven /data && \
    chown -R appuser:appuser /haven /data

# Copy Haven binary from downloader stage
COPY --from=downloader /tmp/haven /haven/haven
RUN chmod +x /haven/haven && chown appuser:appuser /haven/haven

# Copy entrypoint
COPY docker_entrypoint.sh /usr/local/bin/docker_entrypoint.sh
RUN chmod +x /usr/local/bin/docker_entrypoint.sh

# Environment variables
ENV APP_DATA_DIR=/data
ENV TZ=UTC
ENV APP_USER=appuser

WORKDIR /haven

# Expose relay port
EXPOSE 3355

# Use tini as init system
ENTRYPOINT ["/usr/bin/tini", "--"]

# Start relay via entrypoint
CMD ["docker_entrypoint.sh"]
