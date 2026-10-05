/* =========================================================
   Painel do administrador — lembrete para quem confirmou
   - login com e-mail e senha (Firebase Authentication); quem pode entrar
     é definido nas regras do Firestore (função admin)
   - lista as confirmações do banco em tempo real
   - botão "Lembrar" abre o seu WhatsApp com a mensagem pronta
   - marca no banco quem já foi lembrado
   ========================================================= */
import { CONF, PREVIA, conectar, formatarTelefone, linkWhats } from './servicos.js';

const $ = (s) => document.querySelector(s);

let convidados = [];          // documentos do RSVP
let filtro = 'pendentes';
let termo = '';
let banco = null;
let quemSou = '';             // quem está logado (vai em "lembrado por")
let totalPresentes = 0;       // itens escolhidos (presentes-casamento-2026)
let totalEscolhas = 0;        // registros de quem escolheu (escolhas-presentes-2026)

// ---- Texto padrão do lembrete -------------------------------------------
function textoPadrao() {
    const data = new Date(CONF.dataEvento);
    const dia = data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).replace(':00', 'h');
    const local = CONF.local ?? {};
    const link = CONF.siteUrl ? `${CONF.siteUrl.replace(/\/$/, '')}/#local` : (local.googleMaps || '');
    return [
        'Olá, {nome}! 💙',
        '',
        'Passando para lembrar do nosso jantar de casamento:',
        '',
        `📅 *${dia.charAt(0).toUpperCase() + dia.slice(1)}, às ${hora}*`,
        `📍 *${local.nome ?? 'Espaço Paraíso – Eventos'}*`,
        local.endereco ?? '',
        ...(link ? ['', `Como chegar: ${link}`] : []),
        '',
        'Estamos muito felizes em celebrar esse dia com você!',
        'Álfani & Amanda',
    ].join('\n');
}

const CHAVE_TEXTO = 'casamento-aa-lembrete';
const campoMensagem = $('#mensagem');
function lerTexto() {
    try { return localStorage.getItem(CHAVE_TEXTO) || textoPadrao(); } catch { return textoPadrao(); }
}
function salvarTexto(t) {
    try { localStorage.setItem(CHAVE_TEXTO, t); } catch { /* segue sem salvar */ }
}
campoMensagem.value = lerTexto();
campoMensagem.addEventListener('input', () => { salvarTexto(campoMensagem.value); render(); });
$('#mensagem-padrao').addEventListener('click', () => {
    campoMensagem.value = textoPadrao();
    try { localStorage.removeItem(CHAVE_TEXTO); } catch { /* nada */ }
    render();
});
document.querySelectorAll('.marcador').forEach((b) => b.addEventListener('click', () => {
    const { selectionStart: i, selectionEnd: f, value } = campoMensagem;
    campoMensagem.value = value.slice(0, i) + b.dataset.marcador + value.slice(f);
    campoMensagem.focus();
    campoMensagem.setSelectionRange(i + b.dataset.marcador.length, i + b.dataset.marcador.length);
    salvarTexto(campoMensagem.value);
    render();
}));

function mensagemPara(c) {
    return campoMensagem.value
        .replaceAll('{nome_completo}', c.nome)
        .replaceAll('{nome}', c.nome.split(' ')[0]);
}

// ---- Utilidades ----------------------------------------------------------
const normalizar = (t) => String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const paraData = (v) => (v?.toDate ? v.toDate() : v instanceof Date ? v : null);
const dataCurta = (v) => paraData(v)?.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }) ?? '';

function mostrarAviso(texto) {
    const aviso = $('#aviso');
    aviso.textContent = texto;
    aviso.classList.add('visivel');
    clearTimeout(mostrarAviso.t);
    mostrarAviso.t = setTimeout(() => aviso.classList.remove('visivel'), 3800);
}

// ---- Marcar como lembrado -----------------------------------------------
async function marcar(c, lembrado) {
    if (PREVIA) {
        c.lembreteEm = lembrado ? new Date() : null;
        c.lembretePor = lembrado ? quemSou : null;
        render();
        return;
    }
    const { fs, db } = banco;
    try {
        await fs.updateDoc(fs.doc(db, CONF.colecoes.rsvp, c.telefone), lembrado
            ? { lembreteEm: fs.serverTimestamp(), lembretePor: quemSou }
            : { lembreteEm: fs.deleteField(), lembretePor: fs.deleteField() });
    } catch (e) {
        console.error(e);
        mostrarAviso('Não foi possível salvar a marcação. Confira a internet e as regras do Firestore.');
    }
}

