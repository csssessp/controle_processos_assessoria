// Checklists oficiais de conferência de Prestação de Contas do GGCON — transcritos
// literalmente dos PDFs "Instruções 01/2024 (Entidades)" (Check Entidade 2026) e
// "Prestação de Contas – 1º Setor / Prefeituras" (Check List Prefeitura 2026).
// Cada análise (services/ggconAnaliseService.ts → criarAnalise) copia estes itens
// para cgof_ggcon_analise_itens de acordo com o tipo_conveniada escolhido no
// cadastro — a cópia fica congelada no momento da criação, então um ajuste feito
// aqui no futuro não altera retroativamente análises já em andamento.

import { GgconTipoConveniada } from '../types';

export interface GgconChecklistItemTemplate {
  numero: number;
  descricao: string;
  dica?: string; // nota fixa do PDF ("Se não tiver, pedir declaração negativa" etc.) — usada como placeholder do campo "Documento SEI"
}

const DICA_DECLARACAO_NEGATIVA = 'Se não tiver, pedir declaração negativa';
const DICA_LASTROS = 'Informar todas as contas utilizadas de entrada e saída de recursos - lastros';
const DICA_NF_ELETRONICA =
  'Em XML, com carimbo "confere com o original" assinado, contendo nº do Convênio ou do T.A., Secretaria de Estado da Saúde e Unidade Pagadora (UGE) / NF Eletrônica, contendo nº do Convênio ou do T.A., Secretaria de Estado da Saúde e Unidade Pagadora (UGE)';

