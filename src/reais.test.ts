import { describe, expect, it } from 'vitest';
import { ErroValidacao } from './erros';
import { formatarReais, lerReais } from './reais';

// O Intl põe um espaço NÃO separável (U+00A0) depois de "R$", e não o espaço comum.
// Escrever o caractere como \u00a0 deixa isso visível no teste.
const NBSP = '\u00a0';

describe('formatarReais', () => {
  it('T-0.1-01: formata centavos inteiros como reais (positivo, negativo e zero)', () => {
    expect(formatarReais(100001)).toBe(`R$${NBSP}1.000,01`);
    expect(formatarReais(-5)).toBe(`-R$${NBSP}0,05`);
    expect(formatarReais(0)).toBe(`R$${NBSP}0,00`);
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
