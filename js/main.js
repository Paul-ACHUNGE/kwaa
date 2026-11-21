(function(){
    var btn=document.querySelector('.menu-btn'), nav=document.getElementById('menu');
    btn.addEventListener('click',function(){var o=nav.classList.toggle('open');btn.setAttribute('aria-expanded',o);});
    var filters=document.querySelectorAll('.filters button');
    filters.forEach(function(b){b.addEventListener('click',function(){
      filters.forEach(function(x){x.setAttribute('aria-pressed','false');});
      b.setAttribute('aria-pressed','true');
      var f=b.getAttribute('data-f');
      document.querySelectorAll('#grille .project').forEach(function(p){
        p.hidden = !(f==='all' || p.getAttribute('data-cat')===f);
      });
    });});
  })();

// Formulaire de contact : branchement à faire (voir README.md, section « Formulaire »)
document.querySelectorAll('form.form').forEach(function(f){
  f.addEventListener('submit', function(e){
    // Netlify Forms (attribut data-netlify) envoie le formulaire automatiquement.
    // Sans hébergement Netlify, remplacer par un appel vers votre service d'envoi.
    if (!f.hasAttribute('data-netlify')) {
      e.preventDefault();
      alert('Formulaire non encore connecté : voir README.md.');
    }
  });
});
