  const bytes=new Uint8Array(PACKED_BYTES);
  const counts=[125n,1920n,61438n,1048576n],ways=[1n];
  for(let size=1;size<=9;size++){
    let count=0n;
    for(let k=1;k<=Math.min(4,size);k++)count+=counts[k-1]*ways[size-k];
    ways.push(count);
  }
  let left=9,rank=0n,writeAt=0;
  for(let i=0;i<payload.length;){
    const code=payload.codePointAt(i),width=code<128?1:code<2048?2:code<65536?3:4;
    i+=width===4?2:1;
    const digit=width===1?code-1-Number(code>13)-Number(code>60):code-[0,0,128,2048,65536][width]-(width===3&&code>=57344?2048:0);
    for(let k=1;k<width;k++)rank+=counts[k-1]*ways[left-k];
    left-=width;
    rank+=BigInt(digit)*ways[left];
    if(left===0){
      for(let j=0;j<8&&writeAt<bytes.length;j++){bytes[writeAt++]=Number(rank&255n);rank>>=8n;}
      rank=0n;left=9;
    }
  }
  if(left!==9||writeAt!==bytes.length)throw Error('Incomplete offline game');
