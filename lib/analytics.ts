// Eventos de conversão. Hoje a venda acontece no WhatsApp, então o que importa
// medir é quem chega até lá, por produto e por lugar do site. Funciona com
// Google Analytics 4 (gtag) e Meta Pixel (fbq) quando forem instalados; sem
// eles, não faz nada.

type Parametros = Record<string, string | number | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function registrarEvento(nome: string, parametros: Parametros = {}) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", nome, parametros);
    if (nome === "clique_whatsapp") window.fbq?.("track", "Contact", parametros);
  } catch {
    // Medição nunca pode quebrar a navegação.
  }
}

// origem: onde o clique aconteceu (ex.: "produto", "pedido", "flutuante", "lojistas").
export function cliqueWhatsApp(origem: string, produto?: string) {
  registrarEvento("clique_whatsapp", { origem, produto });
}
