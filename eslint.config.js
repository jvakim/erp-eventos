import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['node_modules/', 'dist/', 'coverage/'] },
  js.configs.recommended,
  // Regras que usam os tipos: entre elas, no-floating-promises pega o `await` esquecido.
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  // Este próprio arquivo é JavaScript, fora do tsconfig: sem regras que dependem de tipos.
  { files: ['**/*.js'], extends: [tseslint.configs.disableTypeChecked] },
);