export const CHECKLIST_ENTIDADE: GgconChecklistItemTemplate[] = [
  { numero: 1, descricao: 'Ofício do Interessado endereçado ao Secretário da Saúde' },
  { numero: 2, descricao: 'Cópia do Ajuste (Convênio ou Termo Aditivo)' },
  { numero: 3, descricao: 'Cópia do Plano de Trabalho do Ajuste (Convênio ou Termo Aditivo) devidamente aprovado pela autoridade competente' },
  { numero: 4, descricao: 'Cópia do Termo de Ciência e Notificação do Ajuste (Convênio ou Termo Aditivo)' },
  { numero: 5, descricao: 'Cópia da Publicação do Ajuste (Convênio ou Termo Aditivo), no Diário Oficial do Estado' },
  { numero: 6, descricao: 'Cópia do Termo de aditamento de Prorrogação ou Resolução (se houver)' },
  { numero: 7, descricao: 'Cópia do Estatuto Oficial da Entidade' },
  { numero: 8, descricao: 'Ata de eleição do quadro dirigente atual da entidade conveniada' },
  { numero: 9, descricao: 'Comprovante de Inscrição no Cadastro Nacional de Pessoa Jurídica, atualizado' },
  { numero: 10, descricao: 'Certidão contendo nome e CPFs dos dirigentes e conselheiros da entidade conveniada, incluindo:\na) forma de remuneração\nb) períodos de atuação principalmente do dirigente responsável pela administração dos recursos recebidos à conta do convênio' },
  { numero: 11, descricao: 'Declaração informando o atendimento dos princípios da legalidade, impessoalidade, moralidade, publicidade, eficiência, motivação, interesse público' },
  { numero: 12, descricao: 'Relatório anual de execução de atividades desenvolvidas pela Conveniada, assinado pelo representante legal da entidade, contendo especificamente:\na) relatório sobre a execução do objeto do convênio; e\nb) comparativo entre as metas propostas e os resultados alcançados compensados' },
  { numero: 13, descricao: 'Relatório governamental da análise da execução do convênio, demonstrando que a parceria permanece a melhor opção para a Administração Pública, utilizando como base comparativa os dados informados no documento previsto na alínea "e", inciso I, do art. 137 desta Seção, ou seja:\na) demonstrativo dos custos apurados, para a estipulação das metas e do orçamento' },
  { numero: 14, descricao: 'Certidão indicando o nome e CPF do responsável pelo órgão concessor e respectivos período de atuação' },
  { numero: 15, descricao: 'Certidão indicando os nomes e CPFs dos responsáveis pela fiscalização da execução do convênio e respectivos períodos de atuação' },
  { numero: 16, descricao: 'Manifestação do Controle Interno sobre a prestação de contas do período ou certidão negativa, se for o caso' },
  { numero: 17, descricao: 'Relação dos contratos e respectivos aditamentos, firmados com a utilização de recursos públicos administrados pela entidade conveniada, para os fins estabelecidos no convênio, contendo:\na) tipo e número do ajuste;\nb) identificação das partes;\nc) data;\nd) objeto;\ne) vigência;\nf) valor pago no exercício; e\ng) condições de pagamento (Modelo 02- Anexo – I)', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 18, descricao: 'Se adquiriu, bens móveis e/ou imóveis com os recursos recebidos, encaminhar:\na) prova do registro contábil,\nb) prova do registro patrimonial, e/ou\nc) prova do registro imobiliário da circunscrição, conforme o caso. - Fotos', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 19, descricao: 'Declaração atualizada acerca da existência ou não no quadro diretivo da conveniada de agentes políticos de Poder, de membros do Ministério Público ou de dirigente de órgão ou entidade da Administração Pública celebrante, bem como seus respectivos cônjuges, companheiros ou parentes, até o segundo grau, em linha reta, colateral ou por afinidade', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 20, descricao: 'Declaração atualizada acerca da não contratação empresa(s) pertencente(s) a dirigentes da Conveniada, agentes públicos de Poder, membros do Ministério Público ou dirigentes de órgão ou entidade da Administração Pública celebrante, bem como seus respectivos cônjuges, companheiros ou parentes, até o segundo grau, em linha reta, colateral ou por afinidade' },
  { numero: 21, descricao: 'Anexo RP-11 – Termo de Ciência e Notificação, DRS e Conveniada' },
  { numero: 22, descricao: 'Comprovação de regularidade de débitos relativos a Tributos Federais e à Dívida da União, FGTS, débitos inadimplidos perante a Justiça do Trabalho e Dívida Ativa do Estado de São Paulo' },
  { numero: 23, descricao: 'Declaração de que realizou no mínimo 03 (três) Cotações de Preços nas aquisições realizadas pelo Convênio (materiais e serviços), passado um ano providenciar novas cotações' },
  { numero: 24, descricao: 'Cópia Ficha Patrimonial dos bens adquiridos, carimbada e assinada pelo responsável', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 25, descricao: 'Laudo de Conclusão de Obra assinado por Engenheiro responsável', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 26, descricao: 'Atestado de Recebimento Conclusivo Obra, assinado pelo responsável entidade', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 27, descricao: 'Parecer do Conselho Fiscal aprovando as contas do convênio, ou autoridade competente' },
  { numero: 28, descricao: 'Declaração de Atualização Cadastral, responsável pela conveniada e DRS - CADTESP' },
  { numero: 29, descricao: 'Termo de Consentimento, conforme Anexo PC-02, para que o TCESP acesse as informações das contas bancárias indicadas para movimentação dos recursos do ajuste' },
  { numero: 30, descricao: 'Certidão expedida pelo Conselho Regional de Contabilidade – CRC, comprovando a habilitação profissional dos responsáveis por balanços e demonstrações contábeis' },
  { numero: 31, descricao: 'Conciliação bancária do mês de dezembro da conta corrente específica, aberta em instituição financeira pública, acompanhada dos extratos de conta corrente e de aplicações financeiras (Modelo 04, assinada pelo Contador e Responsável pelo Convênio) e justificativa detalhada de divergências/pendências/cheques não compensados', dica: DICA_LASTROS },
  { numero: 32, descricao: 'Publicação do Balanço Patrimonial da entidade conveniada, dos exercícios encerrado e anterior' },
  { numero: 33, descricao: 'Demonstrações contábeis e financeiras da entidade conveniada, acompanhadas do balancete analítico acumulado do exercício' },
  { numero: 34, descricao: 'Comprovantes da devolução de recursos não aplicados ou aplicados irregularmente', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 35, descricao: 'Demonstrativo integral das receitas e despesas computadas por fontes de recurso, individualizando os gastos pela forma de contratação, conforme modelo do Anexo RP-12' },
  { numero: 36, descricao: 'Demonstrativo integral das receitas e despesas – DIRD (Além do Relatório em PDF pesquisável, enviar a planilha em Excel (XLS))' },
  { numero: 37, descricao: 'Apresentação de cópias de NF Eletrônica, emitidas pelos respectivos fornecedores, com identificação do órgão público contratante, número do contrato de gestão e demais elementos identificadores no conteúdo original do documento (não admitida inserção posterior à emissão)', dica: DICA_NF_ELETRONICA },
  { numero: 38, descricao: 'Extratos da Conta Corrente em que recebeu os recursos, a partir da data de recebimento, por ordem cronológica', dica: DICA_LASTROS },
  { numero: 39, descricao: 'Extratos da Conta de Aplicações Financeiras, demonstrando os respectivos rendimentos a partir da data de recebimento, por ordem cronológica', dica: DICA_LASTROS },
  { numero: 40, descricao: 'Parecer conclusivo por exercício, elaborado nos termos da Instrução TCE' },
  { numero: 41, descricao: 'Relatório da execução do convênio e, quando houver, de visita técnica in loco realizada durante a sua vigência' },
  { numero: 42, descricao: 'Planilha de Tarifas Bancárias (Modelo 05 - Anexo I): controle de tarifas debitadas, data da saída e data do reembolso com recursos próprios e para qual conta o valor foi devolvido' },
  { numero: 43, descricao: 'Relação nominal dos empregados admitidos ou mantidos com recursos do convênio, indicando as funções, datas de admissão, as datas de demissão (quando for o caso), bem como a remuneração bruta e individual do período' },
  { numero: 44, descricao: 'Caso tenha ocorrido rateio administrativo de custos indiretos: relação de todas as despesas rateadas, critério utilizado e memória de cálculo, contendo finalidade, credor, CPF/CNPJ, função/cargo, documento comprobatório, valor total pago, data de pagamento, banco/agência/conta de débito da sede, percentual de rateio e valor/data de ressarcimento com recursos do convênio' },
  { numero: 45, descricao: 'Relação dos pagamentos de indenizações judiciais realizados no exercício fiscalizado, com nome do requerente, nº do processo, data de pagamento, valor pago, objeto da ação, período de referência e data da sentença judicial' },
  { numero: 46, descricao: 'Cópia do site da conveniada, onde constam referências e dados do convênio, nos termos da Lei Federal nº 12.527/2011' },
  { numero: 47, descricao: 'Planilha de Execução Financeira (Modelo 01 - Anexo I): demonstrativo dos gastos confrontados com o Plano de Trabalho, com justificativa dos desvios significativos (acima da variação permitida)' },
];

