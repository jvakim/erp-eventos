import { Decimal } from 'decimal.js';
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { centavos } from './centavos';
import { dividir, parcelar } from './dividir';
import { pct, type Percentual } from './percentual';

// Testes de propriedade (o Hypothesis do Python): em vez de casos escolhidos à mão, o fast-check
// gera 1.000 entradas aleatórias por propriedade e confere uma regra que vale para todas.
// Quando uma falha, ele reduz a entrada ao menor contraexemplo e mostra a semente (seed) para
// repetir o mesmo sorteio. Pela regra da suíte, o contraexemplo vira um teste fixo.
const CASOS = { numRuns: 1000 };

// Total de 0 a R$ 20 milhões, em centavos.
const total = fc.integer({ min: 0, max: 2_000_000_000 });

// 100% em unidades de 0,0001% (a menor casa que o pct aceita).
const UNIDADES_EM_100 = 1_000_000;

// De 1 a 10 percentuais que somam exatamente 100%: sorteia n − 1 cortes entre 0 e 100% e usa
// as distâncias entre eles. Cortes repetidos dão percentual zero, que também é válido.
const percentuaisQueFecham = fc
  .integer({ min: 1, max: 10 })
  .chain((n) =>
    fc.array(fc.integer({ min: 0, max: UNIDADES_EM_100 }), { minLength: n - 1, maxLength: n - 1 }),
  )
  .map((cortes) => {
    const limites = [...cortes].sort((a, b) => a - b);
    let anterior = 0;
    return [...limites, UNIDADES_EM_100].map((limite) => {
      const unidades = limite - anterior;
      anterior = limite;
      return unidadesEmPct(unidades);
    });
  });

// 172500 unidades → pct('17.2500'), montando o texto só com inteiros (sem ponto flutuante).
function unidadesEmPct(unidades: number): Percentual {
  const inteiro = Math.trunc(unidades / 10_000);
  const casas = String(unidades % 10_000).padStart(4, '0');
  return pct(`${String(inteiro)}.${casas}`);
}

describe('propriedades do dividir', () => {
  it('T-0.2-P1: soma das partes = total; nenhuma parte negativa', () => {
    fc.assert(
      fc.property(total, percentuaisQueFecham, (t, percentuais) => {
        const partes = dividir(centavos(t), percentuais);
        expect(partes.reduce((soma, parte) => soma + parte, 0)).toBe(t);
        for (const parte of partes) expect(parte).toBeGreaterThanOrEqual(0);
      }),
      CASOS,
    );
  });

  it('T-0.2-P2: cada parte, menos a última, fica a menos de R$ 0,01 do valor exato', () => {
    fc.assert(
      fc.property(total, percentuaisQueFecham, (t, percentuais) => {
        const partes = dividir(centavos(t), percentuais);
        partes.slice(0, -1).forEach((parte, i) => {
          const percentual = percentuais[i];
          if (percentual === undefined) throw new Error('lista de partes maior que a de percentuais');
          // O valor exato, em Decimal: total × percentual, com fração de centavo.
          const exato = new Decimal(t).times(percentual);
          expect(exato.minus(parte).abs().lt(1)).toBe(true);
        });
      }),
      CASOS,
    );
  });

  it('T-0.2-P4: dividir(−t) é igual a −dividir(t)', () => {
    fc.assert(
      fc.property(total, percentuaisQueFecham, (t, percentuais) => {
        const positivo = dividir(centavos(t), percentuais);
        const negativo = dividir(centavos(-t), percentuais);
        // O espelho de 0 é 0, e não −0 (o toEqual distingue os dois). `0 - parte` em vez de
        // `-parte`: o lint recusa o menos unário num tipo marcado (no-unsafe-unary-minus).
        expect(negativo).toEqual(positivo.map((parte) => (parte === 0 ? 0 : 0 - parte)));
      }),
      CASOS,
    );
  });
});

describe('propriedades do parcelar', () => {
  // De 1 a 60 parcelas, e um total de pelo menos uma parcela de um centavo cada.
  const parcelamento = fc
    .integer({ min: 1, max: 60 })
    .chain((n) => fc.tuple(fc.constant(n), fc.integer({ min: n, max: 2_000_000_000 })));

  it('T-0.2-P3: parcelas iguais exceto a última; última − primeira entre 0 e n − 1 centavos', () => {
    fc.assert(
      fc.property(parcelamento, ([n, t]) => {
        const parcelas = parcelar(centavos(t), n);
        expect(parcelas).toHaveLength(n);
        expect(parcelas.reduce((soma, parcela) => soma + parcela, 0)).toBe(t);

        const primeira = parcelas[0];
        const ultima = parcelas.at(-1);
        if (primeira === undefined || ultima === undefined) throw new Error('parcelar sem parcelas');
        for (const parcela of parcelas.slice(0, -1)) expect(parcela).toBe(primeira);
        expect(ultima - primeira).toBeGreaterThanOrEqual(0);
        expect(ultima - primeira).toBeLessThanOrEqual(n - 1);
      }),
      CASOS,
    );
  });
});
