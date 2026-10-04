/* =========================================================
   CONFIGURAÇÃO DO SITE · Álfani & Amanda
   Tudo que muda de um evento para outro fica aqui.
   ========================================================= */

window.CASAMENTO = {

    /* ---- Noivos: recebem os avisos de confirmação e de presentes -------
       Os avisos chegam AUTOMATICAMENTE pelo CallMeBot (gratuito).
       Cada um precisa ativar o próprio número UMA vez:
         1. Salvar o contato do CallMeBot: +34 684 770 005
            (confira o número atual em https://www.callmebot.com/blog/free-api-whatsapp-messages/)
         2. Enviar para ele, pelo WhatsApp: I allow callmebot to send me messages
         3. Em até 2 minutos chega a "apikey". Cole abaixo.
       telefone: DDI + DDD + número, só dígitos (ex.: 5561999998888)
       Enquanto a apikey estiver vazia, o convidado vê um botão para
       avisar o noivo/a noiva pelo WhatsApp dele mesmo (plano B).          */
    organizadores: [
        { nome: 'Álfani', telefone: '5561994061823', apikey: '' },
        { nome: 'Amanda', telefone: '5561984066880', apikey: '' },
    ],

    /* O acesso ao painel (painel.html) é controlado pelo Firebase:
       crie o seu login em Authentication → Usuários → Adicionar usuário
       e coloque o mesmo e-mail em firestore.rules (função admin).
       O e-mail NÃO fica aqui porque este arquivo é público.               */

    /* Endereço público do site (vai no lembrete). Ex.: https://alfani-e-amanda.netlify.app */
    siteUrl: 'https://alfani-e-amanda.netlify.app',   // troque se o nome do site no Netlify for outro

    /* ---- Banco de dados (Firebase / Firestore) ------------------------- */
    firebase: {
        apiKey: 'AIzaSyBdXIIEcMKb3aqdS9BXlfeeKULLTDHN9Kg',
        authDomain: 'alfani-e-amanda.firebaseapp.com',
        projectId: 'alfani-e-amanda',
        storageBucket: 'alfani-e-amanda.firebasestorage.app',
        messagingSenderId: '628016980870',
        appId: '1:628016980870:web:ca73a8506f95a7e4a70207',
    },
    versaoFirebase: '10.11.0',
    colecoes: {
        presentes: 'presentes-casamento-2026',   // status público de cada item (livre/escolhido)
        rsvp: 'rsvp-casamento-2026',             // um documento por telefone (convite individual)
        escolhas: 'escolhas-presentes-2026',     // quem escolheu o quê (nome + WhatsApp), só o admin lê (pelo painel ou Console)
    },

    /* ---- Evento ---------------------------------------------------------- */
    dataEvento: '2026-11-13T18:00:00-03:00',

    /* ---- Local (usado nos botões Google Maps, Waze e Uber) --------------
       As coordenadas definem o destino exato no Waze e no Uber.
       Para conferir: abra o Google Maps, toque e segure no local e copie
       os dois números que aparecem (latitude, longitude).               */
    local: {
        nome: 'Espaço Paraíso – Eventos',
        endereco: 'R. Caçapava, Qd. 8, Lt. 11 - Jardim Zuleika, Luziânia - GO, 72850-170',
        latitude: -16.1359082,
        longitude: -47.9591609,
        googleMaps: 'https://share.google/DKx1PzBp9vqPbJ42H',
    },

    /* ---- Pix (opcional; chave vazia esconde a seção na lista) ------------ */
    pix: { chave: '', titular: '' },
};
