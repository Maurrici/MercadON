const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  globalIgnores(['.expo/*', 'dist/*', 'web-build/*']),

  expoConfig,

  {
    rules: {
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],

      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  eslintConfigPrettier,
]);
