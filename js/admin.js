// Espace administration : 3 écrans (connexion, liste, nouveau projet). Chaque page porte data-page="login|list|new".
(function () {
  var C = window.KWAA, page = document.body.getAttribute('data-page');
  var $ = function (i) { return document.getElementById(i); };
  var db = supabase.createClient(C.url, C.key);
  function say(t, bad) {
    var m = $('msg'); if (!m) return; m.textContent = t || ''; m.className = bad ? 'err' : '';
    if (t && m.scrollIntoView) m.scrollIntoView({ block: 'center' });
  }
  function go(u) { location.href = u; }
  function imgUrl(p) { return C.url + '/storage/v1/object/public/projets/' + p; }

  if (page === 'login') return login();
  // Pages protégées : sans session, retour à la connexion.
  db.auth.getSession().then(function (r) {
    if (!r.data.session) return go('admin.html');
    var u = r.data.session.user;
    db.from('profiles').select('role').eq('id', u.id).single().then(function (p) {
      var admin = !!(p.data && p.data.role === 'admin');
      document.body.hidden = false;
      $('who').textContent = u.email + (admin ? ' · administrateur' : ' · contributeur');
      if ($('out')) $('out').onclick = function () { db.auth.signOut().then(function () { go('admin.html'); }); };
      if (page === 'list') list(admin);
      if (page === 'new') create(u, admin);
    });
  }).catch(function () { document.body.hidden = false; say('Connexion impossible. Vérifiez votre réseau.', true); });

  function login() {
    db.auth.getSession().then(function (r) { if (r.data.session) go('admin-projets.html'); });
    $('login').onsubmit = function (e) {
      e.preventDefault(); say('Connexion…');
      db.auth.signInWithPassword({ email: this.email.value, password: this.pw.value }).then(function (r) {
        if (r.error) return say('Connexion refusée : ' + r.error.message, true);
        go('admin-projets.html');
      });
    };
  }

  function btn(t, fn, c) { var b = document.createElement('button'); b.className = 'btn' + (c ? ' ' + c : ''); b.textContent = t; b.onclick = fn; return b; }
  function list(admin) {
    $('lt').textContent = admin ? 'Tous les projets' : 'Vos projets';
    var q = location.search.match(/ok=(\w+)/);
    if (q) say(q[1] === 'published' ? 'Projet publié.' : 'Projet envoyé : il sera visible après validation par un administrateur.');
    function setState(id, s) { return db.from('projects').update({ state: s }).eq('id', id).then(load); }
    function load() {
      db.from('projects').select('id,title,state,image_path,location,category').order('created_at', { ascending: false }).then(function (r) {
        var ul = $('list'); ul.textContent = ''; var rows = r.data || []; $('empty').hidden = rows.length > 0;
        rows.forEach(function (p) {
          var li = document.createElement('li'), info = document.createElement('div'); info.className = 'adm-info';
          if (p.image_path) { var im = new Image(); im.src = imgUrl(p.image_path); im.alt = ''; im.className = 'adm-thumb'; info.appendChild(im); }
          var t = document.createElement('div'), n = document.createElement('strong'); n.textContent = p.title; t.appendChild(n);
          t.appendChild(document.createElement('br'));
          var g = document.createElement('span'); g.className = 'badge ' + p.state;
          g.textContent = { pending: 'En attente', published: 'Publié', rejected: 'Refusé' }[p.state]; t.appendChild(g);
          if (p.location) { var l = document.createElement('small'); l.textContent = ' ' + p.location; t.appendChild(l); }
          info.appendChild(t); li.appendChild(info);
          if (admin) {
            var a = document.createElement('div'); a.className = 'adm-actions';
            if (p.state !== 'published') a.appendChild(btn('Publier', function () { setState(p.id, 'published'); }, 'solid'));
            else a.appendChild(btn('Retirer', function () { setState(p.id, 'pending'); }));
            if (p.state === 'pending') a.appendChild(btn('Refuser', function () { setState(p.id, 'rejected'); }));
            a.appendChild(btn('Supprimer', function () {
              if (confirm('Supprimer définitivement ce projet ?'))
                db.from('projects').delete().eq('id', p.id).then(function () { if (p.image_path) db.storage.from('projets').remove([p.image_path]); load(); });
            }));
            li.appendChild(a);
          }
          ul.appendChild(li);
        });
      });
    }
    load();
  }

  // Réduit la photo à 1600 px max : économise les données mobiles.
  function shrink(file) {
    return new Promise(function (ok, ko) {
      var i = new Image(); i.onload = function () {
        var s = Math.min(1, 1600 / i.width), c = document.createElement('canvas'); c.width = i.width * s; c.height = i.height * s;
        c.getContext('2d').drawImage(i, 0, 0, c.width, c.height); c.toBlob(ok, 'image/jpeg', .8);
      }; i.onerror = ko; i.src = URL.createObjectURL(file);
    });
  }

  function create(user, admin) {
    $('new').onsubmit = function (e) {
      e.preventDefault(); var f = this, b = $('send'); b.disabled = true; say('Envoi en cours…');
      var d = new FormData(f), file = d.get('img'), rec = {};
      ['title', 'category', 'work_status', 'location', 'challenge', 'solution', 'surface', 'delay'].forEach(function (k) { rec[k] = d.get(k) || null; });
      rec.state = admin ? 'published' : 'pending';
      var up = file && file.size ? shrink(file).then(function (bl) {
        var p = user.id + '/' + Date.now() + '.jpg';
        return db.storage.from('projets').upload(p, bl, { contentType: 'image/jpeg' }).then(function (r) { if (r.error) throw r.error; rec.image_path = p; });
      }) : Promise.resolve();
      up.then(function () { return db.from('projects').insert(rec); }).then(function (r) {
        if (r.error) throw r.error; go('admin-projets.html?ok=' + rec.state);
      })
        .catch(function (err) { say('Erreur : ' + (err.message || err), true); b.disabled = false; });
    };
  }
})();