/* =========================================================
   Lista de presentes · Álfani & Amanda
   - o convidado marca um ou mais presentes
   - revisa, informa nome e WhatsApp e confirma tudo de uma vez
   - a reserva é atômica: se algum item já foi escolhido, nada é reservado
   - os organizadores recebem o aviso automaticamente
   Itens: presentes.js · Configuração: config.js
   ========================================================= */
import {
    CONF, PREVIA, montarIdentificacao, conectar,
    avisarOrganizadores, botoesPendentes, formatarTelefone, agoraFormatado,
} from './servicos.js';

// Nome e ícone de cada categoria (pela chave "titulo" de presentes.js)
const CATEGORIAS = {
    'cozinha':               { nome: 'Cozinha',               icone: 'bi-egg-fried' },
    'mesa':                  { nome: 'Mesa',                  icone: 'bi-cup-hot' },
    'limpeza e organização': { nome: 'Limpeza e organização', icone: 'bi-stars' },
    'banheiro':              { nome: 'Banheiro',              icone: 'bi-droplet' },
    'quarto':                { nome: 'Quarto',                icone: 'bi-moon-stars' },
    'lavanderia':            { nome: 'Lavanderia',            icone: 'bi-basket' },
    'opções extras':         { nome: 'Opções extras',         icone: 'bi-gift' },
};
const infoCategoria = (titulo) => CATEGORIAS[titulo] ?? {
    nome: titulo.charAt(0).toUpperCase() + titulo.slice(1),
    icone: 'bi-gift',
};

// ---- Estado --------------------------------------------------------------
// "presentes" é declarado em presentes.js (const global, não fica em window)
const itens = (typeof presentes !== 'undefined' ? presentes : []).flat();
const porId = new Map(itens.map((i) => [i.id, i]));
const escolhidos = new Set();        // ids já escolhidos por alguém (vindos do banco)
const selecionados = new Set();      // ids marcados por este convidado agora
const semImagem = [];
let filtroAtual = 'todos';
let termoBusca = '';

// ---- Utilidades ----------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const normalizar = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = (t) => normalizar(t).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const plural = (n, um, varios) => (n === 1 ? um : varios);

