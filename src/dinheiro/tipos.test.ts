import { describe, expect, it } from 'vitest';
import { centavos, type Centavos } from './centavos';
import { pct } from './percentual';

// Este arquivo é conferido pelo `tsc --noEmit` (pnpm typecheck), não pelo Vitest:
// cada `@ts-expect-error` EXIGE um erro de tipo na linha seguinte. Se o erro sumir
// (por exemplo, se Centavos virar um `number` comum), o tsc reclama do comentário
// sem uso, e o CI fica vermelho.

function recebeCentavos(valor: Centavos): Centavos {
  return valor;
}

describe('tipos marcados', () => {
  it('T-0.2-10: o compilador recusa Percentual onde se espera Centavos', () => {
    const taxa = pct('12');

    // @ts-expect-error: Percentual não é Centavos.
    recebeCentavos(taxa);

    // @ts-expect-error: um number solto também não é Centavos; precisa passar por centavos().
    recebeCentavos(100);

    expect(recebeCentavos(centavos(100))).toBe(100);
  });

  it('T-0.2-10: o compilador recusa somar Centavos com Percentual', () => {
    const valor = centavos(100);
    const taxa = pct('12');

    // Na execução, o JS não recusa: chama o valueOf() do Decimal ("0.12") e concatena texto.
    // O lint também recusa essa soma; o comentário no fim da linha cala só ele, de propósito.
    // @ts-expect-error: não se soma Centavos com Percentual.
    const soma: unknown = valor + taxa; // eslint-disable-line @typescript-eslint/restrict-plus-operands

    expect(soma).toBe('1000.12');
  });

  it('T-0.2-10: Centavos + Centavos vira number, e a marca se perde', () => {
    const a = centavos(100);
    const b = centavos(250);

    const somaComum: number = a + b; // aceito: o resultado é number
    // @ts-expect-error: a soma não é mais Centavos; precisa passar de novo por centavos().
    const somaMarcada: Centavos = a + b;

    expect(somaComum).toBe(350);
    expect(somaMarcada).toBe(350);
    expect(centavos(a + b)).toBe(350);
  });
});
