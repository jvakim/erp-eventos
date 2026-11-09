import { Decimal } from 'decimal.js';
import { ErroValidacao } from '../erros';

// Percentual guardado como fração num Decimal (17,25% → 0,1725), marcado para o compilador
// não o aceitar no lugar de Centavos. (Em Python: um `decimal.Decimal` com `NewType`.)
export type Percentual = Decimal & { readonly __marca: 'Percentual' };

// De 0 a 100, com ponto e até 4 casas: o 100 exato numa alternativa, de 0 a 99,9999 na outra.
const formatoPercentual = /^(?:100(?:\.0{1,4})?|[0-9]{1,2}(?:\.[0-9]{1,4})?)$/;

// Cria um Percentual a partir do texto escrito em pontos percentuais: pct('17.25') = 17,25%.
// Recebe texto, e não number, para o valor nunca passar por ponto flutuante.
// Aceita de 0 a 100, com ponto decimal e até 4 casas (ex.: '0', '0.0001', '17.25', '100.0000').
// Qualquer outro texto (negativo, acima de 100, vírgula, expoente, hexadecimal, vazio):
// 'PERCENTUAL_INVALIDO'.
export function pct(texto: string): Percentual {
  if (!formatoPercentual.test(texto)) {
    throw new ErroValidacao(`percentual inválido: ${texto}`, 'PERCENTUAL_INVALIDO');
  }
  const valorDecimal = new Decimal(texto).div(100);
  return valorDecimal as Percentual;
}
