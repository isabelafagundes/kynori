# Plano — Onboarding guiado (variante F)

Canvas de referência: `tmp/canvas-onboarding` (seção **F · Jornada final**).

A jornada tem duas fases:

- **Fase de perguntas** — wizard de 3 etapas, telas novas e isoladas.
- **Fase prática** — 8 balões de tutorial sobrepostos às telas que já existem.

Princípio que atravessa tudo: **o app não prescreve treino**. Nenhuma etapa
sugere exercício, divisão ou carga. O tutorial ensina onde ficam as coisas
enquanto a pessoa monta o conteúdo dela.

---

## Pontos levantados na revisão

### 1. F4 ("Agora a parte prática") como terceira etapa do wizard

**Resolvido no canvas.** A tela ganhou o `TopoWizard` e a barra segmentada
passou a ter 3 segmentos: perfil → meta semanal → contrato do tutorial.

Antes ela flutuava sem chrome, o que a fazia parecer um interstício de
propaganda. Como etapa 3 ela fecha a fase de perguntas e o "Bora, me mostra"
vira a transição explícita entre as duas fases.

**Custo:** nenhum além do que já está no plano de implementação abaixo.

### 2. A saudação "Boa tarde, Isabela" não existe no app

**Confirmado.** Busca por `Boa tarde|Bom dia|Boa noite|saudacao` no `src/`
não retorna nada. Hoje nome e avatar aparecem em exatamente dois lugares,
ambos em [CabecalhoApp.tsx](src/interface/widget/cabecalho/CabecalhoApp.tsx):

- o botão de avatar no canto superior direito (linha 207–228);
- o cabeçalho do drawer de preferências (linha 255–268).

A prévia do F2 mostrava um destino fictício — pior que não ter prévia, porque
promete uma tela que não existe.

**Feito agora:** a prévia do F2 passou a reproduzir o `CabecalhoApp` real
(marca + título da tela + botão de avatar com o ponto de notificação), com a
legenda "É assim que seu avatar aparece no app". A prévia voltou a ser honesta
sem exigir mudança de produto.

**Decisão em aberto (não implementada):** adicionar uma saudação de verdade na
Home. É a opção mais bonita e recupera o card original do canvas, mas mexe no
topo da `HomePage`, que acabou de ser redesenhada (2 colunas no desktop,
"Sua evolução"). Fica como item separado:

- **Onde:** topo da `HomePage`, acima de "Seu próximo treino".
- **O quê:** avatar + "Bom dia/Boa tarde/Boa noite," + nome, derivado de
  `new Date().getHours()`.
- **Cuidado:** a `HomePage` já recebe `usuario`? Não — hoje ela recebe
  `programas`, `fichas`, `historico`. Precisaria passar `usuario` via
  `HomeRota` em [RotasApp.tsx](src/interface/rota/RotasApp.tsx).
- **Cuidado 2:** no desktop a `HomePage` divide em 2 colunas; a saudação
  precisa ficar fora do grid pra não desalinhar.

Enquanto essa decisão não é tomada, a prévia do F2 fica como está e nenhum
mock do canvas com saudação deve virar código.

### 3. Meta semanal precisa adaptar a visualização do streak

**Confirmado.** [StripSemanal.tsx:80](src/interface/widget/calendario/StripSemanal.tsx:80)
tem `{treinosSemana}/7` com o 7 fixo no JSX. Duas questões, não uma:

**(a) O denominador.** Hoje é 7 (dias da semana). Com meta, vira o número
escolhido. A prévia do F3 já mostra os dois estados lado a lado.

**(b) A janela de contagem.** `treinosSemana` conta os **últimos 7 dias
corridos** (loop de `indice` 0..6 a partir de hoje), não a semana
calendário. Isso já é uma inconsistência hoje: o texto diz "esta semana" mas
mede uma janela deslizante. Com uma meta explícita a diferença fica visível —
a pessoa vai conferir o número. A `EstatisticasPage` usa
`construirDadosFrequencia` e `calcularTreinosNoMes` de
[estatisticas/utils.ts](src/interface/page/area-logada/estatisticas/utils.ts),
que precisam ser conferidos pra não divergir do strip.

**Recomendação:** trocar para semana calendário (segunda a domingo) junto com
a meta, e alinhar `StripSemanal` com as funções de `estatisticas/utils.ts`.
Vale um teste, porque a virada de semana é exatamente o tipo de coisa que
quebra em silêncio.

**Consequência de escopo:** a meta semanal (F3) só faz sentido depois disso.
Ela **não entra** na primeira leva de implementação — o campo é gravado, mas
a tela do wizard fica desligada até o strip saber consumi-lo.

---

## Implementação

### Etapa 1 — Fundação (feito nesta leva)

1. `Usuario` ganha `metaSemanal?: number` em [usuario.ts](src/domain/usuario.ts);
   `UsuarioManager.definirUsuario` e `carregar` passam a persistir o campo.
   Opcional no tipo, pra não invalidar perfis já salvos nem o snapshot.
2. Novo widget `PassosWizard` — a barra segmentada, compartilhada pelas 3 etapas.
3. Novas telas em `src/interface/page/onboarding/`:
   - `BoasVindasPage` (F1)
   - `PerfilPage` (F2) — envolve o `FormularioPerfil` existente no chrome do
     wizard e mostra a prévia do cabeçalho
   - `MetaSemanalPage` (F3)
   - `ContratoTutorialPage` (F4)
