/* =========================================================
   Convite · Álfani & Amanda — interações da index
   ========================================================= */

// ---- Configurações -------------------------------------------------------
// (organizadores, Firebase e data ficam em config.js)
const CONFIG = {
    dataEvento: new Date(window.CASAMENTO?.dataEvento ?? '2026-11-13T18:00:00-03:00'),
    contato: (window.CASAMENTO?.organizadores ?? []).find((o) => o.telefone)?.telefone ?? '',
};

// ---- Menu ----------------------------------------------------------------
const topo = document.getElementById('topo');
const botaoMenu = document.querySelector('.menu__botao');
const linksMenu = document.getElementById('menu-links');

function fecharMenu() {
    linksMenu.classList.remove('aberto');
    botaoMenu.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
}

botaoMenu.addEventListener('click', () => {
    const abrir = !linksMenu.classList.contains('aberto');
    linksMenu.classList.toggle('aberto', abrir);
    botaoMenu.setAttribute('aria-expanded', String(abrir));
    document.body.style.overflow = abrir ? 'hidden' : '';
});
linksMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', fecharMenu));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') fecharMenu(); });

// fundo do menu ao rolar
const atualizarTopo = () => topo.classList.toggle('rolado', window.scrollY > 40);
atualizarTopo();
window.addEventListener('scroll', atualizarTopo, { passive: true });

// link ativo conforme a seção visível
const secoesMenu = [...linksMenu.querySelectorAll('a')]
    .map((a) => ({ a, secao: document.querySelector(a.getAttribute('href')) }))
    .filter((item) => item.secao);

const observadorMenu = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        secoesMenu.forEach(({ a, secao }) => a.classList.toggle('ativo', secao === entrada.target));
    });
}, { rootMargin: '-45% 0px -50% 0px' });
secoesMenu.forEach(({ secao }) => observadorMenu.observe(secao));

// ---- Abertura do hero: nomes nascendo dos "A" do monograma ---------------
const TEMPO = {
    inicio: 350,          // espera antes do monograma aparecer
    monograma: 1500,      // tempo até as letras começarem a sair dos "A"
    entreLetras: 190,     // intervalo entre uma letra e a próxima (mais alto = mais lento)
    voo: 1500,            // duração do "voo" de cada letra até o lugar
};

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function introHero() {
    const hero = document.querySelector('.hero');
    const titulo = hero.querySelector('.hero__nomes');
    const semAnimacao = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // quebra cada nome em letras
    const grupos = [...titulo.querySelectorAll('.nome')].map((nome) => {
        const texto = nome.textContent.trim();
        nome.textContent = '';
        nome.setAttribute('aria-hidden', 'true');
        const letras = [...texto].map((ch) => {
            const span = document.createElement('span');
            span.className = 'letra';
            span.textContent = ch;
            nome.appendChild(span);
            return span;
        });
        return { letras, origem: document.getElementById(nome.dataset.origem) };
    });

    if (semAnimacao) {
        titulo.classList.add('pronto');
        hero.classList.add('intro-monograma', 'intro-fim');
        document.body.classList.add('intro-ok');
        return;
    }

    // espera as fontes para medir as posições corretamente (máx. 2,5s)
    await Promise.race([document.fonts?.ready, esperar(2500)]);

    // posiciona cada letra em cima do seu "A" de origem, invisível e reduzida
    grupos.forEach(({ letras, origem }) => {
        const alvo = origem.getBoundingClientRect();
        const escalaA = parseFloat(getComputedStyle(origem).fontSize);
        letras.forEach((letra) => {
            const r = letra.getBoundingClientRect();
            const dx = (alvo.left + alvo.width / 2) - (r.left + r.width / 2);
            const dy = (alvo.top + alvo.height / 2) - (r.top + r.height / 2);
            const escala = escalaA / parseFloat(getComputedStyle(letra).fontSize);
            letra.style.transition = 'none';
            letra.style.opacity = '0';
            letra.style.filter = 'blur(6px)';
            letra.style.transform = `translate(${dx}px, ${dy}px) scale(${escala})`;
        });
    });
    titulo.getBoundingClientRect(); // força o navegador a aplicar o estado inicial
    titulo.classList.add('pronto');

    await esperar(TEMPO.inicio);
    hero.classList.add('intro-monograma');
    await esperar(TEMPO.monograma);

    // as letras saem dos "A", uma a uma, e vão formando os nomes
    const maiorNome = Math.max(...grupos.map((g) => g.letras.length));
    grupos.forEach(({ letras }) => {
        letras.forEach((letra, i) => {
            const atraso = i * TEMPO.entreLetras;
            letra.style.transition = [
                `transform ${TEMPO.voo}ms cubic-bezier(.22, .9, .28, 1) ${atraso}ms`,
                `opacity ${TEMPO.voo * 0.6}ms ease ${atraso}ms`,
                `filter ${TEMPO.voo}ms ease ${atraso}ms`,
            ].join(', ');
            letra.style.opacity = '1';
            letra.style.filter = 'blur(0)';
            letra.style.transform = 'none';
        });
    });

    await esperar((maiorNome - 1) * TEMPO.entreLetras + TEMPO.voo * 0.75);
    hero.classList.add('intro-fim');
    document.body.classList.add('intro-ok');

    // limpa os estilos inline ao final (evita desalinhamento se a tela mudar de tamanho)
    await esperar(TEMPO.voo);
    grupos.forEach(({ letras }) => letras.forEach((l) => l.removeAttribute('style')));
}
introHero();

