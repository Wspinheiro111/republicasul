// Dados institucionais da Republicasul.
//
// Regra do projeto: nada de inventar contatos, endereços, preços ou fatos.
// Campo vazio ("") significa "ainda não confirmado com o dono" e o site
// esconde o que depende dele ou usa um texto neutro.

export const SITE_URL = "https://www.republicasul.com.br";

// Enquanto fotos, cores, medidas e contatos não forem confirmados pelo dono,
// o site mostra uma faixa discreta avisando que é uma prévia.
export const PREVIA = true;

export const empresa = {
  nome: "Republicasul",
  // Frase usada pela própria empresa no site atual (título das páginas).
  assinatura: "Lenços e palas da indumentária gaúcha, tramados artesanalmente, de forma única e original.",
  cnpj: "00.607.826/0001-13",
  cidade: "Porto Alegre",
  uf: "RS",
};

export const contato = {
  // Número comercial com DDI e DDD, só dígitos (ex.: "5551999999999").
  // Vazio: o link abre o WhatsApp para o cliente escolher o contato.
  whatsapp: "",
  // Número para lojistas/atacado; vazio usa o mesmo do varejo.
  whatsappLojistas: "",
  telefone: "",
  email: "",
  endereco: "",
  horario: "",
};

export const links = {
  facebook: "https://www.facebook.com/people/Republicasul/100070988793798/",
  instagram: "",
};

// Páginas do site antigo (PHP) e para onde cada uma passa a apontar.
// Usado no vercel.json para não perder o que o Google já indexou.
export const redirecionamentosLegados: Record<string, string> = {
  "/index.php": "/",
  "/tradicionais_trama_republicasul.php": "/catalogo/lencos-tradicionais/",
  "/carijos1.php": "/catalogo/carijo-uma-cor/",
  "/medidas_especiais.php": "/catalogo/carijo-duas-cores/",
  "/controle_artigos.php": "/catalogo/carijo-duas-cores/",
  "/farroupilha.php": "/catalogo/farroupilha/",
};
