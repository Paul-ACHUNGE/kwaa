(function(){
  var C=window.KWAA,$=function(i){return document.getElementById(i)};
  var db=supabase.createClient(C.url,C.key),me=null,admin=false;
  function say(t){$('msg').textContent=t||'';}
  function show(on){$('login').hidden=on;$('app').hidden=!on;}

  $('login').onsubmit=function(e){e.preventDefault();
    db.auth.signInWithPassword({email:this.email.value,password:this.pw.value}).then(function(r){
      if(r.error) return say('Connexion refusée : '+r.error.message); start(r.data.user);});};
  $('out').onclick=function(){db.auth.signOut().then(function(){show(false);});};

  function start(u){me=u;
    db.from('profiles').select('role').eq('id',u.id).single().then(function(r){
      admin=r.data&&r.data.role==='admin';
      $('who').textContent=u.email+(admin?' · administrateur':' · contributeur (vos dépôts sont soumis à validation)');
      $('lt').textContent=admin?'Tous les projets':'Vos projets'; show(true); say(''); load();});}

  // Réduit la photo à 1600 px max : économise les données mobiles.
  function shrink(file){return new Promise(function(ok,ko){var i=new Image();i.onload=function(){
    var s=Math.min(1,1600/i.width),c=document.createElement('canvas');c.width=i.width*s;c.height=i.height*s;
    c.getContext('2d').drawImage(i,0,0,c.width,c.height);c.toBlob(ok,'image/jpeg',.8);};i.onerror=ko;i.src=URL.createObjectURL(file);});}

  $('new').onsubmit=function(e){e.preventDefault();var f=this,b=$('send');b.disabled=true;say('Envoi…');
    var d=new FormData(f),file=d.get('img'),rec={};
    ['title','category','work_status','location','challenge','solution','surface','delay'].forEach(function(k){rec[k]=d.get(k)||null;});
    rec.state=admin?'published':'pending';
    var up=file&&file.size?shrink(file).then(function(bl){var p=me.id+'/'+Date.now()+'.jpg';
      return db.storage.from('projets').upload(p,bl,{contentType:'image/jpeg'}).then(function(r){if(r.error)throw r.error;rec.image_path=p;});}):Promise.resolve();
    up.then(function(){return db.from('projects').insert(rec);}).then(function(r){
      if(r.error)throw r.error;f.reset();say(admin?'Projet publié.':'Projet envoyé : en attente de validation par un administrateur.');load();})
    .catch(function(err){say('Erreur : '+(err.message||err));}).then(function(){b.disabled=false;});};

  function btn(t,fn){var b=document.createElement('button');b.className='btn';b.textContent=t;b.onclick=fn;return b;}
  function setState(id,s){return db.from('projects').update({state:s}).eq('id',id).then(load);}
  function load(){db.from('projects').select('id,title,state,image_path').order('created_at',{ascending:false}).then(function(r){
    var ul=$('list');ul.textContent='';(r.data||[]).forEach(function(p){
      var li=document.createElement('li'),s=document.createElement('span');s.textContent=p.title+' ';
      var g=document.createElement('span');g.className='badge '+p.state;g.textContent={pending:'En attente',published:'Publié',rejected:'Refusé'}[p.state];s.appendChild(g);li.appendChild(s);
      if(admin){var a=document.createElement('span');
        if(p.state!=='published')a.appendChild(btn('Publier',function(){setState(p.id,'published');}));
        else a.appendChild(btn('Retirer',function(){setState(p.id,'pending');}));
        if(p.state==='pending')a.appendChild(btn('Refuser',function(){setState(p.id,'rejected');}));
        a.appendChild(btn('Supprimer',function(){if(confirm('Supprimer définitivement ?'))db.from('projects').delete().eq('id',p.id).then(function(){
          if(p.image_path)db.storage.from('projets').remove([p.image_path]);load();});}));li.appendChild(a);}
      ul.appendChild(li);});});}

  db.auth.getSession().then(function(r){if(r.data.session)start(r.data.session.user);});
})();
