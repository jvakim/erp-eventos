import { ErroValidacao } from '../erros';
import { centavos, type Centavos } from './centavos';
import { type Percentual } from './percentual';

// R1, divisão que fecha com o total: cada parte, menos a última, é truncada no centavo;
// a última recebe o total menos a soma das outras. A ordem das partes é a da lista recebida
// e muda os centavos, então quem chama declara a sua. Negativo (estorno) é o espelho exato
// do positivo, e −0 vira 0.

// Divide `total` na proporção dos `pesos` (ex.: as listas 9.800 e 6.750).
// Pesos inteiros não negativos, ao menos um, com soma maior que zero; fora disso: 'PESOS_INVALIDOS'.
// A conta é exata, sem ponto flutuante: total × peso pode passar do limite seguro do number.
export function dividirPorPesos(total: Centavos, pesos: readonly number[]): Centavos[] {
  if (pesos.some((peso) => peso < 0 || !Number.isSafeInteger(peso))) {
    throw new ErroValidacao(`pesos inválidos: ${pesos.join('/')}`, 'PESOS_INVALIDOS');
  }
  // A soma de uma lista vazia é 0, então esta conferência também recusa a lista vazia.
  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0);
  if (somaPesos === 0 || !Number.isSafeInteger(somaPesos)) {
    throw new ErroValidacao(`soma dos pesos inválida: ${pesos.join('/')}`, 'PESOS_INVALIDOS');
  }

  // Só total × peso precisa de bigint: o produto pode passar de 2^53. Cada parte volta para
  // number logo depois de dividida, e cabe nele porque nunca passa do total.
  // O espelho dos negativos vem do próprio bigint: a divisão trunca em direção a zero
  // (−888.217,52 → −888.217) e o bigint não tem −0 (Number(0n) é 0).
  const totalExato = BigInt(total);
  const somaExata = BigInt(somaPesos);
  const partes = pesos
    .slice(0, -1)
    .map((peso) => Number((totalExato * BigInt(peso)) / somaExata));

  // A última parte não é calculada pelo peso: recebe o que sobrou, para a soma fechar.
  const jaDistribuido = partes.reduce((soma, parte) => soma + parte, 0);
  partes.push(total - jaDistribuido);

  return partes.map((parte) => centavos(parte));
}

// Peso que corresponde a 100% na conversão de percentual em peso inteiro. O `pct` aceita até
// 4 casas no percentual, ou seja, 6 casas na fração (33,3333% = 0,333333); × 10^6 deixa
// qualquer fração inteira (0,0001% vira o peso 1). Se a regra das casas do `pct` mudar,
// este número muda junto.
const PESO_DE_100_POR_CENTO = 1_000_000;

// Divide `total` pelos percentuais, na mesma R1: converte os percentuais em pesos inteiros
// e chama dividirPorPesos. Percentuais que não somam exatamente 100%: 'PERCENTUAIS_NAO_FECHAM'.
export function dividir(total: Centavos, percentuais: readonly Percentual[]): Centavos[] {
  // A multiplicação é feita no Decimal: em float, 0,0249% viraria o peso 248,99999999999997.
  const pesos = percentuais.map((percentual) => percentual.times(PESO_DE_100_POR_CENTO).toNumber());

  // Os pesos são inteiros exatos, então a soma de 100% é conferida em number, sem Decimal.
  const somaPesos = pesos.reduce((soma, peso) => soma + peso, 0);
  if (somaPesos !== PESO_DE_100_POR_CENTO) {
    const escritos = percentuais.map((percentual) => percentual.times(100).toString()).join('/');
    throw new ErroValidacao(
      `percentuais não somam 100%: ${escritos}`,
      'PERCENTUAIS_NAO_FECHAM',
    );
  }

  return dividirPorPesos(total, pesos);
}
