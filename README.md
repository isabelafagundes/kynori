# Kynori

> **Movimento que vira progresso.**

Kynori é um aplicativo de treino para organizar rotinas, acompanhar sessões de musculação e cardio e tornar a evolução visível. A experiência foi pensada para que o usuário saiba o que fazer, registre cada treino com o mínimo de atrito e mantenha a constância ao longo do tempo.

Mais do que contar séries ou cargas, Kynori conecta programas, fichas, histórico, progressão e estatísticas para transformar cada movimento em um próximo passo.

## A marca

**Kynori** é um nome inventado para transmitir movimento, constância e evolução.

A primeira parte, **Kyn-**, foi inspirada em *kínēsis*, palavra grega que significa “movimento” ou “ação de se mover” e que também está na origem de termos como *cinética* e *cinesiologia*. O verbo grego relacionado, *kinein*, significa “mover” ou “colocar em movimento”. A terminação **-ori** não possui um significado grego específico: ela foi criada para dar ao nome uma sonoridade fluida, acolhedora, memorável e compatível com uma marca global.

Conceitualmente, Kynori representa:

> **Movimento que se transforma em evolução.**

Essa ideia acompanha toda a jornada proposta pelo aplicativo:

**movimentar → registrar → manter constância → progredir**

A identidade visual reforça o conceito ao unir a letra **K**, uma pessoa em movimento, curvas que sugerem fluidez e continuidade e formas direcionadas para a frente, representando progresso.

## Propósito

Kynori existe para ajudar pessoas a manter uma rotina de treino consistente sem transformar a experiência em um painel complexo. O aplicativo prioriza clareza, agilidade e progressão prática:

- indicar qual ficha executar dentro do programa ativo;
- registrar séries, repetições, cargas, descanso, notas e cardio durante a sessão;
- apresentar o histórico e a progressão de cada exercício;
- manter programas e fichas reutilizáveis, editáveis e fáceis de copiar;
- reforçar a frequência e a sequência de treinos de forma discreta.

## Experiência

Kynori tem um tom calmo, direto e determinado. Em vez da linguagem exagerada comum em aplicativos fitness, oferece uma experiência limpa, acolhedora e focada.

A interface mobile-first se inspira em produtos de produtividade: hierarquia visual simples, ações claras, microinterações contidas e elementos de personalidade usados para orientar o usuário. Kynori deve parecer um parceiro de rotina — não um treinador gritando metas.

## Funcionalidades

### Programas e fichas

- criar, editar, copiar, ativar e excluir programas de treino;
- manter um único programa ativo por vez;
- criar, editar, copiar e excluir fichas;
- vincular uma ou mais fichas a programas;
- reutilizar fichas em diferentes programas;
- cadastrar exercícios personalizados além da biblioteca padrão;
- configurar exercícios, séries, repetições, cargas e intervalos de descanso;
- adicionar cardio opcional com tipo, duração e observações.

### Execução do treino

- registrar séries, repetições e cargas durante a sessão;
- adicionar ou remover séries sem interromper o treino;
- acompanhar o intervalo com um timer de descanso por exercício;
- registrar notas por exercício e por atividade de cardio;
- salvar data, início, término, exercícios e cardio ao finalizar;
- receber feedbacks discretos de conclusão, celebração e ações que podem ser desfeitas.

### Histórico e evolução

- consultar os treinos realizados e seus detalhes;
- acompanhar a progressão por exercício com base em sessões anteriores;
- visualizar estatísticas de frequência e evolução;
- acompanhar a sequência de treinos e a atividade semanal;
- exportar e importar backups dos dados.

## Tecnologias

- **React 19** para a interface e os fluxos de tela;
- **TypeScript** para tipar o domínio, o estado e os componentes;
- **Vite** para desenvolvimento e build;
- **Tailwind CSS 4** para estilos e tokens visuais;
- **React Router DOM 7** para navegação;
- **Capacitor 7** para os aplicativos Android e iOS e integrações nativas;
- **Capacitor Preferences e Filesystem** para persistência local e backups;
- **Capacitor Haptics, Local Notifications, Keyboard, Safe Area, Share e Splash Screen** para a experiência mobile;
- **Vitest e Testing Library** para testes unitários e de comportamento;
- **ESLint** para análise estática e padronização do código.

## Arquitetura

O código é organizado em camadas para manter regras de negócio, estado, infraestrutura e interface separados:

```text
src/
├── domain/          # Modelos e tipos centrais
├── application/     # Estado global e serviços da aplicação
├── infrastructure/  # Persistência, backups e integrações nativas
└── interface/       # Páginas, rotas, componentes e utilitários visuais
```

Essa separação permite evoluir a interface, substituir fontes de dados e adicionar integrações sem espalhar regras de negócio pelas telas.

## Como executar

### Pré-requisitos

- Node.js compatível com o projeto;
- npm;
- Android Studio ou Xcode para executar as versões nativas.

### Ambiente de desenvolvimento

```bash
npm install
npm run dev
```

### Qualidade e build

```bash
npm run lint
npm test
npm run build
```

### Aplicativos nativos

```bash
npm run cap:sync
npm run cap:open:android
npm run cap:open:ios
```

## Direção de produto

Kynori privilegia a rotina real: treinos mudam, cargas variam, fichas são copiadas, exercícios são adaptados e nem todo dia precisa se transformar em uma análise profunda. A experiência deve continuar leve mesmo quando o histórico cresce.

O sucesso de Kynori não é fazer o usuário passar mais tempo no aplicativo. É ajudá-lo a treinar melhor, registrar o necessário e seguir em movimento.

---

**Kynori** é um nome inspirado em *kínēsis*, palavra grega relacionada a movimento. A marca representa a evolução construída treino após treino: cada série registrada, cada carga superada e cada passo dado com constância. Sua identidade une movimento, leveza e progresso em uma experiência simples e acolhedora.

Referência etimológica: [Kinesis — Etymology, Origin & Meaning](https://www.etymonline.com/word/kinesis).
