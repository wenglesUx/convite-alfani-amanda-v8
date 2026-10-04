/* =========================================================
   Confirmação de presença (RSVP) — convite individual
   - 1 resposta por WhatsApp (o telefone é a chave no banco)
   - o mesmo número não pode responder por outra pessoa
   - avisa os organizadores automaticamente
   ========================================================= */
import {
    CONF, PREVIA, montarIdentificacao, lerConvidado, conectar,
    avisarOrganizadores, botoesPendentes, formatarTelefone, agoraFormatado,
} from './servicos.js';

const $ = (s) => document.querySelector(s);
const form = $('#form-rsvp');
const botao = $('#rsvp-enviar');
const erroGeral = $('#rsvp-erro');
const anterior = $('#rsvp-anterior');
const sucesso = $('#rsvp-sucesso');

const RESPOSTAS = {
    sim: { curta: 'Sim, estarei presente', aviso: '✅ Vai comparecer' },
    nao: { curta: 'Não poderei comparecer', aviso: '❌ Não poderá comparecer' },
};
// mantém respostas da prévia na memória (não há banco na prévia)
const respostasPrevia = new Map();

const identificacao = montarIdentificacao($('#rsvp-identificacao'), { prefixo: 'rsvp' });
const comparar = (n) => n.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

async function buscarResposta(telefone) {
    if (PREVIA) return respostasPrevia.get(telefone) ?? null;
    const banco = await conectar();
    if (!banco) return null;
    try {
        const snap = await banco.fs.getDoc(banco.fs.doc(banco.db, CONF.colecoes.rsvp, telefone));
        return snap.exists() ? snap.data() : null;
    } catch (e) {
        console.warn('Não foi possível ler a resposta anterior:', e);
        return null;
    }
}

/** Mostra "você já respondeu…" para quem já está identificado neste aparelho. */
async function mostrarRespostaAnterior() {
    const convidado = lerConvidado();
    anterior.hidden = true;
    if (!convidado) return;
    const resp = await buscarResposta(convidado.telefone);
    if (!resp || resp.telefone !== convidado.telefone) return;
    anterior.innerHTML = '<i class="bi bi-info-circle" aria-hidden="true"></i> <span></span>';
    anterior.querySelector('span').textContent =
        `Você já respondeu: "${RESPOSTAS[resp.presenca]?.curta ?? resp.presenca}". Se quiser, altere abaixo.`;
    anterior.hidden = false;
    const radio = form.querySelector(`input[name="presenca"][value="${resp.presenca}"]`);
    if (radio && !form.presenca.value) radio.checked = true;
}
mostrarRespostaAnterior();
window.addEventListener('convidado-mudou', mostrarRespostaAnterior);

form.querySelectorAll('input[name="presenca"]').forEach((r) =>
    r.addEventListener('change', () => r.closest('.campo').classList.remove('invalido')));

function falhar(texto) {
    erroGeral.textContent = texto;
    erroGeral.hidden = false;
    botao.disabled = false;
    botao.innerHTML = 'Confirmar resposta <i class="bi bi-send"></i>';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroGeral.hidden = true;

    const convidado = identificacao.ler();
    const presenca = form.presenca.value;
    if (!presenca) form.querySelector('[data-campo="presenca"]').classList.add('invalido');
    if (!convidado || !presenca) return;

    botao.disabled = true;
    botao.innerHTML = '<i class="bi bi-hourglass-split"></i> Enviando…';

    // 1) grava no banco (o telefone é a chave: uma resposta por convidado)
    const existente = await buscarResposta(convidado.telefone);
    if (existente && comparar(existente.nome) !== comparar(convidado.nome)) {
        falhar(`Este WhatsApp já foi usado para responder por ${existente.nome}. ` +
               'O convite é individual: cada convidado deve confirmar com o próprio número.');
        return;
    }

    if (PREVIA) {
        respostasPrevia.set(convidado.telefone, { ...convidado, presenca });
    } else {
        const banco = await conectar();
        if (!banco) {
            falhar('Não conseguimos registrar sua resposta agora. Verifique sua internet e tente de novo.');
            return;
        }
        try {
            const { fs, db } = banco;
            await fs.setDoc(fs.doc(db, CONF.colecoes.rsvp, convidado.telefone), {
                // ao alterar, mantém o nome exatamente como foi gravado (regra do Firestore)
                nome: existente ? existente.nome : convidado.nome,
                telefone: convidado.telefone,
                presenca,
                atualizadoEm: fs.serverTimestamp(),
                ...(existente ? {} : { criadoEm: fs.serverTimestamp() }),
            }, { merge: true });
        } catch (erro) {
            console.error(erro);
            falhar('Não conseguimos registrar sua resposta agora. Tente de novo em instantes.');
            return;
        }
    }
    identificacao.lembrar(convidado);

    // 2) avisa os organizadores
    const mudou = existente && existente.presenca !== presenca;
    const titulo = !existente ? '💌 *Nova resposta ao convite*'
        : mudou ? '🔄 *Resposta ao convite alterada*'
        : '💌 *Resposta ao convite reenviada*';
    const texto = [
        titulo,
        '',
        `*Nome:* ${convidado.nome}`,
        `*WhatsApp:* ${formatarTelefone(convidado.telefone)}`,
        `*Resposta:* ${RESPOSTAS[presenca].aviso}`,
        ...(mudou ? [`_Antes: ${RESPOSTAS[existente.presenca]?.aviso ?? existente.presenca}_`] : []),
        '',
        `_Casamento Álfani & Amanda · ${agoraFormatado()}_`,
    ].join('\n');
    const { pendentes, previa } = await avisarOrganizadores(texto);

    // 3) mostra o resultado
    $('#rsvp-sucesso-titulo').textContent = presenca === 'sim' ? 'Presença confirmada!' : 'Resposta registrada';
    $('#rsvp-sucesso-texto').textContent = presenca === 'sim'
        ? `Que alegria, ${convidado.nome.split(' ')[0]}! Contamos com você no dia 13 de novembro.`
        : `Obrigado por avisar, ${convidado.nome.split(' ')[0]}. Sentiremos sua falta!`;
    botoesPendentes($('#rsvp-pendentes'), previa ? [] : pendentes, texto);
    if (previa) {
        const caixa = $('#rsvp-pendentes');
        caixa.hidden = false;
        caixa.innerHTML = '<p class="previa-aviso">Modo prévia: nada foi gravado nem enviado. Os organizadores receberiam:</p><pre class="previa-mensagem"></pre>';
        caixa.querySelector('pre').textContent = texto;
    }
    form.hidden = true;
    sucesso.hidden = false;
    sucesso.scrollIntoView({ behavior: 'smooth', block: 'center' });
    botao.disabled = false;
    botao.innerHTML = 'Confirmar resposta <i class="bi bi-send"></i>';
});

$('#rsvp-alterar').addEventListener('click', () => {
    sucesso.hidden = true;
    form.hidden = false;
    mostrarRespostaAnterior();
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
