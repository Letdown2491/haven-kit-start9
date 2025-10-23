import { types as T, util, YAML } from "../../deps.ts";

const noPropertiesFound: T.ResultType<T.Properties> = {
  result: {
    version: 2,
    data: {
      "Not Ready": {
        type: "string",
        value: "Could not load properties. The service is still starting...",
        qr: false,
        copyable: false,
        masked: false,
        description: "Waiting for Haven to finish starting",
      },
    },
  },
} as const;

export const properties: T.ExpectedExports.properties = async (
  effects: T.Effects,
) => {
  const depends = {};
  if (
    !(await effects.metadata).status ||
    !await util.exists(effects, { volumeId: "main", path: "start9" }) ||
    !await util.exists(effects, {
      volumeId: "main",
      path: "start9/config.yaml",
    })
  ) {
    return noPropertiesFound;
  }

  const parsed = await effects.readFile({
    volumeId: "main",
    path: "start9/config.yaml",
  })
    .then((x) => YAML.parse(x))
    .catch((e) => {
      console.error("Error reading config:", e);
      return null;
    });

  if (!parsed || typeof parsed !== "object") {
    return noPropertiesFound;
  }

  const config = parsed as Record<string, unknown>;

  const torAddress = typeof config["tor-address"] === "string" ? config["tor-address"] : null;
  const lanAddress = typeof config["lan-address"] === "string" ? config["lan-address"] : null;
  const configurationMode = typeof config["configuration-mode"] === "string"
    ? config["configuration-mode"]
    : "simple";

  if (!torAddress || !lanAddress) {
    return noPropertiesFound;
  }

  const haven = config["haven"] as Record<string, unknown> | undefined;
  const owner = haven?.owner as Record<string, unknown> | undefined;
  const relay = haven?.relay as Record<string, unknown> | undefined;
  const backup = haven?.backup as Record<string, unknown> | undefined;
  const blastr = haven?.blastr as Record<string, unknown> | undefined;
  const importConfig = haven?.import as Record<string, unknown> | undefined;

  const ownerNpub = typeof owner?.npub === "string" && owner.npub.length > 0 ? owner.npub : "Unknown";
  const ownerUsername = typeof owner?.username === "string" ? owner.username : "";
  const relayUrl = typeof relay?.url === "string" && relay.url.length > 0 ? relay.url : "Not configured";
  const backupProvider = typeof backup?.provider === "string" ? backup.provider : "none";
  const blastrRelays = Array.isArray(blastr?.relays) ? blastr?.relays as unknown[] : [];
  const importRelays = Array.isArray(importConfig?.relays) ? importConfig?.relays as unknown[] : [];
  const importStartDate = typeof importConfig?.start_date === "string"
    ? importConfig.start_date
    : "Not set";

  const torValue = `ws://${torAddress}`;
  const lanValue = `wss://${lanAddress}`;
  const blastrCount = blastrRelays.filter((relayEntry) => typeof relayEntry === "string" && relayEntry.length > 0).length;
  const importCount = importRelays.filter((relayEntry) => typeof relayEntry === "string" && relayEntry.length > 0).length;

  return {
    result: {
      version: 2,
      data: {
        "Configuration Mode": {
          type: "string",
          value: configurationMode === "full" ? "Full" : "Simple",
          description: "Current Haven configuration mode (change via the Config form).",
          copyable: false,
          qr: false,
          masked: false,
        },
        "Nostr Relay Websocket (Tor)": {
          type: "string",
          value: torValue,
          description:
            "Primary Haven relay endpoint – add to your client when connecting over Tor.",
          copyable: true,
          qr: true,
          masked: false,
        },
        "Nostr Relay Websocket (LAN)": {
          type: "string",
          value: lanValue,
          description:
            "LAN relay endpoint (use for trusted local connections only).",
          copyable: true,
          qr: false,
          masked: false,
        },
        "Owner npub": {
          type: "string",
          value: ownerNpub,
          description: ownerUsername ? `Configured owner username: ${ownerUsername}` : "Configured owner npub.",
          copyable: true,
          qr: false,
          masked: false,
        },
        "Advertised Relay URL": {
          type: "string",
          value: relayUrl,
          description: "Websocket URL clients should use (from Haven configuration).",
          copyable: true,
          qr: false,
          masked: false,
        },
        "Backup Provider": {
          type: "string",
          value: backupProvider,
          description: "Cloud backup provider configured for Haven.",
          copyable: false,
          qr: false,
          masked: false,
        },
        "Blastr Relays": {
          type: "string",
          value: `${blastrCount} configured`,
          description: "Number of relays Haven will broadcast to via Blastr.",
          copyable: false,
          qr: false,
          masked: false,
        },
        "Import Relays": {
          type: "string",
          value: `${importCount} configured (start date ${importStartDate})`,
          description: "Import relays and start date used for historical sync.",
          copyable: false,
          qr: false,
          masked: false,
        },
      },
    },
  };
};
