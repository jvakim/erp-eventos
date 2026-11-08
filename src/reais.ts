import { ErroValidacao } from './erros';

const formatoReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatoValorBrasileiro = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/;

// Recebe centavos inteiros (100001) e devolve o texto em reais ("R$ 1.000,01").
export function formatarReais(centavos: number): string {
  const sinal = centavos < 0 ? '-' : '';

  const digitos = String(Math.abs(centavos)).padStart(3, '0');
  const reais = digitos.slice(0, -2);
  const apenasCentavos = digitos.slice(-2);

  // O `as` só é seguro porque `digitos` vem de String(inteiro): tem apenas algarismos.
  // Se `centavos` não for inteiro (150.5 vira '1..5'), o `as` esconde o erro e o Intl
  // devolve "R$ NaN" em silêncio. A garantia de inteiro vem no 0.2, com o tipo Centavos.
  const valor = `${sinal}${reais}.${apenasCentavos}` as Intl.StringNumericLiteral;
  return formatoReais.format(valor);
}

// Recebe um texto em reais ("1.000,01", "R$ 5") e devolve centavos inteiros (100001, 500).
export function lerReais(texto: string): number {
  const textoLimpo = texto.trim();
  const textoSemSimbolo = textoLimpo.startsWith('R$') ? textoLimpo.slice(2).trim() : textoLimpo;

  if (!formatoValorBrasileiro.test(textoSemSimbolo)) {
    throw new ErroValidacao(`valor inválido: ${texto}`, 'VALOR_INVALIDO');
  }

  const apenasNumeros = textoSemSimbolo.replaceAll('.', '');
  const [reais, centavosTemp = ''] = apenasNumeros.split(',');
  const centavos = centavosTemp.padEnd(2, '0');

  return Number(reais) * 100 + Number(centavos);
}
