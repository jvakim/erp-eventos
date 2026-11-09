import { describe, expect, it } from 'vitest';
import { ErroValidacao } from '../erros';
import { centavos, centavosDoBanco } from './centavos';

// Maior inteiro que o `number` (float64) guarda sem perder precisão: 2^53 − 1.
const LIMITE = Number.MAX_SAFE_INTEGER; // 9007199254740991

describe('centavos', () => {
  it('T-0.2-11: aceita inteiros seguros, positivos, negativos e zero', () => {
    expect(centavos(100001)).toBe(100001);
    expect(centavos(-5)).toBe(-5);
    expect(centavos(0)).toBe(0);
    expect(centavos(LIMITE)).toBe(LIMITE);
    expect(centavos(-LIMITE)).toBe(-LIMITE);
  });

  // Antes do 0.2, formatarReais(150.5) devolvia "R$ NaN" em silêncio (pendência do 0.1).
  it.each([
    [150.5, 'fração de centavo'],
    [Number.NaN, 'NaN'],
    [Number.POSITIVE_INFINITY, 'infinito'],
    [1e21, 'acima do limite seguro'],
    [LIMITE + 1, 'logo acima do limite seguro'],
  ])('T-0.2-11: centavos(%s) gera erro de validação (%s)', (valor) => {
    expect(() => centavos(valor)).toThrow(ErroValidacao);
    expect(() => centavos(valor)).toThrow(expect.objectContaining({ codigo: 'CENTAVOS_INVALIDOS' }));
  });
});

describe('centavosDoBanco', () => {
  // O `int8` do PostgreSQL vai até 2^63 − 1; o `number` só é exato até 2^53 − 1.
  it('T-0.2-11: converte bigint dentro do limite seguro', () => {
    expect(centavosDoBanco(100001n)).toBe(100001);
    expect(centavosDoBanco(-500n)).toBe(-500);
    expect(centavosDoBanco(BigInt(LIMITE))).toBe(LIMITE);
  });

  it.each([
    [BigInt(LIMITE) + 1n, 'logo acima do limite'],
    [-(BigInt(LIMITE) + 1n), 'logo abaixo do limite negativo'],
    [9223372036854775807n, 'maior int8 do banco'],
  ])('T-0.2-11: centavosDoBanco(%s) gera erro, sem perder precisão (%s)', (valor) => {
    expect(() => centavosDoBanco(valor)).toThrow(ErroValidacao);
    expect(() => centavosDoBanco(valor)).toThrow(
      expect.objectContaining({ codigo: 'CENTAVOS_INVALIDOS' }),
    );
  });
});
