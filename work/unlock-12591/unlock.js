function newFacilities91(level){
  return Object.keys(B).filter(type=>type!=='worldtree' && B[type].unlock===level &&
    !isTownDecor(type) && !facilityRoles.decor.types.includes(type) && !Object.hasOwn(borderDecor,type));
}
function celebrateFacilities91(level){
  const types=newFacilities91(level);
  const dialog=document.createElement('dialog');
  dialog.className='facility-celebration91';
  dialog.setAttribute('aria-labelledby','facility-title91');
  dialog.innerHTML='<header id="facility-title91"></header><section class="greeting91"><img alt=""><div><small>しろガオ</small><p></p></div></section><div class="stage91" hidden><canvas width="440" height="320"></canvas></div><p class="description91"></p><footer><span></span><button type="button"></button></footer>';
  const title=dialog.querySelector('header'),intro=dialog.querySelector('section'),stage=dialog.querySelector('.stage91');
  const description=dialog.querySelector('.description91'),count=dialog.querySelector('footer span'),button=dialog.querySelector('button');
  let index=-1,frame=0;
  intro.querySelector('img').src=lionImage.src;
  title.textContent='世界樹が Lv.'+level+' に成長！';
  intro.querySelector('p').textContent=types.length?'新しく建てられる施設を'+types.length+'つ紹介するね。':'世界樹がまたひとつ大きくなったよ！';
  button.textContent=types.length?'次へ':'牧場に戻る';
  dialog.addEventListener('close',()=>{cancelAnimationFrame(frame);dialog.remove();},{once:true});
  document.body.append(dialog);
  dialog.showModal();
  button.focus();
  function paint(type){
    const art=spriteBuildingV161(type,1,0);
    if(!art || !art.width || !art.height)return;
    const source=document.createElement('canvas');source.width=art.width;source.height=art.height;
    const sourceCtx=source.getContext('2d');sourceCtx.drawImage(art,0,0);
    const pix=sourceCtx.getImageData(0,0,source.width,source.height).data;
    let l=source.width,r=-1,t=source.height,b=-1;
    for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
      if(pix[(y*source.width+x)*4+3]<12)continue;
      l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
    }
    if(r<l)return;
    const w=r-l+1,h=b-t+1,k=Math.min(418/w,306/h);
    const canvas=stage.querySelector('canvas'),ctx=canvas.getContext('2d');
    ctx.clearRect(0,0,440,320);ctx.imageSmoothingEnabled=false;
    ctx.drawImage(source,l,t,w,h,(440-w*k)/2,318-h*k,w*k,h*k);
  }
  button.onclick=()=>{
    if(++index>=types.length){dialog.close();return;}
    intro.hidden=true;stage.hidden=false;
    const type=types[index];
    title.textContent=B[type].name+'を解放！';
    description.textContent=B[type].desc;
    count.textContent=(index+1)+' / '+types.length;
    button.textContent=index+1===types.length?'受け取る':'次へ';
    stage.classList.remove('reveal91');void stage.offsetWidth;stage.classList.add('reveal91');
    cancelAnimationFrame(frame);paint(type);
    frame=requestAnimationFrame(()=>paint(type));
    playTown75([392,494,587,784],.023);
  };
}
