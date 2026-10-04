/* =========================================================
   CONFIGURAÇÃO DO SITE · Álfani & Amanda
   Tudo que muda de um evento para outro fica aqui.
   ========================================================= */

window.CASAMENTO = {

    /* ---- Organizadores que recebem os avisos ---------------------------
       Os avisos chegam AUTOMATICAMENTE pelo CallMeBot (gratuito).
       Cada organizador precisa ativar o próprio número UMA vez:
         1. Salvar o contato do CallMeBot: +34 684 770 005
            (confira o número atual em https://www.callmebot.com/blog/free-api-whatsapp-messages/)
         2. Enviar para ele, pelo WhatsApp: I allow callmebot to send me messages
         3. Em até 2 minutos chega a "apikey". Cole abaixo.
       telefone: DDI + DDD + número, só dígitos (ex.: 5561999998888)
       Enquanto a apikey estiver vazia, o convidado vê um botão para
       avisar aquele organizador pelo WhatsApp dele mesmo (plano B).      */
    organizadores: [
        { nome: 'Organizador 1', telefone: '556182103445', apikey: '', email: '' },   // TODO
        { nome: 'Organizador 2', telefone: '',             apikey: '', email: '' },   // TODO
    ],
    /* "email" é o login do organizador no painel (painel.html).
       Crie o usuário em: Console do Firebase → Authentication → Usuários →
       Adicionar usuário (e-mail + senha). Use o mesmo e-mail em firestore.rules. */

    /* Endereço público do site (vai no lembrete). Ex.: https://alfani-e-amanda.netlify.app */
    siteUrl: '',   // TODO

    /* ---- Banco de dados (Firebase / Firestore) ------------------------- */
    firebase: {
        apiKey: 'AIzaSyDLv5Kik57zsSFjcOZByy8aqsZHdKUt8uo',
        authDomain: 'lista-de-presentes-ff7f9.firebaseapp.com',
        projectId: 'lista-de-presentes-ff7f9',
        storageBucket: 'lista-de-presentes-ff7f9.appspot.com',
        messagingSenderId: '527502996022',
        appId: '1:527502996022:web:7a84e19fd64727fe861e97',
    },
    versaoFirebase: '10.11.0',
    colecoes: {
        presentes: 'presentes-casamento-2026',   // status público de cada item (livre/escolhido)
        rsvp: 'rsvp-casamento-2026',             // um documento por telefone (convite individual)
        escolhas: 'escolhas-presentes-2026',     // quem escolheu o quê (nome + WhatsApp), só os organizadores leem
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