// ---- Renderização --------------------------------------------------------
function grupos() {
    const sim = convidados.filter((c) => c.presenca === 'sim');
    return {
        sim,
        pendentes: sim.filter((c) => !c.lembreteEm),
        lembrados: sim.filter((c) => c.lembreteEm),
        nao: convidados.filter((c) => c.presenca === 'nao'),
    };
}

function render() {
    const g = grupos();
    $('#n-confirmados').textContent = g.sim.length;
    $('#n-lembrados').textContent = g.lembrados.length;
    $('#n-lembrados-total').textContent = g.sim.length;
    $('#n-nao').textContent = g.nao.length;
    $('#barra-lembrados').style.width = g.sim.length ? `${(g.lembrados.length / g.sim.length) * 100}%` : '0';
    $('#f-pendentes').textContent = g.pendentes.length;
    $('#f-lembrados').textContent = g.lembrados.length;
    $('#f-nao').textContent = g.nao.length;

    // exemplo da mensagem
    const exemplo = g.sim[0] ?? { nome: 'Maria Souza' };
    $('#exemplo-nome').textContent = exemplo.nome.split(' ')[0];
    $('#exemplo-texto').textContent = mensagemPara(exemplo);

    // "lembrar próximo"
    const proximo = g.pendentes[0];
    const botaoProximo = $('#lembrar-proximo');
    botaoProximo.hidden = !proximo || filtro !== 'pendentes';
    if (proximo) {
        botaoProximo.href = linkWhats(proximo.telefone, mensagemPara(proximo));
        $('#proximo-nome').textContent = proximo.nome.split(' ')[0];
        // marca depois que o navegador já abriu o WhatsApp
        botaoProximo.onclick = () => setTimeout(() => marcar(proximo, true), 400);
    }

    // lista
    const lista = (g[filtro] ?? [])
        .filter((c) => !termo || normalizar(c.nome).includes(termo) || c.telefone.includes(termo.replace(/\D/g, '') || '§'));
    const ul = $('#convidados');
    ul.innerHTML = '';
    lista.forEach((c) => ul.appendChild(linha(c)));

    const vazio = $('#vazio');
    vazio.hidden = lista.length > 0;
    vazio.textContent = termo ? 'Ninguém encontrado com essa busca.'
        : filtro === 'pendentes' ? (g.sim.length ? 'Todos os confirmados já foram lembrados. 💙' : 'Ainda não há confirmações.')
        : filtro === 'lembrados' ? 'Ninguém foi lembrado ainda.'
        : 'Ninguém respondeu que não vai.';
}

function linha(c) {
    const li = document.createElement('li');
    li.className = 'convidado';
    if (c.lembreteEm) li.classList.add('convidado--lembrado');

    const info = document.createElement('div');
    info.className = 'convidado__info';
    info.innerHTML = '<strong></strong><span class="convidado__tel"></span><span class="convidado__meta"></span>';
    info.querySelector('strong').textContent = c.nome;
    info.querySelector('.convidado__tel').textContent = formatarTelefone(c.telefone);
    const meta = [];
    if (c.presenca === 'sim' && c.lembreteEm) meta.push(`Lembrado ${dataCurta(c.lembreteEm)}${c.lembretePor ? ` por ${c.lembretePor}` : ''}`);
    else if (c.atualizadoEm) meta.push(`Respondeu ${dataCurta(c.atualizadoEm)}`);
    info.querySelector('.convidado__meta').textContent = meta.join(' · ');
    li.appendChild(info);

    const acoes = document.createElement('div');
    acoes.className = 'convidado__acoes';
    if (c.presenca === 'sim') {
        const enviar = document.createElement('a');
        enviar.className = `botao botao--pequeno ${c.lembreteEm ? 'botao--contorno' : 'botao--cheio botao--auto'}`;
        enviar.target = '_blank';
        enviar.rel = 'noopener';
        enviar.href = linkWhats(c.telefone, mensagemPara(c));
        enviar.innerHTML = `<i class="bi bi-whatsapp"></i> ${c.lembreteEm ? 'Reenviar' : 'Lembrar'}`;
        enviar.addEventListener('click', () => { if (!c.lembreteEm) setTimeout(() => marcar(c, true), 400); });
        acoes.appendChild(enviar);

        if (c.lembreteEm) {
            const desfazer = document.createElement('button');
            desfazer.type = 'button';
            desfazer.className = 'botao-link';
            desfazer.textContent = 'Desmarcar';
            desfazer.addEventListener('click', () => marcar(c, false));
            acoes.appendChild(desfazer);
        }
    } else {
        const conversar = document.createElement('a');
        conversar.className = 'botao botao--contorno botao--pequeno';
        conversar.target = '_blank';
        conversar.rel = 'noopener';
        conversar.href = linkWhats(c.telefone);
        conversar.innerHTML = '<i class="bi bi-chat"></i> Conversar';
        acoes.appendChild(conversar);
    }
    li.appendChild(acoes);
    return li;
}

