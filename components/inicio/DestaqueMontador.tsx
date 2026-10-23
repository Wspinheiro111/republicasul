/*
 * Destaque do montador: bloco escuro com o mini-montador interativo e o
 * caminho para o montador completo.
 */

import CabecaSecao from "./CabecaSecao";
import MiniMontador from "./MiniMontador";

export default function DestaqueMontador() {
  return (
    <section aria-labelledby="inicio-montador" className="secao-escura trama py-14 md:py-20">
      <div className="conteudo">
        <CabecaSecao id="inicio-montador" tom="escuro" rotulo="Monte o seu lenço" titulo="Escolha o padrão e as cores. O desenho acompanha.">
          <p>Teste as combinações aqui e siga no montador para fechar o seu.</p>
        </CabecaSecao>
        <hr className="linha-de-ponto mb-8 mt-8 opacity-40! md:mb-12 md:mt-10" />
        <MiniMontador />
      </div>
    </section>
  );
}
