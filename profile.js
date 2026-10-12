// This preview stores profile edits and visits locally; it does not authenticate users.
export function createProfile({ $, escapeHTML }) {
  const KEY = 'formula-one:profile:v1';
  let profile = { name: '', email: '', favoriteTeam: '', visits: [] };
  try { const saved = JSON.parse(localStorage.getItem(KEY)); if (saved && typeof saved === 'object') profile = { ...profile, ...saved }; } catch {}
  if (!Array.isArray(profile.visits)) profile.visits = [];
  const browser = /Firefox/.test(navigator.userAgent) ? 'Firefox' : /Edg/.test(navigator.userAgent) ? 'Edge' : /Chrome|CriOS/.test(navigator.userAgent) ? 'Chrome' : /Safari/.test(navigator.userAgent) ? 'Safari' : 'Navigateur web';
  const device = /iPhone|iPad/.test(navigator.userAgent) ? 'iPhone / iPad' : /Android/.test(navigator.userAgent) ? 'Android' : 'Ordinateur';
  profile.visits = [{ date: new Date().toISOString(), browser, device }, ...profile.visits].slice(0,5);
  function save() { try { localStorage.setItem(KEY, JSON.stringify(profile)); return true; } catch { return false; } }
  save();
  function avatar() { return String(profile.name || 'Mon profil').trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase(); }
  function updateHeader() { $('#profile-avatar').textContent = avatar(); $('#menu-account-name').textContent=profile.name || 'Pilote invité'; }
  updateHeader();
  function render() {
    $('#results').innerHTML = `<div class="account-layout"><section class="account-card"><div class="account-intro"><span class="account-avatar">${escapeHTML(avatar())}</span><div><h3>${escapeHTML(profile.name || 'Ton profil Calpino Uno')}</h3><span class="simulation-badge">Profil de démonstration</span></div></div><p class="account-description">Personnalise ton profil. Tes informations sont enregistrées dans ce navigateur. La connexion à un compte sera ajoutée ultérieurement.</p><form id="account-form"><label for="account-name">Nom ou pseudonyme</label><input id="account-name" name="name" maxlength="80" autocomplete="nickname" value="${escapeHTML(profile.name)}" placeholder="Ton nom"><label for="account-email">Adresse e-mail</label><input id="account-email" name="email" type="email" maxlength="254" autocomplete="email" value="${escapeHTML(profile.email)}" placeholder="nom@exemple.fr"><label for="account-team">Écurie favorite</label><select id="account-team" name="team"><option value="">Aucune préférence</option>${['Alpine','Aston Martin','Audi','Cadillac','Ferrari','Haas','McLaren','Mercedes','Racing Bulls','Red Bull','Williams'].map(team=>`<option ${profile.favoriteTeam === team ? 'selected' : ''}>${team}</option>`).join('')}</select><button class="primary-action" type="submit">Enregistrer les informations</button><p id="account-status" role="status" aria-live="polite"></p></form></section><div class="account-side"><section class="account-card"><p class="eyebrow">SÉCURITÉ</p><h3>Mot de passe</h3><p class="account-description">Aucun mot de passe n’est configuré dans cette démonstration. Tu peux prévisualiser l’action de réinitialisation.</p><button id="reset-password" type="button">Simuler la réinitialisation</button><p id="password-status" role="status" aria-live="polite"></p></section><section class="account-card"><p class="eyebrow">ACTIVITÉ</p><h3>Dernières connexions</h3><p class="account-description">Aperçu basé sur les dernières visites de ce navigateur, sans authentification ni localisation.</p><ul class="visit-list">${profile.visits.map((visit,index)=>`<li><span class="visit-dot" aria-hidden="true"></span><div><strong>${escapeHTML(visit.browser)} · ${escapeHTML(visit.device)}</strong><small>${escapeHTML(new Date(visit.date).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}))}</small></div>${index === 0 ? '<span class="current-visit">Cette visite</span>' : ''}</li>`).join('')}</ul></section></div></div>`;
    $('#account-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const name = $('#account-name').value.trim();
      if (!name) { $('#account-status').textContent = 'Renseigne un nom ou un pseudonyme.'; $('#account-name').focus(); return; }
      profile.name = name; profile.email = $('#account-email').value.trim(); profile.favoriteTeam = $('#account-team').value;
      const saved = save(); updateHeader();
      $('.account-intro h3').textContent = profile.name; $('.account-avatar').textContent = avatar();
      $('#account-status').textContent = saved ? 'Informations enregistrées sur cet appareil.' : 'La sauvegarde est indisponible dans ce navigateur.';
    });
    $('#reset-password').addEventListener('click', () => { $('#password-status').textContent = 'Simulation terminée : dans la version connectée, un lien de réinitialisation serait envoyé par e-mail. Aucun e-mail n’a été envoyé.'; });
  }
  const toggle = $('#account-menu-toggle');
  const dropdown = $('#account-dropdown');
  function closeMenu() { dropdown.hidden=true; toggle.setAttribute('aria-expanded','false'); }
  toggle.addEventListener('click',()=>{dropdown.hidden=!dropdown.hidden;toggle.setAttribute('aria-expanded',String(!dropdown.hidden));});
  document.addEventListener('click',event=>{if(!event.target.closest('.account-menu'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape' && !dropdown.hidden){closeMenu();toggle.focus();}});
  function setTheme(theme) { document.documentElement.dataset.theme=theme; $('#theme-toggle').setAttribute('aria-checked',String(theme==='dark'));try{localStorage.setItem('calpino:theme',theme);}catch{} }
  let theme='dark';try{theme=localStorage.getItem('calpino:theme')||'dark';}catch{}setTheme(theme);
  $('#theme-toggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
  dropdown.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  $('#sign-out').addEventListener('click',()=>{try{localStorage.removeItem('calpino:demo-session');}catch{}closeMenu();location.hash='connexion';});
  function renderLogin() {
    $('#results').innerHTML=`<section class="login-layout"><div class="login-art"><img src="assets/cockpit-v2.webp" alt="Cockpit de Formule 1 dessiné en noir et rouge"><div><p class="eyebrow">CALPINO UNO</p><h3>Chaque saison.<br>Chaque émotion.</h3><p>Les circuits, les champions et les courses qui ont écrit l’histoire.</p></div></div><div class="login-panel"><p class="eyebrow">TON ACCÈS AU PADDOCK</p><h3>Prends place.</h3><p>Retrouve tes favoris et ta collection de Grands Prix.</p><button id="google-demo" class="google-login"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.5-.2-2.2H12v4h5.6c-.3 1.3-1 2.4-2.1 3.1v2.6h3.4C20.8 17.9 22 15.3 22 12.2Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.2H2.7v2.7A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.2 13.7a6 6 0 0 1 0-3.4V7.6H2.7a10 10 0 0 0 0 8.8Z"/><path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 2.7 7.6l3.5 2.7C7 7.9 9.3 6.1 12 6.1Z"/></svg>Continuer avec Google · démo</button><div class="login-divider">OU</div><form id="login-form"><label for="login-name">Nom ou pseudonyme</label><input id="login-name" autocomplete="nickname" required maxlength="80" placeholder="Ton nom" value="${escapeHTML(profile.name)}"><label for="login-email">Adresse e-mail</label><input id="login-email" type="email" autocomplete="email" required placeholder="nom@exemple.fr" value="${escapeHTML(profile.email)}"><button class="primary-action">Entrer dans le paddock</button></form><p class="login-demo-note">Connexion de démonstration. Aucune authentification Google ni aucun mot de passe : Firebase sera connecté dans une prochaine étape.</p><a href="#">Explorer sans connexion →</a><p id="login-status" role="status"></p></div></section>`;
    function connect(name,email) { profile.name=name;profile.email=email;save();updateHeader();try{localStorage.setItem('calpino:demo-session','true');}catch{}location.hash='profil'; }
    $('#login-form').addEventListener('submit',event=>{event.preventDefault();connect($('#login-name').value.trim(),$('#login-email').value.trim());});
    $('#google-demo').addEventListener('click',()=>connect(profile.name||'Pilote invité',profile.email||''));
  }
  return { render, renderLogin };
}
