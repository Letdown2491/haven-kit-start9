import { types as T } from "../../deps.ts";

export const migration: T.ExpectedExports.migration = {
  from: {
    "*": {
      type: "script",
      args: ["from"],
    },
  },
  to: {
    "*": {
      type: "script",
      args: ["to"],
    },
  },
};
