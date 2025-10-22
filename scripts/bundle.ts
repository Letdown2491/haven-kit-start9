import { bundle } from "https://deno.land/x/emit@0.38.2/mod.ts";

const entrypoint = new URL("./embassy.ts", import.meta.url);

const result = await bundle(entrypoint, {
  compilerOptions: {
    sourceMap: false,
  },
});

const code = result.code;

const outputPath = new URL("./embassy.js", import.meta.url);
await Deno.writeTextFile(outputPath, code);
