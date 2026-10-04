/* =========================================================
   Serviços compartilhados (index + lista de presentes)
   - identificação do convidado (nome + WhatsApp)
   - conexão com o Firebase
   - avisos automáticos para os organizadores (CallMeBot)
   ========================================================= */

export const CONF = window.CASAMENTO;
export const PREVIA = Boolean(window.PREVIA_SEM_BANCO);

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------------
   Validação
   ------------------------------------------------------------------- */
const PARTICULAS = new Set(['da', 'das', 'de', 'do', 'dos', 'e']);

/** Exige nome e sobrenome. Ajusta espaços e maiúsculas ("maria da silva" → "Maria da Silva"). */
export function validarNome(bruto) {
    const limpo = String(bruto ?? '').replace(/\s+/g, ' ').trim();
    const partes = limpo.split(' ').filter(Boolean);
    const palavrasReais = partes.filter((p) => !PARTICULAS.has(p.toLowerCase()) && p.replace(/[^\p{L}]/gu, '').length >= 2);
    if (!limpo) return { ok: false, erro: 'Informe seu nome e sobrenome.' };
    if (/[^\p{L}\s'.-]/u.test(limpo)) return { ok: false, erro: 'Use apenas letras no nome.' };
    if (palavrasReais.length < 2) return { ok: false, erro: 'Informe nome e sobrenome.' };
    const valor = partes
        .map((p, i) => (i > 0 && PARTICULAS.has(p.toLowerCase()))
            ? p.toLowerCase()
            : p.charAt(0).toLocaleUpperCase('pt-BR') + p.slice(1).toLocaleLowerCase('pt-BR'))
        .join(' ');
    return { ok: true, valor };
}

/** Aceita celular ou fixo brasileiro com DDD. Devolve só dígitos com 55 na frente. */
export function validarTelefone(bruto) {
    let d = String(bruto ?? '').replace(/\D/g, '');
    if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2);
    if (!d) return { ok: false, erro: 'Informe seu WhatsApp com DDD.' };
    if (d.length !== 10 && d.length !== 11) return { ok: false, erro: 'Número incompleto. Use DDD + número, ex.: (61) 99999-8888.' };
    if (Number(d.slice(0, 2)) < 11) return { ok: false, erro: 'DDD inválido.' };
    if (d.length === 11 && d[2] !== '9') return { ok: false, erro: 'Celular deve começar com 9 depois do DDD.' };
    return { ok: true, valor: `55${d}`, exibicao: formatarTelefone(d) };
}

export function formatarTelefone(digitos) {
    let d = String(digitos).replace(/\D/g, '');
    if (d.length > 11 && d.startsWith('55')) d = d.slice(2);
    if (d.length <= 2) return d ? `(${d}` : '';
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`;
}

/* ---------------------------------------------------------------------
   Convidado identificado (fica salvo só neste aparelho)
   ------------------------------------------------------------------- */
const CHAVE = 'casamento-aa-convidado';

export function lerConvidado() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE) || 'null');
        if (dados && validarNome(dados.nome).ok && validarTelefone(dados.telefone).ok) return dados;
    } catch { /* armazenamento indisponível */ }
    return null;
}
export function salvarConvidado(nome, telefone) {
    const dados = { nome, telefone };
    try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* segue sem salvar */ }
    window.dispatchEvent(new CustomEvent('convidado-mudou', { detail: dados }));
    return dados;
}
export function esquecerConvidado() {
    try { localStorage.removeItem(CHAVE); } catch { /* nada */ }
    window.dispatchEvent(new CustomEvent('convidado-mudou', { detail: null }));
}

/**
 * Monta o bloco "quem é você" dentro de um container.
 * - Já identificado: mostra o nome e o telefone, com "Não é você? Trocar".
 * - Não identificado: mostra os campos Nome e sobrenome + WhatsApp.
 * Retorna { ler() } — ler() valida, mostra erros e devolve {nome, telefone} ou null.
 */
export function montarIdentificacao(container, { prefixo }) {
    let editando = !lerConvidado();

    function render() {
        const atual = lerConvidado();
        if (atual && !editando) {
            container.innerHTML = `
                <div class="identidade">
                    <i class="bi bi-person-check" aria-hidden="true"></i>
                    <div class="identidade__dados">
                        <strong></strong>
                        <span></span>
                    </div>
                    <button type="button" class="botao-link identidade__trocar">Não é você? Trocar</button>
                </div>`;
            container.querySelector('strong').textContent = atual.nome;
            container.querySelector('.identidade__dados span').textContent = formatarTelefone(atual.telefone);
            container.querySelector('.identidade__trocar').addEventListener('click', () => {
                editando = true;
                render();
                container.querySelector('input')?.focus();
            });
            return;
        }
        container.innerHTML = `
            <label class="campo" data-campo="nome">
                <span class="campo__rotulo">Nome e sobrenome</span>
                <input type="text" id="${prefixo}-nome" autocomplete="name" placeholder="Ex.: Maria Souza" required>
                <span class="campo__erro"></span>
            </label>
            <label class="campo" data-campo="telefone">
                <span class="campo__rotulo">WhatsApp com DDD</span>
                <input type="tel" id="${prefixo}-telefone" autocomplete="tel-national" inputmode="tel" placeholder="(61) 99999-8888" maxlength="16" required>
                <span class="campo__erro"></span>
                <span class="campo__ajuda">Usaremos este número só para falar com você sobre o casamento.</span>
            </label>`;
        if (atual) {
            container.querySelector(`#${prefixo}-nome`).value = atual.nome;
            container.querySelector(`#${prefixo}-telefone`).value = formatarTelefone(atual.telefone);
        }
        const tel = container.querySelector(`#${prefixo}-telefone`);
        tel.addEventListener('input', () => {
            const fim = tel.selectionStart === tel.value.length;
            tel.value = formatarTelefone(tel.value);
            if (fim) tel.setSelectionRange(tel.value.length, tel.value.length);
        });
        container.querySelectorAll('input').forEach((i) =>
            i.addEventListener('input', () => i.closest('.campo').classList.remove('invalido')));
    }

    function erro(campo, texto) {
        const el = container.querySelector(`[data-campo="${campo}"]`);
        el.classList.add('invalido');
        el.querySelector('.campo__erro').textContent = texto;
    }

    render();
    window.addEventListener('convidado-mudou', () => { editando = !lerConvidado(); render(); });

    return {
        ler() {
            const atual = lerConvidado();
            if (atual && !editando) return atual;
            const n = validarNome(container.querySelector(`#${prefixo}-nome`).value);
            const t = validarTelefone(container.querySelector(`#${prefixo}-telefone`).value);
            if (!n.ok) erro('nome', n.erro);
            if (!t.ok) erro('telefone', t.erro);
            if (!n.ok || !t.ok) {
                container.querySelector('.campo.invalido input')?.focus();
                return null;
            }
            container.querySelector(`#${prefixo}-nome`).value = n.valor;
            return { nome: n.valor, telefone: t.valor };
        },
        /** grava como "convidado atual" depois que a ação deu certo */
        lembrar(dados) {
            editando = false;
            salvarConvidado(dados.nome, dados.telefone);
        },
    };
}

