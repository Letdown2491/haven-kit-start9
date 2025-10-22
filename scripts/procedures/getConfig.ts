import { compat, types as T } from "../../deps.ts";

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
  "relay-config": {
    "type": "object",
    "name": "Relay Configuration",
    "description": "Haven relay configuration options",
    "spec": {
      "private-relay": {
        "type": "boolean",
        "name": "Private Relay",
        "description": "Enable private relay mode (recommended)",
        "default": true,
      },
      "chat-relay": {
        "type": "boolean",
        "name": "Chat Relay",
        "description": "Enable chat relay with web-of-trust",
        "default": true,
      },
      "inbox-relay": {
        "type": "boolean",
        "name": "Inbox Relay",
        "description": "Enable inbox relay for mentions and tags",
        "default": true,
      },
      "outbox-relay": {
        "type": "boolean",
        "name": "Outbox Relay",
        "description": "Enable outbox relay for public posts",
        "default": true,
      },
      "blossom-server": {
        "type": "boolean",
        "name": "Blossom Media Server",
        "description": "Enable Blossom media server for images/videos",
        "default": true,
      },
      "database-engine": {
        "type": "enum",
        "name": "Database Engine",
        "description": "Choose database engine (BadgerDB is faster but uses more memory)",
        "values": ["badgerdb", "lmdb"],
        "default": "badgerdb",
      },
    },
  },
});
