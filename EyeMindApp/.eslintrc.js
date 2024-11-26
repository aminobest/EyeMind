module.exports = {
  root: true,
  ignorePatterns: [
    '**/node_modules',
    'environments',
    '**/public',
    '**/lib',
    '**/dist',
  ],
  extends: ['plugin:prettier/recommended'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'prettier/prettier': [
      'warn',
      {
        quoteProps: 'consistent',
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        useTabs: false,
        semi: false,
      },
    ],
  },
}
