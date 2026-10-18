# Testes

Duas suítes, com papéis diferentes.

## Unitários e de componente (Vitest)

```bash
npm test          # roda uma vez
npm run test:watch
```

Cobrem lógica de domínio/aplicação (`pezzo.state`, snapshot, progressão, resumo),
utilitários (número BR, data local, estatísticas) e alguns componentes com
Testing Library. É onde regra de negócio e caso de borda devem ser fixados —
sai barato e falha apontando a linha.

## Ponta a ponta (Playwright)

```bash
npm run test:e2e           # suíte inteira
npm run test:e2e:ui        # modo interativo, bom pra depurar
npm run test:e2e:report    # abre o último relatório HTML
npm run test:tudo          # unitários + e2e
```

Rodam contra o app web servido pelo Vite — o mesmo bundle que o Capacitor
empacota na WebView.

### Como um teste começa no cenário certo

Na web o app persiste tudo em `localStorage` com as chaves de
`src/constants.ts`. A fixture de `e2e/apoio/teste.ts` escreve nessas chaves
antes do primeiro script rodar, então um teste pode começar já com usuário,
programa, ficha e até um treino pela metade:

```ts
test.use({ semearEstado: { usuario: null } });   // cai no onboarding
test.use({ semearEstado: { sessaoAtiva: {...} } }); // treino em andamento
```

A semeadura acontece **uma vez por contexto** (marca no `sessionStorage`): sem
isso, um `page.reload()` dentro do teste desfaria o que ele acabou de fazer.

### Detalhes que economizam tempo

- **O DOM tem mobile e desktop ao mesmo tempo**, escondidos por CSS. Quase todo
  papel aparece duplicado — use o helper `visivel()` em vez de `.first()` às
  cegas.
- **Itens de menu são `role="menuitem"`**, não `button` (`MenuAcoes.tsx`).
- **A sessão de treino grava com debounce de 400ms.** Antes de recarregar a
  página num teste, espere o snapshot aparecer (`expect.poll`).
- **O dev server compila sob demanda.** O `globalSetup` de `e2e/apoio/aquecer.ts`
  visita as telas principais antes da suíte; sem ele, os workers competem pela
  mesma compilação e o resultado é timeout intermitente.

## O que os testes NÃO cobrem

Antes de subir para a Play Store, isto continua sendo verificação manual no
aparelho — o Playwright roda no Chromium, não na WebView do Android com os
plugins nativos:

- haptics (vibração), notificações locais e agendamento de descanso;
- share nativo do card de resultado e escrita de arquivo (backup/restore);
- safe area (status bar / nav bar) em telas com recorte;
- ciclo de vida do Android: app em segundo plano, morto pelo sistema, reaberto;
- permissões, ícone, splash e o fluxo de instalação pela loja.
