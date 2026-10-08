/* Original pixel landscape. No external renderer or image requests. */
(() => {
  "use strict";
  let dispose = () => {};
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  function mount() {
    dispose();
    const scene = document.querySelector(".pixel-world");
    if (!scene) return;
    const canvas = scene.querySelector(".sky-canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const skip = scene.querySelector("[data-sky-skip]");
    let dead = false, visible = true, raf = 0, lastFrame = 0, time = 0, intro = false;
    let introTime = 0, W = 480, H = 260, camera = 0, target = 0, nextMeteor = 7;
    let meteors = [], seed = 893, stars = [];
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 125; i++) stars.push({ x: rnd(), y: rnd() * .69, size: rnd() > .88 ? 2 : 1, phase: rnd() * 6.28, gold: rnd() > .8 });
    const night = { sky: ["#0c102b","#121536","#1c1c43","#29254d","#393153","#4a3a59"], far: "#373256", mid: "#262943", near: "#181e36", snow: "#635173", water: "#182e41", ripple: "#36536a", bank: "#111b2d", pine: "#101728", needles: "#18283a", moon: "#fff1c7", star: "#b5bfdf", gold: "#efc59c", roof: "#282738", wall: "#4c4050" };
    const day = { sky: ["#bdc9e3","#c8cce3","#d4cfe3","#e4d5e0","#f0d9d8","#f6dfd4"], far: "#a5a0bd", mid: "#898aa8", near: "#677a94", snow: "#e1d5e1", water: "#9dbbc8", ripple: "#d2e2e4", bank: "#546d80", pine: "#425f70", needles: "#658493", moon: "#fff6db", star: "#fff5df", gold: "#e7bb78", roof: "#63586e", wall: "#ac8990" };
    function rect(x,y,w,h,color,alpha=1) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
      ctx.globalAlpha = 1;
    }
    function tree(x, y, size, p, detail = true) {
      x = Math.round(x); y = Math.round(y);
      rect(x-1,y-size*.25,2,size*.3,p.pine);
      for(let k=0;k<6;k++) {
        const yy = y-size+k*size*.12, width = (k+1)*size*.065;
        rect(x-width,yy,width*2,size*.17,p.pine);
        if(detail && k>1)rect(x-width,yy,width*.8,1,p.needles);
      }
    }
    function ridge(points, baseline, color, shift) {
      for(let i=0;i<points.length-1;i++) {
        const a=points[i],b=points[i+1];
        const x1=a[0]*W+shift,x2=b[0]*W+shift;
        for(let x=x1;x<x2;x+=3){
          const y=(a[1]+(b[1]-a[1])*((x-x1)/(x2-x1)))*H;
          rect(x,Math.floor(y/3)*3,3,baseline-y+4,color);
        }
      }
    }
    function addMeteor(x, y) {
      if(meteors.length<2)meteors.push({x:x*W,y:y*H,age:0});
    }
    function draw() {
      const light = document.documentElement.dataset.theme === "light";
      const p = light ? day : night;
      const progress = intro ? Math.min(1,introTime/2.2) : 1;
      const rise = (1-Math.pow(1-Math.min(1,progress),3))*1;
      ctx.clearRect(0,0,W,H);
      // Stepped color bands keep the landscape deliberately low resolution.
      const bands=24;
      for(let i=0;i<bands;i++){
        const at=i/(bands-1)*(p.sky.length-1), a=p.sky[Math.floor(at)], b=p.sky[Math.min(p.sky.length-1,Math.ceil(at))];
        const f=at%1, rgb=[1,3,5].map(n=>Math.round(parseInt(a.slice(n,n+2),16)*(1-f)+parseInt(b.slice(n,n+2),16)*f));
        rect(0,i*H/bands,W,H/bands+1,"rgb("+rgb.join(",")+")");
      }
      stars.forEach((s,i)=>{
        const alpha = Math.max(.22,.65+Math.sin(time*.8+s.phase)*.3)*Math.min(1,progress*3-i/170);
        if(alpha<=0)return;
        const x=(s.x*W+camera*2+W)%W,y=s.y*H;
        rect(x,y,s.size,s.size,s.gold?p.gold:p.star,alpha*(light?.35:1));
        if(s.size===2&&i%3===0){rect(x-2,y+.5,6,1,p.moon,alpha*.6);rect(x+.5,y-2,1,6,p.moon,alpha*.6);}
      });
      // The moon is assembled from square pixels, with an offset circular cutout.
      const mx=W*.82+camera*3, my=H*(W<210?.115:.19), radius=W<210?11:16;
      for(let yy=-radius;yy<=radius;yy++)for(let xx=-radius;xx<=radius;xx++){
        if(xx*xx+yy*yy>radius*radius)continue;
        const cut=(xx-6)*(xx-6)+(yy+4)*(yy+4)<radius*radius;
        if(light||!cut)rect(mx+xx,my+yy,1,1,p.moon,Math.min(1,progress*2));
      }
      meteors.forEach(m=>{
        const dx=m.age*80,dy=m.age*31;
        for(let k=13;k>=0;k--)rect(m.x+dx-k*3,m.y+dy-k, k<2?2:1,1,p.moon,Math.max(0,(1-m.age/1.5)*(1-k/15)));
      });
      ctx.save();
      ctx.translate(0,Math.round((1-rise)*H*.38));
      ridge([[-.1,.67],[.03,.6],[.13,.68],[.28,.49],[.42,.67],[.57,.45],[.72,.64],[.84,.5],[1.1,.68]],H,p.far,camera*4);
      // Small ledges of moonlight on the distant peaks.
      for(const [x,y]of [[.28,.49],[.57,.45],[.84,.5]]) {
        rect(x*W-2+camera*4,y*H+4,5,2,p.snow,.55);
        rect(x*W-6+camera*4,y*H+6,11,2,p.snow,.45);
      }
      ridge([[-.1,.73],[.08,.65],[.21,.73],[.4,.62],[.54,.73],[.7,.58],[.87,.72],[1.1,.64]],H,p.mid,camera*7);
      ridge([[-.1,.8],[.08,.76],[.23,.81],[.39,.71],[.55,.79],[.72,.74],[.86,.77],[1.1,.73]],H,p.near,camera*9);
      const lake=H*.81;
      rect(0,lake,W,H-lake,p.water);
      // Lake reflections shift by one pixel, without smooth vector effects.
      for(let k=0;k<28;k++){
        const yy=lake+3+k*(H-lake)/28;
        const spread=8+k*.6, move=Math.round(Math.sin(time*.7+k)*2);
        rect(W*.81-spread+move,yy,spread*2,1,p.ripple,(k%3===0?.6:.3));
        if(k%3===0)rect((k*41)%W,yy,12+k%13,1,p.ripple,.25);
      }
      // Opposite shore with clustered conifers.
      for(let i=0;i<36;i++){
        const x=i*W/35+camera*10, y=H*(.79+Math.sin(i*.9)*.01);
        tree(x,y,9+(i*7)%17,p,false);
      }
      // A warm cabin on the far shore, with window light and chimney smoke.
      const cx=W*(W<210?.65:.74)+camera*7, cy=H*.82, s=W<210?.85:1;
      ctx.save();ctx.translate(Math.round(cx),Math.round(cy));ctx.scale(s,s);
      rect(-19,-17,37,19,p.wall);rect(-22,1,46,3,p.bank);
      for(let k=0;k<6;k++)rect(-22+k*3,-18-k*2,44-k*6,2,p.roof);
      rect(9,-32,4,12,p.wall);rect(8,-33,6,2,p.roof);
      rect(-14,-11,8,8,"#f0bc86");rect(5,-11,8,8,"#f0bc86");
      rect(-11,-11,1,8,p.wall);rect(-14,-8,8,1,p.wall);
      rect(8,-11,1,8,p.wall);rect(5,-8,8,1,p.wall);
      rect(-2,-10,5,12,"#2b2737");rect(1,-5,1,1,p.gold);
      rect(-17,4,31,1,p.gold,.17);rect(-13,7,25,1,p.gold,.12);
      for(let i=0;i<4;i++) {
        const drift=(time*.8+i*4)%18;
        rect(10+Math.sin(time*.45+i)*2,-34-drift,2+i%2,2,p.snow,(1-drift/18)*.4);
      }
      ctx.restore();
      // Foreground land and pines frame the scene.
      ridge([[-.1,.87],[.02,.88],[.1,.93],[.22,.97],[.36,1.02],[.58,1.08],[.8,1.04],[.95,.95],[1.1,.9]],H+10,p.bank,camera*13);
      const treeScale=Math.min(1,W/H*1.12);
      tree(W*.035+camera*14,H*.98,H*.39*treeScale,p);
      tree(W*.09+camera*12,H*.985,H*.27*treeScale,p);
      tree(W*.965+camera*14,H*1.01,H*.4*treeScale,p);
      tree(W*1.01+camera*15,H*1.04,H*.5*treeScale,p);
      tree(W*.91+camera*12,H*1.02,H*.26*treeScale,p);
      // Tiny fireflies hover near the shore.
      for(let i=0;i<8;i++)rect(W*(.14+i*.09)+Math.sin(time*.5+i)*3,H*(.86+(i%3)*.035)+Math.cos(time*.6+i)*2,1,1,p.gold,(Math.sin(time+i*2)+1)*.23);
      ctx.restore();
      if(intro&&progress<.2)rect(0,0,W,H,light?"#d4cfe3":"#0c102b",1-progress*5);
    }
    function finishIntro() {
      intro=false;scene.classList.remove("is-intro");skip.hidden=true;draw();
      try{sessionStorage.setItem("portfolio-sky-seen","true");}catch{}
    }
    function startIntro() {
      if(motion.matches)return;
      intro=true;introTime=0;scene.classList.remove("is-intro");
      void scene.offsetWidth;
      scene.classList.add("is-intro");skip.hidden=false;
      meteors=[{x:W*.5,y:H*.07,age:0}];schedule();
    }
    function frame(now) {
      raf=0;
      if(dead||!visible||document.hidden||motion.matches)return;
      if(now-lastFrame<32){raf=requestAnimationFrame(frame);return;}
      const dt=Math.min(.06,(now-lastFrame)/1000||.033);lastFrame=now;time+=dt;
      camera+=(target-camera)*.035;
      meteors.forEach(m=>m.age+=dt);meteors=meteors.filter(m=>m.age<1.5);
      if(intro){introTime+=dt;if(introTime>2.8)finishIntro();}
      if(time>nextMeteor){addMeteor(.35+Math.random()*.35,.03+Math.random()*.15);nextMeteor=time+12+Math.random()*8;}
      draw();raf=requestAnimationFrame(frame);
    }
    function schedule() {if(!raf&&!dead&&visible&&!document.hidden&&!motion.matches){lastFrame=performance.now();raf=requestAnimationFrame(frame);}}
    function stop(){cancelAnimationFrame(raf);raf=0;}
    function syncMotion() {
      if(motion.matches){stop();finishIntro();}else schedule();
    }
    function resize() {
      const box=scene.getBoundingClientRect(), pixel=box.width<600?2:3;
      W=Math.ceil(box.width/pixel);H=Math.ceil(box.height/pixel);
      canvas.width=W;canvas.height=H;ctx.imageSmoothingEnabled=false;draw();
    }
    const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(scene);
    const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();else stop();});
    visibilityObserver.observe(scene);
    const onMove=e=>{if(e.pointerType==="mouse"&&!motion.matches){const box=scene.getBoundingClientRect();target=(e.clientX-box.left)/box.width*2-1;}};
    const onLeave=()=>{target=0;};
    const onVisibility=()=>document.hidden?stop():schedule();
    const onSkip=()=>{finishIntro();scene.querySelector(".world-actions a").focus({preventScroll:true});};
    skip.addEventListener("click",onSkip);
    scene.addEventListener("pointermove",onMove);scene.addEventListener("pointerleave",onLeave);
    document.addEventListener("visibilitychange",onVisibility);motion.addEventListener("change",syncMotion);
    const themeObserver=new MutationObserver(draw);themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:["data-theme"]});
    resize();syncMotion();
    let seen=false;try{seen=sessionStorage.getItem("portfolio-sky-seen")==="true";}catch{}
    if(!seen&&!motion.matches)startIntro();
    dispose=()=>{
      dead=true;stop();sizeObserver.disconnect();visibilityObserver.disconnect();themeObserver.disconnect();
      document.removeEventListener("visibilitychange",onVisibility);motion.removeEventListener("change",syncMotion);
      skip.removeEventListener("click",onSkip);
      scene.removeEventListener("pointermove",onMove);scene.removeEventListener("pointerleave",onLeave);
    };
  }
  window.PortfolioSky={mount,destroy:()=>dispose()};
})();