// ---- Animação de entrada -------------------------------------------------
const observadorRevelar = new IntersectionObserver((entradas, obs) => {
    entradas.forEach((entrada) => {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('visivel');
        obs.unobserve(entrada.target);
    });
}, { threshold: 0.15 });

document.querySelectorAll('.revelar').forEach((el) => {
    // pequeno atraso em cascata dentro de cada seção
    const irmaos = [...el.closest('.conteudo, .historia, section').querySelectorAll('.revelar')];
    el.style.transitionDelay = `${Math.min(irmaos.indexOf(el), 8) * 90}ms`;
    observadorRevelar.observe(el);
});

// ---- Contagem regressiva -------------------------------------------------
const campos = {
    dias: document.getElementById('dias'),
    horas: document.getElementById('horas'),
    minutos: document.getElementById('minutos'),
    segundos: document.getElementById('segundos'),
};
const doisDigitos = (n) => String(n).padStart(2, '0');

function atualizarContador() {
    const restante = Math.max(0, Math.floor((CONFIG.dataEvento - Date.now()) / 1000));
    campos.dias.textContent = Math.floor(restante / 86400);
    campos.horas.textContent = doisDigitos(Math.floor(restante / 3600) % 24);
    campos.minutos.textContent = doisDigitos(Math.floor(restante / 60) % 60);
    campos.segundos.textContent = doisDigitos(restante % 60);
}
atualizarContador();
setInterval(atualizarContador, 1000);

// ---- Rotas até o local (Google Maps, Waze, Uber) -------------------------
(function montarRotas() {
    const local = window.CASAMENTO?.local;
    if (!local) return;
    const { latitude: lat, longitude: lng } = local;

    if (local.googleMaps) document.getElementById('rota-google').href = local.googleMaps;

    document.getElementById('rota-waze').href =
        `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    // link universal do Uber: no celular abre o app (ou o site) com o destino preenchido
    const uber = new URLSearchParams({
        action: 'setPickup',
        pickup: 'my_location',
        'dropoff[latitude]': lat,
        'dropoff[longitude]': lng,
        'dropoff[nickname]': local.nome,
        'dropoff[formatted_address]': local.endereco,
    });
    document.getElementById('rota-uber').href = `https://m.uber.com/ul/?${uber}`;
})();

// ---- RSVP: veja rsvp.js -----------------------------------------------

// ---- Rodapé --------------------------------------------------------------
const linkWhatsRodape = document.getElementById('link-whats');
if (CONFIG.contato) linkWhatsRodape.href = `https://wa.me/${CONFIG.contato}`;
else linkWhatsRodape.hidden = true;
