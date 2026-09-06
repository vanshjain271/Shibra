// @ts-check
// Minimal ESLint flat config for ESLint v9 - disable strict rules for rapid dev

export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "public/**",
    ],
  },
];
