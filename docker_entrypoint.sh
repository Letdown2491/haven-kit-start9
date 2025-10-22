#!/bin/bash

set -e

# Handle termination signals
_term() {
    echo "Received SIGTERM - shutting down Haven relay..."
    kill -TERM "$haven_process" 2>/dev/null
    wait "$haven_process"
    exit 0
}

trap _term TERM INT

# Ensure proper ownership
chown -R $APP_USER:$APP_USER $APP_DATA_DIR

echo "========================================"
echo "Starting Haven Nostr Relay for Start9"
echo "========================================"

# Load Start9 configuration
CONFIG_FILE="$APP_DATA_DIR/start9/config.yaml"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "ERROR: Configuration file not found at $CONFIG_FILE"
    echo "Please configure Haven through Start9's Config interface"
    exit 1
fi

echo "Loading configuration from Start9..."

# Copy Haven .env file from data volume to /haven directory
# setConfig.ts generates this file when user saves configuration
ENV_SOURCE="$APP_DATA_DIR/start9/haven.env"
ENV_DEST="/haven/.env"

if [ -f "$ENV_SOURCE" ]; then
    echo "Copying configuration from Start9..."
    cp "$ENV_SOURCE" "$ENV_DEST"
else
    echo "WARNING: Haven configuration not found, creating minimal default..."
    cat > "$ENV_DEST" <<EOF
RELAY_PORT=3355
RELAY_BIND_ADDRESS=0.0.0.0
DB_ENGINE=badgerdb
BLOSSOM_PATH=$APP_DATA_DIR/blossom
HAVEN_LOG_LEVEL=INFO
EOF
fi

# Create relay JSON files if they don't exist
if [ ! -f "/haven/relays_import.json" ]; then
    echo "[]" > /haven/relays_import.json
fi

if [ ! -f "/haven/relays_blastr.json" ]; then
    echo "[]" > /haven/relays_blastr.json
fi

# Ensure proper ownership of Haven directory
chown -R $APP_USER:$APP_USER /haven

echo "Configuration loaded successfully"
echo "Starting Haven relay on port 3355..."
echo "Data directory: $APP_DATA_DIR"
echo "========================================"

# Switch to app user and start Haven relay
# Haven reads .env from current working directory (/haven)
cd /haven
exec su -s /bin/bash $APP_USER -c "./haven" &

haven_process=$!

echo "Haven relay started (PID: $haven_process)"
echo "Waiting for relay to be ready..."

# Wait for the process
wait $haven_process
