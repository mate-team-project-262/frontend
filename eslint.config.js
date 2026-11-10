import js from '@eslint/js';
import globals from 'globals';
import jsxA11y from 'eslint-plugin-jsx-a11y-x';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      // Accessibility rules for JSX (labels, alt texts, keyboard access...)
      jsxA11y.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Scrolling areas (carousels) must be focusable so keyboard users can scroll them
      'jsx-a11y-x/no-noninteractive-tabindex': [
        'error',
        { roles: ['tabpanel', 'region'], tags: ['ul'] },
      ],
      // ...and they handle the arrow keys, dragging and the wheel themselves
      'jsx-a11y-x/no-noninteractive-element-interactions': [
        'error',
        {
          div: [
            'onKeyDown',
            'onPointerDown',
            'onPointerMove',
            'onPointerUp',
            'onPointerCancel',
            'onWheel',
          ],
        },
      ],
    },
  },
  {
    // TypeScript rules
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.recommended],
    rules: {
      // `import type` for types, so the bundler can drop them
      // `const { as, ...rest } = props` is how a prop is kept away from the DOM element
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
    },
  },
  {
    // Tests run in Node with Vitest globals
    files: ['**/*.test.{js,jsx,ts,tsx}', 'src/test/**'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]);
