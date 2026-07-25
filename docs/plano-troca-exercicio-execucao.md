# Plano — troca transacional de exercício durante o treino

## 1. Objetivo

Permitir que a pessoa substitua um exercício de musculação somente na sessão em andamento, sem alterar a ficha nem os próximos treinos.

Exemplo:

- planejado na ficha: **remada curvada**;
- executado hoje: **remada baixa**;
- próxima execução da ficha: volta a mostrar **remada curvada**.

A troca precisa permanecer recuperável se o aplicativo for fechado durante o treino e deve alimentar histórico, progressão e estatísticas pelo exercício realmente executado.

## 2. Decisões de produto para o MVP

### 2.1. Escopo

- A troca vale apenas para itens de musculação; cardio fica fora deste MVP.
- A ficha original nunca é modificada por esse fluxo.
- Não será exibida a opção “alterar os próximos treinos”. Uma mudança permanente continua pertencendo ao editor da ficha.
- A prescrição do item é mantida: quantidade de séries, repetições sugeridas, uso de carga e descanso continuam sendo os configurados na ficha.
- O exercício escolhido precisa existir no catálogo atual, incluindo exercícios customizados.

### 2.2. Momento permitido

- A troca fica disponível enquanto nenhuma série do item tiver sido concluída.
- Se carga, repetições ou nota já tiverem sido editadas, mas nenhuma série tiver sido concluída, a interface pede confirmação e informa que esses dados serão reiniciados.
- Depois da primeira série concluída, a troca fica bloqueada no MVP. Isso evita atribuir à substituição séries que foram feitas no exercício planejado.
- Uma troca parcial depois de iniciar o exercício exigiria registrar dois exercícios para o mesmo item da ficha e fica como evolução futura.

### 2.3. Exercícios disponíveis

- Excluir o exercício atualmente exibido.
- Excluir exercícios que já estejam presentes em outro item da sessão, evitando duplicidade no mesmo registro e ambiguidades nos cálculos atuais.
- Abrir o seletor priorizando o mesmo grupo muscular do exercício planejado.
- Permitir remover o filtro e pesquisar em todo o catálogo.
- No modelo atual, o catálogo possui somente nome e grupo muscular. Sugestões por equipamento ou padrão de movimento exigem novos metadados e não fazem parte deste MVP.

## 3. Experiência de uso

### 3.1. Entrada da ação

Na tela de execução, incluir uma ação secundária `Trocar exercício` junto ao bloco do título/subtítulo do exercício. Ela deve ter menos destaque do que concluir série, avançar ou finalizar treino.

Em telas estreitas, a ação pode ficar abaixo do subtítulo. Em telas maiores, pode ficar alinhada à direita do título. O alvo de toque deve ter pelo menos 44 px e um rótulo acessível explícito.

### 3.2. Seletor

Abrir um bottom sheet/overlay com:

1. título `Trocar exercício`;
2. identificação do exercício atual;
3. busca textual;
4. filtros de grupo muscular, iniciando no grupo atual;
5. lista de alternativas;
6. texto persistente `A troca vale somente para este treino`.

O seletor deve reutilizar a lógica de busca e agrupamento já presente em `PickerExercicios`, mas com textos e ícone de seleção próprios. A opção preferível é extrair a parte genérica para um seletor reutilizável, em vez de acoplar a execução ao conceito de “adicionar à ficha”.

### 3.3. Depois da troca

- Atualizar imediatamente nome, grupo muscular, mapa muscular, histórico anterior e gráfico para o exercício executado.
- Mostrar abaixo do título um indicador discreto: `Substitui Remada curvada somente hoje`.
- Trocar a ação para `Trocar novamente` e oferecer `Restaurar planejado` enquanto nenhuma série tiver sido concluída.
- Reiniciar o timer de descanso.
- Manter séries e repetições da prescrição, mas zerar carga, séries concluídas e nota para não transportar dados entre exercícios.
- A navegação por chips e pelo rail deve exibir o nome do exercício executado.

### 3.4. Histórico

No detalhe do treino finalizado:

