import { describe, expect, it } from 'vitest';
import { ErroValidacao } from '../erros';
import { centavos } from './centavos';
import { formatarReais, lerReais } from './reais';

// O Intl põe um espaço NÃO separável (U+00A0) depois de "R$", e não o espaço comum.
// Escrever o caractere como \u00a0 deixa isso visível no teste.
const NBSP = '\u00a0';

describe('formatarReais', () => {
  it('T-0.1-01: formata centavos inteiros como reais (positivo, negativo e zero)', () => {
    expect(formatarReais(centavos(100001))).toBe(`R$${NBSP}1.000,01`);
    expect(formatarReais(centavos(-5))).toBe(`-R$${NBSP}0,05`);
    expect(formatarReais(centavos(0))).toBe(`R$${NBSP}0,00`);
  });
});

describe('lerReais', () => {
  it('T-0.1-02: lê valores em reais e devolve centavos inteiros', () => {
    expect(lerReais('1.000,01')).toBe(100001);
    expect(lerReais('1000,1')).toBe(100010);
    expect(lerReais('R$ 5')).toBe(500);
  });

  it.each([
    ['abc', 'não é número'],
    ['1.000,001', 'mais de duas casas decimais'],
    ['', 'vazio'],
  ])('T-0.1-02: lerReais(%j) gera erro de validação (%s)', (entrada) => {
    expect(() => lerReais(entrada)).toThrow(ErroValidacao);
    expect(() => lerReais(entrada)).toThrow(expect.objectContaining({ codigo: 'VALOR_INVALIDO' }));
  });
});

// Pendência do 0.1: lerReais('99.999.999.999.999,99') devolvia 10000000000000000 em silêncio.
describe('lerReais no limite do number', () => {
  it('T-0.2-11: lê o maior valor exato (Number.MAX_SAFE_INTEGER centavos)', () => {
    expect(lerReais('90.071.992.547.409,91')).toBe(Number.MAX_SAFE_INTEGER);
  });

  it.each([
    ['90.071.992.547.409,92', 'um centavo acima do limite'],
    ['99.999.999.999.999,99', 'valor da pendência do 0.1'],
  ])('T-0.2-11: lerReais(%j) gera erro, sem perder precisão (%s)', (entrada) => {
    expect(() => lerReais(entrada)).toThrow(ErroValidacao);
    expect(() => lerReais(entrada)).toThrow(
      expect.objectContaining({ codigo: 'CENTAVOS_INVALIDOS' }),
    );
  });
});
