import { ErroValidacao } from '../erros';
import { centavos, type Centavos } from './centavos';

const formatoReais = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatoValorBrasileiro = /^(\d{1,3}(\.\d{3})+|\d+)(,\d{1,2})?$/;

// Recebe centavos inteiros (100001) e devolve o texto em reais ("R$ 1.000,01").
export function formatarReais(valor: Centavos): string {
  const sinal = valor < 0 ? '-' : '';

  const digitos = String(Math.abs(valor)).padStart(3, '0');
  const reais = digitos.slice(0, -2);
  const apenasCentavos = digitos.slice(-2);

  // O `as` é seguro porque `valor` é Centavos: um inteiro seguro conferido por centavos().
  // Então `digitos` só tem algarismos e o texto é sempre um decimal válido ('1000.01').
  // (Antes do 0.2, formatarReais(150.5) montava '1..5' e o Intl devolvia "R$ NaN" em silêncio.)
  const textoDecimal = `${sinal}${reais}.${apenasCentavos}` as Intl.StringNumericLiteral;
  return formatoReais.format(textoDecimal);
}

// Recebe um texto em reais ("1.000,01", "R$ 5") e devolve centavos inteiros (100001, 500).
// Formato fora do padrão brasileiro: 'VALOR_INVALIDO'.
// Acima do limite seguro do number: 'CENTAVOS_INVALIDOS' (vem de centavos()).
export function lerReais(texto: string): Centavos {
  const textoLimpo = texto.trim();
  const textoSemSimbolo = textoLimpo.startsWith('R$') ? textoLimpo.slice(2).trim() : textoLimpo;

  if (!formatoValorBrasileiro.test(textoSemSimbolo)) {
    throw new ErroValidacao(`valor inválido: ${texto}`, 'VALOR_INVALIDO');
  }

  const apenasNumeros = textoSemSimbolo.replaceAll('.', '');
  // "1000,1" → reais "1000" e casasDecimais "1"; sem vírgula, casasDecimais fica ''.
  const [reais, casasDecimais = ''] = apenasNumeros.split(',');
  const centavosTexto = casasDecimais.padEnd(2, '0'); // "1" → "10"

  // A conta é em number; centavos() recusa o resultado se passar do limite seguro.
  return centavos(Number(reais) * 100 + Number(centavosTexto));
}
