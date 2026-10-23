import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed, Fraunces } from "next/font/google";
import BarraCelular from "../components/BarraCelular";
import Cabecalho from "../components/Cabecalho";
import FaixaPrevia from "../components/FaixaPrevia";
import Rodape from "../components/Rodape";
import { IMAGEM_COMPARTILHAMENTO } from "../components/conteudo/seo";
import { empresa, links, PREVIA, SITE_URL } from "../content/site";
import "./globals.css";

// Títulos: serifa expressiva (variável, com eixo de tamanho óptico).
const fraunces = Fraunces({
  subsets: ["latin", "latin-ext"],
  axes: ["opsz"],
  variable: "--fonte-titulo",
  display: "swap",
});

// Texto corrido.
const barlow = Barlow({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--fonte-texto",
  display: "swap",
});

// Rótulos em caixa alta, botões e navegação.
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--fonte-rotulo",
  display: "swap",
});

const descricao =
  "Lenços e palas da indumentária gaúcha, tramados artesanalmente. Republicasul, de Porto Alegre/RS. Escolha modelo, cor e medida e mande o pedido pronto pelo WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Republicasul | Lenços e palas gaúchos tramados artesanalmente",
    template: "%s | Republicasul",
  },
  description: descricao,
  applicationName: empresa.nome,
  // Canonical e og:url ficam por conta de cada página (herdar "/" aqui faria
  // todas as páginas apontarem para o início).
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: empresa.nome,
    title: "Republicasul | Lenços e palas gaúchos tramados artesanalmente",
    description: descricao,
    // Imagem padrão (public/og.png, feita por scripts/gerar-og.mjs). Página que
    // define o próprio openGraph precisa repetir a imagem (o Next não mescla).
    images: [IMAGEM_COMPARTILHAMENTO],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1b130e",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Dados estruturados da empresa. Endereço só com cidade/UF (rua não confirmada);
// sameAs só com as redes preenchidas.
const organizacao = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: empresa.nome,
  url: SITE_URL,
  description: empresa.assinatura,
  taxID: empresa.cnpj,
  address: {
    "@type": "PostalAddress",
    addressLocality: empresa.cidade,
    addressRegion: empresa.uf,
    addressCountry: "BR",
  },
  sameAs: [links.facebook, links.instagram].filter(Boolean),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        <a href="#conteudo" className="pular-conteudo">
          Pular para o conteúdo
        </a>
        {PREVIA && <FaixaPrevia />}
        <Cabecalho />
        <main id="conteudo" tabIndex={-1}>
          {children}
        </main>
        <Rodape />
        <BarraCelular />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizacao).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  );
}
