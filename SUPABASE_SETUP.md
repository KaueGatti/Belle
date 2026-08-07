# Guia de configuração — Supabase + Login Google (Belle)

Ativa o **armazenamento em nuvem offline-first** do app: os dados continuam
salvos no aparelho (AsyncStorage) e são **espelhados** no Supabase quando você
entra com o Google. Funciona sem internet (offline) e sincroniza quando voltar.

> Tudo é **gratuito** (plano Free do Supabase + Google OAuth sem custo).

---

## O que já está pronto no código

Nenhum código novo é necessário — só **configuração externa**. O app já tem:

- `src/utils/supabase.js` — client do Supabase (aguarda URL + chave anônima).
- `src/context/AuthContext.js` — login com Google + sessão persistida no aparelho.
- `src/context/SyncContext.js` — sincroniza ao logar, ao abrir o app, ao voltar
  ao primeiro plano e após cada mudança (2s de debounce).
- `src/utils/sync.js` — mescla local↔remoto (última escrita vence por
  `updatedAt`), envia mudanças e apaga registros deletados (tombstones).
- `src/screens/SettingsScreen.js` — card **"Conta e sincronização"** com
  Entrar com Google / Sincronizar / Sair.
- `App.js` — polyfill de `crypto` (PKCE) para o login funcionar no APK.

---

## Passo 1 — Criar o projeto no Supabase

1. Acesse https://supabase.com e crie uma conta (pode ser com o Google).
2. Clique em **New project**.
   - Nome: `manicure-app` (ou qualquer um).
   - Database password: anote (é só para o banco, não usado no app).
   - Região: escolha a mais próxima (ex.: South America).
3. Aguarde o projeto ser criado (~1–2 min).
4. No menu **Settings → API** copie:
   - **Project URL** → é o `SUPABASE_URL`
   - **anon public key** → é o `SUPABASE_ANON_KEY`

## Passo 2 — Criar a tabela e as regras (RLS)

1. No menu **SQL Editor** → **New query**.
2. Cole todo o conteúdo do arquivo **`supabase.sql`** (na raiz deste projeto).
3. Clique em **Run**.
4. Confirme no menu **Table Editor** que a tabela `registros` existe.

## Passo 3 — Ativar login com Google

1. No menu **Authentication → Providers → Google**.
2. Clique em **Create new client** (ou "Add new client").
   - Isso abre o **Google Cloud Console** (grátis) e gera o **Client ID** e
     **Client Secret** automaticamente.
   - Siga as etapas que o próprio Supabase abrir; ao final, o console mostra as
     credenciais.
3. Copie o **Client ID** e o **Client Secret** de volta no Supabase
   (campos "Google Client ID" e "Google Client Secret").
4. Salve e **habilite** o provider (toggle **Enable Sign in with Google**).

> Dica: se preferir criar manualmente no Google Cloud Console, crie um
> **OAuth Client ID** do tipo **Web application** — é esse que o fluxo do
> Supabase usa.

## Passo 4 — Permitir o redirect (URLs de retorno)

O login abre uma janela do Google e volta para o app por uma URL. Essa URL
precisa estar na lista de permitidos:

1. No menu **Authentication → URL Configuration → Redirect URLs**.
2. Adicione:
   - Para o **APK** (Android): `manicureapp://`
   - Para o **Expo Go** (teste): o link `exp://…` que o Expo mostrar ao rodar
     `npx expo start`. O padrão é `exp://<seu-ip>:8081/--/`.

> Se usar o Expo Go, o redirect muda de IP conforme a rede. No APK o redirect é
> sempre `manicureapp://`, então funciona em qualquer aparelho.

## Passo 5 — Preencher as credenciais no app

Edite **`src/utils/supabase.js`** (linhas 8–9):

```js
export const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
export const SUPABASE_ANON_KEY = 'sua-anon-public-key';
```

## Passo 6 — Gerar o APK e testar

```bash
npx expo start                     # para testar no Expo Go (opcional)
npx eas build -p android --profile preview   # gera o APK com tudo embutido
```

1. Instale o APK em um aparelho.
2. Abra **Configurações** (engrenagem no Dashboard) → card
   **"Conta e sincronização"** → **Entrar com Google**.
3. Toque em **Sincronizar** (ou apenas abra o app: ele sincroniza sozinho).
4. Confirme no Supabase (**Table Editor → registros**) que os dados apareceram.
5. Teste em um segundo aparelho logado com a mesma conta para ver a sincronia.

---

## Comportamento da sincronização

- **Offline-first**: tudo continua local; a nuvem é um espelho opcional.
- Sincroniza no **login**, ao **abrir/voltar ao app** e após **qualquer mudança**.
- **Última escrita vence** por registro (via `updatedAt`), por entidade.
- **Exclusões** são propagadas (tombstones) e registros apagados somem na nuvem.
- Sair da conta **não apaga** nada do aparelho; apenas para de sincronizar.

---

## Solução de problemas

| Sintoma | Causa provável | Correção |
|---|---|---|
| "Supabase não configurado" | URL/key vazias no `supabase.js` | Preencher (Passo 5) e rebuild |
| Login abre mas volta com erro | Redirect fora da allowlist | Adicionar `manicureapp://` (Passo 4) |
| `invalid code_verifier` | Falta polyfill de crypto | O `App.js` já inclui; rebuild |
| Nada sincroniza ao logar | RLS/política não criada | Rodar o `supabase.sql` de novo (Passo 2) |
| "Provider desabilitado" | Google não habilitado | Ativar toggle no Passo 3 |
