// scene.js — convierte datos de nivel en primitivas (mismo código para preview SVG y para Figma)
const C={tinta:'#1F2329',blanco:'#FFFFFF',tierra:'#F2F1EC',agua:'#D3DEE6',parque:'#DDE6D3',amarilla:'#F0B429',naranja:'#E8772E',azul:'#2E62B5',lila:'#8565C4',cafe:'#8B5E3C',cian:'#2FA8D5',cerrada:'#B8BCC3',cable:'#D6338A',rojo:'#D93A35',verde:'#2E8B57',sec:'#5B616B',borde:'#D5D8DC'};
const BLK={1:['Fácil',C.amarilla],2:['Intermedio',C.naranja],3:['Difícil',C.azul]};
const FW={EB:.56,B:.54,SB:.52,M:.5,C:.42,CB:.44};
const tw=(s,z,f)=>s.length*z*(FW[f]||.5);
const nf=v=>{const r=Math.round(v*10)/10;return (Number.isInteger(r)?String(r):r.toFixed(1)).replace('.',',')};
const cars=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'.');
function segs(pts){let L=0,best=0,bi=0;const s=[];for(let i=0;i<pts.length-1;i++){const[a,b]=[pts[i],pts[i+1]];const l=Math.hypot(b[0]-a[0],b[1]-a[1]);s.push(l);if(l>best){best=l;bi=i}L+=l}return{s,bi,L}}
function onSeg(pts,i,t){const a=pts[i],b=pts[i+1];return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]}
function wrap(str,z,f,maxW){const w=str.split(' ');const out=[];let cur='';for(const x of w){const n=cur?cur+' '+x:x;if(tw(n,z,f)>maxW&&cur){out.push(cur);cur=x}else cur=n}if(cur)out.push(cur);return out}
function S(name){const it=[];const A=(L,o)=>{o.L=L;it.push(o);return o};
  return{name,w:1440,h:900,bg:C.tierra,it,
    p:(L,pts,c,w,o={})=>A(L,{k:'p',pts,c,w,...o}),
    e:(L,x,y,r,o={})=>A(L,{k:'e',x,y,r,...o}),
    r:(L,x,y,w,h,o={})=>A(L,{k:'r',x,y,w,h,...o}),
    g:(L,pts,f,o={})=>A(L,{k:'g',pts,f,...o}),
    t:(L,x,y,v,z,f,c,o={})=>A(L,{k:'t',x,y,v,z,f,c,a:'l',...o}),
    pill:(L,x,y,parts,o={})=>A(L,{k:'pill',x,y,parts,bg:C.blanco,bd:C.borde,px:9,py:4,gap:3,...o}),
    tw:(L,x,y,v,z,f,c,maxW,lh,o={})=>{wrap(v,z,f,maxW).forEach((l,i)=>A(L,{k:'t',x,y:y+i*lh,v:l,z,f,c,a:'l',...o}))}}}
function territorio(s,seed,np=2){
  s.g('ter',[[1150,0],[1440,0],[1440,190]],C.agua,{n:'agua'});
  s.g('ter',[[0,680],[0,900],[290,900]],C.agua,{n:'agua'});
  const P=[[300,410,130,80],[1000,560,120,70],[560,560,100,60],[860,370,110,70],[1120,780,130,70]];
  for(let i=0;i<np;i++){const q=P[(seed+i*2)%P.length];s.r('ter',q[0],q[1],q[2],q[3],{f:C.parque,rr:8,n:'parque'})}}
function btns(s){
  s.e('inf',62,838,22,{f:C.tinta,n:'btn:reiniciar'});
  s.e('inf',62,838,8,{s:C.blanco,sw:2.4,arc:[0.9,6.1],n:'icono reiniciar'});
  s.g('inf',[[66,826],[72,831],[64,834]],C.blanco,{n:'flecha'});
  s.e('inf',116,838,22,{f:C.tinta,n:'btn:pausa'});
  s.r('inf',110,831,4,14,{f:C.blanco,rr:1});s.r('inf',118,831,4,14,{f:C.blanco,rr:1});}
