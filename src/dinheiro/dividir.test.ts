import { describe, expect, it } from 'vitest';
import { ErroValidacao } from '../erros';
import { centavos } from './centavos';
import { dividir, dividirPorPesos, parcelar } from './dividir';
import { pct } from './percentual';

// R1: cada parte, menos a última, é truncada no centavo; a última recebe o resto.
// O `toEqual` compara as listas item a item com Object.is, então também pega um −0.

describe('dividirPorPesos', () => {
  it('T-0.2-12: divide R$ 15.000,00 pelas listas 9.800 e 6.750', () => {
    // 1.500.000 × 9.800 ÷ 16.550 = 888.217,52… → trunca em 888.217; a última fica com o resto.
    expect(dividirPorPesos(centavos(1500000), [9800, 6750])).toEqual([888217, 611783]);
  });

  it('T-0.2-12: a ordem das partes muda os centavos: a última recebe o resto', () => {
    expect(dividirPorPesos(centavos(1), [1, 1])).toEqual([0, 1]);
    expect(dividirPorPesos(centavos(100), [1, 1, 1])).toEqual([33, 33, 34]);
  });

  it('T-0.2-12: peso zero recebe zero, inclusive na última posição', () => {
    expect(dividirPorPesos(centavos(1000), [0, 1])).toEqual([0, 1000]);
    expect(dividirPorPesos(centavos(1000), [1, 0])).toEqual([1000, 0]);
  });

  it('T-0.2-12: um peso só fica com o total', () => {
    expect(dividirPorPesos(centavos(100001), [7])).toEqual([100001]);
  });

  it('T-0.2-12: total zero dá partes zero', () => {
    expect(dividirPorPesos(centavos(0), [9800, 6750])).toEqual([0, 0]);
  });

  it('T-0.2-12: negativo é o espelho do positivo, sem −0', () => {
    expect(dividirPorPesos(centavos(-1500000), [9800, 6750])).toEqual([-888217, -611783]);
    // Positivo: [0, 1]. O espelho é [0, −1], e não [−0, −1].
    expect(dividirPorPesos(centavos(-1), [1, 1])).toEqual([0, -1]);
  });

  // Em ponto flutuante, MAX_SAFE_INTEGER × 2 ÷ 3 dá 6004799503160661; o exato é …660.
  it('T-0.2-12: conta exata, sem ponto flutuante, com o total no limite seguro', () => {
    const total = centavos(Number.MAX_SAFE_INTEGER);
    expect(dividirPorPesos(total, [2, 1])).toEqual([6004799503160660, 3002399751580331]);
  });

  it.each([
    [[], 'lista vazia'],
    [[1, -1, 2], 'peso negativo'],
    [[1, 1.5], 'peso fracionário'],
    [[0, 0], 'pesos somando zero'],
    [[Number.NaN, 1], 'peso NaN'],
  ])('T-0.2-12: pesos %j geram erro de validação (%s)', (pesos) => {
    expect(() => dividirPorPesos(centavos(1000), pesos)).toThrow(ErroValidacao);
    expect(() => dividirPorPesos(centavos(1000), pesos)).toThrow(
      expect.objectContaining({ codigo: 'PESOS_INVALIDOS' }),
    );
  });
});