export const CHECKLIST_PREFEITURA: GgconChecklistItemTemplate[] = [
  { numero: 1, descricao: 'Ofício do Interessado endereçado ao Secretário da Saúde, informando o número do Convênio ou Termo Aditivo, a UGE da Prestação de Contas e o exercício a que se refere' },
  { numero: 2, descricao: 'Cópia do Ajuste (Convênio ou Termo Aditivo) em referência' },
  { numero: 3, descricao: 'Cópia do Plano de Trabalho do Ajuste (Convênio ou Termo Aditivo) devidamente aprovado pela autoridade competente' },
  { numero: 4, descricao: 'Cópia da Publicação do Ajuste (Convênio ou Termo Aditivo), na imprensa oficial, do extrato do convênio' },
  { numero: 5, descricao: 'Cópia do Termo de aditamento de Prorrogação ou Resolução (se houver)' },
  { numero: 6, descricao: 'Comprovante de Inscrição no Cadastro Nacional de Pessoa Jurídica, atualizado' },
  { numero: 7, descricao: 'Certidão indicando os nomes e CPFs dos responsáveis pela fiscalização da execução do(s) convênio(s) e respectivos períodos de atuação' },
  { numero: 8, descricao: 'Certidão contendo os nomes e CPFs da(s) autoridade(s) responsável(eis) pelo órgão conveniado (Prefeito) e os respectivos períodos de atuação' },
  { numero: 9, descricao: 'Relatório anual do conveniado das atividades desenvolvidas com recursos próprios e as verbas públicas repassadas, computadas por fontes de recurso e por categorias/finalidades dos gastos, com comparativo entre metas propostas e resultados alcançados' },
  { numero: 10, descricao: 'Certidão indicando o nome completo e CPF dos responsáveis pela existência e funcionamento regular do controle interno' },
  { numero: 11, descricao: 'Declaração de que cumpriu as normas gerais da Lei Federal nº 8.666/93 e alterações quanto à realização de Licitações para as despesas apresentadas, acompanhada da Publicação de Homologação e Adjudicação' },
  { numero: 12, descricao: 'Na hipótese de aquisição de bens móveis e/ou imóveis com os recursos recebidos, encaminhar, conforme o caso:\na) prova do registro contábil;\nb) prova do registro patrimonial; e/ou\nc) prova do registro imobiliário da circunscrição - Foto', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 13, descricao: 'Cópia Ficha Patrimonial dos bens adquiridos, carimbada e assinada pelo responsável' },
  { numero: 14, descricao: 'Laudo de Conclusão de Obra assinado por Engenheiro responsável', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 15, descricao: 'Atestado de Recebimento Conclusivo da Obra, assinado pelos responsáveis da conveniada', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 16, descricao: 'Demonstrativo Integral das Receitas e Despesas computadas por fontes de recurso e por categorias/finalidades dos gastos, conforme modelo do Anexo RP-02' },
  { numero: 17, descricao: 'Apresentação de cópias de NF Eletrônica, emitidas pelos respectivos fornecedores, com identificação do órgão público contratante, número do contrato de gestão e demais elementos identificadores no conteúdo original do documento (não admitida inserção posterior à emissão)', dica: DICA_NF_ELETRONICA },
  { numero: 18, descricao: 'Planilha de Tarifas Bancárias (Modelo 05 - Anexo I): controle de tarifas debitadas, data da saída e data do reembolso com recursos próprios e para qual conta o valor foi devolvido' },
  { numero: 19, descricao: 'Comprovante de devolução de recursos não aplicados ou aplicados irregularmente', dica: DICA_DECLARACAO_NEGATIVA },
  { numero: 20, descricao: 'Cópia do comprovante de devolução de eventuais glosas/saldos, ou cópia de solicitação formal para sua utilização em exercício subsequente' },
  { numero: 21, descricao: 'Extratos da Conta Corrente em que recebeu os recursos, a partir da data de recebimento, por ordem cronológica', dica: DICA_LASTROS },
  { numero: 22, descricao: 'Extratos da Conta de Aplicações Financeiras, demonstrando os respectivos rendimentos a partir da data de recebimento, por ordem cronológica', dica: DICA_LASTROS },
  { numero: 23, descricao: 'Certidão expedida pelo Conselho Regional de Contabilidade – CRC, comprovando a habilitação profissional dos responsáveis pelos balanços e demonstrações contábeis' },
  { numero: 24, descricao: 'Conciliação Bancária (Modelo 04), assinada pelo Contador e Responsável pelo Convênio, com justificativa detalhada de divergências/pendências/cheques não compensados' },
  { numero: 25, descricao: 'Ata do Conselho Municipal de Saúde aprovando as Contas deste convênio (incluindo aprovação das metas/resultados)' },
  { numero: 26, descricao: 'Demonstrativos Contábeis e Financeiros do conveniado, com indicação dos valores repassados pelo órgão convenente e correspondentes despesas realizadas, acompanhados da conciliação bancária do mês de dezembro da conta corrente específica em instituição financeira oficial' },
  { numero: 27, descricao: 'Link do site da conveniada onde constam referências e dados do convênio, nos termos da Lei Federal nº 12.527/2011' },
  { numero: 28, descricao: 'Termo de Consentimento, conforme Anexo PC-02, para que o TCESP acesse as informações das contas bancárias indicadas para movimentação dos recursos do ajuste' },
  { numero: 29, descricao: 'Cópia do Termo de Ciência e de Notificação do Ajuste (Convênio ou Termo Aditivo), conforme Anexo RP-03' },
  { numero: 30, descricao: 'Declaração de Atualização Cadastral, responsável pela conveniada e DRS - CADTESP' },
  { numero: 31, descricao: 'Relatório governamental da análise da execução do convênio, demonstrando que a parceria permanece a melhor opção para a Administração Pública, utilizando como base comparativa os dados informados no documento previsto na alínea "e", inciso I, do art. 137 desta Seção, ou seja:\na) demonstrativo dos custos apurados, para a estipulação das metas e do orçamento' },
  { numero: 32, descricao: 'Relatório Indicando a realização de visita in loco pelo órgão/entidade concessor (a) em obras e na aquisição de mobiliário, equipamentos e/ou veículos. Em caso de aquisição de Equipamentos: informa se eles estão em pleno funcionamento e, inclusive, o número do patrimônio' },
  { numero: 33, descricao: 'Houve notificação para apresentação, complementação ou correção de documentação por parte da DRS?' },
  { numero: 34, descricao: 'Resposta Notificação' },
  { numero: 35, descricao: 'Parecer Conclusivo' },
];