function hud(s,total,opt,solved,cambios){
  const x=1074,y=34;
  s.r('inf',x,y,330,solved?134:118,{f:C.blanco,s:solved?C.verde:C.borde,sw:solved?2:1,rr:14,n:'HUD'});
  s.t('inf',x+20,y+16,'TOTAL · MIN POR CARRO',10,'CB',C.sec,{ls:1});
  s.t('inf',x+310,y+16,'ÓPTIMO',10,'CB',C.sec,{ls:1,a:'r'});
  s.t('inf',x+18,y+32,nf(total),44,'EB',solved?C.verde:C.rojo,{n:'hud:total'});
  s.t('inf',x+312,y+32,nf(opt),44,'EB',C.tinta,{a:'r',n:'hud:optimo'});
  s.r('inf',x+24,y+96,282,4,{f:solved?C.verde:C.borde,rr:2,n:'progreso'});
  s.e('inf',x+24,y+98,6,{f:solved?C.verde:C.rojo,s:C.blanco,sw:2});
  s.e('inf',x+306,y+98,7,{f:solved?C.verde:C.blanco,s:solved?C.verde:C.tinta,sw:3});
  if(solved)s.t('inf',x+20,y+110,`Equilibrio alcanzado en ${cambios} toque${cambios>1?'s':''}`,12,'SB',C.verde);}
function titulo(s,lv){
  const [bn,bc]=BLK[lv.block];
  s.e('inf',60,56,20,{f:bc,n:'badge'});
  s.t('inf',60,47,String(lv.num).padStart(2,'0'),15,'B',lv.block==1?C.tinta:C.blanco,{a:'c'});
  s.t('inf',92,34,lv.name,26,'B',C.tinta,{n:'titulo'});
  let sub=`${bn} · NIVEL ${String(lv.num).padStart(2,'0')} DE 15 · ${lv.lineas} LÍNEAS`;
  if(lv.grupos>1)sub+=` · ${lv.grupos} GRUPOS`; if(lv.cables)sub+=` · ${lv.cables} CABLE${lv.cables>1?'S':''}`;
  s.t('inf',93,68,sub.toUpperCase(),11,'CB',C.sec,{ls:1.2});}
function lineDraw(s,l,open,pass){
  const col=C[l.line]||C.tinta,pts=l.pts,nm='via:'+l.id;
  if(!open){ if(pass!==0)return;
    s.p('red',pts,C.cerrada,4,{d:[8,8],n:nm+' (cerrada)',rad:22});
    const g=segs(pts),m=onSeg(pts,g.bi,.5);
    s.e('red',m[0],m[1],11,{f:C.blanco,s:C.cerrada,sw:2,n:'x:'+l.id});
    s.p('red',[[m[0]-4,m[1]-4],[m[0]+4,m[1]+4]],C.sec,2);s.p('red',[[m[0]-4,m[1]+4],[m[0]+4,m[1]-4]],C.sec,2);return}
  if(l.kind==='ancha'&&pass===0){s.p('red',pts,col,14,{n:nm,rad:22});s.p('red',pts,C.blanco,2.5,{d:[9,9],cap:'b',n:'centro ancha',rad:22})}
  if(l.kind==='angosta'&&pass===1)s.p('red',pts,col,7,{n:nm,rad:22});
  if(l.kind==='cable'&&pass===2)s.p('red',pts,C.cable,5,{d:[0.1,11],n:nm});
  if(l.locked&&pass===2){s.p('red',pts,C.tinta,13,{d:[2.5,9],cap:'b',n:'obra (rayado)'});}}
