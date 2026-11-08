// Códigos estáveis dos erros de validação: só estes valores são aceitos.
export type CodigoValidacao = 'VALOR_INVALIDO' | 'DATA_INVALIDA' | 'PERIODO_INVERTIDO';

// Erro lançado quando uma entrada do usuário não pode ser aceita.
export class ErroValidacao extends Error {
  readonly codigo: CodigoValidacao;

  constructor(mensagem: string, codigo: CodigoValidacao) {
    super(mensagem);
    this.codigo = codigo;
  }
}
