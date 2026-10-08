const assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm");
const source=fs.readFileSync(require("node:path").join(__dirname,"../wwwroot/sky.js"),"utf8");
function fixture({reduce=false,seen=false,storageBlocked=false}={}) {
 class Target {
  constructor(){this.events={};this.hidden=false;this.attrs={};this.textContent="";this.last={textContent:""};this.classList={values:new Set(),add:c=>this.classList.values.add(c),remove:c=>this.classList.values.delete(c),contains:c=>this.classList.values.has(c)}}
  addEventListener(k,f){(this.events[k]??=new Set()).add(f)}
  removeEventListener(k,f){this.events[k]?.delete(f)}
  emit(k,e={}){for(const f of this.events[k]??[])f(e)}
  setAttribute(k,v){this.attrs[k]=v}
  querySelector(){return this.last}
  focus(){this.focused=true}
 }
 const document=new Target(), scene=new Target(), elements={};
 let draws=0,renderedColors=new Set(),now=0,id=0;
 const queue=new Map(),observations=[];
 for(const s of ["[data-sky-skip]",".world-actions a"])elements[s]=new Target();
 const context={fillRect(...args){assert(args.every(Number.isFinite));draws++;renderedColors.add(this.fillStyle)},clearRect(){},save(){},restore(){},translate(){},scale(){}};
 elements[".sky-canvas"]={getContext:()=>context,width:480,height:280};
 scene.querySelector=s=>elements[s];scene.getBoundingClientRect=()=>({width:1440,height:840,left:0,top:0});
 document.querySelector=()=>scene;document.documentElement={dataset:{theme:"dark"}};
 const motion=new Target();motion.matches=reduce;
 const data=new Map([["portfolio-sky-seen",String(seen)]]);
 const sessionStorage={getItem:k=>{if(storageBlocked)throw Error("blocked");return data.get(k)},setItem:(k,v)=>{if(storageBlocked)throw Error("blocked");data.set(k,v)}};
 function Observer(callback){this.callback=callback;this.disconnected=false;observations.push(this);this.observe=()=>{};this.disconnect=()=>{this.disconnected=true}}
 const window={getSelection:()=>""};
 vm.runInNewContext(source,{window,document,matchMedia:()=>motion,sessionStorage,ResizeObserver:Observer,IntersectionObserver:Observer,MutationObserver:Observer,requestAnimationFrame:f=>{queue.set(++id,f);return id},cancelAnimationFrame:n=>queue.delete(n),performance:{now:()=>now},Math});
 function frames(n=1){for(let i=0;i<n;i++){now+=34;const callbacks=[...queue.values()];queue.clear();for(const f of callbacks)f(now)}}
 return {window,document,scene,elements,motion,data,queue,observations,frames,get draws(){return draws},renderedColors};
}
const passed=[];
const f=fixture();f.window.PortfolioSky.mount();assert(f.scene.classList.contains("is-intro"));f.frames(90);assert(!f.scene.classList.contains("is-intro"));assert(f.elements["[data-sky-skip]"].hidden);assert.equal(f.data.get("portfolio-sky-seen"),"true");passed.push("Opening completes and only runs automatically once per session");
const skipFixture=fixture();skipFixture.window.PortfolioSky.mount();
skipFixture.elements["[data-sky-skip]"].emit("click");assert(skipFixture.elements[".world-actions a"].focused);assert(!skipFixture.scene.classList.contains("is-intro"));skipFixture.window.PortfolioSky.destroy();passed.push("Skip intro returns keyboard focus to the portfolio");
f.frames(500);assert.equal(f.queue.size,1);passed.push("Ambient stars maintain a single rendering loop");
f.motion.matches=true;f.motion.emit("change");assert.equal(f.queue.size,0);const reducedDraws=f.draws;f.frames(20);assert.equal(f.draws,reducedDraws);
f.document.documentElement.dataset.theme="light";f.observations[2].callback();assert(f.renderedColors.has("#425f70"));assert.equal(f.queue.size,0);passed.push("Live reduced-motion preference stops animation, while theme changes still render");
f.motion.matches=false;f.motion.emit("change");assert.equal(f.queue.size,1);f.observations[1].callback([{isIntersecting:false}]);assert.equal(f.queue.size,0);f.observations[1].callback([{isIntersecting:true}]);assert.equal(f.queue.size,1);
f.document.hidden=true;f.document.emit("visibilitychange");assert.equal(f.queue.size,0);f.document.hidden=false;f.document.emit("visibilitychange");assert.equal(f.queue.size,1);passed.push("Offscreen and background scenes stop rendering");
f.window.PortfolioSky.destroy();assert.equal(f.queue.size,0);assert(f.observations.every(o=>o.disconnected));assert.equal(f.document.events.visibilitychange.size,0);assert.equal(f.motion.events.change.size,0);
f.window.PortfolioSky.mount();assert.equal(f.elements["[data-sky-skip]"].events.click.size,1);assert(!f.scene.classList.contains("is-intro"));f.window.PortfolioSky.destroy();passed.push("Navigation disposes observers and handlers without duplicating them");
for(const options of [{reduce:true},{storageBlocked:true}]){
 const g=fixture(options);g.window.PortfolioSky.mount();assert(g.draws>0);
 if(options.reduce){assert.equal(g.queue.size,0);assert(!g.scene.classList.contains("is-intro"))}
 g.window.PortfolioSky.destroy();
}
passed.push("Initial reduced motion and blocked browser storage are supported");
console.log(JSON.stringify({passed,errors:[]},null,2));