function nivel(lv,solved){
  const s=S(solved?`Nivel ${String(lv.num).padStart(2,'0')} · Resuelto`:`Nivel ${String(lv.num).padStart(2,'0')} · ${lv.name}`);
  territorio(s,lv.num,lv.block==3?0:2);
  const st=l=>solved?l.os:l.op, T=l=>solved?l.t1:l.t0, X=l=>solved?l.x1:l.x0;
  for(const pass of [0,1,2])for(const l of lv.links)lineDraw(s,l,st(l),pass);
  // estaciones
  const nodes=lv.nodes;
  for(const [id,n] of Object.entries(nodes)){
    const nm='nodo:'+id;
    if(n.kind==='bar'){s.r('est',n.x-12,n.y1,24,n.y2-n.y1,{f:C.tinta,rr:12,n:nm});
      s.t('est',n.x,n.y1-44,n.label.toUpperCase(),12,'CB',C.tinta,{a:'c',ls:.8});continue}
    if(n.kind==='capsule'){s.r('est',n.x-15,n.y-56,30,112,{f:C.blanco,s:C.tinta,sw:4,rr:15,n:nm});
      s.t('est',n.x,n.y-84,n.label.toUpperCase(),12,'CB',C.tinta,{a:'c',ls:.8});continue}
    if(n.kind==='terminal'){s.e('est',n.x,n.y,15,{f:C.tinta,n:nm});s.e('est',n.x,n.y,6,{f:C.blanco});
      const sd=n.x<400?'r':n.x>1040?'l':'c', lx=sd==='r'?n.x-26:sd==='l'?n.x+26:n.x, ly=sd==='c'?n.y-44:n.y-16;
      s.t('est',lx,ly,n.label.toUpperCase(),12,'CB',C.tinta,{a:sd,ls:.8});n._lab=[lx,ly,sd];continue}
    s.e('est',n.x,n.y,11,{f:C.blanco,s:C.tinta,sw:4,n:nm});
    const up=n.y<500;
    s.t('est',n.x,up?n.y-36:n.y+22,n.label.toUpperCase(),12,'CB',C.tinta,{a:'c',ls:.8});}
  // grupos
  const og={};lv.groups.forEach(g=>{og[g.from]=(og[g.from]||0)+g.cars});
  for(const [id,cs] of Object.entries(og)){const n=nodes[id];const txt=cars(cs)+' carros';
    if(n.kind==='bar')s.t('inf',n.x,n.y1-28,txt,11,'M',C.sec,{a:'c',n:'grupo'});
    else if(n.kind==='terminal')s.t('inf',n._lab[0],n._lab[1]+16,txt,11,'M',C.sec,{a:n._lab[2],n:'grupo'});
    else s.pill('inf',n.x,n.y+(n.y<500?-64:64),[{v:'+'+txt,z:11,f:'SB',c:C.blanco}],{bg:C.tinta,bd:C.tinta,n:'grupo'});}
  // pastillas de costo + carros
  for(const l of lv.links){ if(!st(l))continue; const t=T(l); if(t==null)continue;
    const g=segs(l.pts),m=onSeg(l.pts,g.bi,.5);
    const hot=l.kind==='angosta'&&t-(l.a||0)>=20, cab=l.kind==='cable';
    const cc=cab?C.cable:hot?C.rojo:C.tinta;
    s.pill('sta',m[0],m[1],[{v:String(Math.round(t)),z:14,f:'B',c:cc},{v:'min',z:9,f:'M',c:cab?C.cable:hot?C.rojo:C.sec}],{bd:cab?C.cable:hot?C.rojo:C.borde,n:'costo:'+l.id});
    const len=g.s[g.bi],half=len/2,n=Math.min(6,Math.round(X(l)/650));
    const mh=Math.ceil(n/2),span=half-62;
    for(let k=0;k<n&&span>20;k++){const i=k>>1,off=(k%2?1:-1)*(46+(i+0.5)*span/mh);const q=onSeg(l.pts,g.bi,.5+off/len);
      s.e('sta',q[0],q[1],5.5,{f:C.tinta,s:C.blanco,sw:2.5,n:'carro'})}
    if(l.locked)s.pill('inf',m[0]-120,m[1]+20,[{v:'Obra · no se toca',z:11,f:'SB',c:C.blanco}],{bg:C.tinta,bd:C.tinta,n:'obra'});}
  titulo(s,lv);
  hud(s,solved?lv.optimo:lv.start,lv.optimo,solved,lv.cambios);
  let y=100;
  if(lv.msg&&!solved){s.pill('inf',40+(tw(lv.msg,13,'SB')+24)/2,y+14,[{v:lv.msg,z:13,f:'SB',c:C.blanco}],{bg:C.tinta,bd:C.tinta,px:12,py:7,n:'mensaje'});}
  if(lv.phases&&!solved){const x0=560;
    s.r('inf',x0,38,200,34,{f:C.blanco,s:C.borde,sw:1,rr:17,n:'fases'});
    s.r('inf',x0+100,41,97,28,{f:C.tinta,rr:14});
    s.t('inf',x0+50,47,'Hora valle',12,'SB',C.sec,{a:'c'});s.t('inf',x0+148,47,'Hora pico',12,'SB',C.blanco,{a:'c'});
    if(lv.toques){s.r('inf',x0+212,38,58+lv.toques*16,34,{f:C.blanco,s:C.borde,sw:1,rr:17,n:'toques'});
      s.t('inf',x0+226,49,'TOQUES',10,'CB',C.sec,{ls:1});
      for(let k=0;k<lv.toques;k++)s.e('inf',x0+268+k*16,55,5,{s:C.tinta,sw:2,f:C.blanco});}}
  if(lv.legend&&!solved){const items={ancha:'Ancha · fija',angosta:'Angosta · se llena',cerrada:'Cerrada',cable:'Cable · atajo',obra:'Obra · no se toca'};
    const W=lv.legend.length*150+24, x0=720-W/2;
    s.r('inf',x0,822,W,36,{f:C.blanco,s:C.borde,sw:1,rr:18,n:'leyenda'});
    lv.legend.forEach((k,i)=>{const x=x0+16+i*150,y=840;
      if(k==='ancha'){s.p('inf',[[x,y],[x+28,y]],C.tinta,8);s.p('inf',[[x,y],[x+28,y]],C.blanco,1.5,{d:[4,4],cap:'b'})}
      if(k==='angosta')s.p('inf',[[x,y],[x+28,y]],C.tinta,4);
      if(k==='cerrada')s.p('inf',[[x,y],[x+28,y]],C.cerrada,3,{d:[5,4],cap:'b'});
      if(k==='cable')s.p('inf',[[x,y],[x+28,y]],C.cable,4,{d:[0.1,7]});
      if(k==='obra'){s.p('inf',[[x,y],[x+28,y]],C.naranja,6);s.p('inf',[[x,y],[x+28,y]],C.tinta,8,{d:[2,5],cap:'b'})}
      s.t('inf',x+36,y-8,items[k],12,'M',C.tinta);});}
  if(solved)s.pill('inf',720,836,[{v:'Ver bitácora',z:14,f:'SB',c:C.blanco}],{bg:C.tinta,bd:C.tinta,px:18,py:10,n:'btn:bitacora'});
  btns(s);
  return s;}
