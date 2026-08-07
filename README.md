# Belle 💅

Aplicativo em React Native (Expo) para gestão de manicures/nail designers autônomas: agenda de clientes, cadastro de clientes, contas a pagar e a receber (com status pago/recebido) e centro de custo.

## Funcionalidades

- **Início (Dashboard)** — resumo de contas a receber/pagar, saldo previsto e próximos agendamentos.
- **Agenda** — lista de agendamentos por data (hoje, próximos 7 dias ou todos), com cliente, serviço, horário, valor e status (Agendado/Concluído/Cancelado).
- **Clientes** — cadastro completo (nome, telefone, e-mail, observações), busca, e resumo de agendamentos/total recebido por cliente.
- **Financeiro** — contas a pagar e a receber, com filtro por status (Pendente/Pago-Recebido/Todos), marcação rápida de pagamento/recebimento e vínculo a um centro de custo e, opcionalmente, a uma cliente.
- **Centro de Custo** — categorias de receita/despesa (ex: Serviços, Produtos, Aluguel) com total consolidado por categoria.

Ao criar um agendamento, o app pode gerar automaticamente uma conta a receber vinculada no módulo Financeiro (opção ativada por padrão, pode ser desmarcada).

Todos os dados são salvos localmente no dispositivo (AsyncStorage) — não há servidor/backend, então os dados não sincronizam entre aparelhos.

## Pré-requisitos

- [Node.js](https://nodejs.org) 18 ou superior
- npm (ou yarn)
- App **Expo Go** no seu celular (disponível na App Store / Google Play) **ou** um emulador Android/iOS configurado

## Como rodar

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npx expo start
```

Depois de iniciar, um QR Code aparecerá no terminal:

- **No celular:** abra o app **Expo Go** e escaneie o QR Code (Android) ou use a câmera nativa (iOS).
- **Emulador Android:** com o Android Studio configurado, pressione `a` no terminal.
- **Simulador iOS:** em um Mac com Xcode, pressione `i` no terminal.
- **Web (experimental):** pressione `w` no terminal.

## Instalação do APK (Android)

Para instalar o **Belle** como aplicativo no seu celular Android, gere um APK com o **EAS Build** (build na nuvem — não precisa de Android Studio nem JDK na sua máquina).

### Pré-requisitos

- Conta no [Expo](https://expo.dev) (você já é dono do projeto `lucitti` no `app.json`).
- Node.js 18+ e npm.

### Passo a passo

```bash
# 1. Instale o CLI do EAS (se ainda não tiver)
npm install -g eas-cli

# 2. Faça login (a conta logada deve ter acesso ao projeto do owner "lucitti")
eas login
eas whoami

# 3. (Recomendado) Versionamento com git — deixa o build do EAS mais estável
git init
git add -A
git commit -m "chore: preparar build"

# 4. Crie o arquivo eas.json na raiz (gera APK instalável em vez de AAB):
#    {
#      "cli": { "appVersionSource": "remote" },
#      "build": {
#        "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
#        "production": { "android": { "buildType": "app-bundle" } }
#      }
#    }

# 5. Gere o APK (build na nuvem, ~5–15 min)
eas build -p android --profile preview
```

### Instalando o APK no celular

1. Ao finalizar, o EAS mostra um **link/QR Code** com o download do `.apk`.
2. Baixe o arquivo no celular Android.
3. Se o sistema pedir, **permita "instalar apps de fontes desconhecidas"** para o navegador/gerenciador de arquivos que abrir o APK.
4. Abra o APK e confirme a instalação. O **Belle** aparecerá no menu de aplicativos.

> **Observações:**
> - O ícone (`assets/icon.png`), o nome **Belle** e os módulos nativos (notificações, navegação por gestos) **só aparecem no APK** — o Expo Go não reflete essas configurações.
> - Mudanças futuras de código não exigem novo APK se você usar o Expo Go/`expo start`. Já mudanças em `app.json` (ícone, nome, plugins nativos) exigem um **novo build**.

## Estrutura do projeto

```
manicure-app/
├── App.js                     # Ponto de entrada, providers
├── app.json                   # Configuração do Expo
├── src/
│   ├── context/DataContext.js # Estado global + persistência (AsyncStorage)
│   ├── components/            # Componentes reutilizáveis (Button, Input, Card, etc.)
│   ├── navigation/            # Bottom tabs + stacks de navegação
│   ├── screens/                # Telas do app
│   ├── theme/colors.js        # Paleta de cores e tokens visuais
│   └── utils/                 # Formatação de datas/moeda e storage
```

## Próximos passos sugeridos

- Adicionar notificações push para lembrar clientes de agendamentos.
- Exportar relatórios financeiros (PDF/Excel).
- Autenticação e sincronização em nuvem, caso precise usar em mais de um dispositivo.
- Adicionar foto de perfil da cliente.

## Personalização visual

As cores principais do app ficam centralizadas em `src/theme/colors.js` — basta alterar os valores de `primary`, `accent`, etc. para trocar a identidade visual.
