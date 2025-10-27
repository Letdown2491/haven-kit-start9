# Haven for Start9

[Haven](https://github.com/bitvora/haven) - a High Availability Vault for Events on Nostr, packaged for Start9 OS.

## What is Haven?

Haven is a specialized Nostr relay system that provides a complete infrastructure for managing your Nostr presence. It consists of five interconnected relay components:

- **Private Relay**: Secure storage for drafts and sensitive content
- **Chat Relay**: Direct messaging with web-of-trust validation
- **Inbox Relay**: Centralized location for mentions and tags
- **Outbox Relay**: Public-facing storage for your posts
- **Blossom Media Server**: Image and video content hosting

## Features

- Start9 native configuration with Simple (quick-start) and Full (advanced) modes covering every Haven environment option
- Multi-relay architecture for specialized content handling
- Support for BadgerDB and LMDB database engines
- S3-compatible backup integration
- Blastr relay broadcasting support with managed relay lists
- Docker-based deployment optimized for Start9
- Integrated with Start9's backup system
- Accessible via Tor and LAN

## Installation

### From the Start9 Marketplace (Coming soon)

1. Open your Start9 dashboard
2. Navigate to the Marketplace
3. Search for "Haven"
4. Click "Install"
5. Wait for the installation to complete
6. Open the Haven service and click **Config** to set up the relay

### Manual Installation (Sideloading)

If you want to install this package manually:

1. Clone this repository
2. Build the package: `make`
3. Transfer the `.s9pk` file to your Start9 server
4. Install via the Start9 interface: System > Sideload Service

## What's Included

This package includes:

- **Haven Relay Engine** - Complete Nostr relay infrastructure managed through Start9's configuration system

## Technical Details

### Services

Haven runs a single service:

- **haven_relay** (Port 3355): The core relay engine built from the [bitvora/haven](https://github.com/bitvora/haven) project

### Docker Image

This package reuses the published `letdown2491/haven-relay:v1.3.1` Docker Hub image and layers a Start9-specific entrypoint that bridges Start9 configuration files into Haven's runtime layout.


### Data Persistence

Haven stores its data in Start9-managed volumes:
- Generated configuration & relay lists: `/data/start9`
- Blossom media (default): `/data/blossom`
- Relay databases: managed under `/data` by Haven (Badger) or via LMDB map settings

All data is automatically included in Start9 system backups.

### Interfaces

- **Nostr Relay**: Protocol endpoint on port 3355 for Nostr client connections (via Tor and LAN proxies managed by Start9)

## Configuration

After installation, open the Haven service in your Start9 dashboard and select **Config**.

At the top of the form choose a **Configuration Mode**:

- **Simple** – supply just your npub, optional username, and advertised relay URL. Haven fills every other value with sensible defaults.
- **Full** – edit every Haven environment variable (relay metadata, rate limits, imports, backups, logging, etc.).

Then work through the sections to set:

1. Fill out the fields in each section (Owner identity, relay endpoint, relay components, imports, backups, logging).
2. Save. The package regenerates Haven's `.env` file and the Blastr/Import relay JSON lists under `/data/start9`.

Relay and import relay lists are entered one per line or comma-separated; they are written automatically to the JSON files consumed by Haven.

## Building from Source

To build the Start9 package:

1. **Install prerequisites:**
   ```bash
   ./install-prerequisites.sh
   ```
   This installs Start9 SDK, Deno, yq, Docker, and Docker buildx.

2. Clone this repository (if not already done)

3. **Build the package:**
   ```bash
   make
   ```

4. **Verify the package:**
   ```bash
   make verify
   ```

5. **Install on your Start9 server:**
   ```bash
   make install
   ```
   (Requires `~/.embassy/config.yaml` configured with your server address)

## Development

### Prerequisites

- Start9 SDK installed
- Docker
- Make

### Project Structure

```
haven-kit-start9/
├── manifest.yaml           # Start9 service manifest
├── instructions.md         # User instructions
├── docker-compose.yml      # Docker service definitions
├── assets/                 # Icons and images
├── LICENSE                 # MIT License
└── README.md              # This file
```

## Support

- Haven Kit Issues: [https://github.com/Letdown2491/haven-kit/issues](https://github.com/Letdown2491/haven-kit/issues)
- Start9 Package Issues: [https://github.com/Letdown2491/haven-kit-start9/issues](https://github.com/Letdown2491/haven-kit-start9/issues)
- Upstream Haven: [https://github.com/bitvora/haven](https://github.com/bitvora/haven)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Developer

Packaged for Start9 by [Letdown2491](https://github.com/Letdown2491)

Original Haven relay by [Bitvora](https://github.com/bitvora)

## License

MIT License - See [LICENSE](LICENSE) file for details.

## About Start9

Start9 is a sovereign computing platform that allows you to run your own private server with a curated marketplace of self-hosted applications. Haven on Start9 provides you with complete control over your Nostr infrastructure.

For more information about Start9, visit [https://start9.com](https://start9.com).