function inicio(){const s=S('Inicio');
  s.g('ter',[[1000,0],[1440,0],[1440,330]],C.agua);s.g('ter',[[0,760],[0,900],[150,900]],C.agua);
  s.r('ter',1180,600,140,90,{f:C.parque,rr:8});
  s.p('red',[[860,-20],[860,250],[1060,450],[1460,450]],C.azul,12,{rad:40});
  s.p('red',[[760,920],[760,640],[1000,400],[1000,-20]],C.amarilla,12,{rad:40});
  s.p('red',[[1460,700],[1180,700],[940,460],[700,460]],C.naranja,7,{rad:40});
  s.p('red',[[1300,920],[1300,560],[1160,420],[1160,-20]],C.lila,7,{rad:40});
  s.p('red',[[1000,450],[1160,450]],C.cable,5,{d:[0.1,11]});
  [[860,250],[1000,400],[940,460],[1160,450],[1300,560],[760,640]].forEach(q=>s.e('est',q[0],q[1],11,{f:C.blanco,s:C.tinta,sw:4}));
  s.e('est',1000,450,15,{f:C.tinta});s.e('est',1000,450,6,{f:C.blanco});
  [[18,0],[34,1],[50,2]].forEach(([x,i])=>s.e('inf',62+x-18,96,6,{f:[C.amarilla,C.naranja,C.azul][i]}));
  s.t('inf',108,89,'UN JUEGO DE VÍAS · BOGOTÁ',12,'CB',C.sec,{ls:1.4});
  s.t('inf',56,300,'Equilibrio',112,'EB',C.tinta,{n:'titulo'});
  s.tw('inf',60,440,'A veces, cerrar una vía es la forma más rápida de que todos lleguen.',22,'M',C.sec,520,30);
  s.pill('inf',200,550,[{v:'Seguir en el nivel 08',z:18,f:'SB',c:C.blanco} ],{bg:C.tinta,bd:C.tinta,px:24,py:14,gap:10,n:'btn:jugar'});
  [['Plano de la red',60],['Bitácora',214],['Ajustes',320]].forEach(([v,x])=>s.pill('inf',x+(tw(v,14,'SB')+30)/2,628,[{v,z:14,f:'SB',c:C.tinta}],{px:15,py:8,n:'chip'}));
  s.t('inf',60,836,'SIMPLICIDAD = EQUILIBRIO · JOHN MAEDA',12,'CB',C.sec,{ls:1.4});
  return s;}
