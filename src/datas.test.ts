import { describe, expect, it } from 'vitest';
import { diasEntre } from './datas';
import { ErroValidacao } from './erros';

describe('diasEntre', () => {
  it('T-0.1-03: conta dias corridos atravessando a virada do ano', () => {
    // Datas como texto AAAA-MM-DD (como o tipo `date` do PostgreSQL): sem hora, sem fuso.
    expect(diasEntre('2026-11-05', '2027-03-15')).toBe(130);
  });

  it('T-0.1-03: mesma data dá zero', () => {
    expect(diasEntre('2026-11-14', '2026-11-14')).toBe(0);
  });

  it('T-0.1-03: fim antes do início gera erro de período invertido', () => {
    expect(() => diasEntre('2027-03-15', '2026-11-05')).toThrow(ErroValidacao);
    expect(() => diasEntre('2027-03-15', '2026-11-05')).toThrow(
      expect.objectContaining({ codigo: 'PERIODO_INVERTIDO' }),
    );
  });

  // O núcleo só aceita AAAA-MM-DD. Converter o que o usuário digita (DD/MM/AAAA) é da borda.
  it.each([
    ['2026-13-01', 'mês 13'],
    ['2026-02-30', '30 de fevereiro'],
    ['2026-04-31', '31 de abril'],
    ['2026-11-5', 'dia sem zero à esquerda'],
    ['04/10/2026', 'formato com barras (ambíguo)'],
    ['', 'vazio'],
  ])('T-0.1-03: diasEntre(%j, …) gera erro de validação (%s)', (data) => {
    expect(() => diasEntre(data, '2027-03-15')).toThrow(ErroValidacao);
    expect(() => diasEntre(data, '2027-03-15')).toThrow(
      expect.objectContaining({ codigo: 'DATA_INVALIDA' }),
    );
  });

  it('T-0.1-03: data final inválida também gera erro de validação', () => {
    expect(() => diasEntre('2026-11-05', '2026-02-30')).toThrow(
      expect.objectContaining({ codigo: 'DATA_INVALIDA' }),
    );
  });
});
