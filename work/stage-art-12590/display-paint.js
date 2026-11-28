}else if(type==='rugShop'&&state&&w>0){
    const dye=[[211,126,105],[109,167,93],[225,136,63],[126,161,202]][state%4];
    glaze(dye,(r,green,b)=>r>green*1.25&&r>b*1.05&&r>58);
