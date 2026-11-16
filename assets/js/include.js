/* Memuatkan header/footer dari /partials. Berfungsi pada GitHub Pages (project atau domain sendiri). */
(function(){
  const ROOT=new URL('../../',document.currentScript.src).href;
  const page=document.body.dataset.page||'';
  Promise.all([...document.querySelectorAll('[data-include]')].map(async el=>{
    try{const r=await fetch(ROOT+'partials/'+el.dataset.include+'.html');
      if(!r.ok)throw 0;el.outerHTML=(await r.text()).replaceAll('{{root}}',ROOT)}
    catch(e){el.textContent='Gagal memuatkan '+el.dataset.include+' (buka melalui pelayan/GitHub Pages, bukan fail terus).'}
  })).then(()=>{
    const a=document.querySelector('nav.main a[data-p="'+page+'"]');if(a)a.setAttribute('aria-current','page');
    const b=document.querySelector('.burger'),n=document.querySelector('nav.main');
    if(b)b.onclick=()=>{const o=n.classList.toggle('open');b.setAttribute('aria-expanded',o)};
  });
})();
