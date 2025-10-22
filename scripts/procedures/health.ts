import { types as T, checkWebUrl } from "../../deps.ts";

export const health: T.ExpectedExports.health = {
  async "main"(effects) {
    // Check if the Haven relay is listening on port 3355
    // Haven uses websocket protocol, so we check for the websocket endpoint
    return await checkWebUrl("http://localhost:3355")(effects)
      .then((res) => {
        return res;
      })
      .catch(() => {
        return {
          result: {
            "error": "Haven relay is not responding on port 3355. Check logs for details.",
          },
        } as T.ResultType<T.HealthResult>;
      });
  },
};
