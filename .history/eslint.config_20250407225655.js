import unusedImports from 'eslint-plugin-unused-imports';

export default [
  {
    ignores: [
      '**/src/examples/old-poc.js',
      '**/src/examples/poc.js'
    ],
    plugins: {
      'unused-imports': unusedImports
    },
    rules: {
      'no-unused-vars': ['warn', { 
        'vars': 'all', 
        'args': 'after-used', 
        'ignoreRestSiblings': false 
      }],
      'unused-imports/no-unused-imports': 'error'
    }
  }
];