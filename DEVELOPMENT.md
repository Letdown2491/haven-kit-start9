# Development Guide for Haven on Start9

This document outlines the development process and implementation status for the Haven Start9 package.

## Current Approach: Relay-Only Package

Haven has been packaged for Start9 using a **relay-only approach**. The Flask web UI has been removed in favor of Start9's native configuration system, which simplifies the architecture significantly.

### Why Relay-Only?

Start9 provides its own configuration interface through the Embassy SDK. Users configure Haven through Start9's Config forms rather than a separate web UI. This approach:

- **Eliminates multi-container complexity** - No need to run separate UI container
- **Follows Start9 patterns** - Matches how other Start9 services work (like nostr-rs-relay)
- **Cleaner integration** - No Docker socket access or container orchestration needed
- **Better UX** - Consistent configuration experience across all Start9 services

## Implementation Status

### ✅ Completed

**Package Structure:**
- Removed Umbrel-specific files
- Created Start9 `manifest.yaml` following official patterns
- Created proper `Makefile` with architecture support (arm/x86)
- Updated `README.md` and `instructions.md` for Start9
- Simplified `docker-compose.yml` (relay only, kept for reference)

**Scripts & SDK Integration:**
- Properly structured `scripts/` directory with `procedures/` subdirectory
- **`getConfig.ts`** - Haven-specific configuration schema:
  - Enable/disable individual relay types (Private, Chat, Inbox, Outbox, Blossom)
  - Database engine selection (BadgerDB vs LMDB)
  - Tor and LAN address configuration
- **`setConfig.ts`** - Writes configuration to Start9 managed volumes
- **`properties.ts`** - Displays relay websocket URLs (Tor and LAN)
- **`health.ts`** - Checks if relay is responding on port 3355
- **`migrations.ts`** - Handles version upgrades
- **`bundle.ts`** - TypeScript compilation using Deno emit
- **`deps.ts`** - Proper Embassy SDK imports

**Build System:**
- Makefile supports universal, arm64, and amd64 builds
- Proper TypeScript bundling with Deno
- Docker multi-platform image building

**Manifest:**
- Single interface for relay (port 3355)
- Script-based health checks
- Proper volume configuration (`/data`)
- Backup/restore with duplicity

### ⚠️ Remaining Implementation Work

#### 1. Verify Haven Relay Binary Location

The Dockerfile currently assumes:
```dockerfile
COPY --from=relay-base /app/haven /usr/local/bin/haven
```

**Action needed:**
```bash
# Pull and inspect the image
docker pull letdown2491/haven-relay:latest
docker run -it --entrypoint /bin/sh letdown2491/haven-relay:latest

# Find the actual binary location
which haven
# or
find / -name "haven*" -type f
```

Update Dockerfile line 30 with the correct path.

#### 2. Determine Haven CLI Arguments

The `docker_entrypoint.sh` uses placeholder arguments:
```bash
/usr/local/bin/haven \
    --config $APP_DATA_DIR/config \
    --data $APP_DATA_DIR/db \
    --blossom $APP_DATA_DIR/blossom \
    --port 3355
```

**Action needed:**
- Check Haven's actual CLI interface
- Review upstream documentation: https://github.com/bitvora/haven
- Test the command with the real binary
- Update docker_entrypoint.sh with correct flags

#### 3. Configuration File Format

Haven relay likely expects a configuration file. We need to:

1. Determine the config format (TOML, YAML, JSON?)
2. Update `setConfig.ts` to write Haven's config format
3. Map Start9 config options to Haven's config structure

Example in `setConfig.ts`:
```typescript
// Generate Haven configuration from Start9 config
const havenConfig = {
  relays: {
    private: input["relay-config"]["private-relay"],
    chat: input["relay-config"]["chat-relay"],
    inbox: input["relay-config"]["inbox-relay"],
    outbox: input["relay-config"]["outbox-relay"],
    blossom: input["relay-config"]["blossom-server"],
  },
  database: {
    engine: input["relay-config"]["database-engine"],
    path: "/data/db",
  },
  port: 3355,
};

// Write in Haven's expected format
await effects.writeFile({
  volumeId: "main",
  path: "config/haven.toml",  // or .yaml, .json
  toWrite: [TOML.stringify(havenConfig)],
});
```

#### 4. Test Build Process

Once binary location and CLI args are verified:

```bash
# Build the package
make

# Check if it builds successfully
make verify

# Test on a Start9 development server
make install
```

#### 5. Optional: Build From Source

For production, consider building Haven from source instead of using the pre-built image:

**Dockerfile approach:**
```dockerfile
# Build stage
FROM rust:1-bookworm as builder
WORKDIR /build
RUN git clone https://github.com/bitvora/haven.git
WORKDIR /build/haven
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim
COPY --from=builder /build/haven/target/release/haven /usr/local/bin/haven
# ... rest of Dockerfile
```