export const CHECKLISTS: Record<GgconTipoConveniada, GgconChecklistItemTemplate[]> = {
  ENTIDADE: CHECKLIST_ENTIDADE,
  PREFEITURA: CHECKLIST_PREFEITURA,
};

export const GGCON_TIPO_CONVENIADA_LABELS: Record<GgconTipoConveniada, string> = {
  ENTIDADE: 'Entidade',
  PREFEITURA: 'Prefeitura',
};

// Modelos de referência (Anexo I) citados dentro da descrição de vários itens do
// checklist (ex.: item 17 "Modelo 02 - Anexo I", item 31 "Modelo 04", item 42
// "Modelo 05 - Anexo I", item 47 "Modelo 01 - Anexo I") — aparecem nos PDFs originais
// logo depois da tabela de itens ("MODELOS:"), mas até agora não tinham nenhuma tela
// própria: o técnico via só a referência ao modelo no texto do item, sem saber o que
// ele contém. Aqui ficam resumidos (título + colunas) para consulta rápida dentro da
// análise, sem precisar abrir o PDF original.
//
// O Modelo 02 (Relação de Contratos) NÃO é idêntico nos dois documentos-fonte: a
// versão do PDF de Entidades tem 10 colunas; a versão do PDF de Prefeituras tem
// mais duas ("Valor Pago" e "Data encerramento do contrato") — por isso este
// catálogo é por tipo_conveniada, e não uma lista única compartilhada (os outros
// quatro modelos são idênticos nos dois documentos).
export interface GgconModeloReferencia {
  numero: string;
  titulo: string;
  descricao: string;
  colunas: string[];
  // Linhas de exemplo/estrutura, na mesma ordem das colunas — célula vazia ('') é um
  // espaço em branco a preencher. Só listar colunas não basta pra um técnico entender
  // a planilha; a tabela renderizada (ver GgconAnalise.tsx) mostra isso como uma
  // tabela de verdade, não uma lista de nomes separados por ponto.
  linhasExemplo: string[][];
  observacao?: string;
}

