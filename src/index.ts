import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import process from "process";

import { createUnplugin, type UnpluginFactory } from "unplugin";
import { buildParserFile } from "@lezer/generator";

const moduleIdPattern = /^\0?(.*\.grammar)(\.terms)?$/;

export const unpluginFactory: UnpluginFactory<undefined> = () => ({
  name: "unplugin-lezer",
  resolveId(source, importer) {
    const m = moduleIdPattern.exec(source);
    if (!m) return null;
    const id = resolve(importer ? dirname(importer) : process.cwd(), m[1]);
    return m[2] ? `\0${id}.terms` : id;
  },

  load(id) {
    const m = moduleIdPattern.exec(id);
    if (!m) return null;
    if (!m[2]) this.addWatchFile(id);
    const base = m[1];
    const build = readFile(base, "utf8").then((code) =>
      buildParserFile(code, {
        fileName: base,
        moduleStyle: "es",
        warn: (message) => this.warn(message),
      })
    );
    return build.then((result: ReturnType<typeof buildParserFile>) =>
      m?.[2] ? result.terms : result.parser
    );
  },
});

export const unplugin = /* #__PURE__ */ createUnplugin(unpluginFactory);

export default unplugin;
