function coach(s,paso,total,titulo,texto,cx,cy,btn){
  const W=380,lines=wrap(texto,14,'M',W-48),H=140+lines.length*20,x=Math.max(40,Math.min(1440-W-40,cx-W/2)),y=cy;
  s.r('top',x,y,W,H,{f:C.blanco,rr:18,n:'tutorial:tarjeta'});
  for(let i=0;i<total;i++)s.e('top',x+28+i*16,y+28,4,{f:i<paso?C.tinta:C.borde});
  s.t('top',x+W-24,y+20,`PASO ${paso} DE ${total}`,10,'CB',C.sec,{a:'r',ls:1.2});
  s.t('top',x+24,y+46,titulo,22,'B',C.tinta);
  lines.forEach((l,i)=>s.t('top',x+24,y+80+i*20,l,14,'M',C.sec));
  s.pill('top',x+W-24-(tw(btn,14,'SB')+36)/2,y+H-28,[{v:btn,z:14,f:'SB',c:C.blanco}],{bg:C.tinta,bd:C.tinta,px:18,py:9,n:'btn:siguiente'});
  s.t('top',x+24,y+H-36,'Saltar',13,'SB',C.sec,{n:'btn:saltar'});}
function dedo(s,x,y){s.e('top',x,y,30,{s:C.blanco,sw:3,o:.6,n:'tap:onda'});s.e('top',x,y,18,{f:C.blanco,o:.95,n:'tap'});s.e('top',x,y,7,{f:C.tinta})}
function lift(s,pred){const sel=s.it.filter(i=>i.L!=='top'&&i.L!=='ter'&&pred(i));for(const i of sel)s.it.push(Object.assign({},i,{L:'top'},i.k==='t'?{c:C.blanco}:{}))}
function tutorial(L1){
  const out=[];const base=JSON.parse(JSON.stringify(L1));base.msg=null;base.legend=null;
  const dim=s=>s.r('top',0,0,1440,900,{f:C.tinta,o:.55,n:'tutorial:velo'});
  const isN=(i,p)=>i.n&&i.n.indexOf(p)===0;
  let s=nivel(base,false);s.name='Tutorial · 1 · Los carros';dim(s);
  lift(s,i=>isN(i,'via:s')||i.n==='costo:s'||i.n==='carro'||isN(i,'nodo:')||(i.L==='est'&&i.k!=='r')||i.n==='grupo');
  coach(s,1,4,'Estos son los carros','Salen de Portal Usme y todos quieren llegar a Av. Jiménez lo más rápido posible.',720,560,'Siguiente');out.push(s);
  s=nivel(base,false);s.name='Tutorial · 2 · Cada vía tiene un tiempo';dim(s);
  lift(s,i=>i.n==='costo:s');s.e('top',720,340,42,{s:C.blanco,sw:2,o:.8});
  coach(s,2,4,'Cada vía dice cuánto se demora','Esta vía es angosta: entre más carros, más lenta. Hoy van todos por aquí y se demoran 60 min.',720,420,'Siguiente');out.push(s);
  s=nivel(base,false);s.name='Tutorial · 3 · Toca para abrir o cerrar';dim(s);
  const xi=s.it.findIndex(i=>i.n==='x:n');lift(s,(i)=>{const k=s.it.indexOf(i);return isN(i,'via:n')||(k>=xi&&k<=xi+2)});
  dedo(s,738,676);
  coach(s,3,4,'Toca una vía para abrirla','La vía de abajo está cerrada. Es ancha: siempre se demora 45 min y no se llena. Tócala.',720,420,'Ya la toqué');out.push(s);
  const r=JSON.parse(JSON.stringify(base));r.start=45;
  for(const l of r.links){if(l.id==='s'){l.t0=45;l.x0=4500}if(l.id==='n'){l.op=true;l.t0=45;l.x0=1500}}
  s=nivel(r,false);s.name='Tutorial · 4 · El equilibrio';
  for(const i of s.it){if(i.n==='hud:total')i.c=C.verde;if(i.n==='HUD'){i.s=C.verde;i.sw=2}if(i.n==='progreso')i.f=C.verde}
  dim(s);lift(s,i=>i.L==='inf'&&i.x>=1070&&i.y<170);
  coach(s,4,4,'¡Bajó de 60 a 45!','Los carros se repartieron solos. Cuando TOTAL llega a ÓPTIMO, la ciudad está en equilibrio.',1060,190,'Jugar');out.push(s);
  return out;}
