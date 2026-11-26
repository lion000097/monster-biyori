// Render and test actual v1.25.65 in-game canvases with headless Chromium.
const {chromium}=require('playwright');
const http=require('http');
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const release=path.join(root,'releases/1.25.65');
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost/').pathname);
  const target=path.resolve(root,'.'+pathname);
  if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.stat(target,(err,stat)=>{
    if(err||!stat.isFile()){res.writeHead(404).end();return;}
    const type=target.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream';
    res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});
    fs.createReadStream(target).pipe(res);
  });
});
(async()=>{
  await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',resolve).on('error',reject));
  const origin='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  try{
    for(const width of [1280,390]){
      const page=await browser.newPage({viewport:{width,height:850},deviceScaleFactor:1});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      await page.goto(origin+'/tests/v1.25.65-town-art.html',{waitUntil:'domcontentloaded',timeout:120000});
      await page.waitForFunction('document.body.dataset.status==="pass"||document.body.dataset.status==="fail"',null,{timeout:120000});
      const status=await page.locator('body').getAttribute('data-status');
      const report=await page.locator('#logs').textContent();
      if(status!=='pass')throw Error(width+'px: '+report+'; PAGE ERRORS '+errors.join(' / '));
      const tiles=await page.locator('#gallery article').count();
      if(tiles!==24)throw Error(width+'px: expected 24 gallery images, got '+tiles);
      if(width===1280){
        await page.locator('#gallery').screenshot({path:path.join(release,'ART-PREVIEW.png'),animations:'disabled',timeout:120000});
      }
      console.log('PASS Chromium '+width+'px, '+tiles+' graphics; '+report.replaceAll('\n','; '));
      await page.close();
    }
  }finally{
    await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
