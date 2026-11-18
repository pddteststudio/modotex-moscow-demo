/* Modotex demo: all form data and photos stay in the browser. No API calls. */
(() => {
  'use strict';
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const state = {
    system: 'drapes', room: 'Гостиная', color: 'sand', light: 65,
    mount: 'Потолок', photos: []
  };
  const colors = {
    sand: { name:'Песочный', value:'#b8a895', shadow:'#968777' },
    sage: { name:'Шалфейный', value:'#8eaa9e', shadow:'#68857a' },
    slate: { name:'Графитово-синий', value:'#637a84', shadow:'#455f69' },
    milk: { name:'Молочный', value:'#ded7c8', shadow:'#aaa393' },
    terracotta: { name:'Терракотовый', value:'#b57f6c', shadow:'#936450' }
  };
  const systems = {drapes:'Портьеры и тюль', roller:'Рулонные шторы', pleated:'Плиссе', blinds:'Жалюзи'};
  const els = {
    system: $('#systemGroup'), room:$('#roomGroup'), mount:$('#mountGroup'),
    light:$('#lightRange'), lightValue:$('#lightValue'), lightLabel:$('#lightLabel'),
    width:$('#windowWidth'), height:$('#windowHeight'), notes:$('#notes'),
    chosenColor:$('#chosenColor'), status:$('#formStatus'), photoInput:$('#roomPhotos'),
    photos:$('#uploadList'), toast:$('#globalToast')
  };
  let toastTimeout=0;
  function toast(message){
    if(!els.toast)return;
    els.toast.textContent=message;
    els.toast.classList.add('is-visible');
    clearTimeout(toastTimeout);
    toastTimeout=setTimeout(()=>els.toast.classList.remove('is-visible'),3100);
  }
  function setStatus(message){ if(els.status)els.status.textContent=message; }
  function selectButtons(selector, value, attribute){
    $$(selector).forEach(b => {
      const active=b.dataset[attribute]===value;
      b.classList.toggle('is-active',active);
      b.setAttribute('aria-pressed',String(active));
    });
  }
  function renderPreview(){
    selectButtons('[data-system]', state.system,'system');
    selectButtons('[data-room]', state.room,'room');
    selectButtons('[data-mount]', state.mount,'mount');
    selectButtons('[data-color]', state.color,'color');
    els.chosenColor.textContent=colors[state.color].name;
    els.lightValue.textContent=state.light;
    els.lightLabel.textContent=state.system==='drapes'?'Пожелание по плотности':'Условная степень закрытия';
    $('#previewSystemText').textContent=systems[state.system];
    $('#previewRoomText').textContent=state.room;
    const visible={drapes:'pvDrapes',roller:'pvRoller',pleated:'pvPleated',blinds:'pvBlinds'};
    Object.entries(visible).forEach(([system,id])=>{const g=document.getElementById(id);if(g)g.style.display=state.system===system?'':'none';});
    const chosen=colors[state.color];
    $$('#pvfabric stop').forEach((stop,i)=>stop.setAttribute('stop-color',i===1?chosen.value:chosen.shadow));
    $('#pvLeft').setAttribute('opacity',(.66+state.light/290).toFixed(2));
    $('#pvRight').setAttribute('opacity',(.66+state.light/290).toFixed(2));
    // Roller and pleated height are illustrations of coverage, not actual size or optical density.
    const length= Math.round(80+state.light*3.55);
    $('#pvRollerScreen').setAttribute('fill',chosen.value);
    $('#pvRollerScreen').setAttribute('height',String(length));
    $('#pvRollerBar').setAttribute('d',`M129 ${97+length}h356`);
    $('#pvChain').setAttribute('d',`M472 110v${length}`);
    $('#pvPleatedScreen').setAttribute('fill',chosen.value);
    $('#pvPleatedScreen').setAttribute('height',String(length));
    const pleatLines=[];
    for(let y=88+25;y<88+length;y+=27){pleatLines.push(`M129 ${y}h356`);}
    $('#pvPleatLines').setAttribute('d',pleatLines.join(''));
    const blindCount=Math.min(18,Math.max(4,Math.round(state.light/7)+4));
    const slatGap=23;
    const blindPaths=[];
    for(let n=0;n<blindCount;n++){
      const y=100+n*slatGap;
      blindPaths.push(`<path d="M129 ${y}q178 ${8+state.light/15} 356 0l-5 14H134Z" fill="${chosen.value}" stroke="${chosen.shadow}" stroke-width="1" stroke-opacity=".45"/>`);
    }
    $('#pvBlindSlats').innerHTML=blindPaths.join('');
    const stage=$('#previewStage');
    stage.setAttribute('data-system',state.system);
  }
  function bindGroup(attribute){
    $$(`[data-${attribute}]`).forEach(button=>{
      // data-system etc are exclusively selector inputs within the application.
      if(attribute==='system' && !button.closest('#systemGroup'))return;
      button.addEventListener('click',()=>{
        state[attribute]=button.dataset[attribute];
        renderPreview();setStatus('');
      });
    });
  }
  ['system','room','mount','color'].forEach(bindGroup);
  els.light.addEventListener('input',()=>{state.light=Number(els.light.value);renderPreview();setStatus('');});
  function validateSize(){
    const width=Number(els.width.value),height=Number(els.height.value);
    if(!Number.isFinite(width) || width<30 || width>2000){setStatus('Укажите ширину от 30 до 2000 см.');els.width.focus();return null;}
    if(!Number.isFinite(height) || height<30 || height>1000){setStatus('Укажите высоту от 30 до 1000 см.');els.height.focus();return null;}
    return {width,height};
  }
  function makeMessage(){
    const size=validateSize();if(!size)return null;
    const notes=els.notes.value.trim();
    const body=[
      'Здравствуйте! Хочу подобрать оформление окна в Modotex.', '',
      `Решение: ${systems[state.system]}`,
      `Комната: ${state.room}`,
      `Оттенок: ${colors[state.color].name}`,
      `${state.system==='drapes'?'Предпочтение по плотности':'Условная степень закрытия'}: ${state.light}%`,
      `Ширина окна / карниза: ${size.width} см`,
      `Высота: ${size.height} см`,
      `Предпочтительный монтаж: ${state.mount}`
    ];
    if(notes)body.push(`Пожелания: ${notes}`);
    if(state.photos.length)body.push(`Фото окна: ${state.photos.length} шт. (прикреплю отдельно в VK)`);
    body.push('','Подскажите, пожалуйста, варианты материалов, ориентировочную стоимость и условия выезда дизайнера.');
    return body.join('\n');
  }
  async function copyText(text){
    if(navigator.clipboard && window.isSecureContext){
      try{await navigator.clipboard.writeText(text);return true;}catch(e){}
    }
    const temp=document.createElement('textarea');
    temp.value=text;temp.readOnly=true;temp.setAttribute('aria-hidden','true');
    Object.assign(temp.style,{position:'fixed',top:'-9999px',left:'0',opacity:'0'});
    document.body.appendChild(temp);temp.select();
    let success=false;
    try{success=document.execCommand('copy');}catch(e){}
    temp.remove();return success;
  }
  $('#copyInquiry').addEventListener('click',async()=>{
    const message=makeMessage();if(!message)return;
    const ok=await copyText(message);
    if(ok){setStatus('Заявка скопирована. Откройте VK и вставьте сообщение.');toast('Готово — текст заявки скопирован');}
    else{
      setStatus('Автоматическое копирование недоступно: выделите текст вручную.');
      // Show message in an ordinary prompt only as a fallback when clipboard is blocked.
      window.prompt('Скопируйте текст заявки:',message);
    }
  });
  // Images are local previews only. We don't upload or automatically attach files to VK.
  function clearPhotos(){state.photos.forEach(p=>URL.revokeObjectURL(p.url));state.photos=[];els.photoInput.value='';renderPhotos();}
  function renderPhotos(){
    els.photos.replaceChildren();
    state.photos.forEach(p=>{
      const box=document.createElement('div');box.className='photo-chip';
      const img=document.createElement('img');img.src=p.url;img.alt=p.name;box.appendChild(img);
      const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label',`Удалить фото ${p.name}`);
      remove.addEventListener('click',()=>{
        URL.revokeObjectURL(p.url);state.photos=state.photos.filter(item=>item!==p);renderPhotos();toast('Фотография удалена');
      });
      box.appendChild(remove);els.photos.appendChild(box);
    });
  }
  els.photoInput.addEventListener('change',event=>{
    const files=Array.from(event.target.files||[]);let skipped=0,added=0;
    for(const file of files){
      if(state.photos.length>=3){skipped++;continue;}
      if(!/^image\/(png|jpe?g|webp|gif)$/.test(file.type) || file.size>8*1024*1024){skipped++;continue;}
      state.photos.push({name:file.name,url:URL.createObjectURL(file)});added++;
    }
    els.photoInput.value='';renderPhotos();
    if(skipped)toast(`Добавлено ${added} фото. Остальные не подошли по формату, размеру или лимиту.`);
    else if(added)toast(`Добавлено фото: ${added}. Оно хранится только в браузере.`);
  });
  $('#resetDesigner').addEventListener('click',()=>{
    state.system='drapes';state.room='Гостиная';state.color='sand';state.light=65;state.mount='Потолок';
    els.light.value='65';els.width.value='250';els.height.value='260';els.notes.value='';
    clearPhotos();renderPreview();setStatus('Параметры сброшены.');
  });
  // Cross-page navigation and presets.
  $$('[data-preset]').forEach(el=>el.addEventListener('click',event=>{
    const newSystem=el.dataset.preset;
    if(!systems[newSystem])return;
    state.system=newSystem;renderPreview();
    if(el.tagName==='BUTTON'){
      event.preventDefault();$('#designer').scrollIntoView({behavior:'smooth',block:'start'});
    }
  }));
  // Portfolio concept filter.
  $$('.idea-filter').forEach(button=>button.addEventListener('click',()=>{
    const filter=button.dataset.filter;
    $$('.idea-filter').forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});
    $$('.idea-card').forEach(card=>{card.hidden=filter!=='all' && card.dataset.kind!==filter;});
  }));
  // Accessible lightbox.
  const modal=$('#ideaModal'),closeModalButton=$('#closeModal');
  let lastFocused=null;
  function closeModal(){modal.hidden=true;modal.setAttribute('aria-hidden','true');document.body.classList.remove('modal-open');if(lastFocused&&lastFocused.isConnected)lastFocused.focus();}
  $$('.idea-card').forEach(card=>card.addEventListener('click',()=>{
    lastFocused=card;
    $('#modalImage').src=card.dataset.image;
    $('#modalImage').alt=`Авторская иллюстрация: ${card.dataset.title}`;
    $('#modalTitle').textContent=card.dataset.title;
    $('#modalDescription').textContent=card.dataset.description;
    modal.hidden=false;modal.setAttribute('aria-hidden','false');document.body.classList.add('modal-open');closeModalButton.focus();
  }));
  closeModalButton.addEventListener('click',closeModal);
  $$('[data-close-modal]').forEach(item=>item.addEventListener('click',closeModal));
  $('#modalDesignerLink').addEventListener('click',closeModal);
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape' && !modal.hidden){closeModal();return;}
    if(event.key==='Escape' && $('#menuToggle').getAttribute('aria-expanded')==='true')closeMenu();
    if(event.key==='Tab' && !modal.hidden){
      const focusables=$$('a,button',modal).filter(el=>!el.disabled && el.getClientRects().length>0);
      if(focusables.length){const first=focusables[0],last=focusables[focusables.length-1];
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
    }
  });
  // Mobile navigation.
  const menuBtn=$('#menuToggle'),menu=$('#mobileMenu');
  function closeMenu(){menu.hidden=true;menuBtn.setAttribute('aria-expanded','false');menuBtn.setAttribute('aria-label','Открыть меню');menuBtn.querySelector('use').setAttribute('href','#i-menu');}
  function openMenu(){menu.hidden=false;menuBtn.setAttribute('aria-expanded','true');menuBtn.setAttribute('aria-label','Закрыть меню');menuBtn.querySelector('use').setAttribute('href','#i-close');}
  menuBtn.addEventListener('click',()=>menu.hidden?openMenu():closeMenu());
  $$('a',menu).forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!menuBtn.contains(e.target))closeMenu();});
  window.addEventListener('resize',()=>{if(innerWidth>1000&&!menu.hidden)closeMenu();});
  // Soft scroll reveals; avoid hiding meaningful content if observers are unsupported.
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    document.body.classList.add('js-animate');
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}});
    },{threshold:.08,rootMargin:'0px 0px 40px 0px'});
    $$('.reveal').forEach(el=>observer.observe(el));
  }
  renderPreview();
})();
