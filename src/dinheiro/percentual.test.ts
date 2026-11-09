import { describe, expect, it } from 'vitest';
import { ErroValidacao } from '../erros';
import { pct } from './percentual';

describe('pct', () => {
  // Decisão do 0.2: pct('17.25') é 17,25% e guarda a fração 0,1725.
  it('T-0.2-10: pct guarda a fração do percentual escrito', () => {
    expect(pct('17.25').equals('0.1725')).toBe(true);
    expect(pct('100').equals(1)).toBe(true);
    expect(pct('0').equals(0)).toBe(true);
    expect(pct('6.25').equals('0.0625')).toBe(true);
  });

  // Regras do 0.2: até 4 casas decimais, de 0 a 100 inclusive.
  it('T-0.2-10: aceita os limites (4 casas e 100%)', () => {
    expect(pct('0.0001').equals('0.000001')).toBe(true);
    expect(pct('100.0000').equals(1)).toBe(true);
    expect(pct('99.9999').equals('0.999999')).toBe(true);
  });

  it.each([
    ['abc', 'não é número'],
    ['', 'vazio'],
    ['17,25', 'vírgula: no código o separador é ponto'],
    ['-5', 'negativo'],
    ['Infinity', 'infinito'],
    ['NaN', 'NaN'],
    ['100.01', 'acima de 100%'],
    ['125', 'acima de 100% (12.5 digitado errado)'],
    ['17.12345', 'cinco casas decimais'],
    ['.5', 'sem dígito antes do ponto'],
    ['5.', 'sem dígito depois do ponto'],
    ['1e3', 'notação científica'],
    ['0x10', 'hexadecimal'],
  ])('T-0.2-10: pct(%j) gera erro de validação (%s)', (texto) => {
    expect(() => pct(texto)).toThrow(ErroValidacao);
    expect(() => pct(texto)).toThrow(expect.objectContaining({ codigo: 'PERCENTUAL_INVALIDO' }));
  });
});