function plano(levels){const s=S('Plano de la red');
  s.g('ter',[[1180,0],[1440,0],[1440,170]],C.agua);s.g('ter',[[0,720],[0,900],[260,900]],C.agua);
  s.t('inf',60,48,'Plano de la red',32,'B',C.tinta);
  s.t('inf',61,92,'TRES LÍNEAS · QUINCE ESTACIONES · CADA ESTACIÓN ES UN NIVEL',11,'CB',C.sec,{ls:1.2});
  const cur=8;
  [[1,C.amarilla,300],[2,C.naranja,500],[3,C.azul,700]].forEach(([b,col,y])=>{
    const L5=levels.filter(l=>l.block===b);const x0=330,dx=230;
    s.e('inf',90,y,8,{f:col});s.t('inf',108,y-9,BLK[b][0].toUpperCase(),13,'CB',C.tinta,{ls:1.2});
    s.t('inf',108,y+8,`Niveles ${String(b*5-4).padStart(2,'0')}–${String(b*5).padStart(2,'0')}`,11,'M',C.sec);
    L5.forEach((l,i)=>{const x=x0+i*dx;
      if(i<4){const done=l.num<cur;s.p('red',[[x,y],[x+dx,y]],done||l.num+1<=cur?col:C.cerrada,done?12:6,done?{}:{d:[8,8]})}});
    L5.forEach((l,i)=>{const x=x0+i*dx,done=l.num<cur,now=l.num===cur;
      if(done){s.e('est',x,y,15,{f:C.tinta});s.e('est',x,y,6,{f:C.blanco})}
      else if(now){s.e('est',x,y,20,{f:C.blanco,s:C.tinta,sw:5});s.e('est',x,y,7,{f:col});
        s.pill('inf',x,y-48,[{v:'Estás aquí',z:12,f:'SB',c:C.blanco}],{bg:C.tinta,bd:C.tinta,px:10,py:5})}
      else s.e('est',x,y,11,{f:C.blanco,s:C.cerrada,sw:4});
      s.t('est',x,y+28,String(l.num).padStart(2,'0'),13,'CB',now||done?C.tinta:C.sec,{a:'c'});
      s.t('est',x,y+46,l.name,12,'M',now||done?C.tinta:C.sec,{a:'c'});});});
  s.p('red',[[1250,300],[1290,300],[1290,500],[1250,500]],C.tinta,3,{d:[0.1,8],rad:16});
  s.p('red',[[1250,500],[1290,500],[1290,700],[1250,700]],C.cerrada,3,{d:[0.1,8],rad:16});
  btns(s);return s;}
function bitacora(){const s=S('Bitácora · Nivel 03');
  territorio(s,3);
  s.r('inf',0,0,1440,900,{f:C.tinta,o:.06});
  const x=400,y=200,W=640,H=470;
  s.r('inf',x,y,W,H,{f:C.blanco,s:C.borde,sw:1,rr:22,n:'bitacora'});
  [C.amarilla,C.naranja,C.azul,C.lila].forEach((c,i)=>s.r('inf',x+40+i*44,y+34,36,6,{f:c,rr:3}));
  s.t('inf',x+40,y+58,'BITÁCORA DEL INGENIERO · NIVEL 03',11,'CB',C.sec,{ls:1.4});
  s.tw('inf',x+40,y+92,'«Hoy cerré el cable y la ciudad respiró.»',36,'EB',C.tinta,540,44);
  s.t('inf',x+40,y+210,'80',64,'EB',C.rojo);
  s.p('inf',[[x+140,y+250],[x+220,y+250]],C.tinta,3);s.g('inf',[[x+222,y+242],[x+234,y+250],[x+222,y+258]],C.tinta);
  s.t('inf',x+250,y+210,'65',64,'EB',C.verde);
  s.t('inf',x+360,y+240,'min por carro',14,'M',C.sec);
  s.tw('inf',x+40,y+310,'Cerraste una vía y todos llegaron 15 minutos antes.',16,'M',C.sec,540,22);
  s.pill('inf',x+40+90,y+400,[{v:'Siguiente nivel',z:15,f:'SB',c:C.blanco} ],{bg:C.tinta,bd:C.tinta,px:18,py:11,gap:8,n:'btn:siguiente'});
  s.pill('inf',x+330,y+400,[{v:'Ver plano',z:15,f:'SB',c:C.tinta}],{px:18,py:11,n:'btn:plano'});
  return s;}
