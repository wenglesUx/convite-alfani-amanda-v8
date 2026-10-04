/* =========================================================
   Lista de presentes · Álfani & Amanda
   ---------------------------------------------------------
   Cada item: { id, titulo (categoria), item (nome), img }

   O campo "img" aceita DUAS formas:
     • caminho de um arquivo do projeto:  img: "images/concha.webp"
     • URL completa de uma imagem:        img: "https://site.com/foto.jpg"

   Se a imagem não existir ou não carregar, a página mostra
   uma ilustração no lugar (nada fica quebrado). Abra o console
   do navegador (F12) para ver a lista de itens sem imagem.

   ⚠ O "id" identifica o item no banco (Firebase). Não reutilize
   um id para outro item depois que a lista estiver no ar.
   ========================================================= */

const cozinha = [
    { id: 101, titulo: "cozinha", item: "Colher grande para servir", img: "images/colher-de-servir.webp" },
    { id: 102, titulo: "cozinha", item: "Concha", img: "images/kit-concha.jpg" },
    { id: 103, titulo: "cozinha", item: "Espátula", img: "images/espatula.webp" },
    { id: 104, titulo: "cozinha", item: "Pegador de macarrão", img: "images/pegador-de-macarrao.webp" },
    { id: 105, titulo: "cozinha", item: "Pegador de salada", img: "images/pegador-de-salada.webp" },
    { id: 106, titulo: "cozinha", item: "Escumadeira", img: "images/escumadeira.webp" },
    { id: 107, titulo: "cozinha", item: "Colher de pau", img: "images/colher-de-pau.webp" },
    { id: 108, titulo: "cozinha", item: "Fouet", img: "images/fouet.webp" },
    { id: 109, titulo: "cozinha", item: "Ralador", img: "images/descascador.webp" },
    { id: 110, titulo: "cozinha", item: "Peneira", img: "images/peneira.webp" },
    { id: 111, titulo: "cozinha", item: "Escorredor de macarrão", img: "images/escorredor-de-macarrao.jpg" },
    { id: 112, titulo: "cozinha", item: "Escorredor de louça", img: "images/escorredor-de-louca.webp" },
    { id: 113, titulo: "cozinha", item: "Tábua de corte", img: "images/tabua-de-corte.webp" },
    { id: 114, titulo: "cozinha", item: "Potes com tampa", img: "images/potes-com-tampa.webp" },
    { id: 115, titulo: "cozinha", item: "Potes para mantimentos", img: "images/pote-mantimentos.jpeg" },
    { id: 116, titulo: "cozinha", item: "Garrafa térmica", img: "images/garrafa-termica.webp" },
    { id: 117, titulo: "cozinha", item: "Forma de bolo", img: "images/forma-de-bolo.jpeg" },
    { id: 118, titulo: "cozinha", item: "Assadeira", img: "images/assadeira.webp" },
];

const mesa = [
    { id: 201, titulo: "mesa", item: "Jogo de pratos", img: "images/jogo-de-aparelho-de-jantar.webp" },
    { id: 202, titulo: "mesa", item: "Jogo de copos", img: "images/copos-de-vidro.webp" },
    { id: 203, titulo: "mesa", item: "Jogo de xícaras", img: "images/jogo-de-xicaras.webp" },
    { id: 204, titulo: "mesa", item: "Talheres", img: "images/jogo-de-talher.webp" },
    { id: 205, titulo: "mesa", item: "Colheres de sobremesa", img: "images/colheres-de-sobremesa.webp" },
    { id: 206, titulo: "mesa", item: "Garfos de sobremesa", img: "images/garfos-de-sobremesa.webp" },
    { id: 207, titulo: "mesa", item: "Faquinhas", img: "images/faquinhas.webp" },
    { id: 208, titulo: "mesa", item: "Travessa", img: "images/jogo-de-travessa.webp" },
    { id: 209, titulo: "mesa", item: "Saladeira", img: "images/saladeira.webp" },
    { id: 210, titulo: "mesa", item: "Tigelas", img: "images/tigelas.webp" },
    { id: 211, titulo: "mesa", item: "Açucareiro", img: "images/acucareiro.webp" },
    { id: 212, titulo: "mesa", item: "Porta-temperos", img: "images/616-porta-temepros.jpg" },
];