4. `OnboardingUsuarioPage` vira o orquestrador das etapas (estado local de
   passo, sem rota nova), preservando a assinatura `aoConcluir` que
   `RotasApp` já usa.

### Etapa 2 — Streak com meta ✅ feito

5. `StripSemanal` recebe `metaSemanal` e troca o denominador (`?? 7` quando
   não há meta, preservando perfis antigos). Ao atingir a meta, o número
   destaca e aparece "meta batida 🎯".
6. Nova `contarDiasComTreinoNaSemana` em `estatisticas/utils.ts`, usando o
   mesmo `inicioDaSemana` (segunda) do volume semanal — agora exportado, junto
   com `toISODate`. O `StripSemanal` deixou de ter cópia local do helper.
7. 5 testes cobrindo âncora na segunda, domingo pertencendo à semana anterior,
   virada de semana zerando, dias vs sessões e dias futuros.
8. Meta ligada da ponta a ponta: `RotasApp` → `HomePage` → `StripSemanal`.

**Decisão registrada:** semana calendário (seg–dom), não janela deslizante.

Ainda duplicado (não bloqueia): o `StripSemanal` calcula o streak com loop
próprio em vez de usar `calcularStreakAtual`. As regras coincidem hoje; unificar
exigiria passar `historico` em vez de `DadosFrequencia`.

### Etapa 3 — Tutorial sobreposto (fundação feita)

Feito: `domain/tutorial.ts` (passos), `tutorial.state.ts` (persistência),
`TutorialProvider` (registro de alvos + avanço), `OverlayTutorial` (recorte
escuro), os 10 alvos marcados nas telas reais e a ligação com o wizard.

**São 8 passos numerados, não 7.** Saiu o "salvar o programa" (Etapa 2.5) e
entrou "montar treino": o `EditorFichaPage` real monta os itens numa tela
dedicada empilhada, coisa que o canvas não previa.

Duas decisões de implementação que o código não explica sozinho:

- **`pointer-events-none` no contêiner do overlay** é o que faz o buraco
  existir de verdade. As quatro faixas escuras e o balão reativam o evento por
  conta própria. Sem isso o alvo aparece destacado mas não recebe o toque.
- **`avancaComProximoAlvo` por passo.** A regra óbvia — "o alvo atual sumiu,
  então avance" — não funciona: os editores entram como drawer e a tela de
  fundo continua montada. A regra passou a ser "o alvo do próximo passo
  apareceu", válida só nos passos que levam a outra tela; onde os dois alvos
  convivem na mesma tela, só o botão do balão avança.

Falta: **card de retomada na home** (artboard E4). Hoje quem sai pelo "Sair do
tutorial" não tem como voltar. Exige distinguir "saiu no meio" de "concluiu" —
sugestão: um campo `dispensado` no estado, com o card aparecendo quando
`concluido && passo < último`.

### Etapa 3 — pendências originais

9. ~~Escolher o tratamento visual~~ — **decidido: E1, recorte escuro.**
   (A recomendação era E2 por causa da paleta creme; a escolha foi E1 pelo
   foco maior. Registrado aqui só para não reabrir a discussão.)
10. Máquina de estado do tutorial: passo atual, alvo, persistência (a pessoa
    fecha o app no meio), retomada (artboard E4).
11. Ancoragem: cada alvo precisa expor uma ref. O overlay tem que sobreviver à
    navegação entre páginas **e** aos drawers (`EditorProgramaPage` e
    `EditorFichaPage` são `fixed` com z-index alto — o overlay precisa ficar
    acima sem bloquear o toque no alvo).
12. Card de retomada na Home.

### Etapa 2.5 — Remover o degrau do "Salvar" ✅ feito

O passo **F7 (Salvar)** existe só porque `EditorProgramaPage` exige salvar o
programa antes de liberar "Nova ficha". O modal "Nova Ficha" da própria tela já
persiste o programa em silêncio quando não há id
([EditorProgramaPage.tsx:412-423](src/interface/page/area-logada/gerenciar/EditorProgramaPage.tsx:412)).

**Feito.** A lógica virou um helper único, `garantirProgramaPersistido()`, usado
pelos dois caminhos do modal. A seção "Fichas do programa" não depende mais de
o programa estar salvo: "Nova ficha" aparece desde o começo e o estado vazio é
sempre "Nenhuma ficha ainda". O texto "Salve o programa para começar a montar
as fichas" e o botão duplicado "Criar nova ficha" saíram.

Dois defeitos latentes fechados junto, ambos no caminho "Adicionar ficha
existente", que criava o programa sem navegar:

- o efeito de recarga caía no ramo "novo programa" e **reescrevia o toggle de
  ativo** por baixo do formulário (o programa recém-criado passava a ser o
  ativo, então `!obterProgramaAtivo()` virava `false`);
- o `baseline` não era reajustado, então sair da tela pedia "descartar
  alterações?" para dados que já estavam salvos.

O helper sempre navega com `substituir`, fazendo `programaId` virar a fonte da
verdade, e reajusta o `baseline`.

**Consequência para a Etapa 3:** a fase prática cai de 8 para 7 balões. O passo
F7 (Salvar) deixa de existir e os balões F8–F14 sobem uma posição.
