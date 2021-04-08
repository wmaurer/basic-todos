module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['import', 'fp-ts'],
    // extends: ['plugin:@typescript-eslint/recommended'],
    rules: {
        'import/order': [
            'error',
            {
                groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
                'newlines-between': 'always',
                alphabetize: {
                    order: 'asc',
                    caseInsensitive: true,
                },
            },
        ],
        'sort-imports': [
            'error',
            {
                ignoreDeclarationSort: true,
            },
        ],
        'fp-ts/no-lib-imports': 'error',
        'fp-ts/no-pipeable': 'error',
    },
};