function cargaApp(){const s=S('Carga · Inicio de la app');
  s.g('ter',[[1150,0],[1440,0],[1440,190]],C.agua);s.g('ter',[[0,680],[0,900],[290,900]],C.agua);
  [[18,0],[34,1],[50,2]].forEach(([x,i])=>s.e('inf',662+x,330,7,{f:[C.amarilla,C.naranja,C.azul][i]}));
  s.t('inf',720,356,'Equilibrio',72,'EB',C.tinta,{a:'c',n:'titulo'});
  const y=520,x0=420,x1=1020;
  s.p('red',[[x0,y],[x1,y]],C.cerrada,6,{d:[8,8],n:'progreso:pendiente'});
  s.p('red',[[x0,y],[780,y]],C.amarilla,12,{n:'progreso:hecho'});
  [0,1,2,3,4].forEach(i=>{const x=x0+i*150;if(x<=780){s.e('est',x,y,13,{f:C.tinta});s.e('est',x,y,5,{f:C.blanco})}else s.e('est',x,y,10,{f:C.blanco,s:C.cerrada,sw:4})});
  [690,730,770].forEach(x=>s.e('sta',x-20,y,5.5,{f:C.tinta,s:C.blanco,sw:2.5,n:'carro'}));
  s.t('inf',720,556,'CARGANDO LA RED DE BOGOTÁ · 60%',12,'CB',C.sec,{a:'c',ls:1.4,n:'progreso:texto'});
  s.r('inf',470,690,500,64,{f:C.blanco,s:C.borde,sw:1,rr:14,n:'dato'});
  s.t('inf',494,704,'¿SABÍAS QUE?',10,'CB',C.cable,{ls:1.2});
  s.t('inf',494,722,'A veces abrir un atajo hace que todos lleguen más tarde.',14,'M',C.tinta);
  s.t('inf',720,836,'SIMPLICIDAD = EQUILIBRIO · JOHN MAEDA',12,'CB',C.sec,{a:'c',ls:1.4});
  return s;}
function cargaNivel(lv){const s=S(`Carga · Entrando al nivel ${String(lv.num).padStart(2,'0')}`);
  territorio(s,lv.num,0);
  for(const l of lv.links){const c=l.kind==='cable'?C.cable:(C[l.line]||C.tinta);
    s.p('red',l.pts.map(p=>[p[0],p[1]]),c,l.kind==='cable'?3:4,{o:.25,rad:22,d:l.kind==='cable'?[0.1,8]:null})}
  const [bn,bc]=BLK[lv.block];
  s.r('inf',470,290,500,320,{f:C.blanco,s:C.borde,sw:1,rr:22,n:'tarjeta'});
  s.e('inf',720,360,34,{f:bc});s.t('inf',720,343,String(lv.num).padStart(2,'0'),26,'B',lv.block==1?C.tinta:C.blanco,{a:'c'});
  s.t('inf',720,410,lv.name,34,'B',C.tinta,{a:'c'});
  s.t('inf',720,458,`${bn.toUpperCase()} · ${lv.lineas} LÍNEAS · ${lv.cables} CABLE${lv.cables==1?'':'S'}`,12,'CB',C.sec,{a:'c',ls:1.2});
  s.t('inf',720,490,`Empiezas en ${nf(lv.start)} min por carro. La meta: ${nf(lv.optimo)}.`,15,'M',C.tinta,{a:'c'});
  s.pill('inf',720,560,[{v:'Toca para empezar',z:15,f:'SB',c:C.blanco}],{bg:C.tinta,bd:C.tinta,px:20,py:11,n:'btn:empezar'});
  return s;}
function extraScenes(levels){const g=n=>levels.find(l=>l.num===n);return[...tutorial(g(1)),cargaApp(),cargaNivel(g(3))]}
if(typeof module!=='undefined')module.exports={extraScenes};
