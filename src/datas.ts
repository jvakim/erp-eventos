import { ErroValidacao } from './erros';

export function diasEntre(inicio: string, fim: string): number {
  const dataInicio = lerData(inicio);
  const dataFim = lerData(fim);
  const diffTime = dataFim - dataInicio;

  if (diffTime < 0) {
    throw new ErroValidacao(`datas invertidas: ${inicio} > ${fim}`, 'PERIODO_INVERTIDO');
  }

  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays
}

function lerData(texto: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    throw new ErroValidacao(`data inválida: ${texto}`, 'DATA_INVALIDA');
  }

  const [ano, mes, dia] = texto.split('-').map(Number);

  if ((ano === undefined)|| (mes === undefined)|| (dia=== undefined)) {
    throw new ErroValidacao(`data inválida: ${texto}`, 'DATA_INVALIDA');
  }

  const ms = Date.UTC(ano, mes - 1, dia);
  const data = new Date(ms);

  if ((data.getUTCFullYear() !== ano) || (data.getUTCMonth() !== mes - 1) || (data.getUTCDate() !== dia)) {
    throw new ErroValidacao(`data inválida: ${texto}`, 'DATA_INVALIDA');
  }

  return ms;
}