describe('dividir', () => {
  it('T-0.2-01: dividir(R$ 1.000,01; 60/40)', () => {
    expect(dividir(centavos(100001), [pct('60'), pct('40')])).toEqual([60000, 40001]);
  });

  it('T-0.2-05: dividir(R$ 1.000,00; 17,25 / 17,25 / 15,25 / 15,25 / 15,25 / 13,50 / 6,25)', () => {
    const percentuais = ['17.25', '17.25', '15.25', '15.25', '15.25', '13.50', '6.25'].map((p) =>
      pct(p),
    );
    expect(dividir(centavos(100000), percentuais)).toEqual([
      17250, 17250, 15250, 15250, 15250, 13500, 6250,
    ]);
  });

  it('T-0.2-06: dividir(−R$ 1.000,01; 60/40) é o espelho do estorno', () => {
    expect(dividir(centavos(-100001), [pct('60'), pct('40')])).toEqual([-60000, -40001]);
  });

  // Contraexemplo da T-0.2-P4 (fast-check, seed 1046557815, reduzido a [0, [100%]]):
  // dividir(−0) devolvia [−0], porque a última parte é total − 0 = −0 − 0 = −0.
  it('T-0.2-P4: dividir do total −0 dá 0, não −0', () => {
    expect(dividir(centavos(-0), [pct('100')])).toEqual([0]);
  });

  it('T-0.2-06: o espelho normaliza −0 para 0', () => {
    expect(dividir(centavos(-1), [pct('50'), pct('50')])).toEqual([0, -1]);
  });

  it('T-0.2-01: percentuais com 4 casas fecham no total', () => {
    // 33,3333 + 33,3333 + 33,3334 = 100
    const percentuais = [pct('33.3333'), pct('33.3333'), pct('33.3334')];
    expect(dividir(centavos(100), percentuais)).toEqual([33, 33, 34]);
  });

  // Contraexemplo achado no 0.2: em float, 0,0249% × 1.000.000 dá 248,99999999999997, e não 249.
  // A conversão de percentual em peso precisa ser feita no Decimal.
  it('T-0.2-01: percentual que em float não vira peso inteiro (0,0249%)', () => {
    const percentuais = [pct('0.0249'), pct('99.9751')];
    expect(dividir(centavos(1000000), percentuais)).toEqual([249, 999751]);
  });

  it.each([
    [['60', '39.99'], '99,99%'],
    [['60', '40.01'], '100,01%'],
    [[], 'lista vazia (0%)'],
  ])('T-0.2-07: percentuais %j somando %s geram erro de validação', (textos) => {
    const percentuais = textos.map((p) => pct(p));
    expect(() => dividir(centavos(100001), percentuais)).toThrow(ErroValidacao);
    expect(() => dividir(centavos(100001), percentuais)).toThrow(
      expect.objectContaining({ codigo: 'PERCENTUAIS_NAO_FECHAM' }),
    );
  });
});

describe('parcelar', () => {
  it('T-0.2-02: parcelar(R$ 600,00; 3)', () => {
    expect(parcelar(centavos(60000), 3)).toEqual([20000, 20000, 20000]);
  });

  it('T-0.2-03: parcelar(R$ 400,01; 3)', () => {
    expect(parcelar(centavos(40001), 3)).toEqual([13333, 13333, 13335]);
  });

  it('T-0.2-04: parcelar(R$ 1.000,01; 3)', () => {
    expect(parcelar(centavos(100001), 3)).toEqual([33333, 33333, 33335]);
  });

  it('T-0.2-04: uma parcela só fica com o total', () => {
    expect(parcelar(centavos(100001), 1)).toEqual([100001]);
  });

  it('T-0.2-04: total igual ao número de parcelas dá um centavo em cada', () => {
    expect(parcelar(centavos(3), 3)).toEqual([1, 1, 1]);
  });

  // Decisão do 0.2: parcelar segue a mesma R1, com o mesmo espelho dos negativos.
  it('T-0.2-04: negativo é o espelho do positivo', () => {
    expect(parcelar(centavos(-40001), 3)).toEqual([-13333, -13333, -13335]);
  });

  it.each([
    [2, 'R$ 0,02 em 3'],
    [0, 'total zero'],
    [-2, '−R$ 0,02 em 3 (o limite vale para o valor absoluto)'],
  ])('T-0.2-08: parcelar(%i centavos, 3) gera erro de total menor que as parcelas (%s)', (total) => {
    expect(() => parcelar(centavos(total), 3)).toThrow(ErroValidacao);
    expect(() => parcelar(centavos(total), 3)).toThrow(
      expect.objectContaining({ codigo: 'TOTAL_MENOR_QUE_PARCELAS' }),
    );
  });

  it.each([
    [0, 'zero parcelas'],
    [-1, 'parcelas negativas'],
    [1.5, 'parcela fracionária'],
    [Number.NaN, 'NaN'],
    [Number.POSITIVE_INFINITY, 'infinito'],
  ])('T-0.2-08: parcelar(R$ 10,00; %s) gera erro de número de parcelas (%s)', (n) => {
    expect(() => parcelar(centavos(1000), n)).toThrow(ErroValidacao);
    expect(() => parcelar(centavos(1000), n)).toThrow(
      expect.objectContaining({ codigo: 'PARCELAS_INVALIDAS' }),
    );
  });
});