// Gera N linhas em branco (todas as células vazias) — usado nos modelos que no
// documento original são planilhas em branco para a conveniada preencher, sem
// nenhuma linha de exemplo impressa.
const linhasEmBranco = (qtdColunas: number, qtdLinhas: number): string[][] =>
  Array.from({ length: qtdLinhas }, () => Array(qtdColunas).fill(''));

const MODELO_01: GgconModeloReferencia = {
  numero: '01',
  titulo: 'Execução de Convênio',
  descricao: 'Demonstrativo dos gastos confrontados com o Plano de Trabalho, por categoria de despesa.',
  colunas: ['Categoria', 'Descrição', 'Valor Total Previsto (R$)', 'Ano 1 Previsto (R$)', 'Ano 1 Executado (R$)', 'Ano 2 Previsto (R$)', 'Ano 2 Executado (R$)', 'Ano 3 Previsto (R$)', 'Ano 3 Executado (R$)', 'Total Executado (R$)', '% Execução', 'Saldo (R$)'],
  // As 10 categorias já vêm impressas na planilha original (uma linha fixa por
  // categoria) — só os valores é que ficam em branco para preencher.
  linhasExemplo: [
    'Gêneros Alimentícios', 'Gás de Cozinha', 'Rouparia e Vestimentas', 'Material de Escritório',
    'Material de Limpeza', 'Medicamentos', 'Material Hospitalar', 'Energia Elétrica',
    'Água e Esgoto', 'Folha de Pagamento e Encargos',
  ].map(categoria => [categoria, ...Array(11).fill('')]),
  observacao: 'Em caso de divergência entre valores previstos/executados ou entre metas planejadas/realizadas, a conveniada deve apresentar justificativa técnica e financeira detalhada, com documentação comprobatória.',
};

