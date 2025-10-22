import { matches, types as T, util, YAML } from "../../deps.ts";

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

const matchConfigShape = matches.shape({
  "tor-address": matches.string,
  "lan-address": matches.string,
});

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

  const config = await effects.readFile({
    volumeId: "main",
    path: "start9/config.yaml",
  })
    .then((x) => YAML.parse(x))
    .then((x) => matchConfigShape.unsafeCast(x))
    .catch((e) => {
      console.error("Error reading config:", e);
      return null;
    });

  if (!config) {
    return noPropertiesFound;
  }

  return {
    result: {
      version: 2,
      data: {
        "Nostr Relay Websocket (Tor)": {
          type: "string",
          value: `ws://${config["tor-address"]}`,
          description:
            "Main Haven relay endpoint - add this to your Nostr client's relay list. Recommended for privacy. Configure relay settings in the Config section.",
          copyable: true,
          qr: true,
          masked: false,
        },
        "Nostr Relay Websocket (LAN)": {
          type: "string",
          value: `wss://${config["lan-address"]}`,
          description:
            "LAN relay endpoint (for testing only, less recommended for privacy). Configure relay settings in the Config section.",
          copyable: true,
          qr: false,
          masked: false,
        },
      },
    },
  };
};
