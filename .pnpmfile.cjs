"use strict";

/**
 * typescript-eslint needs the TypeScript *JavaScript API*, which typescript@7
 * (the Go-native compiler) does not ship — `require("typescript")` against v7
 * exposes only { version }, crashing typescript-estree at load time
 * ("Cannot read properties of undefined (reading 'Cjs')"). Its peer range is
 * ">=4.8.4 <6.1.0" for the same reason.
 *
 * The root `typescript` must stay on 7 for `tsc --noEmit` and the `next build`
 * CLI type checker (see docs/01-app/03-api-reference/05-config/02-typescript.md
 * "Using TypeScript 7"). Since pnpm fulfills peers from the root project, the
 * @typescript-eslint packages would otherwise receive TS 7. This hook converts
 * their `typescript` peer into a real dependency on TS 6 so ESLint parses with
 * a JS-API-capable TypeScript while everything else uses 7.
 */

const ESLINT_TS_VERSION = "6.0.2";

function readPackage(pkg) {
   const isTsEslint =
      typeof pkg.name === "string" &&
      (pkg.name.startsWith("@typescript-eslint/") || pkg.name === "typescript-eslint");

   if (isTsEslint && pkg.peerDependencies && pkg.peerDependencies.typescript) {
      delete pkg.peerDependencies.typescript;
      if (pkg.peerDependenciesMeta) {
         delete pkg.peerDependenciesMeta.typescript;
      }
      pkg.dependencies = { ...pkg.dependencies, typescript: ESLINT_TS_VERSION };
   }

   return pkg;
}

module.exports = {
   hooks: {
      readPackage,
   },
};