function sistema(){const s=S('Sistema de color y forma');
  s.t('inf',60,48,'EQUILIBRIO · SISTEMA VISUAL',11,'CB',C.sec,{ls:1.4});
  s.t('inf',60,70,'Un plano de metro, no una app',40,'B',C.tinta);
  s.t('inf',1380,84,'Cada color tiene un solo trabajo.',14,'M',C.sec,{a:'r'});
  s.r('inf',60,150,720,640,{f:C.blanco,s:C.borde,sw:1,rr:16});
  s.t('inf',90,174,'JERARQUÍA DE COLOR · 5 CAPAS, DE ABAJO HACIA ARRIBA',11,'CB',C.tinta,{ls:1.2});
  const rows=[['1','Territorio','se siente, no se lee',[['Tierra','tierra'],['Agua','agua'],['Parque','parque']]],
    ['2','Red','identidad de cada línea',[['Amarilla','amarilla'],['Naranja','naranja'],['Azul','azul'],['Lila','lila'],['Café','cafe'],['Cian','cian']]],
    ['3','Estaciones','tinta y blanco',[['Tinta','tinta'],['Blanco','blanco']]],
    ['4','Estados','solo cuando algo pasa',[['Cerrada','cerrada'],['Cable','cable'],['Costo alto','rojo'],['Meta','verde']]],
    ['5','Información','texto y HUD',[['Texto','tinta'],['Secundario','sec'],['Borde','borde']]]];
  rows.forEach(([n,t,d,sw],i)=>{const y=212+i*104;
    s.t('inf',92,y+8,n,22,'EB',C.tinta);s.t('inf',124,y+6,t,15,'B',C.tinta);s.t('inf',124,y+26,d,11,'M',C.sec);
    sw.forEach(([nm,k],j)=>{const x=290+j*78;s.r('inf',x,y,64,40,{f:C[k],s:C.borde,sw:1,rr:6});
      s.t('inf',x,y+46,nm,10,'SB',C.tinta);s.t('inf',x,y+60,C[k],9,'M',C.sec)})});
  s.r('inf',90,742,660,32,{f:C.tierra,rr:8});
  s.t('inf',104,751,'Las líneas nunca usan rojo, verde ni magenta: esos tres son solo para costo, meta y cable.',11,'M',C.sec);
  s.r('inf',810,150,570,330,{f:C.blanco,s:C.borde,sw:1,rr:16});
  s.t('inf',840,174,'ANATOMÍA DE UNA VÍA · EL GROSOR ES LA REGLA',11,'CB',C.tinta,{ls:1.2});
  const an=[['ancha','Ancha','tiempo fijo, no se llena'],['angosta','Angosta','tiempo crece con los carros'],['cerrada','Cerrada','toca para abrir'],['cable','Cable','atajo: a veces ayuda, a veces estorba'],['obra','Obra','no se puede cerrar']];
  an.forEach(([k,t,d],i)=>{const y=222+i*50,x=840;
    if(k==='ancha'){s.p('inf',[[x,y],[x+90,y]],C.azul,14);s.p('inf',[[x,y],[x+90,y]],C.blanco,2.5,{d:[9,9],cap:'b'})}
    if(k==='angosta')s.p('inf',[[x,y],[x+90,y]],C.azul,7);
    if(k==='cerrada'){s.p('inf',[[x,y],[x+90,y]],C.cerrada,4,{d:[8,8]});s.e('inf',x+45,y,10,{f:C.blanco,s:C.cerrada,sw:2})}
    if(k==='cable')s.p('inf',[[x,y],[x+90,y]],C.cable,5,{d:[0.1,11]});
    if(k==='obra'){s.p('inf',[[x,y],[x+90,y]],C.naranja,7);s.p('inf',[[x,y],[x+90,y]],C.tinta,13,{d:[2.5,9],cap:'b'})}
    s.t('inf',x+120,y-9,t,14,'B',C.tinta);s.t('inf',x+200,y-7,d,12,'M',C.sec)});
  s.r('inf',810,500,570,130,{f:C.blanco,s:C.borde,sw:1,rr:16});
  s.t('inf',840,524,'CARROS Y COSTOS',11,'CB',C.tinta,{ls:1.2});
  s.p('inf',[[840,585],[1040,585]],C.amarilla,7);
  [880,930,980].forEach(x=>s.e('inf',x,585,5.5,{f:C.tinta,s:C.blanco,sw:2.5}));
  s.pill('inf',1110,585,[{v:'45',z:14,f:'B',c:C.rojo},{v:'min',z:9,f:'M',c:C.rojo}],{bd:C.rojo});
  s.pill('inf',1190,585,[{v:'20',z:14,f:'B',c:C.tinta},{v:'min',z:9,f:'M',c:C.sec}]);
  s.pill('inf',1270,585,[{v:'0',z:14,f:'B',c:C.cable},{v:'min',z:9,f:'M',c:C.cable}],{bd:C.cable});
  s.t('inf',840,608,'Carro: tinta con borde blanco. Una cifra por tramo.',11,'M',C.sec);
  s.r('inf',810,650,570,140,{f:C.blanco,s:C.borde,sw:1,rr:16});
  s.t('inf',840,674,'MAEDA EN CADA PANTALLA',11,'CB',C.tinta,{ls:1.2});
  ['Leyenda solo donde se aprende algo (niveles 01, 03 y 10).','Mensaje negro solo cuando aparece algo nuevo.','El HUD dice dos números: TOTAL y ÓPTIMO.','La dificultad se ve en el número de líneas.'].forEach((v,i)=>{s.e('inf',846,707+i*20,3,{f:C.tinta});s.t('inf',858,699+i*20,v,12,'M',C.tinta)});
  s.t('inf',60,826,'TIPOGRAFÍA',11,'CB',C.sec,{ls:1.2});
  s.t('inf',200,812,'Barlow 800 · 80 min',30,'EB',C.tinta);
  s.t('inf',540,820,'Barlow 600 · botones y títulos',18,'SB',C.tinta);
  s.t('inf',860,824,'BARLOW CONDENSED · ESTACIONES',14,'CB',C.tinta,{ls:1});
  return s;}
