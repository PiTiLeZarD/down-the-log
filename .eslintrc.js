module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    settings: {
        react: {
            version: '18.0',
        },
    },
    overrides: [
        {
            env: {
                node: true,
            },
            files: ['.eslintrc.{js,cjs}'],
            parserOptions: {
                sourceType: 'script',
            },
        },
        {
            files: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.mjs'],
            extends: [
                'plugin:react/recommended',
                require.resolve('eslint-config-airbnb-typescript'),
                require.resolve('eslint-config-prettier'),
            ],

            parserOptions: {
                warnOnUnsupportedTypeScriptVersion: false,
                ecmaVersion: 6,
                sourceType: 'module',
                ecmaFeatures: {
                    modules: true,
                    jsx: true,
                },
                // createDefaultProgram: true,
                // Should be provided by the extender eslint
                // we can't calculate the tsconfig path here
                // project: `${tsconfigPath}`,
            },

            rules: {
                '@typescript-eslint/camelcase': 'off',
                'import/no-extraneous-dependencies': 'off',
                'import/prefer-default-export': 'off',
                'react/jsx-props-no-spreading': 'off',
                'react/no-array-index-key': 'off',
                'trailing-comma': 'off',
                '@typescript-eslint/comma-dangle': 'off',
                'object-curly-newline': 'off',
                'react/react-in-jsx-scope': 'off',
                'class-methods-use-this': 'off',
                'arrow-body-style': 'off',
                'prefer-arrow-callback': 'off',
                'no-underscore-dangle': 'off',
                // Disable the rule because this causes issues in case there are multiple eslint versions
                // on the process, as it depends on some outer context.
                // this should be solve once upgrading to @typescript-eslint/eslint-plugin v6
                // see more details here -
                // https://stackoverflow.com/questions/76457373/cannot-read-properties-of-undefined-reading-gettokens-occurred-while-linting
                '@typescript-eslint/no-empty-function': 'off',
                'react/prop-types': 'off',
                'no-console': 'off',
                'react/react-in-jsx-scope': 'off',
            },
        },
    ],
};
