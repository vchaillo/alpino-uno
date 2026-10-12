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
  function updateHeader() { $('#profile-avatar').textContent = avatar(); }
  updateHeader();
  function render() {
    $('#results').innerHTML = `<a class="back-to-races" href="#">Retour aux Grands Prix</a><div class="account-layout"><section class="account-card"><div class="account-intro"><span class="account-avatar">${escapeHTML(avatar())}</span><div><h3>${escapeHTML(profile.name || 'Ton espace personnel')}</h3><span class="simulation-badge">Profil de démonstration</span></div></div><p class="account-description">Personnalise cette maquette. Tes informations sont enregistrées dans ce navigateur. La connexion à un compte sera ajoutée ultérieurement.</p><form id="account-form"><label for="account-name">Nom ou pseudonyme</label><input id="account-name" name="name" maxlength="80" autocomplete="nickname" value="${escapeHTML(profile.name)}" placeholder="Ton nom"><label for="account-email">Adresse e-mail</label><input id="account-email" name="email" type="email" maxlength="254" autocomplete="email" value="${escapeHTML(profile.email)}" placeholder="nom@exemple.fr"><label for="account-team">Écurie favorite</label><select id="account-team" name="team"><option value="">Aucune préférence</option>${['Alpine','Aston Martin','Audi','Cadillac','Ferrari','Haas','McLaren','Mercedes','Racing Bulls','Red Bull','Williams'].map(team=>`<option ${profile.favoriteTeam === team ? 'selected' : ''}>${team}</option>`).join('')}</select><button class="primary-action" type="submit">Enregistrer les informations</button><p id="account-status" role="status" aria-live="polite"></p></form></section><div class="account-side"><section class="account-card"><p class="eyebrow">SÉCURITÉ</p><h3>Mot de passe</h3><p class="account-description">Aucun mot de passe n’est configuré dans cette démonstration. Tu peux prévisualiser l’action de réinitialisation.</p><button id="reset-password" type="button">Simuler la réinitialisation</button><p id="password-status" role="status" aria-live="polite"></p></section><section class="account-card"><p class="eyebrow">ACTIVITÉ</p><h3>Dernières connexions</h3><p class="account-description">Aperçu basé sur les dernières visites de ce navigateur, sans authentification ni localisation.</p><ul class="visit-list">${profile.visits.map((visit,index)=>`<li><span class="visit-dot" aria-hidden="true"></span><div><strong>${escapeHTML(visit.browser)} · ${escapeHTML(visit.device)}</strong><small>${escapeHTML(new Date(visit.date).toLocaleString('fr-FR',{dateStyle:'medium',timeStyle:'short'}))}</small></div>${index === 0 ? '<span class="current-visit">Cette visite</span>' : ''}</li>`).join('')}</ul></section></div></div>`;
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
  return { render };
}
