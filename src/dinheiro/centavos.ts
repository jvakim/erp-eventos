import { ErroValidacao } from '../erros';

// Valor em centavos inteiros, marcado para o compilador não o confundir com um `number` qualquer.
// Na execução é só um número: a marca `__marca` não existe em nenhum valor de verdade.
// (Em Python: `Centavos = NewType('Centavos', int)`.)
export type Centavos = number & { readonly __marca: 'Centavos' };

// Limite do `number` escrito como bigint, para a comparação com o valor do banco
// acontecer inteira em bigint, sem conversão nenhuma.
const LIMITE_SEGURO = BigInt(Number.MAX_SAFE_INTEGER); // 2^53 − 1

// Única porta de entrada para criar Centavos: confere `Number.isSafeInteger`.
// O `as` é seguro porque a conferência vem logo antes (construtor inteligente).
export function centavos(valor: number): Centavos {
  if (!Number.isSafeInteger(valor)) {
    throw new ErroValidacao(`centavos inválidos: ${String(valor)}`, 'CENTAVOS_INVALIDOS');
  }
  return valor as Centavos;
}

// Converte o `int8` do banco (que chega como bigint) para Centavos, sem perder precisão.
// Acima de Number.MAX_SAFE_INTEGER (ou abaixo de −MAX_SAFE_INTEGER): 'CENTAVOS_INVALIDOS'.
export function centavosDoBanco(valor: bigint): Centavos {
  if (valor > LIMITE_SEGURO || valor < -LIMITE_SEGURO) {
    throw new ErroValidacao(
      `valor do banco fora do limite seguro do number: ${String(valor)}`,
      'CENTAVOS_INVALIDOS',
    );
  }
  // Aqui a conversão é garantidamente exata: o valor já cabe no number.
  return centavos(Number(valor));
}
