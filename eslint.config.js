import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Garde-fous de déterminisme : la simulation ne doit jamais dépendre de
 * l'horloge, d'un aléatoire non seedé ni de fonctions trigonométriques dont
 * le dernier bit peut varier d'un moteur JavaScript à l'autre.
 */
const deterministicZones = ['src/core/**/*.ts', 'src/sim/**/*.ts'];

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: deterministicZones,
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Utiliser src/core/math/rng.ts (seedé).' },
        { object: 'Date', property: 'now', message: 'La simulation ne lit jamais l\'horloge.' },
        { object: 'performance', property: 'now', message: 'La simulation ne lit jamais l\'horloge.' },
        { object: 'Math', property: 'sin', message: 'Pas de trigonométrie dans la simulation.' },
        { object: 'Math', property: 'cos', message: 'Pas de trigonométrie dans la simulation.' },
        { object: 'Math', property: 'tan', message: 'Pas de trigonométrie dans la simulation.' },
        { object: 'Math', property: 'atan2', message: 'Pas de trigonométrie dans la simulation.' },
        { object: 'Math', property: 'atan', message: 'Pas de trigonométrie dans la simulation.' },
        { object: 'Math', property: 'pow', message: 'Préférer la multiplication explicite.' },
      ],
    },
  },
);
