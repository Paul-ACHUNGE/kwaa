// Affiche les projets publiés. Sans réseau ou sans configuration : les exemples du HTML restent affichés.
(function(){
  var C=window.KWAA, grid=document.getElementById('grille');
  if(!C||!grid||C.url.indexOf('VOTRE')>-1) return;
  var CAT={res:'Résidentiel',urb:'Urbanisme',des:'Design intérieur',ins:'Institutions'},
      ST={realise:'Réalisé',chantier:'En chantier',etude:'Projet d\u2019étude',visuel:'Visualisation'};
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x)e.textContent=x;return e;}
  function row(dl,k,v){if(v){dl.appendChild(el('dt','',k));dl.appendChild(el('dd','',v));}}
  fetch(C.url+'/rest/v1/projects?state=eq.published&order=created_at.desc&select=*',{headers:{apikey:C.key}})
    .then(function(r){return r.ok?r.json():[];}).then(function(list){
      if(!list.length) return;
      grid.textContent='';
      list.forEach(function(p){
        var li=el('li','project');li.setAttribute('data-cat',p.category);
        var f=el('div','frame');
        if(p.image_path){var i=new Image();i.loading='lazy';i.alt=p.title+(p.location?', '+p.location:'');
          i.src=C.url+'/storage/v1/object/public/projets/'+p.image_path;i.className='photo';f.appendChild(i);}
        li.appendChild(f);
        li.appendChild(el('p','meta',CAT[p.category]+' · '+ST[p.work_status]));
        li.appendChild(el('h3','',p.title));
        var dl=el('dl');row(dl,'Lieu',p.location);row(dl,'Défi',p.challenge);row(dl,'Solution',p.solution);
        row(dl,'Surface',p.surface);row(dl,'Délai',p.delay);li.appendChild(dl);grid.appendChild(li);
      });
    }).catch(function(){});
})();
