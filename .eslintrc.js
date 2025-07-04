module.exports = {
  extends: 'next/core-web-vitals',
  // Disable ESLint in development mode
  ignorePatterns: process.env.NODE_ENV === 'development' ? ['**/*'] : [],
  rules: {
    // Disable the no-unused-vars rule completely
    '@typescript-eslint/no-unused-vars': 'off',
    // Disable the rule for unescaped entities
    'react/no-unescaped-entities': 'off',
    // Allow any type
    '@typescript-eslint/no-explicit-any': 'off',
    // Disable require imports warning
    '@typescript-eslint/no-require-imports': 'off'
  }
}