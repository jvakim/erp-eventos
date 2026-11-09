// Códigos estáveis dos erros de validação: só estes valores são aceitos.
export type CodigoValidacao =
  | 'VALOR_INVALIDO'
  | 'DATA_INVALIDA'
  | 'PERIODO_INVERTIDO'
  | 'CENTAVOS_INVALIDOS' // não é inteiro seguro (0.2)
  | 'PERCENTUAL_INVALIDO' // texto que não é um percentual válido (0.2)
  | 'PESOS_INVALIDOS' // pesos vazios, negativos, fracionários ou somando zero (0.2)
  | 'PERCENTUAIS_NAO_FECHAM' // percentuais de uma divisão que não somam 100% (0.2)
  | 'PARCELAS_INVALIDAS' // número de parcelas que não é inteiro maior ou igual a 1 (0.2)
  | 'TOTAL_MENOR_QUE_PARCELAS'; // total, em centavos, menor que o número de parcelas (0.2)

// Erro lançado quando uma entrada do usuário não pode ser aceita.
export class ErroValidacao extends Error {
  readonly codigo: CodigoValidacao;

  constructor(mensagem: string, codigo: CodigoValidacao) {
    super(mensagem);
    this.codigo = codigo;
  }
}
