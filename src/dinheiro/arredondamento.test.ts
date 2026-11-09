import { Decimal } from 'decimal.js';
import { describe, expect, it } from 'vitest';
import { ErroValidacao } from '../erros';
import { arredondarMeioAfastandoDeZero, arredondarMeioParaPar, arredondarR2 } from './arredondamento';

// As funções recebem o valor em CENTAVOS, num Decimal que pode ter fração (9277,5 centavos),
// e devolvem Centavos inteiros. O `d` só encurta a escrita dos casos.
const d = (texto: string): Decimal => new Decimal(texto);

describe('arredondarR2 (modo vigente)', () => {
  it('T-0.2-09: meia diária de R$ 185,55 dá R$ 92,78', () => {
    const meiaDiaria = new Decimal(18555).div(2); // 9277,5 centavos
    expect(arredondarR2(meiaDiaria)).toBe(9278);
  });

  it('T-0.2-09: o negativo é o espelho do positivo', () => {
    const estorno = new Decimal(-18555).div(2); // −9277,5 centavos
    expect(arredondarR2(estorno)).toBe(-9278);
  });

  // Decisão do 0.2 (09/11/2026): a R2 segue a ABNT NBR 5891, porque a reforma tributária
  // ainda não definiu um padrão. Os dois modos existem; esta é a conferência de qual vale.
  // Trocar o modo muda esta conferência junto.
  it('T-0.2-09: o modo vigente é o meio para o par (NBR 5891)', () => {
    expect(arredondarR2).toBe(arredondarMeioParaPar);
  });
});

// Os dois modos só diferem no MEIO exato (,5): fora dele, ambos vão ao inteiro mais próximo.
// 9276,5 é o caso que separa os dois: afastando de zero dá 9277; para o par dá 9276.
describe('arredondarMeioAfastandoDeZero', () => {
  it.each([
    ['9277.5', 9278],
    ['9276.5', 9277],
    ['0.5', 1],
    ['2.5', 3],
    ['-0.5', -1],
    ['-9276.5', -9277],
    ['9276.4999', 9276],
    ['9276.5001', 9277],
    ['-9276.5001', -9277],
    ['100', 100],
  ])('T-0.2-09: %s centavos dá %i', (valor, esperado) => {
    expect(arredondarMeioAfastandoDeZero(d(valor))).toBe(esperado);
  });
});

describe('arredondarMeioParaPar', () => {
  it.each([
    ['9277.5', 9278],
    ['9276.5', 9276],
    ['0.5', 0],
    ['1.5', 2],
    ['2.5', 2],
    ['-1.5', -2],
    ['-0.5', 0], // o par de −0,5 é 0, e o teste exige 0, não −0
    ['-9276.5', -9276],
    ['9276.4999', 9276],
    ['9276.5001', 9277],
    ['100', 100],
  ])('T-0.2-09: %s centavos dá %i', (valor, esperado) => {
    expect(arredondarMeioParaPar(d(valor))).toBe(esperado);
  });
});

// ABNT NBR 5891, regras de arredondamento na numeração decimal, aplicadas ao centavo:
//   1. o que se descarta começa com algarismo < 5: o anterior fica como está;
//   2. começa com algarismo > 5, ou com 5 seguido de algum algarismo diferente de zero:
//      o anterior sobe um;
//   3. é exatamente 5 (seguido só de zeros, ou de nada): o anterior sobe um se for ímpar
//      e fica como está se for par.
// O arredondamento é feito de uma só vez, sobre o valor inteiro, nunca em etapas.
describe('arredondarMeioParaPar segundo a NBR 5891', () => {
  it.each([
    ['9276.4', 9276],
    ['9276.49', 9276],
  ])('T-0.2-09: regra 1, descartado < 5: %s centavos dá %i', (valor, esperado) => {
    expect(arredondarMeioParaPar(d(valor))).toBe(esperado);
  });

  it.each([
    ['9276.6', 9277],
    ['9276.5001', 9277],
    ['9276.50000001', 9277],
  ])('T-0.2-09: regra 2, descartado > 5 ou 5 seguido de não zero: %s centavos dá %i', (valor, esperado) => {
    expect(arredondarMeioParaPar(d(valor))).toBe(esperado);
  });

  it.each([
    ['9276.5', 9276, 'anterior par: fica'],
    ['9276.50', 9276, '5 seguido só de zeros'],
    ['9276.5000', 9276, '5 seguido só de zeros'],
    ['9277.5', 9278, 'anterior ímpar: sobe'],
    ['-9276.5', -9276, 'espelho do par'],
    ['-9277.5', -9278, 'espelho do ímpar'],
  ])('T-0.2-09: regra 3, descartado é 5 exato: %s centavos dá %i (%s)', (valor, esperado) => {
    expect(arredondarMeioParaPar(d(valor))).toBe(esperado);
  });

  // Em duas etapas (primeiro a uma casa, depois ao inteiro) o resultado mudaria:
  // 9277,4501 → 9277,5 → 9278, e 9276,5001 → 9276,5 → 9276. Por isso a R2 é aplicada
  // só no resultado final das contas de várias etapas.
  it.each([
    ['9277.4501', 9277],
    ['9276.5001', 9277],
    ['-9276.5001', -9277],
  ])('T-0.2-09: arredonda de uma só vez: %s centavos dá %i', (valor, esperado) => {
    expect(arredondarMeioParaPar(d(valor))).toBe(esperado);
  });
});

describe('os dois modos', () => {
  // O `toBe` compara com Object.is, que distingue −0 de 0: o teste pega um −0 escondido.
  it.each([
    ['-0.4', 'arredonda para zero vindo do negativo'],
    ['-0', 'zero negativo na entrada'],
  ])('T-0.2-09: %s centavos dá 0, nunca −0 (%s)', (valor) => {
    expect(arredondarMeioAfastandoDeZero(d(valor))).toBe(0);
    expect(arredondarMeioParaPar(d(valor))).toBe(0);
  });

  it('T-0.2-09: resultado acima do limite seguro gera erro, nos dois modos', () => {
    const grande = d('9007199254740992.4'); // arredonda para 2^53, que não é seguro
    expect(() => arredondarMeioAfastandoDeZero(grande)).toThrow(ErroValidacao);
    expect(() => arredondarMeioParaPar(grande)).toThrow(
      expect.objectContaining({ codigo: 'CENTAVOS_INVALIDOS' }),
    );
  });
});