/** Aceita URL completa (http/https/data) ou caminho do projeto ("images/x.webp"). */
function resolverImagem(img) {
    if (!img || !String(img).trim()) return null;
    const valor = String(img).trim();
    if (/^(https?:)?\/\//i.test(valor) || valor.startsWith('data:')) return valor;
    const raiz = window.RAIZ_SITE ?? '/';
    return encodeURI(raiz + valor.replace(/^\//, ''));
}

/** Miniatura: foto quando existir, ilustração quando não. */
function criarMiniatura(item, classe) {
    const caixa = document.createElement('div');
    caixa.className = classe;
    const reserva = document.createElement('div');
    reserva.className = 'miniatura__reserva';
    reserva.innerHTML = `<i class="bi ${infoCategoria(item.titulo).icone}" aria-hidden="true"></i>`;
    caixa.appendChild(reserva);

    const src = resolverImagem(item.img);
    if (!src) { registrarSemImagem(item, '(sem imagem)'); return caixa; }
    const foto = new Image();
    foto.alt = item.item;
    foto.loading = 'lazy';
    foto.decoding = 'async';
    foto.referrerPolicy = 'no-referrer';
    foto.addEventListener('load', () => caixa.classList.add('com-foto'));
    foto.addEventListener('error', () => { foto.remove(); registrarSemImagem(item, item.img); });
    foto.src = src;
    caixa.appendChild(foto);
    return caixa;
}

let relatorioAgendado = null;
function registrarSemImagem(item, img) {
    if (semImagem.some((s) => s.id === item.id)) return;
    semImagem.push({ id: item.id, item: item.item, img });
    clearTimeout(relatorioAgendado);
    relatorioAgendado = setTimeout(() => {
        console.groupCollapsed(`🖼️ Lista de presentes: ${semImagem.length} item(ns) sem imagem`);
        console.table(semImagem.sort((a, b) => a.id - b.id));
        console.info('Edite o campo "img" em presentes.js com um caminho do projeto ou uma URL completa.');
        console.groupEnd();
    }, 2500);
}

function mostrarAviso(texto) {
    const aviso = $('#aviso');
    aviso.textContent = texto;
    aviso.classList.add('visivel');
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(() => aviso.classList.remove('visivel'), 4200);
}

// ---- Renderização --------------------------------------------------------
const categoriasOrdenadas = [...new Set(itens.map((i) => i.titulo))];

function montarFiltros() {
    const filtros = $('#filtros');
    const botoes = [['todos', 'Todos'], ...categoriasOrdenadas.map((t) => [t, infoCategoria(t).nome])];
    filtros.innerHTML = '';
    botoes.forEach(([valor, rotulo]) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'filtro';
        b.setAttribute('role', 'tab');
        b.textContent = rotulo;
        b.setAttribute('aria-selected', String(valor === filtroAtual));
        b.addEventListener('click', () => {
            filtroAtual = valor;
            filtros.querySelectorAll('.filtro').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
            aplicarFiltros();
            if (valor !== 'todos') {
                document.getElementById(`cat-${slug(valor)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
        filtros.appendChild(b);
    });
}

function montarLista() {
    const area = $('#categorias');
    area.innerHTML = '';
    categoriasOrdenadas.forEach((titulo) => {
        const { nome, icone } = infoCategoria(titulo);
        const bloco = document.createElement('section');
        bloco.className = 'categoria';
        bloco.id = `cat-${slug(titulo)}`;
        bloco.dataset.categoria = titulo;
        bloco.innerHTML = `
            <header class="categoria__topo">
                <i class="bi ${icone}" aria-hidden="true"></i>
                <h2>${nome}</h2>
                <span class="categoria__contagem"></span>
            </header>
            <ul class="grade"></ul>`;
        const grade = bloco.querySelector('.grade');

        itens.filter((i) => i.titulo === titulo).forEach((item) => {
            const li = document.createElement('li');
            li.className = 'cartao';
            li.dataset.id = item.id;
            li.dataset.busca = normalizar(`${item.item} ${nome}`);

            const botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'cartao__botao';
            botao.setAttribute('aria-pressed', 'false');
            botao.appendChild(criarMiniatura(item, 'miniatura'));
            botao.insertAdjacentHTML('beforeend', `
                <span class="cartao__marca" aria-hidden="true"><i class="bi bi-check-lg"></i></span>
                <span class="cartao__nome"></span>
                <span class="cartao__acao"><i class="bi bi-plus-lg" aria-hidden="true"></i> Selecionar</span>
                <span class="cartao__acao cartao__acao--marcado"><i class="bi bi-check2" aria-hidden="true"></i> Selecionado</span>
                <span class="cartao__selo"><i class="bi bi-check2" aria-hidden="true"></i> Já escolhido</span>`);
            botao.querySelector('.cartao__nome').textContent = item.item;
            botao.addEventListener('click', () => alternarSelecao(item.id));

            li.appendChild(botao);
            grade.appendChild(li);
        });
        area.appendChild(bloco);
    });
}

function alternarSelecao(id) {
    if (escolhidos.has(id)) return;
    if (selecionados.has(id)) selecionados.delete(id);
    else selecionados.add(id);
    atualizarCartoes();
}

function atualizarCartoes() {
    // um item escolhido por outra pessoa sai da seleção automaticamente
    const perdidos = [...selecionados].filter((id) => escolhidos.has(id));
    perdidos.forEach((id) => selecionados.delete(id));
    if (perdidos.length && !$('#modal').open) {
        mostrarAviso(`${perdidos.map((id) => porId.get(id).item).join(', ')} acabou de ser escolhido por outro convidado.`);
    }

    document.querySelectorAll('.cartao').forEach((li) => {
        const id = Number(li.dataset.id);
        const indisponivel = escolhidos.has(id);
        const marcado = selecionados.has(id);
        li.classList.toggle('escolhido', indisponivel);
        li.classList.toggle('selecionado', marcado);
        const botao = li.querySelector('.cartao__botao');
        botao.disabled = indisponivel;
        botao.setAttribute('aria-pressed', String(marcado));
        botao.setAttribute('aria-label', indisponivel
            ? `${porId.get(id).item}: já escolhido`
            : `${porId.get(id).item}: ${marcado ? 'selecionado, toque para remover' : 'toque para selecionar'}`);
    });
    atualizarBarra();
    aplicarFiltros();
}

function atualizarBarra() {
    const n = selecionados.size;
    const barra = $('#selecao-barra');
    barra.hidden = n === 0;
    document.body.classList.toggle('com-selecao', n > 0);
    $('#selecao-qtd').textContent = n;
    $('#selecao-rotulo').textContent = plural(n, 'presente selecionado', 'presentes selecionados');
}

function aplicarFiltros() {
    let visiveis = 0;
    document.querySelectorAll('.categoria').forEach((bloco) => {
        const daCategoria = filtroAtual === 'todos' || bloco.dataset.categoria === filtroAtual;
        let noBloco = 0, livres = 0, total = 0;
        bloco.querySelectorAll('.cartao').forEach((li) => {
            total++;
            if (!li.classList.contains('escolhido')) livres++;
            const casa = daCategoria && (!termoBusca || li.dataset.busca.includes(termoBusca));
            li.hidden = !casa;
            if (casa) noBloco++;
        });
        bloco.hidden = noBloco === 0;
        visiveis += noBloco;
        bloco.querySelector('.categoria__contagem').textContent = `${livres} de ${total} disponíveis`;
    });
    $('#resumo').textContent = `${itens.length - escolhidos.size} de ${itens.length} presentes disponíveis`;
    $('#vazio').hidden = visiveis > 0;
}

function avisoConexao(texto) {
    const p = $('#aviso-conexao');
    p.textContent = texto;
    p.hidden = false;
}

// ---- Banco ---------------------------------------------------------------
let banco = null;

function ouvirEscolhidos() {
    const { db, fs } = banco;
    fs.onSnapshot(
        fs.collection(db, CONF.colecoes.presentes),
        (snap) => {
            escolhidos.clear();
            snap.forEach((d) => { if (d.data().disponivel === false) escolhidos.add(Number(d.id)); });
            atualizarCartoes();
        },
        (erro) => {
            console.warn('Erro ao ler a lista do banco:', erro);
            avisoConexao('Não conseguimos verificar quais presentes já foram escolhidos. Recarregue a página em instantes.');
        },
    );
}

class JaEscolhidos extends Error {
    constructor(ids) { super('ja-escolhido'); this.ids = ids; }
}

/** Reserva todos os itens de uma vez. Se algum já foi escolhido, não reserva nenhum. */
async function reservar(ids, convidado) {
    if (PREVIA) {
        ids.forEach((id) => escolhidos.add(id));
        return;
    }
    if (!banco) throw new Error('sem-conexao');
    const { db, fs } = banco;
    const refs = ids.map((id) => fs.doc(db, CONF.colecoes.presentes, String(id)));
    await fs.runTransaction(db, async (t) => {
        const atuais = await Promise.all(refs.map((r) => t.get(r)));
        const tomados = ids.filter((id, i) => atuais[i].exists() && atuais[i].data().disponivel === false);
        if (tomados.length) throw new JaEscolhidos(tomados);

        ids.forEach((id, i) => {
            const item = porId.get(id);
            // status público do item (sem dados pessoais)
            t.set(refs[i], {
                id, item: item.item, categoria: item.titulo,
                disponivel: false, escolhidoEm: fs.serverTimestamp(),
            });
        });
        // registro privado de quem presenteou (só os organizadores leem)
        t.set(fs.doc(fs.collection(db, CONF.colecoes.escolhas)), {
            nome: convidado.nome,
            telefone: convidado.telefone,
            itens: ids.map((id) => ({ id, item: porId.get(id).item })),
            criadoEm: fs.serverTimestamp(),
        });
    });
    ids.forEach((id) => escolhidos.add(id));
}

// ---- Revisão e confirmação ----------------------------------------------
const modal = $('#modal');
const identificacao = montarIdentificacao($('#lista-identificacao'), { prefixo: 'lista' });

function desenharRevisao() {
    const ul = $('#revisao');
    ul.innerHTML = '';
    [...selecionados].forEach((id) => {
        const item = porId.get(id);
        const li = document.createElement('li');
        li.className = 'revisao__item';
        li.appendChild(criarMiniatura(item, 'miniatura miniatura--mini'));
        const texto = document.createElement('div');
        texto.className = 'revisao__texto';
        texto.innerHTML = '<strong></strong><span></span>';
        texto.querySelector('strong').textContent = item.item;
        texto.querySelector('span').textContent = infoCategoria(item.titulo).nome;
        li.appendChild(texto);
        const remover = document.createElement('button');
        remover.type = 'button';
        remover.className = 'revisao__remover';
        remover.setAttribute('aria-label', `Remover ${item.item}`);
        remover.innerHTML = '<i class="bi bi-x-lg"></i>';
        remover.addEventListener('click', () => {
            selecionados.delete(id);
            atualizarCartoes();
            if (!selecionados.size) { modal.close(); return; }
            desenharRevisao();
        });
        li.appendChild(remover);
        ul.appendChild(li);
    });
    const n = selecionados.size;
    $('#modal-titulo').textContent = `${n} ${plural(n, 'presente escolhido', 'presentes escolhidos')}`;
    $('#modal-confirmar').innerHTML = `<i class="bi bi-gift"></i> Confirmar ${plural(n, 'presente', 'presentes')}`;
}

function abrirRevisao() {
    if (!selecionados.size) return;
    $('#modal-erro').hidden = true;
    $('#modal-corpo').hidden = false;
    $('#modal-sucesso').hidden = true;
    $('#modal-confirmar').disabled = false;
    desenharRevisao();
    modal.showModal();
}

$('#selecao-revisar').addEventListener('click', abrirRevisao);
$('#modal-voltar').addEventListener('click', () => modal.close());
$('#modal-concluir').addEventListener('click', () => modal.close());
modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });

$('#modal-confirmar').addEventListener('click', async () => {
    const ids = [...selecionados];
    if (!ids.length) return;
    const erro = $('#modal-erro');
    erro.hidden = true;

    const convidado = identificacao.ler();
    if (!convidado) return;

    const botao = $('#modal-confirmar');
    botao.disabled = true;
    botao.innerHTML = '<i class="bi bi-hourglass-split"></i> Confirmando…';

    try {
        await reservar(ids, convidado);
    } catch (e) {
        botao.disabled = false;
        if (e instanceof JaEscolhidos) {
            const nomes = e.ids.map((id) => porId.get(id).item).join(', ');
            e.ids.forEach((id) => { escolhidos.add(id); selecionados.delete(id); });
            atualizarCartoes();
            erro.textContent = `${nomes} ${plural(e.ids.length, 'acabou de ser escolhido', 'acabaram de ser escolhidos')} por outro convidado e ${plural(e.ids.length, 'saiu', 'saíram')} da sua seleção. Nada foi reservado ainda: revise e confirme de novo.`;
            if (!selecionados.size) {
                erro.textContent += ' Sua seleção ficou vazia; escolha outro item na lista.';
                botao.disabled = true;
            }
            desenharRevisao();
        } else {
            console.error(e);
            erro.textContent = 'Não conseguimos confirmar agora. Verifique sua internet e tente de novo.';
            desenharRevisao();
        }
        erro.hidden = false;
        return;
    }
    identificacao.lembrar(convidado);

    // aviso para os organizadores
    const lista = ids.map((id) => `• ${porId.get(id).item}`);
    const texto = [
        `🎁 *${plural(ids.length, 'Presente escolhido', 'Presentes escolhidos')}*`,
        '',
        `*Nome:* ${convidado.nome}`,
        `*WhatsApp:* ${formatarTelefone(convidado.telefone)}`,
        '',
        ...lista,
        '',
        `_Casamento Álfani & Amanda · ${agoraFormatado()}_`,
    ].join('\n');
    const { pendentes, previa } = await avisarOrganizadores(texto);

    // tela de sucesso
    const final = $('#revisao-final');
    final.innerHTML = '';
    ids.forEach((id) => {
        const li = document.createElement('li');
        li.innerHTML = '<i class="bi bi-gift" aria-hidden="true"></i> <span></span>';
        li.querySelector('span').textContent = porId.get(id).item;
        final.appendChild(li);
    });
    $('#modal-sucesso-texto').textContent =
        `${convidado.nome.split(' ')[0]}, ${plural(ids.length, 'seu presente está reservado', 'seus presentes estão reservados')}` +
        (previa ? '.' : ' e os noivos já foram avisados.');
    const caixa = $('#lista-pendentes');
    botoesPendentes(caixa, previa ? [] : pendentes, texto);
    if (previa) {
        caixa.hidden = false;
        caixa.innerHTML = '<p class="previa-aviso">Modo prévia: nada foi gravado nem enviado. Os organizadores receberiam:</p><pre class="previa-mensagem"></pre>';
        caixa.querySelector('pre').textContent = texto;
    }

    selecionados.clear();
    atualizarCartoes();
    $('#modal-corpo').hidden = true;
    $('#modal-sucesso').hidden = false;
});

// ---- Busca ---------------------------------------------------------------
$('#busca').addEventListener('input', (e) => {
    termoBusca = normalizar(e.target.value.trim());
    aplicarFiltros();
});

// ---- Pix -----------------------------------------------------------------
if (CONF.pix?.chave) {
    $('#pix').hidden = false;
    $('#pix-chave').textContent = CONF.pix.chave;
    $('#pix-titular').textContent = CONF.pix.titular;
    $('#pix-copiar').addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(CONF.pix.chave);
            mostrarAviso('Chave Pix copiada!');
        } catch {
            const faixa = document.createRange();
            faixa.selectNodeContents($('#pix-chave'));
            getSelection().removeAllRanges();
            getSelection().addRange(faixa);
            mostrarAviso('Chave selecionada. Use "copiar" do seu aparelho.');
        }
    });
}

// ---- Rodapé --------------------------------------------------------------
const contato = (CONF.organizadores ?? []).find((o) => o.telefone)?.telefone;
if (contato) $('#link-whats').href = `https://wa.me/${contato}`;
else $('#link-whats').hidden = true;

// ---- Início --------------------------------------------------------------
montarFiltros();
montarLista();
atualizarCartoes();

if (PREVIA) {
    avisoConexao('Modo prévia: as escolhas feitas aqui não são salvas no banco.');
} else {
    banco = await conectar();
    if (banco) ouvirEscolhidos();
    else avisoConexao('Não conseguimos verificar quais presentes já foram escolhidos. Recarregue a página em instantes.');
}
