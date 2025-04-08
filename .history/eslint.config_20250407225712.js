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
        'args': 'after-used', 
        'ignoreRestSiblings': false 
      }],
      'unused-imports/no-unused-imports': 'error'
    }
  }
];