// filtros e busca
document.querySelectorAll('.painel-filtros .filtro').forEach((b) => b.addEventListener('click', () => {
    filtro = b.dataset.filtro;
    document.querySelectorAll('.painel-filtros .filtro').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    render();
}));
$('#busca').addEventListener('input', (e) => { termo = normalizar(e.target.value.trim()); render(); });

// copiar números (útil para montar uma lista de transmissão)
$('#copiar-numeros').addEventListener('click', async () => {
    const numeros = grupos().sim.map((c) => `+${c.telefone}`).join('\n');
    if (!numeros) { mostrarAviso('Ainda não há números para copiar.'); return; }
    try {
        await navigator.clipboard.writeText(numeros);
        mostrarAviso(`${grupos().sim.length} números copiados.`);
    } catch {
        mostrarAviso('Não foi possível copiar automaticamente neste navegador.');
    }
});

// ---- Lista de presentes (zerar depois dos testes) -----------------------
function renderPresentes() {
    const total = totalPresentes + totalEscolhas;
    $('#presentes-resumo').textContent = total
        ? `${totalPresentes} presente(s) escolhido(s) · ${totalEscolhas} registro(s) de quem escolheu.`
        : 'Nenhum presente escolhido ainda.';
    $('#zerar-presentes').disabled = total === 0;
}

async function zerarPresentes() {
    if (PREVIA || !banco) { mostrarAviso('Modo prévia: nada para apagar.'); return; }
    const total = totalPresentes + totalEscolhas;
    if (!total) { mostrarAviso('Não há presentes escolhidos para apagar.'); return; }
    const ok = confirm(
        `Apagar ${totalPresentes} presente(s) escolhido(s) e ${totalEscolhas} registro(s) de quem escolheu?\n\n` +
        'Isso libera todos os itens da lista novamente. Não pode ser desfeito.',
    );
    if (!ok) return;

    const botao = $('#zerar-presentes');
    botao.disabled = true;
    botao.textContent = 'Apagando…';
    try {
        const { fs, db } = banco;
        const [presentesSnap, escolhasSnap] = await Promise.all([
            fs.getDocs(fs.collection(db, CONF.colecoes.presentes)),
            fs.getDocs(fs.collection(db, CONF.colecoes.escolhas)),
        ]);
        const refs = [...presentesSnap.docs, ...escolhasSnap.docs].map((d) => d.ref);
        for (let i = 0; i < refs.length; i += 450) {
            const lote = fs.writeBatch(db);
            refs.slice(i, i + 450).forEach((ref) => lote.delete(ref));
            await lote.commit();
        }
        mostrarAviso('Lista de presentes zerada.');
    } catch (e) {
        console.error(e);
        mostrarAviso('Não foi possível apagar. Confira as regras do Firestore e tente de novo.');
    } finally {
        botao.textContent = 'Apagar todos os presentes escolhidos';
        renderPresentes();
    }
}
$('#zerar-presentes').addEventListener('click', zerarPresentes);

// ---- Confirmações / RSVP (zerar depois dos testes) -----------------------
function renderConvidadosZerar() {
    const total = convidados.length;
    $('#convidados-resumo').textContent = total
        ? `${total} confirmação(ões) de presença registrada(s).`
        : 'Nenhuma confirmação registrada ainda.';
    $('#zerar-convidados').disabled = total === 0;
}

async function zerarConvidados() {
    if (PREVIA || !banco) { mostrarAviso('Modo prévia: nada para apagar.'); return; }
    const total = convidados.length;
    if (!total) { mostrarAviso('Não há confirmações para apagar.'); return; }
    const ok = confirm(
        `Apagar ${total} confirmação(ões) de presença (quem confirmou, quem não vai e quem já foi lembrado)?\n\n` +
        'O site volta a não ter nenhum convidado respondido. Não pode ser desfeito.',
    );
    if (!ok) return;

    const botao = $('#zerar-convidados');
    botao.disabled = true;
    botao.textContent = 'Apagando…';
    try {
        const { fs, db } = banco;
        const snap = await fs.getDocs(fs.collection(db, CONF.colecoes.rsvp));
        const refs = snap.docs.map((d) => d.ref);
        for (let i = 0; i < refs.length; i += 450) {
            const lote = fs.writeBatch(db);
            refs.slice(i, i + 450).forEach((ref) => lote.delete(ref));
            await lote.commit();
        }
        mostrarAviso('Confirmações zeradas.');
    } catch (e) {
        console.error(e);
        mostrarAviso('Não foi possível apagar. Confira as regras do Firestore e tente de novo.');
    } finally {
        botao.textContent = 'Apagar todas as confirmações (RSVP)';
        renderConvidadosZerar();
    }
}
$('#zerar-convidados').addEventListener('click', zerarConvidados);