/* ---------------------------------------------------------------------
   Firebase
   ------------------------------------------------------------------- */
let conexao = null;
export function conectar() {
    if (PREVIA) return Promise.resolve(null);
    conexao ??= (async () => {
        try {
            const v = CONF.versaoFirebase;
            const [{ initializeApp }, fs] = await Promise.race([
                Promise.all([
                    import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
                    import(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore.js`),
                ]),
                esperar(8000).then(() => { throw new Error('tempo esgotado ao carregar o Firebase'); }),
            ]);
            const app = initializeApp(CONF.firebase);
            return { app, db: fs.getFirestore(app), fs };
        } catch (e) {
            console.warn('Firebase indisponível:', e);
            return null;
        }
    })();
    return conexao;
}

/* ---------------------------------------------------------------------
   Avisos para os organizadores
   ------------------------------------------------------------------- */
export const linkWhats = (telefone, texto) =>
    `https://wa.me/${telefone}${texto ? `?text=${encodeURIComponent(texto)}` : ''}`;

/**
 * Envia o texto para cada organizador com apikey do CallMeBot.
 * Retorna { enviados: [...], pendentes: [...] } — "pendentes" são organizadores
 * sem apikey (a página oferece um botão de WhatsApp para eles).
 */
export async function avisarOrganizadores(texto) {
    const organizadores = (CONF.organizadores || []).filter((o) => o.telefone);
    const automaticos = organizadores.filter((o) => o.apikey);
    const pendentes = organizadores.filter((o) => !o.apikey);

    if (PREVIA) {
        console.info('[prévia] aviso que seria enviado aos organizadores:\n' + texto);
        return { enviados: [], pendentes: organizadores, previa: true };
    }

    await Promise.all(automaticos.map(async (o) => {
        const url = `https://api.callmebot.com/whatsapp.php?phone=${o.telefone}` +
            `&text=${encodeURIComponent(texto)}&apikey=${encodeURIComponent(o.apikey)}`;
        try {
            // o CallMeBot não libera CORS: a resposta é "opaca", mas a mensagem é enviada
            await Promise.race([fetch(url, { mode: 'no-cors', cache: 'no-store' }), esperar(8000)]);
        } catch {
            // última tentativa sem fetch
            new Image().src = url;
        }
    }));
    return { enviados: automaticos, pendentes };
}

/** Monta botões "Avisar <nome>" para organizadores sem envio automático. */
export function botoesPendentes(container, pendentes, texto) {
    container.innerHTML = '';
    if (!pendentes.length) { container.hidden = true; return; }
    container.hidden = false;
    const p = document.createElement('p');
    p.textContent = pendentes.length > 1
        ? 'Para concluir, avise os noivos pelo WhatsApp:'
        : 'Para concluir, avise pelo WhatsApp:';
    container.appendChild(p);
    pendentes.forEach((o) => {
        const a = document.createElement('a');
        a.className = 'botao botao--contorno';
        a.target = '_blank';
        a.rel = 'noopener';
        a.href = linkWhats(o.telefone, texto);
        a.innerHTML = '<i class="bi bi-whatsapp"></i> <span></span>';
        a.querySelector('span').textContent = `Avisar ${o.nome}`;
        container.appendChild(a);
    });
}

export function agoraFormatado() {
    return new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });
}
