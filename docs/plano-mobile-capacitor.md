# Plano — Versão Mobile (Capacitor)

## Objetivo
Empacotar o Trainify atual (React 19 + Vite + Tailwind) como app nativo **iOS e Android** usando **Capacitor**, sem reescrever a UI. Mesma base de código serve:
- **v1:** app mobile para alunos (foco atual).
- **futuro:** web desktop para professores de academia (mesmo build, só adaptando layouts em breakpoints maiores).

## Por que Capacitor (vs React Native)
- Reaproveita **100% do código atual** — só embrulha o build do Vite num WebView nativo.
- Setup inicial: ~1 dia (vs ~3–4 semanas para reescrever em RN).
- Uma única UI para manter — features novas saem para mobile e desktop de uma vez.
- Atualizações de JS/CSS são instantâneas via deploy web; só precisa rebuild nativo quando muda plugin.
- Plugins nativos disponíveis para o que importa: storage, haptics, notificações, share, splash.

---

## Fase 0 — Decisões prévias

| Decisão | Recomendado |
|---|---|
| Capacitor | **v7** (última stable) |
| Storage | **`@capacitor/preferences`** (substitui `localStorage`) |
| Haptics | **`@capacitor/haptics`** |
| Notificações | **`@capacitor/local-notifications`** (lembrete de treino) |
| Splash/ícone | **`@capacitor/splash-screen`** + `@capacitor/assets` para gerar todos os tamanhos |
| Status bar | **`@capacitor/status-bar`** (cor combinando com tema) |
| Safe area | CSS `env(safe-area-inset-*)` |
| Build/distribuição | Xcode + Android Studio local; **Ionic Appflow** ou GitHub Actions para CI |
| OTA updates | **[`@capgo/capacitor-updater`](https://capgo.app/)** (open-source / cloud; plugs into the CI you already use) — or custom. Avoid new Appflow Live Updates projects (commercial wind-down; existing customers through Dec 31, 2027). |

---

## Fase 1 — Bootstrap do Capacitor (1 dia)

1. **Instalar Capacitor** no projeto atual:
   ```bash
   npm i @capacitor/core @capacitor/cli
   npx cap init Trainify com.trainify.app --web-dir=dist
   ```
2. **Configurar `capacitor.config.ts`**:
   - `webDir: 'dist'`
   - `server.androidScheme: 'https'`
   - `backgroundColor` combinando com tema (creme `#f5f1ea` ou preto, conforme `tema.state`)
3. **Adicionar plataformas**:
   ```bash
   npm i @capacitor/ios @capacitor/android
   npx cap add ios
   npx cap add android
   ```
4. **Primeiro build de validação**:
   ```bash
   npm run build && npx cap sync && npx cap open ios
   ```
5. Rodar no simulador iOS e emulador Android. Confirmar que o app abre e o tema/fontes carregam.

**Critério de saída:** app abre no simulador exibindo a `HomePage` igualzinha à versão web.

---

## Fase 2 — Adaptações no código web (2–3 dias)

Mudanças que precisam acontecer no `src/` atual para o app ficar "nativo de verdade". Tudo continua funcionando no navegador.

### 2.1 Substituir `localStorage` por storage assíncrono

`localStorage` funciona dentro do WebView, **mas** o iOS pode limpar dados de WebView agressivamente (storage não-persistente). Solução: abstrair via interface e usar `@capacitor/preferences` no app.

- Criar `src/infrastructure/service/armazenamento.service.ts` com interface `Armazenamento` (`obter`, `definir`, `remover`).
- Implementação web: usa `localStorage` (síncrono → embrulhar em Promise).
- Implementação Capacitor: usa `Preferences` (já é Promise).
- Detectar plataforma com `Capacitor.isNativePlatform()` e escolher implementação no `app.module.ts`.
- Atualizar `tema.state.ts` e `trainify.state.ts` para consumir a interface (vão ficar async no boot — adicionar estado inicial de loading).

### 2.2 Safe areas

Adicionar no `src/index.css`:
```css
:root {
  --safe-top: env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom);
}
```
Aplicar nos componentes de borda: `CabecalhoApp` (padding-top), `NavegacaoInferior` (padding-bottom). Já existe `max-width: 480px` — basta acrescentar safe areas.

### 2.3 Viewport e meta tags

No `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
```

### 2.4 Status bar dinâmica

No `tema.state.ts`, quando o tema muda (claro/escuro), atualizar status bar via `@capacitor/status-bar`:
```ts
import { StatusBar, Style } from '@capacitor/status-bar';
if (Capacitor.isNativePlatform()) {
  await StatusBar.setStyle({ style: ehEscuro ? Style.Dark : Style.Light });
}
```

### 2.5 Comportamentos de WebView a desativar

- **Bounce/overscroll**: `overscroll-behavior: none` no `body`.
- **Long-press selection** nos botões: `user-select: none` em `Pressable`/botão.
- **Tap highlight cinza** do Android: `-webkit-tap-highlight-color: transparent`.

**Critério de saída:** app no simulador comporta-se sem bugs visuais de WebView, com áreas seguras corretas e tema/status bar alinhados.

---

## Fase 3 — Recursos nativos (2–3 dias)

Aproveitar plugins onde já existe lógica equivalente no app web. Tudo via abstração para não vazar Capacitor nos componentes.

### 3.1 Haptics
Onde já existe celebração / feedback tátil simulado (`CelebracaoConfetti`, conclusão de série, finalizar treino):
```ts
import { Haptics, ImpactStyle } from '@capacitor/haptics';
await Haptics.impact({ style: ImpactStyle.Medium });
```
Encapsular em `infrastructure/service/feedback-tatil.service.ts` (no-op no web).

### 3.2 Notificações locais
Caso de uso: lembrete diário de treino, "você não treina há 3 dias" (alinhado ao `StreakCounter`).
- Pedir permissão no onboarding ou nas configurações.
- Agendar via `LocalNotifications.schedule({ ... })`.

### 3.3 Splash screen + ícones
- Criar `resources/icon.png` (1024×1024) e `resources/splash.png` (2732×2732) com o ícone do Trainify.
- `npx @capacitor/assets generate` gera todos os tamanhos para iOS e Android automaticamente.
- Configurar duração e cor de fundo do splash em `capacitor.config.ts`.

### 3.4 Compartilhar treino (opcional)
`@capacitor/share` para compartilhar um resumo de treino concluído (texto ou imagem).

---

## Fase 4 — Detalhes de UX mobile (2–3 dias)

Polimento que diferencia "site no celular" de "app de verdade". Tudo em CSS/React, sem código nativo.

- **Transições entre páginas:** se ainda não tem, adicionar slide horizontal ao navegar (`framer-motion` ou transitions CSS).
- **Modais como bottom sheets:** revisar `ModalConfirmacao`, `ModalCopiarFicha`, `ModalCopiarPrograma`, `ModalCriarExercicio` — no mobile devem subir de baixo com handle de arrasto (visual Notion/Linear). Implementação CSS pura ou com `vaul` (compatível com React).
- **Pull-to-refresh:** se houver listas que valha a pena (histórico). Plugin: `@capacitor/pull-to-refresh` ou implementação custom.
- **Teclado iOS:** garantir que inputs não fiquem cobertos. Plugin `@capacitor/keyboard` ajusta automaticamente.
- **Botão voltar do Android:** interceptar com `App.addListener('backButton', ...)` para navegar dentro do app antes de fechar.
- **Loading states** ao invés de telas brancas durante carregamento de storage assíncrono.

---

## Fase 5 — Distribuição (3–5 dias)

### iOS
1. Conta **Apple Developer** (US$ 99/ano).
2. Configurar bundle ID, certificados, provisioning em Xcode.
3. `npx cap open ios` → Archive → upload para App Store Connect.
4. **TestFlight** para beta (até 10k testadores externos).
5. Submeter para review (média 24–48h).

### Android
1. Conta **Google Play Console** (US$ 25 único).
2. Gerar keystore de assinatura (guardar em local seguro — perder = não conseguir mais atualizar o app).
3. `npx cap open android` → Build → Generated Signed Bundle (`.aab`).
4. **Internal testing** para beta.
5. Submeter para produção.

### CI/CD (opcional v1, recomendado v2)
- **GitHub Actions** com Fastlane para automatizar build e upload.
- **Ionic Appflow** only if you already have an account (commercial wind-down). Prefer Capgo live updates with GitHub Actions for new work.

---

## Fase 6 — Desktop para professores (futuro)

Quando o uso por professores for ativado, a base de código já está pronta. Mudanças necessárias:

1. **Remover `max-width: 480px`** em breakpoints `≥ 1024px`.
2. **Layouts em duas/três colunas** para telas largas (ex.: lista de fichas + editor lado a lado).
3. **Atalhos de teclado** para ações comuns (criar ficha, navegar entre exercícios).
4. **Tabelas densas** para visualização de histórico/estatísticas com muitos alunos.
5. **Deploy web separado** (mesmo build, hospedagem em Vercel/Netlify/Cloudflare Pages).

**Importante:** o app empacotado por Capacitor continua sendo só o mobile. O desktop usa o mesmo `dist/` do Vite servido via web — Capacitor não interfere.

---

## Riscos e armadilhas

1. **WebView ≠ Safari/Chrome.** Algumas features modernas (certas APIs Web) podem se comportar diferente. Testar **no device real** cedo, não só no simulador.
2. **iOS apaga storage de WebView** em situações de pressão de armazenamento se usar `localStorage` puro. Por isso a Fase 2.1 (`Preferences`) é obrigatória, não opcional.
3. **Apple Review pode rejeitar** apps que parecem "site embrulhado". Mitigação: ter funcionalidades nativas reais (haptics, notificações, ícone na home, offline básico) e não usar só conteúdo web puro.
4. **Performance de listas longas** em WebView é pior que nativo. Se `HistoricoPage` crescer muito, considerar virtualização (`@tanstack/react-virtual`).
5. **Hot reload no device durante dev** exige `npx cap run ios --livereload --external` — primeira vez tem pegadinhas de rede/IP local.
6. **Plugins nativos exigem rebuild** (`npx cap sync` + rebuild no Xcode/AS). Só código JS/CSS pode ser atualizado sem rebuild.
7. **Chave de assinatura do Android.** Perder = nunca mais atualizar o app. Backup obrigatório em local seguro.

---

## Estimativa

| Fase | Esforço (dev solo) |
|---|---|
| 1. Bootstrap Capacitor | 1 dia |
| 2. Adaptações no código (storage async, safe area, viewport) | 2–3 dias |
| 3. Recursos nativos (haptics, notificações, splash, ícone) | 2–3 dias |
| 4. UX mobile (bottom sheets, transições, teclado, back button) | 2–3 dias |
| 5. Distribuição (contas, certificados, primeira submissão) | 3–5 dias |
| **Total para v1 mobile nas stores** | **~2 semanas** |

Comparação: RN seria ~3–4 semanas só para chegar ao nível atual do web.

---

## Próximos passos imediatos

1. Aprovar a stack (Capacitor v7 + Preferences + Haptics + LocalNotifications).
2. Definir bundle ID (sugestão: `com.trainify.app` ou similar — precisa ser único globalmente).
3. Decidir se já vai contratar Apple Developer agora ou só quando estiver pronto para TestFlight.
4. Começar pela **Fase 1**: instalar Capacitor e gerar primeiro build iOS no simulador.
