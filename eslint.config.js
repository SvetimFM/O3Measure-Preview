import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: [
      '**/src/examples/*'
    ],
    plugins: {
      'unused-imports': unusedImports
    },
    rules: {
      'no-unused-vars': ['error', { 
        'vars': 'all', 
        'varsIgnorePattern': '^_',
        'args': 'after-used',
        'argsIgnorePattern': '^_', 
        'ignoreRestSiblings': false 
      }],
      'unused-imports/no-unused-imports': 'error',
      'no-unused-private-class-members': 'warn',
      'no-unused-expressions': 'warn'
    }
  }
];