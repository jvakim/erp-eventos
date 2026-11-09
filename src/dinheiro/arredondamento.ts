import { Decimal } from 'decimal.js';
import { centavos, type Centavos } from './centavos';

// R2: cálculo isolado (meia diária, imposto, projeção) vai ao centavo inteiro mais próximo.
// As duas funções recebem o valor em centavos num Decimal, que pode ter fração (9277,5),
// e devolvem Centavos. Só diferem no meio exato (,5). O negativo é o espelho do positivo,
// e −0 vira 0. Resultado acima do limite seguro: 'CENTAVOS_INVALIDOS' (vem de centavos()).
// O arredondamento é feito de uma só vez, direto do valor recebido ao centavo inteiro:
// em duas etapas, 9277,4501 → 9277,5 → 9278, quando o certo é 9277. Por isso quem chama
// faz a conta inteira em Decimal e só arredonda o resultado final.

// Corpo comum aos dois modos: só o `modo` muda. Fica sem `export` de propósito, para
// ninguém fora deste arquivo escolher um modo por conta própria (ex.: ROUND_DOWN).
function arredondarNoModo(valor: Decimal, modo: Decimal.Rounding): Centavos {
  const valorArredondado = valor.toDecimalPlaces(0, modo).toNumber();
  // −0 === 0 é true: o −0 (de −0,4 ou de −0) sai como 0, e qualquer outro valor fica como está.
  return centavos(valorArredondado === 0 ? 0 : valorArredondado);
}

// Meio afastando de zero: 9276,5 → 9277; −9276,5 → −9277.
export function arredondarMeioAfastandoDeZero(valor: Decimal): Centavos {
  return arredondarNoModo(valor, Decimal.ROUND_HALF_UP);
}

// Meio para o par ("arredondamento bancário"), segundo a ABNT NBR 5891. Sobre o que se descarta:
//   1. começa com algarismo < 5: o anterior fica (9276,49 → 9276);
//   2. começa com > 5, ou com 5 seguido de algum algarismo diferente de zero:
//      o anterior sobe um (9276,6 → 9277; 9276,5001 → 9277);
//   3. é exatamente 5 (seguido só de zeros, ou de nada): o anterior sobe se for ímpar
//      e fica se for par (9277,5 → 9278; 9276,5 → 9276; −9276,5 → −9276).
// Regras escritas pelo que a norma costuma citar; conferir com o texto oficial da ABNT.
export function arredondarMeioParaPar(valor: Decimal): Centavos {
  return arredondarNoModo(valor, Decimal.ROUND_HALF_EVEN);
}

// Modo vigente da R2: ABNT NBR 5891 (meio para o par), decidido no 0.2 porque a reforma
// tributária ainda não definiu um padrão. Trocar o modo é trocar o nome nesta linha
// (e a conferência no teste).
export const arredondarR2 = arredondarMeioParaPar;
