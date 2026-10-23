# Republicasul: site novo

Site da Republicasul, de Porto Alegre/RS: lenços e palas da indumentária gaúcha, tramados artesanalmente. Substitui o site antigo em PHP (`republicasul.com.br`).

Feito em Next.js 16 (App Router) com export estático, React 19, TypeScript, Tailwind CSS 4 e Framer Motion. O resultado do build é uma pasta `out/` com HTML pronto, que pode ser publicada em qualquer hospedagem de site estático.

## Como a venda funciona

A decisão é do dono: **a venda fecha pelo WhatsApp.**

- Não tem carrinho, checkout, pagamento nem cálculo de frete.
- O cliente escolhe o lenço e as variações (cor, medida, quantidade) e monta a **lista de pedido** (`lib/pedido.ts`). A lista fica só no navegador dele.
- Na página **Seu pedido** (`/pedido/`), ele confere tudo e envia a mensagem pronta pelo WhatsApp (`lib/whatsapp.ts`).
- Cada página de produto também tem o botão **Pedir agora no WhatsApp**, que manda só aquela peça.
- Sem preço confirmado, o site mostra **"Valor pelo WhatsApp"**. Valor, prazo e entrega são combinados na conversa.
- Todo clique de WhatsApp passa por `cliqueWhatsApp()` em `lib/analytics.ts`. Quando o Google Analytics 4 ou o Meta Pixel forem instalados, esses cliques já chegam como evento.

## Páginas

| Endereço | O que é |
| --- | --- |
| `/` | Início |
| `/catalogo/` e `/catalogo/<linha>/` | Catálogo completo e cada linha |
| `/produto/<slug>/` | Página de cada peça, com as escolhas e os botões de pedido |
| `/montador/` | Monte o seu lenço, com o desenho acompanhando cada escolha |
| `/pedido/` | Lista de pedido e envio pelo WhatsApp |
| `/guia-do-lenco/` | Guia curto das cores e dos padrões |
| `/lojistas/` | Contato para revenda |
| `/sobre/` | Sobre a Republicasul |

## Como rodar

Precisa do Node 22.18 ou mais novo.

```bash
npm install
npm run dev          # site em http://localhost:3000 enquanto edita
```

Antes de publicar qualquer alteração, rode tudo:

```bash
npm run test         # testes (Vitest)
npm run typecheck    # TypeScript
npm run build        # gera a pasta out/
npm run check:links  # confere os links internos do out/
npx playwright test  # navegação no celular e no computador sobre o out/
```

Para ver o resultado do build como vai ao ar: `npm run serve` e abra http://localhost:4173.

Na primeira vez que for rodar o Playwright numa máquina nova, instale o navegador com `npx playwright install chromium`.

## Onde editar

### Produtos, cores, medidas e fotos: `content/catalogo.ts`

- `categorias`: as linhas do catálogo (tradicionais, carijó uma cor, carijó duas cores, farroupilha, palas).
- `produtos`: cada peça, com nome, textos, padrão do desenho, opções e fotos.
- `cores`: a paleta usada nos desenhos e nas bolinhas de cor. Para mudar uma cor, mude o `hex`. Para mudar as cores oferecidas no carijó, edite a lista `coresCarijo`.
- `medida`: as opções de medida. Hoje são só "Medida padrão" e "Medida especial", sem centímetros, porque as medidas ainda não foram confirmadas.
- `preco`: deixe sem o campo para mostrar "Valor pelo WhatsApp". Só coloque um valor depois que o dono confirmar.
- `aConfirmar`: anotação interna do que falta o dono confirmar em cada peça. Não aparece no site.

### Número do WhatsApp e contatos: `content/site.ts`

```ts
export const contato = {
  whatsapp: "",          // só dígitos, com 55 e DDD. Ex.: "5551999999999"
  whatsappLojistas: "",  // vazio usa o mesmo número do varejo
  telefone: "",
  email: "",
  endereco: "",
  horario: "",
};

export const links = {
  facebook: "https://www.facebook.com/people/Republicasul/100070988793798/",
  instagram: "",
};
```

Campo vazio quer dizer "ainda não confirmado": o site esconde o que depende dele. Telefone, e-mail, endereço, horário e Instagram só aparecem no rodapé depois de preenchidos.