function unpack(P){const KD={a:'ancha',n:'angosta',c:'cable'},ND={t:'terminal',s:'station',b:'bar',c:'capsule'};
  return P.map(q=>{const[num,name,block,G,start,optimo,cambios,lineas,cables,grupos,msg,legend,phases,toques,NS,LS]=q;
    const nodes={};for(const n of NS){nodes[n[0]]={label:n[1],kind:ND[n[2]],x:n[3],y:n[4]};if(n[2]==='b'){nodes[n[0]].y1=n[5];nodes[n[0]].y2=n[6]}}
    const links=LS.map(r=>{const pts=[];for(let i=0;i<r[3].length;i+=2)pts.push([r[3][i],r[3][i+1]]);
      return{id:r[0],kind:KD[r[1]],line:r[2]||null,pts,op:!!r[4],os:!!r[5],locked:!!r[6],t0:r[7],x0:r[8],a:r[9],t1:r[10],x1:r[11]}});
    return{num,name,block,groups:G.map(g=>({from:g[0],to:g[1],cars:g[2]})),start,optimo,cambios,lineas,cables,grupos,msg,legend,phases,toques,nodes,links}})}
function allScenes(levels){const out=[sistema(),inicio(),plano(levels),bitacora()];
  for(const lv of levels){out.push(nivel(lv,false)); if(lv.num===3)out.push(nivel(lv,true));}
  return out;}
if(typeof module!=='undefined')module.exports={allScenes,unpack,C,tw,wrap};
