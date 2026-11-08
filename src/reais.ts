import { ErroValidacao } from './erros';

const formatoReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

// Recebe centavos inteiros (100001) e devolve o texto em reais ("R$ 1.000,01").
export function formatarReais(centavos: number): string {
  const sinal = centavos < 0 ? '-' : '';

  const digitos = String(Math.abs(centavos)).padStart(3,'0');
  const reais = digitos.slice(0, -2);
  const apenasCentavos = digitos.slice(-2);

  const valor = `${sinal}${reais}.${apenasCentavos}` as Intl.StringNumericLiteral;
  return formatoReais.format(valor);
}

// Recebe um texto em reais ("1.000,01", "R$ 5") e devolve centavos inteiros (100001, 500).
export function lerReais(texto: string): number {
  let valor = texto.trim();
  if (valor.startsWith('R$')) {
    valor = valor.slice(2).trim();
  }
  const regex = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/;

  if (!regex.test(valor)) {
    throw new ErroValidacao(`valor invalido: ${valor}`, 'VALOR_INVALIDO');
  }

  valor = valor.replaceAll('.', '');
  const [reais, centavosTemp = ''] = valor.split(',');
  const centavos = centavosTemp.padEnd(2, '0');

  return Number(reais) * 100 + Number(centavos);
}