const MODELO_03: GgconModeloReferencia = {
  numero: '03',
  titulo: 'Plantão',
  descricao: 'Controle de plantões/escalas de profissionais remunerados com recursos do convênio (ex.: plantão médico por hora).',
  colunas: ['Profissional', 'CRM', 'Clínica', 'Turno', 'Plantões', 'Total Plantões', 'Total Horas', 'Horas Trabalhadas', 'Valor Pago', 'Período Pago', 'Descrição', 'N.F.'],
  linhasExemplo: linhasEmBranco(12, 2),
};

const MODELO_04: GgconModeloReferencia = {
  numero: '04',
  titulo: 'Conciliação Bancária',
  descricao: 'Saldo em 31/12 do exercício em exame por conta bancária, assinada pelo Contador e pelo Responsável pelo Convênio.',
  colunas: ['Banco', 'Nº Conta', 'Saldo em 31/12 — Conta Corrente (R$)', 'Saldo em 31/12 — Conta Poupança (R$)', 'Saldo em 31/12 — Conta Investimento (R$)', 'Saldo em 31/12 — Total (R$)'],
  linhasExemplo: linhasEmBranco(6, 2),
  observacao: '(A) Subtotal – Contas Bancárias + (B) Caixa = (C) Total Caixa e Equivalentes de Caixa. Acompanhar de justificativa de divergências na conciliação (pendências ou cheques não compensados).',
};

const MODELO_05: GgconModeloReferencia = {
  numero: '05',
  titulo: 'Controle de Tarifas Bancárias',
  descricao: 'Controle de tarifas debitadas e do respectivo reembolso com recursos próprios da conveniada.',
  colunas: ['Data do Débito', 'Descrição da Tarifa', 'Valor Débito (R$)', 'Data do Reembolso (Recurso Próprio)', 'Comprovante de Depósito (Doc/Ted/PIX)'],
  // Linha de exemplo real, tirada do documento original.
  linhasExemplo: [['05/02/2024', 'Tarifa de Manutenção', '55,00', '07/02/2024', 'Transf. 12345'], Array(5).fill('')],
};

