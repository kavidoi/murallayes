module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'eslint-config-prettier'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    // Custom translation key validation rule
    'no-hardcoded-translations': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }]
  },
  overrides: [
    {
      files: ['scripts/validate-translations.js'],
      rules: {
        '@typescript-eslint/no-require-imports': 'off'
      }
    }
  ]
};