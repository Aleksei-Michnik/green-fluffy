const jsxA11y = require('eslint-plugin-jsx-a11y');
const baseConfig = require('./base');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...baseConfig,
  // Accessibility lint on every component: the recommended jsx-a11y set (WCAG-oriented static checks).
  {
    ...jsxA11y.flatConfigs.recommended,
    files: ['**/*.tsx'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Next.js-specific relaxations
      '@typescript-eslint/no-explicit-any': 'warn',

      // React
      'react/react-in-jsx-scope': 'off',
    },
  },
];