export const MODELOS_REFERENCIA: Record<GgconTipoConveniada, GgconModeloReferencia[]> = {
  ENTIDADE: [
    MODELO_01,
    {
      numero: '02',
      titulo: 'Relação de Contratos',
      descricao: 'Relação dos contratos e respectivos aditamentos firmados com recursos públicos administrados pela entidade conveniada.',
      colunas: ['Empresa', 'CNPJ', 'Natureza', 'Subgrupo', 'Base', 'Proj. Ano', 'Mês reajuste', 'Índice reajuste', 'Valor contrato após reajuste', 'Data assinatura'],
      linhasExemplo: linhasEmBranco(10, 2),
    },
    MODELO_03,
    MODELO_04,
    MODELO_05,
  ],
  PREFEITURA: [
    MODELO_01,
    {
      numero: '02',
      titulo: 'Relação de Contratos',
      descricao: 'Relação dos contratos e respectivos aditamentos firmados com recursos públicos administrados pelo conveniado.',
      colunas: ['Empresa', 'CNPJ', 'Natureza', 'Subgrupo', 'Base', 'Proj. Ano', 'Mês reajuste', 'Índice reajuste', 'Valor contrato após reajuste', 'Data assinatura', 'Valor Pago', 'Data encerramento do contrato'],
      linhasExemplo: linhasEmBranco(12, 2),
    },
    MODELO_03,
    MODELO_04,
    MODELO_05,
  ],
};

// Itens exigidos apenas "quando a Prestação de Contas for destinada a investimento
// (Obra)" — no PDF original (Instruções 01/2024, Entidades) esses são blocos de texto
// informativo, sem colunas SIM/NÃO/NÃO SE APLICA, por isso não entram na grade de
// itens respondíveis: aparecem como um painel de apoio quando "investimento" é marcado.
export const ITENS_INVESTIMENTO_OBRA: { titulo: string; itens: string[] }[] = [
  {
    titulo: 'Documentos técnicos da obra (Lei nº 14.133/2021)',
    itens: [
      'Memorial descritivo e justificativo da obra',
      'Plantas, cortes e elevações (quando aplicável)',
      'Especificações técnicas dos materiais e serviços',
      'Cronograma físico-financeiro',
      'Orçamento detalhado com planilhas de custos',
      'Anotação de Responsabilidade Técnica (ART ou RRT)',
    ],
  },
  {
    titulo: 'Estimativa de custos e fontes de recursos',
    itens: [
      'Planilha orçamentária detalhada (materiais, mão de obra, equipamentos)',
      'Composição de custos unitários',
      'Indicação da fonte de recursos (dotação orçamentária, convênio, contrato de gestão etc.)',
      'Comparativo com preços de mercado (ex.: SINAPI, SICRO, TCESP)',
    ],
  },
  {
    titulo: 'Estudos complementares (quando aplicável)',
    itens: [
      'Estudo de Viabilidade Técnica e Econômica (EVTEA)',
      'Laudo de vistoria e diagnóstico do local',
      'Relatório de impacto ambiental (EIA/RIMA, se aplicável)',
      'Levantamento topográfico, sondagens, relatórios de solo e fundação',
    ],
  },
  {
    titulo: 'Documentos jurídicos e administrativos',
    itens: [
      'Cadastro e regularidade fiscal da empresa (CNPJ, certidões, balanço)',
      'Comprovação de capacidade técnica (atestados de execução de obras semelhantes)',
      'Registro ou autorização no CREA/CAU',
      'Declarações exigidas por lei (idoneidade, ausência de impedimentos etc.)',
    ],
  },
  {
    titulo: 'Parecer ou aprovação interna (antes da contratação)',
    itens: [
      'Parecer técnico do setor de engenharia ou infraestrutura',
      'Parecer jurídico sobre a legalidade',
      'Autorização da autoridade competente (assinatura do gestor público ou responsável legal)',
      'Quando for reforma ou ampliação: termo de vistoria e aprovação da área usuária',
    ],
  },
];
