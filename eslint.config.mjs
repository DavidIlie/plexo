import next from "eslint-config-next";

const eslintConfig = [
   ...next,
   {
      // Match the base config's files so this override only applies where
      // the react-hooks plugin is actually registered (excludes e.g. .cjs).
      files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
      rules: {
         // eslint-config-next 16.3 promotes this react-hooks rule to an error.
         // A couple of pre-existing client-only effects (localStorage reads)
         // legitimately setState in an effect; keep it visible as a warning
         // rather than forcing unrelated refactors. Revisit separately.
         "react-hooks/set-state-in-effect": "warn",
      },
   },
   {
      ignores: [".next/**", "node_modules/**"],
   },
];

export default eslintConfig;
