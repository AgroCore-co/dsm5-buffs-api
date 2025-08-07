import globals from "globals";
import js from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";

export default [
  // Configuração global e para arquivos JavaScript
  {
    files: ["**/*.js"],
    ...js.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },

  // Configuração principal para arquivos TypeScript
  {
    files: ["**/*.ts"], // Aplica apenas a arquivos .ts
    extends: [
      ...typescriptEslint.configs.recommendedTypeChecked, // <--- Usa as regras que precisam de tipos
      ...typescriptEslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: true, // <--- A MÁGICA ACONTECE AQUI!
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Você pode desativar regras específicas aqui, se precisar
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-argument": "off", // Pode ser útil no início
      "@typescript-eslint/no-unsafe-assignment": "off", // Pode ser útil no início
    },
  },

  // Desativa regras de estilo que entram em conflito com o Prettier
  prettierConfig,
];