import { compat, types as T } from "../../deps.ts";

const DEFAULT_RELAY_LIST = `relay.damus.io
nos.lol
relay.nostr.band
relay.snort.social
nostr.land
nostr.mom
relay.nos.social
relay.primal.net
no.str.cr
nostr21.com
nostrue.com
wot.utxo.one
nostrelites.org
wot.nostr.party
wot.sovbit.host
wot.girino.org
relay.lexingtonbitcoin.org
zap.watch
satsage.xyz
wons.calva.dev`;

export const getConfig: T.ExpectedExports.getConfig = compat.getConfig({
  "tor-address": {
    "name": "Tor Address",
    "description": "The Tor address for the Haven relay websocket interface",
    "type": "pointer",
    "subtype": "package",
    "package-id": "haven",
    "target": "tor-address",
    "interface": "websocket",
  },
  "lan-address": {
    "name": "LAN Address",
    "description": "The LAN address for the Haven relay websocket interface",
    "type": "pointer",
    "subtype": "package",
    "package-id": "haven",
    "target": "lan-address",
    "interface": "websocket",
  },
  "configuration-mode": {
    "type": "enum",
    "name": "Configuration Mode",
    "description": "Choose between a quick-start wizard (Simple) or full control over every Haven option.",
    "values": ["simple", "full"],
    "default": "simple",
  },
  "simple-config": {
    "type": "object",
    "name": "Simple Configuration",
    "description": "Provide only the essential details. All other values fall back to Haven defaults.",
    "spec": {
      "npub": {
        "type": "string",
        "name": "Owner npub",
        "description": "Your Nostr public key (must start with npub1).",
        "default": "",
      },
      "username": {
        "type": "string",
        "name": "Display Name",
        "description": "Optional display name used when deriving relay labels.",
        "default": "",
      },
      "relay-url": {
        "type": "string",
        "name": "Relay URL",
        "description": "Advertised websocket URL (e.g. ws://localhost:3355 or wss://relay.example.com).",
        "default": "ws://localhost:3355",
      },
    },
  },
  "full-config": {
    "type": "object",
    "name": "Full Configuration",
    "description": "Configure Haven's relay identity, relay behaviour, rate limits, imports, backups, and integrations.",
    "spec": {
      "owner": {
        "type": "object",
        "name": "Owner Identity",
        "description": "Owner information applied to each relay component.",
        "spec": {
          "npub": {
            "type": "string",
            "name": "Owner npub",
            "description": "Your Nostr public key in npub format (must start with npub1).",
            "default": "",
          },
          "username": {
            "type": "string",
            "name": "Display Name",
            "description": "Used to label relays when personalized names are empty.",
            "default": "",
          },
        },
      },
      "relay": {
        "type": "object",
        "name": "Relay Endpoint",
        "description": "Network binding and advertised URL for Haven.",
        "spec": {
          "url": {
            "type": "string",
            "name": "Relay URL",
            "description": "Websocket URL clients should use (for example ws://localhost:3355 or wss://relay.example.com).",
            "default": "ws://localhost:3355",
          },
          "port": {
            "type": "number",
            "name": "Relay Port",
            "description": "TCP port Haven listens on inside the container.",
            "default": 3355,
          },
          "bind-address": {
            "type": "string",
            "name": "Bind Address",
            "description": "Interface Haven listens on (0.0.0.0 for all interfaces).",
            "default": "0.0.0.0",
          },
        },
      },
      "database": {
        "type": "object",
        "name": "Database",
        "description": "Storage engine configuration.",
        "spec": {
          "engine": {
            "type": "enum",
            "name": "Database Engine",
            "description": "Badger is the default (faster, higher RAM). Choose LMDB for lower memory environments.",
            "values": ["badger", "lmdb"],
            "default": "badger",
          },
          "lmdb-mapsize": {
            "type": "number",
            "name": "LMDB Map Size",
            "description": "Size in bytes for the LMDB map (used when engine = lmdb).",
            "default": 273000000000,
          },
        },
      },
      "paths": {
        "type": "object",
        "name": "Storage Paths",
        "description": "Locations on disk for Haven data.",
        "spec": {
          "blossom-path": {
            "type": "string",
            "name": "Blossom Media Path",
            "description": "Directory for Blossom attachments inside the service volume.",
            "default": "/data/blossom",
          },
        },
      },
      "private-relay": {
        "type": "object",
        "name": "Private Relay",
        "description": "Settings for the private draft relay.",
        "spec": {
          "name": {
            "type": "string",
            "name": "Relay Name",
            "description": "Label displayed to clients (leave blank to derive from owner display name).",
            "default": "",
          },
          "npub": {
            "type": "string",
            "name": "Relay Owner npub",
            "description": "Override owner npub for this relay (leave blank to use owner npub).",
            "default": "",
          },
          "description": {
            "type": "string",
            "name": "Description",
            "description": "Optional description presented to clients.",
            "default": "",
          },
          "icon": {
            "type": "string",
            "name": "Icon URL",
            "description": "Optional icon URL for this relay.",
            "default": "",
          },
        },
      },
      "private-rate-limits": {
        "type": "object",
        "name": "Private Relay Rate Limits",
        "description": "Rate limiting configuration for the private relay.",
        "spec": {
          "event-ip-tokens-per-interval": {
            "type": "number",
            "name": "Event Tokens per Interval",
            "default": 50,
          },
          "event-ip-interval-seconds": {
            "type": "number",
            "name": "Event Interval (seconds)",
            "default": 1,
          },
          "event-ip-max-tokens": {
            "type": "number",
            "name": "Event Max Tokens",
            "default": 100,
          },
          "allow-empty-filters": {
            "type": "boolean",
            "name": "Allow Empty Filters",
            "default": true,
          },
          "allow-complex-filters": {
            "type": "boolean",
            "name": "Allow Complex Filters",
            "default": true,
          },
          "connection-tokens-per-interval": {
            "type": "number",
            "name": "Connection Tokens per Interval",
            "default": 3,
          },
          "connection-interval-seconds": {
            "type": "number",
            "name": "Connection Interval (seconds)",
            "default": 5,
          },
          "connection-max-tokens": {
            "type": "number",
            "name": "Connection Max Tokens",
            "default": 9,
          },
        },
      },
      "chat-relay": {
        "type": "object",
        "name": "Chat Relay",
        "description": "Settings for direct message relay.",
        "spec": {
          "name": {
            "type": "string",
            "name": "Relay Name",
            "default": "",
          },
          "npub": {
            "type": "string",
            "name": "Relay Owner npub",
            "description": "Override owner npub for chat relay (blank uses owner npub).",
            "default": "",
          },
          "description": {
            "type": "string",
            "name": "Description",
            "default": "",
          },
          "icon": {
            "type": "string",
            "name": "Icon URL",
            "default": "",
          },
          "wot-depth": {
            "type": "number",
            "name": "Web-of-Trust Depth",
            "default": 3,
          },
          "wot-refresh-interval-hours": {
            "type": "number",
            "name": "WOT Refresh Interval (hours)",
            "default": 24,
          },
          "minimum-followers": {
            "type": "number",
            "name": "Minimum Followers",
            "default": 3,
          },
        },
      },
      "chat-rate-limits": {
        "type": "object",
        "name": "Chat Relay Rate Limits",
        "description": "Rate limiting configuration for chat relay.",
        "spec": {
          "event-ip-tokens-per-interval": {
            "type": "number",
            "name": "Event Tokens per Interval",
            "default": 50,
          },
          "event-ip-interval-seconds": {
            "type": "number",
            "name": "Event Interval (seconds)",
            "default": 1,
          },
          "event-ip-max-tokens": {
            "type": "number",
            "name": "Event Max Tokens",
            "default": 100,
          },
          "allow-empty-filters": {
            "type": "boolean",
            "name": "Allow Empty Filters",
            "default": false,
          },
          "allow-complex-filters": {
            "type": "boolean",
            "name": "Allow Complex Filters",
            "default": false,
          },
          "connection-tokens-per-interval": {
            "type": "number",
            "name": "Connection Tokens per Interval",
            "default": 3,
          },
          "connection-interval-seconds": {
            "type": "number",
            "name": "Connection Interval (seconds)",
            "default": 3,
          },
          "connection-max-tokens": {
            "type": "number",
            "name": "Connection Max Tokens",
            "default": 9,
          },
        },
      },
      "outbox-relay": {
        "type": "object",
        "name": "Outbox Relay",
        "description": "Settings for public outbox relay.",
        "spec": {
          "name": {
            "type": "string",
            "name": "Relay Name",
            "default": "",
          },
          "npub": {
            "type": "string",
            "name": "Relay Owner npub",
            "description": "Override owner npub for outbox relay (blank uses owner npub).",
            "default": "",
          },
          "description": {
            "type": "string",
            "name": "Description",
            "default": "",
          },
          "icon": {
            "type": "string",
            "name": "Icon URL",
            "default": "",
          },
        },
      },
      "outbox-rate-limits": {
        "type": "object",
        "name": "Outbox Relay Rate Limits",
        "description": "Rate limiting configuration for outbox relay.",
        "spec": {
          "event-ip-tokens-per-interval": {
            "type": "number",
            "name": "Event Tokens per Interval",
            "default": 10,
          },
          "event-ip-interval-seconds": {
            "type": "number",
            "name": "Event Interval (seconds)",
            "default": 60,
          },
          "event-ip-max-tokens": {
            "type": "number",
            "name": "Event Max Tokens",
            "default": 100,
          },
          "allow-empty-filters": {
            "type": "boolean",
            "name": "Allow Empty Filters",
            "default": false,
          },
          "allow-complex-filters": {
            "type": "boolean",
            "name": "Allow Complex Filters",
            "default": false,
          },
          "connection-tokens-per-interval": {
            "type": "number",
            "name": "Connection Tokens per Interval",
            "default": 3,
          },
          "connection-interval-seconds": {
            "type": "number",
            "name": "Connection Interval (seconds)",
            "default": 1,
          },
          "connection-max-tokens": {
            "type": "number",
            "name": "Connection Max Tokens",
            "default": 9,
          },
        },
      },
      "inbox-relay": {
        "type": "object",
        "name": "Inbox Relay",
        "description": "Settings for inbox relay.",
        "spec": {
          "name": {
            "type": "string",
            "name": "Relay Name",
            "default": "",
          },
          "npub": {
            "type": "string",
            "name": "Relay Owner npub",
            "description": "Override owner npub for inbox relay (blank uses owner npub).",
            "default": "",
          },
          "description": {
            "type": "string",
            "name": "Description",
            "default": "",
          },
          "icon": {
            "type": "string",
            "name": "Icon URL",
            "default": "",
          },
          "pull-interval-seconds": {
            "type": "number",
            "name": "Pull Interval (seconds)",
            "default": 600,
          },
        },
      },
      "inbox-rate-limits": {
        "type": "object",
        "name": "Inbox Relay Rate Limits",
        "description": "Rate limiting configuration for inbox relay.",
        "spec": {
          "event-ip-tokens-per-interval": {
            "type": "number",
            "name": "Event Tokens per Interval",
            "default": 10,
          },
          "event-ip-interval-seconds": {
            "type": "number",
            "name": "Event Interval (seconds)",
            "default": 1,
          },
          "event-ip-max-tokens": {
            "type": "number",
            "name": "Event Max Tokens",
            "default": 20,
          },
          "allow-empty-filters": {
            "type": "boolean",
            "name": "Allow Empty Filters",
            "default": false,
          },
          "allow-complex-filters": {
            "type": "boolean",
            "name": "Allow Complex Filters",
            "default": false,
          },
          "connection-tokens-per-interval": {
            "type": "number",
            "name": "Connection Tokens per Interval",
            "default": 3,
          },
          "connection-interval-seconds": {
            "type": "number",
            "name": "Connection Interval (seconds)",
            "default": 1,
          },
          "connection-max-tokens": {
            "type": "number",
            "name": "Connection Max Tokens",
            "default": 9,
          },
        },
      },
      "import": {
        "type": "object",
        "name": "Import Configuration",
        "description": "Historical note import behaviour.",
        "spec": {
          "start-date": {
            "type": "string",
            "name": "Import Start Date",
            "description": "Only import notes on or after this ISO date (YYYY-MM-DD).",
            "default": "2023-01-20",
          },
          "query-interval-seconds": {
            "type": "number",
            "name": "Query Interval (seconds)",
            "default": 600,
          },
          "owner-fetch-timeout-seconds": {
            "type": "number",
            "name": "Owner Notes Fetch Timeout (seconds)",
            "default": 60,
          },
          "tagged-fetch-timeout-seconds": {
            "type": "number",
            "name": "Tagged Notes Fetch Timeout (seconds)",
            "default": 120,
          },
          "relays": {
            "type": "string",
            "name": "Import Relays",
            "description": "One relay per line or comma separated (host or websocket URL).",
            "default": DEFAULT_RELAY_LIST,
          },
          "relays-file": {
            "type": "string",
            "name": "Import Relays File Path",
            "description": "Path for the generated relay list file used by Haven.",
            "default": "/data/start9/relays_import.json",
          },
        },
      },
      "backup": {
        "type": "object",
        "name": "Backup",
        "description": "Cloud backup provider configuration.",
        "spec": {
          "provider": {
            "type": "enum",
            "name": "Backup Provider",
            "values": ["none", "s3"],
            "default": "none",
          },
          "interval-hours": {
            "type": "number",
            "name": "Backup Interval (hours)",
            "default": 24,
          },
          "s3": {
            "type": "object",
            "name": "S3 Settings",
            "description": "Only used when provider is set to s3.",
            "spec": {
              "access-key-id": {
                "type": "string",
                "name": "Access Key ID",
                "default": "",
              },
              "secret-key": {
                "type": "string",
                "name": "Secret Key",
                "description": "Keep this private.",
                "default": "",
              },
              "endpoint": {
                "type": "string",
                "name": "Endpoint",
                "default": "",
              },
              "region": {
                "type": "string",
                "name": "Region",
                "default": "",
              },
              "bucket": {
                "type": "string",
                "name": "Bucket Name",
                "default": "",
              },
            },
          },
        },
      },
      "blastr": {
        "type": "object",
        "name": "Blastr",
        "description": "Broadcast additional relays for outbound notes.",
        "spec": {
          "relays": {
            "type": "string",
            "name": "Blastr Relays",
            "description": "One relay per line or comma separated (host or websocket URL).",
            "default": DEFAULT_RELAY_LIST,
          },
          "relays-file": {
            "type": "string",
            "name": "Blastr Relays File Path",
            "description": "Path for the generated blastr relay list used by Haven.",
            "default": "/data/start9/relays_blastr.json",
          },
        },
      },
      "wot": {
        "type": "object",
        "name": "Web-of-Trust",
        "description": "Global WOT behaviour.",
        "spec": {
          "fetch-timeout-seconds": {
            "type": "number",
            "name": "Fetch Timeout (seconds)",
            "default": 60,
          },
        },
      },
      "logging": {
        "type": "object",
        "name": "Logging",
        "description": "Log level and timezone.",
        "spec": {
          "level": {
            "type": "enum",
            "name": "Log Level",
            "values": ["TRACE", "DEBUG", "INFO", "WARN", "ERROR"],
            "default": "INFO",
          },
          "timezone": {
            "type": "string",
            "name": "Timezone",
            "description": "Timezone string for the container (e.g. UTC, America/New_York).",
            "default": "UTC",
          },
        },
      },
    },
  },
});
