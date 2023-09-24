module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['@wmk/eslint-config/vanilla'],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  rules: {},
  overrides: [
    {
      files: ['vitest.config.ts'],
      rules: {
        'import/no-default-export': 'off',
      },
    },
  ],
};