- usar como título o exercício executado;
- quando houver substituição, mostrar `Planejado: Remada curvada` em texto secundário;
- abrir gráfico e progressão pelo exercício executado.

O resumo e o compartilhamento continuam apresentando o que foi realmente feito. A indicação da substituição no card compartilhável pode ser adicionada depois, sem bloquear o MVP.

## 4. Modelo de dados

### 4.1. Registro histórico

Manter `exercicioId` com a semântica de **exercício executado**, preservando o funcionamento dos cálculos atuais. Adicionar o campo opcional abaixo:

```ts
export interface RegistroExercicio {
  exercicioId: string;             // executado
  exercicioPlanejadoId?: string;   // preenchido somente quando diferente
  series: RegistroSerie[];
  nota: string;
}
```

Consequências:

- registros antigos continuam compatíveis, pois o novo campo é opcional;
- progressão, volume e estatísticas permanecem atribuídos ao exercício executado;
- o histórico consegue explicar a diferença entre plano e execução;
- backups portáteis continuam compatíveis por serem serializados como JSON.

### 4.2. Sessão ativa

Adicionar à representação do item de exercício:

```ts
interface SessaoExercicio {
  exercicioId: string;            // executado no momento
  exercicioPlanejadoId: string;   // imutável durante a sessão
  // estado atual de séries, nota, conclusão e visita
}
```

Na criação da sessão, os dois IDs começam iguais. A ação de troca altera apenas `exercicioId`. Na finalização, `exercicioPlanejadoId` só é copiado para `RegistroExercicio` quando for diferente do executado.

### 4.3. Snapshot da sessão

- Evoluir `SessaoItemSalvo` para persistir `exercicioPlanejadoId`.
- Subir `VERSAO_SESSAO_SALVA` de 2 para 3.
- Migrar snapshots v2 compatíveis inferindo o planejado a partir do item correspondente da ficha. Isso evita perder um treino em andamento após a atualização.
- Validar na restauração que o ID planejado continua correspondendo ao item da ficha; o ID executado pode ser diferente quando existir uma troca.

## 5. Regra de troca no estado da sessão

Adicionar ao `useSessaoTreino` uma ação semelhante a:

```ts
trocarExercicio(indiceItem: number, novoExercicioId: string): ResultadoTroca
```

Responsabilidades:

1. validar que o índice aponta para um exercício;
2. rejeitar ID vazio, igual ao atual ou já usado em outro item da sessão;
3. bloquear quando houver série concluída;
4. atualizar somente o exercício executado;
5. recriar as séries a partir da configuração da ficha, com carga zero;
6. limpar nota e conclusões;
7. manter o item como visitado;
8. deixar o snapshot persistir a alteração pelo mecanismo de debounce existente.

Adicionar também `restaurarExercicioPlanejado(indiceItem)` usando as mesmas regras de reinicialização.

O hook deve retornar um resultado explícito (`trocado`, `requerConfirmacao`, `jaIniciado`, `duplicado` ou `invalido`) para a interface decidir entre confirmar, informar ou fechar o overlay sem duplicar regra de negócio na página.

## 6. Arquivos afetados

| Arquivo | Alteração planejada |
|---|---|
| `src/domain/tipos.ts` | Adicionar `exercicioPlanejadoId?` a `RegistroExercicio`. |
| `src/application/state/sessao-ativa.ts` | Persistir o ID planejado e migrar snapshot v2 para v3. |
| `src/interface/page/area-logada/execucao/hooks/useSessaoTreino.ts` | Modelar planejado versus executado e implementar troca/restauração. |
| `src/interface/page/area-logada/execucao/ExecucaoTreinoPage.tsx` | Abrir o seletor, exibir o indicador de substituição, reiniciar timer e integrar o interceptador de voltar. |
| `src/interface/page/area-logada/execucao/OverlayTrocarExercicio.tsx` | Novo overlay responsivo de seleção e confirmação. |
| `src/interface/widget/formulario/PickerExercicios.tsx` | Extrair/reutilizar busca, filtros e agrupamento sem textos específicos de “adicionar”. |
| `src/interface/page/area-logada/historico/DetalheHistoricoPage.tsx` | Mostrar exercício executado e referência ao planejado. |
| `src/interface/page/area-logada/execucao/hooks/useSessaoTreino.test.ts` | Cobrir regras, persistência, migração e finalização. |
| `src/interface/page/area-logada/historico/DetalheHistoricoPage.test.tsx` | Cobrir a indicação visual da substituição. |
| `src/interface/page/area-logada/estatisticas/utils.test.ts` | Garantir que a progressão seja atribuída ao executado, não ao planejado. |

