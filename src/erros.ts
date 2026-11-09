// Códigos estáveis dos erros de validação: só estes valores são aceitos.
export type CodigoValidacao =
  | 'VALOR_INVALIDO'
  | 'DATA_INVALIDA'
  | 'PERIODO_INVERTIDO'
  | 'CENTAVOS_INVALIDOS' // não é inteiro seguro (0.2)
  | 'PERCENTUAL_INVALIDO'; // texto que não é um percentual válido (0.2)

// Erro lançado quando uma entrada do usuário não pode ser aceita.
export class ErroValidacao extends Error {
  readonly codigo: CodigoValidacao;

  constructor(mensagem: string, codigo: CodigoValidacao) {
    super(mensagem);
    this.codigo = codigo;
  }
}
