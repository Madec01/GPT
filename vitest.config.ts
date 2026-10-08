import { defineConfig } from 'vitest/config';

/** Tests unitaires en Node pur : aucune dépendance au navigateur ni au rendu. */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