This gives you:
- Full control over the build
- Security auditing
- Custom optimizations
- No dependency on external Docker images

## Project Structure

```
haven-kit-start9/
├── manifest.yaml              # Start9 service manifest
├── Makefile                   # Build system
├── Dockerfile                 # Container definition
├── docker_entrypoint.sh       # Startup script
├── docker-compose.yml         # Reference only
├── instructions.md            # User documentation
├── LICENSE                    # MIT license
├── README.md                  # Project README
├── DEVELOPMENT.md            # This file
├── deps.ts                    # Deno dependencies
├── assets/                    # Icons and images
│   ├── haven-icon.svg
│   ├── haven-kit-configuration.png
│   └── haven-kit-info.png
└── scripts/                   # Embassy SDK scripts
    ├── embassy.ts             # Main export file
    ├── bundle.ts              # Build script
    └── procedures/            # Implementation
        ├── getConfig.ts       # Configuration schema
        ├── setConfig.ts       # Configuration writer
        ├── properties.ts      # Service properties
        ├── health.ts          # Health checks
        └── migrations.ts      # Version migrations
```

## Testing Checklist

Once implementation is complete:

**Build & Install:**
- [ ] Package builds without errors (`make`)
- [ ] Verification passes (`make verify`)
- [ ] Installation completes successfully
- [ ] No errors in Start9 logs

**Functionality:**
- [ ] Relay starts and listens on port 3355
- [ ] Can connect with Nostr client
- [ ] Configuration changes via Start9 Config work
- [ ] Changes persist after restart
- [ ] All relay types function (Private, Chat, Inbox, Outbox, Blossom)

**Start9 Integration:**
- [ ] Health check reports correctly
- [ ] Properties show correct websocket URLs
- [ ] Tor address works from external client
- [ ] LAN address works (if configured)
- [ ] Backup creation works
- [ ] Restore from backup works
- [ ] Service stops gracefully
- [ ] Service starts cleanly
- [ ] Logs are helpful and readable

## Quick Start for Development

### Prerequisites

**Quick install (recommended):**
```bash
./install-prerequisites.sh
```

This script installs:
- Start9 SDK
- Deno (for TypeScript compilation)
- yq (for YAML processing)
- Docker and Docker buildx (for multi-platform builds)

**Manual install:**
```bash
# Install Start9 SDK
curl -s https://start9.com/install | bash

# Install Deno for TypeScript
curl -fsSL https://deno.land/install.sh | sh

# Install build dependencies
sudo apt-get install -y yq docker-buildx
```

### Investigate Haven Relay

```bash
# Pull the image
docker pull letdown2491/haven-relay:latest

# Explore the image
docker run -it --entrypoint /bin/sh letdown2491/haven-relay:latest

# Inside the container:
ls -la /                    # Find binary location
find / -name "haven*"       # Search for Haven files
cat /path/to/config.example # Find config format
/path/to/haven --help       # Check CLI arguments
```

### Update Implementation

1. Update `Dockerfile` line 30 with correct binary path
2. Update `docker_entrypoint.sh` lines 35-39 with correct Haven command
3. Update `setConfig.ts` to generate Haven's config format
4. Test build: `make`

### Test Package

```bash
# Build
make

# Verify structure
make verify

# Install on test Start9 server
# (Requires ~/.embassy/config.yaml configured)
make install
```

## Resources

**Start9 Documentation:**
- [Start9 Developer Docs](https://docs.start9.com)
- [Start9 SDK Reference](https://github.com/Start9Labs/start-sdk)
- [Start9 Developer Community](https://community.start9.com)

**Reference Implementation:**
- [nostr-rs-relay-startos](https://github.com/Start9Labs/nostr-rs-relay-startos) - Our primary reference

**Haven Sources:**
- [Haven Relay (bitvora/haven)](https://github.com/bitvora/haven) - Upstream relay
- [Haven Kit (Letdown2491/haven-kit)](https://github.com/Letdown2491/haven-kit) - Original packaging
- [Haven Docker Images](https://hub.docker.com/u/letdown2491) - Pre-built images

## Summary

The package structure is **complete and follows Start9 best practices**. The simplified relay-only approach eliminates the multi-container challenge.

**Critical remaining work:**
1. Verify Haven binary location in Docker image
2. Determine correct CLI arguments
3. Implement Haven config file generation in `setConfig.ts`
4. Test the build

All the scaffolding is in place - focus should be on the three TODO items in the Docker integration.

## Support

**For Start9 packaging questions:**
- [Start9 Developer Community](https://community.start9.com)
- [Start9 Documentation](https://docs.start9.com)

**For Haven-specific questions:**
- [Haven Repository](https://github.com/bitvora/haven)
- [Haven Kit Issues](https://github.com/Letdown2491/haven-kit/issues)
