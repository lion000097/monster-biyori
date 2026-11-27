// Decode the embedded frames before building the menu or painting the first map.
const townIllustrations=new Map();
await Promise.all([illustratedSigns.decode().catch(()=>{}),...Object.entries(illustratedTownBank).map(async ([type,[size,colors,bounds,uri]])=>{
  const image=new Image();
  image.src=uri;
  try{await image.decode();}catch{return;}
  const palette=colors.match(/.{6}/g).map(hex=>parseInt(hex,16));
  townIllustrations.set(type,{size,image,palette,bounds,nearest:new Uint8Array(32768),views:[]});
})]);
