import { compat, types as T, YAML } from "../../deps.ts";

const DEFAULT_RELAY_LIST = [
  "relay.damus.io",
  "nos.lol",
  "relay.nostr.band",
  "relay.snort.social",
  "nostr.land",
  "nostr.mom",
  "relay.nos.social",
  "relay.primal.net",
  "no.str.cr",
  "nostr21.com",
  "nostrue.com",
  "wot.utxo.one",
  "nostrelites.org",
  "wot.nostr.party",
  "wot.sovbit.host",
  "wot.girino.org",
  "relay.lexingtonbitcoin.org",
  "zap.watch",
  "satsage.xyz",
  "wons.calva.dev",
];

const newline = "\n";

const sanitizeList = (raw: string | undefined): string[] => {
  if (!raw) return [...DEFAULT_RELAY_LIST];
  return raw
    .split(/[,\n\r]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
};

const ensureDataPath = (pathValue: string, label: string): { absolute: string; relative: string } => {
  const trimmed = pathValue.trim();
  if (!trimmed.startsWith("/data/")) {
    throw new Error(`${label} must reside within /data (received: ${trimmed})`);
  }
  const relative = trimmed.replace(/^\/data\//, "");
  if (!relative) {
    throw new Error(`${label} must include a file name (received: ${trimmed})`);
  }
  return { absolute: trimmed, relative };
};

const quote = (value: string): string => {
  const safe = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");
  return `"${safe}"`;
};

const boolString = (value: boolean): string => value ? "true" : "false";

const coerceNumber = (value: unknown, fallback: number): number => {
  const num = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const coerceBoolean = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return fallback;
};

const fallbackName = (custom: string, username: string, label: string): string => {
  const trimmed = custom.trim();
  if (trimmed) return trimmed;
  if (username) {
    return `${username}'s ${label}`;
  }
  return label;
};

const normalizeRelayUrl = (raw: string, port: number): string => {
  const trimmed = raw.trim();
  if (!trimmed) {
    return `ws://localhost:${port}`;
  }
  if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
    return trimmed.replace(/\/$/, "");
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
      .replace(/^http:/, "ws:")
      .replace(/^https:/, "wss:")
      .replace(/\/$/, "");
  }
  return `ws://${trimmed.replace(/\/$/, "")}`;
};

const relayNpub = (value: string | undefined, owner: string): string => {
  const trimmed = (value ?? "").trim();
  return trimmed || owner;
};

const ensureDir = async (effects: T.Effects, dir: string) => {
  if (!dir || dir === ".") return;
  await effects.createDir({ volumeId: "main", path: dir });
};

export const setConfig: T.ExpectedExports.setConfig = async (
  effects: T.Effects,
  input: T.Config,
) => {
  const modeRaw = input["configuration-mode"] as string | undefined;
  const mode = modeRaw === "full" ? "full" : "simple";
  const simpleConfig = input["simple-config"] as Record<string, string> | undefined;
  const fullConfig = input["full-config"] as Record<string, unknown> | undefined;

  let havenConfig: Record<string, unknown> | undefined;
  let simplePersist: { npub: string; username: string; "relay-url": string } | undefined;

  if (mode === "simple") {
    if (!simpleConfig) {
      throw new Error("Simple configuration values are missing.");
    }
    const simpleNpub = simpleConfig["npub"]?.trim() ?? "";
    if (!simpleNpub) {
      throw new Error("Owner npub is required (npub1...).");
    }
    if (!simpleNpub.startsWith("npub1")) {
      throw new Error("Owner npub must begin with npub1.");
    }

    const simpleUsername = simpleConfig["username"]?.trim() ?? "";
    const simpleRelayPort = 3355;
    const normalizedRelayUrl = normalizeRelayUrl(String(simpleConfig["relay-url"] ?? ""), simpleRelayPort);

    havenConfig = {
      owner: {
        npub: simpleNpub,
        username: simpleUsername,
      },
      relay: {
        url: normalizedRelayUrl,
        port: simpleRelayPort,
        "bind-address": "0.0.0.0",
      },
    };

    simplePersist = {
      npub: simpleNpub,
      username: simpleUsername,
      "relay-url": normalizedRelayUrl,
    };
  } else {
    havenConfig = fullConfig;
  }

  if (!havenConfig) {
    throw new Error("Missing Haven configuration. Please configure the service before starting.");
  }

  const owner = havenConfig["owner"] as Record<string, string> | undefined;
  const ownerNpub = owner?.npub?.trim() ?? "";
  if (!ownerNpub) {
    throw new Error("Owner npub is required (npub1...).");
  }
  if (!ownerNpub.startsWith("npub1")) {
    throw new Error("Owner npub must begin with npub1.");
  }
  const ownerUsername = owner?.username?.trim() ?? "";

  const relay = havenConfig["relay"] as Record<string, unknown> | undefined;
  const relayPort = coerceNumber(relay?.port, 3355);
  const relayUrl = normalizeRelayUrl(String(relay?.url ?? ""), relayPort);
  const relayBindAddress = String(relay?.["bind-address"] ?? "0.0.0.0").trim() || "0.0.0.0";

  const database = havenConfig["database"] as Record<string, unknown> | undefined;
  const dbEngine = String(database?.engine ?? "badger");
  const lmdbMapsize = coerceNumber(database?.["lmdb-mapsize"], 273000000000);

  const paths = havenConfig["paths"] as Record<string, unknown> | undefined;
  const blossomPath = String(paths?.["blossom-path"] ?? "/data/blossom").trim() || "/data/blossom";

  const privateRelay = havenConfig["private-relay"] as Record<string, string> | undefined;
  const privateRate = havenConfig["private-rate-limits"] as Record<string, unknown> | undefined;

  const chatRelay = havenConfig["chat-relay"] as Record<string, string> | undefined;
  const chatRate = havenConfig["chat-rate-limits"] as Record<string, unknown> | undefined;

  const outboxRelay = havenConfig["outbox-relay"] as Record<string, string> | undefined;
  const outboxRate = havenConfig["outbox-rate-limits"] as Record<string, unknown> | undefined;

  const inboxRelay = havenConfig["inbox-relay"] as Record<string, unknown> | undefined;
  const inboxRate = havenConfig["inbox-rate-limits"] as Record<string, unknown> | undefined;

  const importConfig = havenConfig["import"] as Record<string, unknown> | undefined;
  const backup = havenConfig["backup"] as Record<string, unknown> | undefined;
  const blastr = havenConfig["blastr"] as Record<string, unknown> | undefined;
  const wot = havenConfig["wot"] as Record<string, unknown> | undefined;
  const logging = havenConfig["logging"] as Record<string, unknown> | undefined;

  const importRelays = sanitizeList(importConfig?.relays as string | undefined);
  const importRelaysFileSpec = ensureDataPath(
    String(importConfig?.["relays-file"] ?? "/data/start9/relays_import.json"),
    "Import relays file",
  );
  const importStartDate = String(importConfig?.["start-date"] ?? "2023-01-20").trim() || "2023-01-20";
  const importQueryInterval = coerceNumber(importConfig?.["query-interval-seconds"], 600);
  const importOwnerTimeout = coerceNumber(importConfig?.["owner-fetch-timeout-seconds"], 60);
  const importTaggedTimeout = coerceNumber(importConfig?.["tagged-fetch-timeout-seconds"], 120);

  const blastrRelays = sanitizeList(blastr?.relays as string | undefined);
  const blastrRelaysFileSpec = ensureDataPath(
    String(blastr?.["relays-file"] ?? "/data/start9/relays_blastr.json"),
    "Blastr relays file",
  );

  const backupProvider = String(backup?.provider ?? "none");
  const backupInterval = coerceNumber(backup?.["interval-hours"], 24);
  const backupS3 = backup?.s3 as Record<string, string> | undefined;
  const s3AccessKey = backupS3?.["access-key-id"]?.trim() ?? "";
  const s3SecretKey = backupS3?.["secret-key"]?.trim() ?? "";
  const s3Endpoint = backupS3?.endpoint?.trim() ?? "";
  const s3Region = backupS3?.region?.trim() ?? "";
  const s3Bucket = backupS3?.bucket?.trim() ?? "";

  const wotFetchTimeout = coerceNumber(wot?.["fetch-timeout-seconds"], 60);

  const logLevel = String(logging?.level ?? "INFO");
  const timezone = String(logging?.timezone ?? "UTC").trim() || "UTC";

  const privateName = fallbackName(privateRelay?.name ?? "", ownerUsername, "Private Relay");
  const privateDescription = (privateRelay?.description ?? "A safe place to store my drafts and ecash").trim() ||
    "A safe place to store my drafts and ecash";
  const privateIcon = (privateRelay?.icon ?? "").trim();
  const privateNpub = relayNpub(privateRelay?.npub, ownerNpub);

  const chatName = fallbackName(chatRelay?.name ?? "", ownerUsername, "Chat Relay");
  const chatDescription = (chatRelay?.description ?? "A relay for private chats").trim() || "A relay for private chats";
  const chatIcon = (chatRelay?.icon ?? "").trim();
  const chatNpub = relayNpub(chatRelay?.npub, ownerNpub);
  const chatWotDepth = coerceNumber(chatRelay?.["wot-depth"], 3);
  const chatWotRefresh = coerceNumber(chatRelay?.["wot-refresh-interval-hours"], 24);
  const chatMinFollowers = coerceNumber(chatRelay?.["minimum-followers"], 3);

  const outboxName = fallbackName(outboxRelay?.name ?? "", ownerUsername, "Outbox Relay");
  const outboxDescription = (outboxRelay?.description ?? "A relay and Blossom server for public messages and media").trim() ||
    "A relay and Blossom server for public messages and media";
  const outboxIcon = (outboxRelay?.icon ?? "").trim();
  const outboxNpub = relayNpub(outboxRelay?.npub, ownerNpub);

  const inboxName = fallbackName(inboxRelay?.name ?? "", ownerUsername, "Inbox Relay");
  const inboxDescription = (inboxRelay?.description ?? "Send your interactions with my notes here").trim() ||
    "Send your interactions with my notes here";
  const inboxIcon = (inboxRelay?.icon ?? "").trim();
  const inboxNpub = relayNpub((inboxRelay?.npub as string | undefined), ownerNpub);
  const inboxPullInterval = coerceNumber(inboxRelay?.["pull-interval-seconds"], 600);

  const envLines = [
    "# Haven Configuration - Generated by Start9",
    "# Owner Configuration",
    `OWNER_NPUB=${quote(ownerNpub)}`,
    `OWNER_USERNAME=${quote(ownerUsername)}`,
    "",
    "# Relay Configuration",
    `RELAY_URL=${quote(relayUrl)}`,
    `RELAY_PORT=${relayPort}`,
    `RELAY_BIND_ADDRESS=${quote(relayBindAddress)}`,
    "",
    "# Database Configuration",
    `DB_ENGINE=${quote(dbEngine)}`,
    `LMDB_MAPSIZE=${lmdbMapsize}`,
    "",
    "# Storage Paths",
    `BLOSSOM_PATH=${quote(blossomPath)}`,
    "",
    "## Private Relay Settings",
    `PRIVATE_RELAY_NAME=${quote(privateName)}`,
    `PRIVATE_RELAY_NPUB=${quote(privateNpub)}`,
    `PRIVATE_RELAY_DESCRIPTION=${quote(privateDescription)}`,
    `PRIVATE_RELAY_ICON=${quote(privateIcon)}`,
    "",
    "## Private Relay Rate Limiters",
    `PRIVATE_RELAY_EVENT_IP_LIMITER_TOKENS_PER_INTERVAL=${coerceNumber(privateRate?.["event-ip-tokens-per-interval"], 50)}`,
    `PRIVATE_RELAY_EVENT_IP_LIMITER_INTERVAL=${coerceNumber(privateRate?.["event-ip-interval-seconds"], 1)}`,
    `PRIVATE_RELAY_EVENT_IP_LIMITER_MAX_TOKENS=${coerceNumber(privateRate?.["event-ip-max-tokens"], 100)}`,
    `PRIVATE_RELAY_ALLOW_EMPTY_FILTERS=${boolString(coerceBoolean(privateRate?.["allow-empty-filters"], true))}`,
    `PRIVATE_RELAY_ALLOW_COMPLEX_FILTERS=${boolString(coerceBoolean(privateRate?.["allow-complex-filters"], true))}`,
    `PRIVATE_RELAY_CONNECTION_RATE_LIMITER_TOKENS_PER_INTERVAL=${coerceNumber(privateRate?.["connection-tokens-per-interval"], 3)}`,
    `PRIVATE_RELAY_CONNECTION_RATE_LIMITER_INTERVAL=${coerceNumber(privateRate?.["connection-interval-seconds"], 5)}`,
    `PRIVATE_RELAY_CONNECTION_RATE_LIMITER_MAX_TOKENS=${coerceNumber(privateRate?.["connection-max-tokens"], 9)}`,
    "",
    "## Chat Relay Settings",
    `CHAT_RELAY_NAME=${quote(chatName)}`,
    `CHAT_RELAY_NPUB=${quote(chatNpub)}`,
    `CHAT_RELAY_DESCRIPTION=${quote(chatDescription)}`,
    `CHAT_RELAY_ICON=${quote(chatIcon)}`,
    `CHAT_RELAY_WOT_DEPTH=${chatWotDepth}`,
    `CHAT_RELAY_WOT_REFRESH_INTERVAL_HOURS=${chatWotRefresh}`,
    `CHAT_RELAY_MINIMUM_FOLLOWERS=${chatMinFollowers}`,
    "",
    "## Chat Relay Rate Limiters",
    `CHAT_RELAY_EVENT_IP_LIMITER_TOKENS_PER_INTERVAL=${coerceNumber(chatRate?.["event-ip-tokens-per-interval"], 50)}`,
    `CHAT_RELAY_EVENT_IP_LIMITER_INTERVAL=${coerceNumber(chatRate?.["event-ip-interval-seconds"], 1)}`,
    `CHAT_RELAY_EVENT_IP_LIMITER_MAX_TOKENS=${coerceNumber(chatRate?.["event-ip-max-tokens"], 100)}`,
    `CHAT_RELAY_ALLOW_EMPTY_FILTERS=${boolString(coerceBoolean(chatRate?.["allow-empty-filters"], false))}`,
    `CHAT_RELAY_ALLOW_COMPLEX_FILTERS=${boolString(coerceBoolean(chatRate?.["allow-complex-filters"], false))}`,
    `CHAT_RELAY_CONNECTION_RATE_LIMITER_TOKENS_PER_INTERVAL=${coerceNumber(chatRate?.["connection-tokens-per-interval"], 3)}`,
    `CHAT_RELAY_CONNECTION_RATE_LIMITER_INTERVAL=${coerceNumber(chatRate?.["connection-interval-seconds"], 3)}`,
    `CHAT_RELAY_CONNECTION_RATE_LIMITER_MAX_TOKENS=${coerceNumber(chatRate?.["connection-max-tokens"], 9)}`,
    "",
    "## Outbox Relay Settings",
    `OUTBOX_RELAY_NAME=${quote(outboxName)}`,
    `OUTBOX_RELAY_NPUB=${quote(outboxNpub)}`,
    `OUTBOX_RELAY_DESCRIPTION=${quote(outboxDescription)}`,
    `OUTBOX_RELAY_ICON=${quote(outboxIcon)}`,
    "",
    "## Outbox Relay Rate Limiters",
    `OUTBOX_RELAY_EVENT_IP_LIMITER_TOKENS_PER_INTERVAL=${coerceNumber(outboxRate?.["event-ip-tokens-per-interval"], 10)}`,
    `OUTBOX_RELAY_EVENT_IP_LIMITER_INTERVAL=${coerceNumber(outboxRate?.["event-ip-interval-seconds"], 60)}`,
    `OUTBOX_RELAY_EVENT_IP_LIMITER_MAX_TOKENS=${coerceNumber(outboxRate?.["event-ip-max-tokens"], 100)}`,
    `OUTBOX_RELAY_ALLOW_EMPTY_FILTERS=${boolString(coerceBoolean(outboxRate?.["allow-empty-filters"], false))}`,
    `OUTBOX_RELAY_ALLOW_COMPLEX_FILTERS=${boolString(coerceBoolean(outboxRate?.["allow-complex-filters"], false))}`,
    `OUTBOX_RELAY_CONNECTION_RATE_LIMITER_TOKENS_PER_INTERVAL=${coerceNumber(outboxRate?.["connection-tokens-per-interval"], 3)}`,
    `OUTBOX_RELAY_CONNECTION_RATE_LIMITER_INTERVAL=${coerceNumber(outboxRate?.["connection-interval-seconds"], 1)}`,
    `OUTBOX_RELAY_CONNECTION_RATE_LIMITER_MAX_TOKENS=${coerceNumber(outboxRate?.["connection-max-tokens"], 9)}`,
    "",
    "## Inbox Relay Settings",
    `INBOX_RELAY_NAME=${quote(inboxName)}`,
    `INBOX_RELAY_NPUB=${quote(inboxNpub)}`,
    `INBOX_RELAY_DESCRIPTION=${quote(inboxDescription)}`,
    `INBOX_RELAY_ICON=${quote(inboxIcon)}`,
    `INBOX_PULL_INTERVAL_SECONDS=${inboxPullInterval}`,
    "",
    "## Inbox Relay Rate Limiters",
    `INBOX_RELAY_EVENT_IP_LIMITER_TOKENS_PER_INTERVAL=${coerceNumber(inboxRate?.["event-ip-tokens-per-interval"], 10)}`,
    `INBOX_RELAY_EVENT_IP_LIMITER_INTERVAL=${coerceNumber(inboxRate?.["event-ip-interval-seconds"], 1)}`,
    `INBOX_RELAY_EVENT_IP_LIMITER_MAX_TOKENS=${coerceNumber(inboxRate?.["event-ip-max-tokens"], 20)}`,
    `INBOX_RELAY_ALLOW_EMPTY_FILTERS=${boolString(coerceBoolean(inboxRate?.["allow-empty-filters"], false))}`,
    `INBOX_RELAY_ALLOW_COMPLEX_FILTERS=${boolString(coerceBoolean(inboxRate?.["allow-complex-filters"], false))}`,
    `INBOX_RELAY_CONNECTION_RATE_LIMITER_TOKENS_PER_INTERVAL=${coerceNumber(inboxRate?.["connection-tokens-per-interval"], 3)}`,
    `INBOX_RELAY_CONNECTION_RATE_LIMITER_INTERVAL=${coerceNumber(inboxRate?.["connection-interval-seconds"], 1)}`,
    `INBOX_RELAY_CONNECTION_RATE_LIMITER_MAX_TOKENS=${coerceNumber(inboxRate?.["connection-max-tokens"], 9)}`,
    "",
    "## Import Settings",
    `IMPORT_START_DATE=${quote(importStartDate)}`,
    `IMPORT_QUERY_INTERVAL_SECONDS=${importQueryInterval}`,
    `IMPORT_OWNER_NOTES_FETCH_TIMEOUT_SECONDS=${importOwnerTimeout}`,
    `IMPORT_TAGGED_NOTES_FETCH_TIMEOUT_SECONDS=${importTaggedTimeout}`,
    `IMPORT_SEED_RELAYS_FILE=${quote(importRelaysFileSpec.absolute)}`,
    "",
    "## Backup Settings",
    `BACKUP_PROVIDER=${quote(backupProvider)}`,
    `BACKUP_INTERVAL_HOURS=${backupInterval}`,
  ];

  if (backupProvider === "s3") {
    envLines.push(
      "",
      "## S3 Backup Settings",
      `S3_ACCESS_KEY_ID=${quote(s3AccessKey)}`,
      `S3_SECRET_KEY=${quote(s3SecretKey)}`,
      `S3_ENDPOINT=${quote(s3Endpoint)}`,
      `S3_REGION=${quote(s3Region)}`,
      `S3_BUCKET_NAME=${quote(s3Bucket)}`,
    );
  }

  envLines.push(
    "",
    "## Blastr Settings",
    `BLASTR_RELAYS_FILE=${quote(blastrRelaysFileSpec.absolute)}`,
    "",
    "## WOT Settings",
    `WOT_FETCH_TIMEOUT_SECONDS=${wotFetchTimeout}`,
    "",
    "## Logging",
    `HAVEN_LOG_LEVEL=${quote(logLevel)}`,
    `TZ=${quote(timezone)}`,
  );

  const envContent = envLines.join(newline) + newline;

  await effects.createDir({ volumeId: "main", path: "start9" });

  await effects.writeFile({
    volumeId: "main",
    path: "start9/haven.env",
    toWrite: [envContent],
  });

  await ensureDir(effects, importRelaysFileSpec.relative.split("/").slice(0, -1).join("/"));
  await ensureDir(effects, blastrRelaysFileSpec.relative.split("/").slice(0, -1).join("/"));

  const importJson = JSON.stringify(importRelays, null, 2) + newline;
  await effects.writeFile({
    volumeId: "main",
    path: importRelaysFileSpec.relative,
    toWrite: [importJson],
  });

  const blastrJson = JSON.stringify(blastrRelays, null, 2) + newline;
  await effects.writeFile({
    volumeId: "main",
    path: blastrRelaysFileSpec.relative,
    toWrite: [blastrJson],
  });

  const persistedConfig: Record<string, unknown> = {
    "configuration-mode": mode,
    "tor-address": input["tor-address"],
    "lan-address": input["lan-address"],
    haven: {
      owner: {
        npub: ownerNpub,
        username: ownerUsername,
      },
      relay: {
        url: relayUrl,
        port: relayPort,
      },
      backup: {
        provider: backupProvider,
        interval_hours: backupInterval,
      },
      blastr: {
        relays: blastrRelays,
        file: blastrRelaysFileSpec.absolute,
      },
      import: {
        relays: importRelays,
        file: importRelaysFileSpec.absolute,
        start_date: importStartDate,
      },
    },
  };

  if (simplePersist) {
    persistedConfig["simple-config"] = simplePersist;
  }

  const yamlContent = YAML.stringify(persistedConfig);
  await effects.writeFile({
    volumeId: "main",
    path: "start9/config.yaml",
    toWrite: [yamlContent],
  });

  return await compat.setConfig(effects, input);
};
