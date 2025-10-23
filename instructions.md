# Haven Instructions for Start9

## Welcome to Haven

Haven is a specialized Nostr relay system that provides a complete infrastructure for managing your Nostr presence on your Start9 server.

## What is Haven?

Haven consists of five interconnected relay components:

- **Private Relay**: Secure storage for drafts and sensitive content
- **Chat Relay**: Direct messaging with web-of-trust validation
- **Inbox Relay**: Centralized location for mentions and tags
- **Outbox Relay**: Public-facing storage for your posts
- **Blossom Media Server**: Image and video content hosting

## Getting Started

### Configuration

Haven is configured through Start9's native configuration system:

1. After installation, navigate to the Haven service in your Start9 dashboard.
2. Click **Config** to open the Haven configuration form.
3. Choose a **Configuration Mode**:
   - **Simple** – supply just your npub, optional username, and advertised relay URL. Haven fills every other value with sensible defaults.
   - **Full** – expose every Haven environment variable for fine-grained control.
4. Work through the sections to set (especially when using Full mode):
   - **Owner Identity & Relay Endpoint** – owner npub, display name, advertised websocket URL, port and bind address.
   - **Database & Storage** – choose Badger or LMDB, adjust LMDB map size, and set the Blossom media directory.
   - **Relay Details** – names, descriptions, icons, and rate limits for the Private, Chat, Outbox, and Inbox relays (all values map directly to the Haven `.env`).
   - **Import & Blastr** – manage lists of relays (one per line) for historical imports and Blastr broadcasting. Files are generated automatically under `/data/start9`.
   - **Backups & Integrations** – configure S3-compatible backups, global Web-of-Trust timeout, logging level, and timezone.
5. Click **Save** to apply your configuration. Start9 will regenerate Haven's `.env` and supporting JSON files.

**Note:** Configuration changes may require restarting the service.

### Service Port

Haven exposes one main endpoint:

- **Port 3355**: Nostr relay websocket endpoint (for connecting Nostr clients)

### Getting Your Relay Address

1. In the Haven service page, click on "Properties"
2. Copy your Nostr Relay Websocket URL (Tor is recommended for privacy)
3. This is the address you'll add to your Nostr client

### Connecting Your Nostr Client

To connect your Nostr client to your Haven relay:

1. Open your Nostr client (Damus, Amethyst, Nostros, etc.)
2. Navigate to relay settings
3. Add your Haven relay websocket URL from the Properties page
4. The relay will serve all configured relay types:
   - Private relay for drafts
   - Outbox relay for public posts
   - Inbox relay for receiving mentions
   - Chat relay for direct messages
   - Blossom server for media uploads

### Data Storage

Haven stores all data in the Start9 managed volume at `/data`:

- Generated configuration: `/data/start9` (includes the `.env` file plus blastr/import relay lists)
- Media files (Blossom): `/data/blossom` by default (customisable)
- Relay databases: managed by Haven under its data directory (Badger) or as configured for LMDB

All data is automatically backed up when you perform a Start9 system backup.

### Backup and Restore

Haven integrates with Start9's backup system:

- **Automatic Backups**: Haven data is included in your Start9 system backups
- **Manual Backups**: Use the Start9 backup interface to create on-demand backups
- All relay data, media, and configuration are preserved

### Troubleshooting

#### Relay Not Responding

1. Check the Health Checks in the Start9 dashboard
2. Verify the relay service is running (should show "Running")
3. Review the logs for any error messages
4. Try restarting the service

#### Connection Issues

1. Ensure your Nostr client supports websocket connections
2. Verify you're using the correct relay URL from Properties
3. Check that the relay is healthy in the dashboard
4. For Tor connections, ensure Tor is running on your device

#### Configuration Not Applied

1. Make sure you clicked "Save" after changing configuration
2. Restart the Haven service to apply changes
3. Check logs for any configuration errors

#### Database Issues

If you experience database corruption:

1. Stop the Haven service
2. Restore from a recent backup via Start9's backup system
3. Restart the service
4. If issues persist, try switching database engines in Config

### Support

For issues or questions:

- GitHub Issues: [https://github.com/Letdown2491/haven-kit/issues](https://github.com/Letdown2491/haven-kit/issues)
- Haven Kit Repository: [https://github.com/Letdown2491/haven-kit](https://github.com/Letdown2491/haven-kit)
- Upstream Haven: [https://github.com/bitvora/haven](https://github.com/bitvora/haven)

### Advanced Configuration

All Haven configuration is managed through Start9's Config interface. Every environment variable used by Haven is surfaced, including relay metadata, rate limits, import/blastr lists, S3 credentials, and logging controls. The descriptions beside each field provide guidance and defaults.

For more information about Haven's architecture and capabilities, refer to the [Haven documentation](https://github.com/bitvora/haven).

## Security Considerations

- **Private Relay**: Never share your private relay address publicly
- **Access Control**: Use web-of-trust features for the Chat relay
- **Backups**: Regularly backup your Haven data to prevent data loss
- **Updates**: Keep Haven updated for the latest security patches

## What's Next?

After setting up Haven:

1. Configure your Nostr client to use your relays
2. Test each relay type with sample posts
3. Set up automated backups
4. Join the Nostr community and start using your self-hosted relay!

Enjoy your sovereign Nostr infrastructure with Haven on Start9!
