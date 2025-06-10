module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    parserOptions: {
      ecmaVersion: 2020, // Allows parsing modern ECMAScript features
      sourceType: 'module', // Allows using imports
    },
    extends: [
      'eslint:recommended', // Use recommended ESLint rules
      'plugin:@typescript-eslint/recommended', // Use recommended rules from the @typescript-eslint/eslint-plugin
    ],
    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
    },
  };
  