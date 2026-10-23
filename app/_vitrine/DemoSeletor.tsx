"use client";

// PROVISÓRIO: demonstração do seletor na vitrine de componentes (app/page.tsx).
// Pode ser apagado junto com a vitrine quando a página inicial real entrar.

import { useState } from "react";
import BotaoWhatsApp from "../../components/BotaoWhatsApp";
import LencoArte from "../../components/LencoArte";
import Quantidade from "../../components/Quantidade";
import SeletorOpcoes from "../../components/SeletorOpcoes";
import { coresDasEscolhas, escolhasPadrao, produtoPorSlug } from "../../content/catalogo";
import { adicionarItem } from "../../lib/pedido";
import { mensagemProduto } from "../../lib/whatsapp";

export default function DemoSeletor({ slug }: { slug: string }) {
  const produto = produtoPorSlug(slug)!;
  const [escolhas, setEscolhas] = useState(() => escolhasPadrao(produto));
  const [quantidade, setQuantidade] = useState(1);
  const item = { produto: produto.slug, escolhas, quantidade };

  return (
    <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-14">
      <div className="secao-escura trama costura rounded-[var(--raio-grande)] p-6 sm:p-10">
        <LencoArte padrao={produto.padrao} cores={coresDasEscolhas(produto, escolhas)} titulo={`Desenho do ${produto.nome}`} />
      </div>
      <div>
        <p className="rotulo text-ouro-escuro">Monte do seu jeito</p>
        <h3 className="mt-2 text-[1.75rem]">{produto.nome}</h3>
        <p className="mt-2 text-tinta/80">{produto.resumo}</p>
        <p className="mt-3 font-semibold">Valor pelo WhatsApp</p>
        <SeletorOpcoes
          className="mt-6"
          opcoes={produto.opcoes}
          escolhas={escolhas}
          aoMudar={(id, valor) => setEscolhas((e) => ({ ...e, [id]: valor }))}
        />
        <Quantidade className="mt-6" valor={quantidade} aoMudar={setQuantidade} />
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" className="botao-acao" onClick={() => adicionarItem(item)}>
            Pôr na lista de pedido
          </button>
          <BotaoWhatsApp texto={mensagemProduto(item)} origem="vitrine" produto={produto.slug}>
            Pedir agora no WhatsApp
          </BotaoWhatsApp>
        </div>
      </div>
    </div>
  );
}