// ---- Telas ---------------------------------------------------------------
function mostrar(tela) {
    $('#carregando').hidden = true;
    $('#tela-login').hidden = tela !== 'login';
    $('#tela-painel').hidden = tela !== 'painel';
    $('#sair').hidden = tela !== 'painel' || PREVIA;
}

// ---- Prévia (sem banco): dados de exemplo --------------------------------
function iniciarPrevia() {
    $('#aviso-previa').hidden = false;
    quemSou = 'Admin';
    const h = (dias, horas = 0) => new Date(Date.now() - (dias * 24 + horas) * 3600e3);
    convidados = [
        { nome: 'Maria da Silva (exemplo)',  telefone: '5561982103445', presenca: 'sim', atualizadoEm: h(6) },
        { nome: 'João Pereira (exemplo)',    telefone: '5561991234567', presenca: 'sim', atualizadoEm: h(5, 3) },
        { nome: 'Ana Beatriz Costa (exemplo)', telefone: '5561998887766', presenca: 'sim', atualizadoEm: h(4), lembreteEm: h(0, 2), lembretePor: quemSou },
        { nome: 'Carlos Henrique (exemplo)', telefone: '5561987654321', presenca: 'sim', atualizadoEm: h(3) },
        { nome: 'Fernanda Lima (exemplo)',   telefone: '5561976543210', presenca: 'nao', atualizadoEm: h(2) },
    ];
    mostrar('painel');
    render();
    renderPresentes();
    renderConvidadosZerar();
}

// ---- Firebase: login + dados em tempo real -------------------------------
async function iniciar() {
    banco = await conectar();
    if (!banco) {
        $('#carregando').textContent = 'Não foi possível conectar ao banco. Recarregue a página.';
        return;
    }
    const auth = await import(`https://www.gstatic.com/firebasejs/${CONF.versaoFirebase}/firebase-auth.js`);
    const sessao = auth.getAuth(banco.app);
    let pararDeOuvir = [];

    auth.onAuthStateChanged(sessao, (usuario) => {
        pararDeOuvir.forEach((parar) => parar());
        pararDeOuvir = [];
        if (!usuario) { mostrar('login'); return; }

        quemSou = usuario.displayName || (usuario.email || '').split('@')[0] || 'Admin';

        const { fs, db } = banco;
        pararDeOuvir.push(fs.onSnapshot(
            fs.query(fs.collection(db, CONF.colecoes.rsvp)),
            (snap) => {
                convidados = snap.docs.map((d) => ({ telefone: d.id, ...d.data() }))
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
                mostrar('painel');
                render();
                renderConvidadosZerar();
            },
            (e) => {
                console.error(e);
                if (e.code === 'permission-denied') {
                    // logou, mas o e-mail não está autorizado nas regras do Firestore
                    auth.signOut(sessao);
                    erroLogin('Este login não tem acesso ao painel. Confira o e-mail em firestore.rules (função admin).');
                    return;
                }
                mostrar('painel');
                mostrarAviso('Não foi possível carregar as confirmações. Recarregue a página.');
            },
        ));
        pararDeOuvir.push(fs.onSnapshot(
            fs.collection(db, CONF.colecoes.presentes),
            (snap) => { totalPresentes = snap.size; renderPresentes(); },
            (e) => console.error(e),
        ));
        pararDeOuvir.push(fs.onSnapshot(
            fs.collection(db, CONF.colecoes.escolhas),
            (snap) => { totalEscolhas = snap.size; renderPresentes(); },
            (e) => console.error(e),
        ));
    });

    $('#form-login').addEventListener('submit', async (e) => {
        e.preventDefault();
        const botao = $('#login-entrar');
        $('#login-erro').hidden = true;
        botao.disabled = true;
        botao.textContent = 'Entrando…';
        try {
            await auth.signInWithEmailAndPassword(sessao, $('#login-email').value.trim(), $('#login-senha').value);
        } catch (err) {
            console.warn(err);
            erroLogin(err.code === 'auth/too-many-requests'
                ? 'Muitas tentativas. Aguarde alguns minutos e tente de novo.'
                : 'E-mail ou senha incorretos.');
        } finally {
            botao.disabled = false;
            botao.textContent = 'Entrar';
        }
    });
    $('#sair').addEventListener('click', () => auth.signOut(sessao));
}

function erroLogin(texto) {
    const p = $('#login-erro');
    p.textContent = texto;
    p.hidden = false;
}

if (PREVIA) iniciarPrevia();
else iniciar();
