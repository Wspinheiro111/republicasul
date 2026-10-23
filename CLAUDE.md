# Republicasul — contexto para desenvolvimento

Site da Republicasul (Porto Alegre/RS): lenços e palas da indumentária gaúcha, tramados artesanalmente. Substitui o site antigo em PHP (`republicasul.com.br`). Projeto vendido e acompanhado pela W9 Sistemas (William Pinheiro).

## Decisão comercial (do dono)
- **A venda fecha pelo WhatsApp.** Os produtos têm muitas variações (modelo, cor, medida), então não há carrinho nem checkout por enquanto.
- O site é um catálogo que deixa o cliente montar o pedido com todas as variações e envia a mensagem pronta para o WhatsApp (`lib/whatsapp.ts`, `lib/pedido.ts`).
- Preço só aparece se o dono confirmar (`preco` em `content/catalogo.ts`); sem preço, o site mostra "valor pelo WhatsApp".

## Stack
- Next.js 16 (App Router) com export estático (`output: "export"`, `trailingSlash: true`)
- React 19, TypeScript, Tailwind CSS 4, Framer Motion
- Vitest + Testing Library; Playwright para testes visuais (`e2e/`)

## Comandos obrigatórios antes de considerar uma alteração concluída
```bash
npm install
npm run test
npm run typecheck
npm run build
```

## Regras de conteúdo
- Usar somente fotografias reais da Republicasul (do site antigo ou enviadas pelo dono). Nunca gerar fotos por IA.
- Enquanto não houver foto, o lenço é **desenhado** pelo componente `components/LencoArte.tsx` a partir do padrão e das cores; isso é ilustração, não foto.
- Não inventar preços, medidas, contatos, endereço, prazos, depoimentos, números de vendas ou fatos históricos. Campo vazio em `content/site.ts` = ainda não confirmado; o site esconde o que depende dele.
- Itens marcados com `aConfirmar` no catálogo dependem do dono. `PREVIA = true` mostra a faixa de prévia.
- Textos em português do Brasil, frases curtas, tom de balcão de loja do interior: direto e acolhedor.

## Identidade visual: "galpão premium"
- Base escura de couro/madeira, creme para leitura, vermelho maragato como cor de ação, dourado discreto em detalhes, verde campo pontual.
- A trama do tecido é o motivo visual: textura tramada, linhas de ponto como divisores, o lenço desenhado como peça central.
- Tipografia: serifa expressiva nos títulos, sem serifa de sinalização no texto, condensada em caixa alta para rótulos.
- Animações só com Framer Motion (ou CSS simples); nada de GSAP. Respeitar `prefers-reduced-motion`.
- Mobile primeiro: barra inferior fixa no celular com "Seu pedido" e WhatsApp.

## Rotas
- `/` início · `/catalogo/` · `/catalogo/[categoria]/` · `/produto/[slug]/`
- `/montador/` montador de lenço com prévia ao vivo · `/pedido/` lista e envio pelo WhatsApp
- `/guia-do-lenco/` · `/lojistas/` · `/sobre/`
- URLs antigas `.php` redirecionam via `vercel.json` (fonte: `redirecionamentosLegados` em `content/site.ts`).

## Fluxo Git
- `main` publicável; mudanças em branch e PR. Testes e build antes do merge.
