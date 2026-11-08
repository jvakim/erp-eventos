import { expect, it } from 'vitest';

// T-0.1-04: teste que falha DE PROPÓSITO, para ver o CI barrar o merge. Não fazer merge.
it('T-0.1-04: falha de propósito', () => {
  expect(1 + 1).toBe(3);
});