**Importante:** enquanto `whatsapp` estiver vazio, os botões abrem o WhatsApp com a mensagem pronta, mas sem destinatário. O cliente teria de escolher o contato. Preencha o número antes de divulgar o site.

### Faixa de prévia: `PREVIA` em `content/site.ts`

```ts
export const PREVIA = true;
```

Com `true`, aparece uma faixa fina no topo avisando que é uma prévia (e, sem o número do WhatsApp, que os links ainda não chegam à loja). Quando contatos, fotos, cores e medidas estiverem confirmados, troque para `false`, rode o build e publique.

## Como colocar as fotos reais

Use só fotos reais da Republicasul (do site antigo ou enviadas pelo dono). Nada de banco de imagens e nada gerado por IA.

1. Salve as fotos em `public/fotos/`, uma pasta por peça. Prefira `.webp` ou `.jpg`, com uns 1600 px no lado maior. Exemplo:
   ```
   public/fotos/lenco-tradicional-maragato/1.webp
   public/fotos/lenco-tradicional-maragato/2.webp
   ```
2. No produto, em `content/catalogo.ts`, preencha o campo `fotos` com o caminho a partir de `/fotos/`:
   ```ts
   fotos: ["/fotos/lenco-tradicional-maragato/1.webp", "/fotos/lenco-tradicional-maragato/2.webp"],
   ```
3. Rode `npm run build` e confira.

Com fotos, o cartão do catálogo e a página do produto mostram a foto (a primeira vira a capa e as outras viram miniaturas). Sem fotos, ou se uma foto falhar, o site desenha o lenço com `components/LencoArte.tsx`.

No carijó, que tem escolha de cor, o montador e a lista de pedido continuam com o desenho, porque a foto mostra uma cor e o cliente pode ter escolhido outra.

## O que falta o dono confirmar

Até lá, o site fica como prévia (`PREVIA = true`).

- [ ] **Contatos**: número do WhatsApp do varejo, WhatsApp para lojistas (se for outro), telefone, e-mail, endereço e horário de atendimento.
- [ ] **Instagram**: endereço do perfil, se houver.
- [ ] **Fotos reais** de cada peça: tradicionais (maragato, chimango, azul royal, verde esmeralda), carijó uma cor, carijó duas cores, farroupilha e palas.
- [ ] **Cores do carijó**: quais cores existem de verdade em uma cor e quais combinações em duas cores. Hoje a lista é provisória.
- [ ] **Medidas**: os tamanhos de cada lenço (o site hoje só diz "medida padrão" e "medida especial").
- [ ] **Desenho do lenço farroupilha**: como as três cores ficam dispostas na peça. O desenho atual é uma ilustração provisória.
- [ ] **Palas**: modelos, cores e medidas. Hoje existe uma página só, e o cliente conta o que procura na observação.
- [ ] **Preços**: só se o dono quiser publicar. Sem preço, fica "Valor pelo WhatsApp".
- [ ] Depois de tudo confirmado: trocar `PREVIA` para `false`.

Opcional: instalar Google Analytics 4 ou Meta Pixel para medir os cliques no WhatsApp (o código de medição já está pronto em `lib/analytics.ts`).

## Publicação na Vercel

1. Crie o projeto na Vercel importando este repositório do GitHub. O framework é detectado como Next.js; o comando de build é `npm run build`.
2. Cada push na `main` publica de novo. Branches e pull requests ganham um endereço de prévia.
3. Em **Settings > Domains**, ligue `republicasul.com.br` e `www.republicasul.com.br` quando for trocar o site antigo.
4. O `vercel.json` já leva as URLs antigas `.php` para as páginas novas (redirecionamento 301), para não perder o que o Google já conhece. A lista vem de `redirecionamentosLegados` em `content/site.ts`. Se mudar uma, mude as duas (o teste do Playwright confere).

Para uma prévia rápida sem conta na Vercel, dá para arrastar o conteúdo da pasta `out/` (zipado, com os arquivos na raiz do zip) no Netlify Drop. Nesse caso os redirecionamentos das URLs `.php` não valem, porque eles estão no `vercel.json`.

## Fluxo de trabalho

- A `main` fica sempre pronta para publicar.
- Mudanças em branch (`feat/...` ou `fix/...`) e pull request.
- Testes e build antes de juntar na `main`.
- Regras de conteúdo e de visual para quem for mexer no código: veja `CLAUDE.md`.