const limpeza = [
    { id: 301, titulo: "limpeza e organização", item: "Balde", img: "images/balde.webp" },
    { id: 302, titulo: "limpeza e organização", item: "Lixeira para cozinha", img: "images/lixeira-cozinha.webp" },
    { id: 303, titulo: "limpeza e organização", item: "Lixeira para banheiro", img: "images/lixeira-banheiro.webp" },
    { id: 304, titulo: "limpeza e organização", item: "Organizador de cozinha", img: "images/organizador-de-cozinha.webp" },
    { id: 305, titulo: "limpeza e organização", item: "Cesto para roupas sujas", img: "images/cesto-de-roupa.webp" },
    { id: 306, titulo: "limpeza e organização", item: "Varal de chão (arara)", img: "images/varal-de-roupas.webp" },
];

const banheiro = [
    { id: 401, titulo: "banheiro", item: "Toalhas de banho", img: "images/toalha-de-banho.webp" },
    { id: 402, titulo: "banheiro", item: "Toalhas de rosto", img: "images/toalha-de-rosto.webp" },
    { id: 403, titulo: "banheiro", item: "Jogo de banheiro", img: "images/kit-lavabo.webp" },
    { id: 404, titulo: "banheiro", item: "Porta-escova de dentes", img: "images/porta-escova.webp" },
    { id: 405, titulo: "banheiro", item: "Saboneteira", img: "images/saboneteira.webp" },
    { id: 406, titulo: "banheiro", item: "Lixeira", img: "images/lixeira-banheiro.webp" },
    { id: 407, titulo: "banheiro", item: "Escova sanitária", img: "images/escova-sanitaria.webp" },
    { id: 408, titulo: "banheiro", item: "Tapete para banheiro", img: "images/jogo-de-tapete.jpeg" },
];

const quarto = [
    { id: 501, titulo: "quarto", item: "Jogo de cama", img: "images/jogo_de_cama.webp" },
    { id: 502, titulo: "quarto", item: "Lençol com elástico (virol)", img: "images/jogo-de-virou.webp" },
    { id: 503, titulo: "quarto", item: "Cobertor", img: "images/cobertor-manta.webp" },
    { id: 504, titulo: "quarto", item: "Travesseiros", img: "images/jogo-de-travesseiro.webp" },
    { id: 505, titulo: "quarto", item: "Capas para travesseiro", img: "images/capa-de-travesseiro.webp" },
    { id: 506, titulo: "quarto", item: "Cabides", img: "images/cabides.webp" },
];

const lavanderia = [
    { id: 601, titulo: "lavanderia", item: "Cesto para roupas", img: "images/cesto-de-roupa.webp" },
    { id: 602, titulo: "lavanderia", item: "Balde", img: "images/balde.webp" },
    { id: 603, titulo: "lavanderia", item: "Bacia", img: "images/bacia.webp" },
    { id: 604, titulo: "lavanderia", item: "Tábua de passar roupa", img: "images/tabua-de-passar.jpg" },
    { id: 605, titulo: "lavanderia", item: "Cesto/organizador para produtos de limpeza", img: "images/organizador-produtos-limpeza.webp" },
];

const extras = [
    { id: 701, titulo: "opções extras", item: "Kit de potes de vidro", img: "images/pote-de-vidro.avif" },
    { id: 702, titulo: "opções extras", item: "Kit de potes plásticos", img: "images/potes-plasticos.webp" },
    { id: 703, titulo: "opções extras", item: "Jogo americano", img: "images/jogo-americano.webp" },
    { id: 704, titulo: "opções extras", item: "Toalha de mesa", img: "images/toalha-de-mesa.webp" },
    { id: 705, titulo: "opções extras", item: "Kit de facas", img: "images/jogo-de-faca.webp" },
    { id: 706, titulo: "opções extras", item: "Escorredor de talheres", img: "images/escorredor-de-talheres.webp" },
    { id: 707, titulo: "opções extras", item: "Porta-temperos", img: "images/616-porta-temepros.jpg" },
    { id: 708, titulo: "opções extras", item: "Porta-condimentos", img: "images/porta-condimentos.webp" },
    { id: 709, titulo: "opções extras", item: "Organizadores de gaveta", img: "images/organizador-de-gaveta.webp" },
    { id: 710, titulo: "opções extras", item: "Tapetes para a casa", img: "images/tapete-para-a-sala.jpeg" },
];

const presentes = [cozinha, mesa, limpeza, banheiro, quarto, lavanderia, extras];