Não é necessário alterar `pezzo.state.ts` ou `state-manager.repo.ts`: o registro continua entrando pelo mesmo método e o novo campo será preservado pelo spread/JSON existentes.

## 7. Ordem de implementação

### Etapa 1 — domínio e persistência

1. adicionar o campo opcional ao registro;
2. separar IDs planejado e executado na sessão;
3. criar migração v2 → v3 do snapshot;
4. cobrir restauração e serialização com testes.

### Etapa 2 — regra transacional

1. implementar troca e restauração no hook;
2. impedir troca depois de série concluída;
3. impedir duplicidade na sessão;
4. reinicializar dados específicos do exercício;
5. garantir que `finalizar()` grave os dois IDs corretamente.

### Etapa 3 — interface da execução

1. extrair o seletor reutilizável;
2. criar o overlay de troca;
3. adicionar a ação próxima ao título;
4. incluir confirmação quando houver dados editados;
5. exibir o indicador da substituição;
6. tratar voltar físico/navegador fechando primeiro o novo overlay;
7. reiniciar timer após a troca.

### Etapa 4 — histórico e indicadores

1. mostrar o planejado no detalhe do histórico;
2. validar resultado final e compartilhamento com o exercício executado;
3. executar testes de estatísticas e progressão para prevenir atribuição incorreta.

### Etapa 5 — validação final

1. executar `npm test`;
2. executar `npm run lint`;
3. executar `npm run build`;
4. validar manualmente em viewport mobile e desktop;
5. validar fechamento e restauração da sessão no navegador e no Capacitor.

## 8. Cenários de teste essenciais

1. Trocar um exercício intacto atualiza a tela, mas não altera `ficha.itens`.
2. Fechar e reabrir o app restaura a substituição.
3. Finalizar grava `exercicioId` como executado e `exercicioPlanejadoId` como original.
4. Uma sessão sem troca não grava campo redundante.
5. Registros antigos sem `exercicioPlanejadoId` continuam abrindo normalmente.
6. Snapshot v2 é migrado sem perder séries já registradas.
7. Troca com valores editados exige confirmação e reinicia os valores.
8. Troca depois de uma série concluída é bloqueada sem perder dados.
9. Um exercício já usado em outro item da sessão não pode ser escolhido.
10. Histórico mostra `Planejado: ...`, mas gráfico, volume e evolução usam o executado.
11. Restaurar o planejado antes de iniciar remove a marca de substituição.
12. A ficha e as próximas execuções permanecem inalteradas.

## 9. Critérios de aceite

- A pessoa consegue trocar o exercício em até três ações: abrir, escolher e confirmar quando necessário.
- A interface comunica claramente que a troca vale somente para o treino atual.
- Nenhuma operação do fluxo chama atualização da ficha.
- A substituição sobrevive à recuperação da sessão ativa.
- Histórico e estatísticas usam o exercício executado.
- O exercício planejado continua auditável no detalhe do treino.
- Não ocorre perda silenciosa ou reatribuição de séries já concluídas.
- Testes, lint e build passam.

## 10. Evoluções posteriores

- sugestões por equipamento, padrão de movimento e músculos secundários;
- registro de motivo da troca, como `equipamento ocupado`;
- substituição parcial depois de algumas séries, gerando dois registros executados para um item planejado;
- recomendação baseada nas trocas mais frequentes do usuário;
- ação explícita e separada para transformar uma troca recorrente em alteração permanente da ficha.
