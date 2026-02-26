const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1476582492185170063/oi0UssJcXQ7WrciIGYHIFcV0X8wWZTeAQRGaFf13HwXNOVYvQksybaNrEqaM0Zo_UEru';

/* =========================================================
   1. ANIMATION DE L'ENVELOPPE (INTRO)
   ========================================================= */
const introOverlay = document.getElementById('intro-overlay');
const envelopeCard = document.getElementById('envelope-card');
const envelopeFlap = document.getElementById('envelope-flap');
const envelopeShadow = document.getElementById('envelope-shadow');
const hintText = document.getElementById('hint-text');
const slidesContainer = document.getElementById('slides-container');

// Afficher le hint après 2s
setTimeout(() => {
    if(hintText) hintText.style.opacity = '1';
}, 2000);

let isOpening = false;

document.querySelector('.envelope-scene').addEventListener('click', () => {
    if (isOpening) return;
    isOpening = true;
    if(hintText) hintText.style.opacity = '0';

    // Phase 1 : Flip 3D
    envelopeCard.classList.add('is-flipped');

    // Phase 2 : Ouverture du rabat
    setTimeout(() => {
        envelopeFlap.classList.add('is-open');
    }, 800);

    // Phase 3 : Zoom caméra
    setTimeout(() => {
        envelopeCard.classList.add('is-zoomed');
        envelopeShadow.classList.add('is-hidden');
    }, 1600);

    // Phase 4 : Révélation du site
    setTimeout(() => {
        introOverlay.style.opacity = '0';
        slidesContainer.classList.add('visible');
        document.body.style.overflow = 'auto'; // Active le scroll natif
        
        setTimeout(() => {
            introOverlay.remove(); // Nettoie le DOM
        }, 600);
    }, 2800);
});

/* =========================================================
   2. GÉNÉRATION DE PARTICULES DORÉES
   ========================================================= */
function createParticles(containerId, count) {
    const container = document.getElementById(containerId);
    if (!container) return;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Taille et position aléatoires
        const size = Math.random() * 3 + 1;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Animation aléatoire
        particle.style.animationDuration = `${Math.random() * 2 + 2}s`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        
        container.appendChild(particle);
    }
}

// Particules pour l'intro et pour la Slide 4 (Fête)
createParticles('particles-container', 12);
createParticles('fete-particles', 20);

/* =========================================================
   3. ANIMATIONS AU SCROLL (FADE UP)
   ========================================================= */
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.2 // Déclenche quand 20% de l'élément est visible
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
        }
    });
}, observerOptions);

document.querySelectorAll('.fade-up').forEach(el => {
    observer.observe(el);
});

/* =========================================================
   4. LOGIQUE DU FORMULAIRE RSVP (STATIQUE)
   ========================================================= */
const rsvpForm = document.getElementById('rsvp-form');
const btnToggles = document.querySelectorAll('.btn-toggle');
const rsvpState = { henna: null, mairie: null, fete: null };

// Gestion visuelle des boutons "Oui / Non"
btnToggles.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const parent = btn.closest('.btn-toggles');
        const target = parent.getAttribute('data-target');
        const val = btn.getAttribute('data-val') === 'oui';

        parent.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        rsvpState[target] = val;
    });
});

// Envoi du formulaire (Async pour le fetch Webhook)
rsvpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errorMsg = document.getElementById('form-error');
    errorMsg.classList.add('hidden');

    const nom = document.getElementById('nom').value.trim();
    const tel = document.getElementById('tel').value.trim();
    const adultes = document.getElementById('adultes').value;
    const enfants = document.getElementById('enfants').value;
    const message = document.getElementById('message').value.trim();

    // Validation
    if (!nom || !tel || rsvpState.henna === null || rsvpState.mairie === null || rsvpState.fete === null) {
        errorMsg.innerText = "Veuillez remplir tous les champs obligatoires.";
        errorMsg.classList.remove('hidden');
        return;
    }

    const btnSubmit = document.getElementById('btn-submit');
    const originalText = btnSubmit.innerText;
    btnSubmit.innerText = "Envoi en cours...";
    btnSubmit.disabled = true;

    // 1. Sauvegarde locale (Admin Panel)
    const rsvpData = { date: new Date().toLocaleDateString(), nom, tel, ...rsvpState, adultes, enfants, message };
    let localData = JSON.parse(localStorage.getItem('wedding_rsvps')) || [];
    localData.push(rsvpData);
    localStorage.setItem('wedding_rsvps', JSON.stringify(localData));

    // 2. Préparation du message Discord (Format Embed chic)
    const discordPayload = {
        embeds: [{
            title: "💍 Nouveau RSVP : " + nom,
            color: 13215820, // Code couleur décimal qui correspond à ton doré (#c9a84c)
            fields: [
                { name: "📞 Téléphone", value: tel, inline: true },
                { name: "👥 Personnes", value: `${adultes} Adulte(s) - ${enfants} Enfant(s)`, inline: true },
                { name: "🌿 Henna", value: rsvpState.henna ? "✅ Oui" : "❌ Non", inline: false },
                { name: "🏛️ Mairie", value: rsvpState.mairie ? "✅ Oui" : "❌ Non", inline: true },
                { name: "✨ Fête", value: rsvpState.fete ? "✅ Oui" : "❌ Non", inline: true }
            ]
        }]
    };

    if (message) {
        discordPayload.embeds[0].fields.push({ name: "💬 Message des invités", value: message, inline: false });
    }

    // 3. Envoi via Fetch
    try {
        // On vérifie que l'URL a bien été configurée
        if(DISCORD_WEBHOOK_URL && DISCORD_WEBHOOK_URL !== 'TON_LIEN_WEBHOOK_DISCORD_ICI') {
            const response = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discordPayload)
            });

            if (!response.ok) throw new Error("Erreur serveur Discord");
        } else {
            // Mode test : si pas de lien webhook, on simule l'attente 1 seconde
            await new Promise(r => setTimeout(r, 1000));
        }

        // Affichage du Succès
        rsvpForm.classList.add('hidden');
        document.getElementById('rsvp-success').classList.remove('hidden');

    } catch (error) {
        console.error("Erreur Webhook:", error);
        errorMsg.innerText = "Erreur lors de l'envoi. Veuillez réessayer.";
        errorMsg.classList.remove('hidden');
        btnSubmit.innerText = originalText;
        btnSubmit.disabled = false;
    }
});
