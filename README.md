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

- Web-based configuration UI for easy setup
- Multi-relay architecture for specialized content handling
- Support for BadgerDB and LMDB database engines
- S3-compatible backup integration
- Blastr relay broadcasting support
- Docker-based deployment optimized for Start9
- Integrated with Start9's backup system
- Accessible via Tor and LAN

## Installation

### From the Start9 Marketplace

1. Open your Start9 dashboard
2. Navigate to the Marketplace
3. Search for "Haven"
4. Click "Install"
5. Wait for the installation to complete
6. Launch the Haven configuration interface from your services

### Manual Installation (Sideloading)

If you want to install this package manually:

1. Clone this repository
2. Build the package: `make`
3. Transfer the `.s9pk` file to your Start9 server
4. Install via the Start9 interface: System > Sideload Service

## What's Included

This package includes:

- **Haven Relay Engine** - Complete Nostr relay infrastructure
- **Configuration UI** - Web-based interface for easy management

## Technical Details

### Services

Haven runs two main services:

1. **haven_relay** (Port 3355): The core relay engine built from the [bitvora/haven](https://github.com/bitvora/haven) project
2. **config_ui** (Port 8080): Flask-based web interface for configuration

### Docker Images

The app uses the following Docker images:
- `letdown2491/haven-relay:latest`
- `letdown2491/haven-config-ui:latest`

### Data Persistence

Haven stores its data in Start9-managed volumes:
- Configuration files: `/root/.haven/config`
- Blossom media: `/root/.haven/blossom`
- Database: `/root/.haven/db`

All data is automatically included in Start9 system backups.

### Interfaces

- **Web Interface**: Accessible via Tor and (optionally) LAN on port 8080
- **Nostr Relay**: Protocol endpoint on port 3355 for Nostr client connections

## Configuration

After installation, access the web UI to configure:

- Relay settings (Private, Chat, Inbox, Outbox, Blossom)
- Database engine selection (BadgerDB/LMDB)
- Backup providers and S3 integration
- Blastr relay connections for broadcasting

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
