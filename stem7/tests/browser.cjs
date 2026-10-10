const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert'),vm=require('vm');
const {chromium}=require(process.env.STEM7_PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(__dirname,'..');
const artifacts=fs.mkdtempSync(path.join(require('os').tmpdir(),'stem7-browser-check-'));
for(const file of fs.readdirSync(path.join(root,'lessons')).filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(path.join(root,'lessons',file),'utf8'),{filename:file});
for(const [,code] of fs.readFileSync(path.join(root,'index.html'),'utf8').matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(code);
(async()=>{
 const server=http.createServer((req,res)=>{const rel=decodeURIComponent(req.url.split('?')[0]);const file=path.join(root,rel==='/'?'index.html':rel);try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webmanifest')?'application/manifest+json':file.endsWith('.svg')?'image/svg+xml':'text/html');res.end(fs.readFileSync(file))}catch{res.statusCode=404;res.end()}}).listen(0,'127.0.0.1');
 const browser=await chromium.launch({channel:process.env.STEM7_BROWSER_CHANNEL||'msedge',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>typeof RB==='object'&&Object.keys(RB).length===lessons.filter(l=>l.id!=='alg-equation').length);
 // Reset regression: seed both primary and backup, reset without reload side-effects, and verify old progress cannot return.
 await page.evaluate(()=>{state.testResetSentinel='must-disappear';state.skills['Reset sentinel']=99;persistState();window.confirm=()=>true;window.__resetReplace='';const oldReplace=location.replace;Object.defineProperty(window,'__resetReady',{value:true});});
 await page.evaluate(()=>{const real=location.replace;try{Object.defineProperty(location,'replace',{value:u=>{window.__resetReplace=u},configurable:true})}catch(e){};resetProgress()});
 const resetSnapshot=await page.evaluate(()=>({primary:JSON.parse(localStorage.getItem(KEY)||'null'),backup:localStorage.getItem(BACKUP_KEY),memory:state,flag:resetInProgress}));
 assert.equal(resetSnapshot.backup,null);assert.equal(resetSnapshot.memory.testResetSentinel,undefined);assert.equal(resetSnapshot.memory.skills['Reset sentinel'],undefined);assert.equal(resetSnapshot.primary.testResetSentinel,undefined);assert.equal(resetSnapshot.flag,true);
 await page.reload();await page.waitForFunction(()=>typeof RB==='object');assert.equal(await page.evaluate(()=>state.testResetSentinel),undefined);assert.equal(await page.evaluate(()=>localStorage.getItem(BACKUP_KEY)!==null),false);

 const ids=await page.evaluate(()=>lessons.filter(l=>l.id!=='alg-equation'&&!['bio','chem'].includes(l.s)).map(l=>l.id));assert.equal(ids.length,50);
 await page.evaluate(()=>{state.testSentinel='preserve-me';state.skills['Збережена навичка']=87;state.coordLearning={step:3,errors:2,review:[1],self:true,exam:false};state.angleLearning={step:4,attempts:{},mistakes:[1],testScore:3};state.triangleLearning={practice:2,quiz:{1:true},stem:1};state.completedVariants['alg-expr']=['0'];state.last='alg-expr';persistState()});
 const legacy=await page.evaluate(()=>({coord:state.coordLearning,angle:state.angleLearning,triangle:state.triangleLearning,keys:[KEY,BACKUP_KEY],skills:state.skills['Збережена навичка']}));
 await page.click('#continueBtn');assert.equal(await page.locator('[data-rebuilt]').getAttribute('data-rebuilt'),'alg-expr');assert((await page.locator('.q').first().innerText()).length>0);
 let practice=0,models=0,quizzes=0,missions=0;
 async function answer(key,value){const input=page.locator('#'+key);await input.fill(String(value));await input.locator('..').locator('[data-rb-check]').click()}
 for(const id of ids){
  await page.locator('#mobileLessonSelect').selectOption(id);assert.equal(await page.locator('[data-rebuilt]').getAttribute('data-rebuilt'),id);
  const data=await page.evaluate(id=>{const l=lessons.find(x=>x.id===id),t=RB[id];return {controls:t.controls,bank:practiceBanks[id]||[l.q],quiz:t.quiz,steps:t.mission.steps,check:t.check.answer(rbRead(t))}},id);
  assert(data.bank.length>=1);assert(data.quiz.length>=2);assert(data.steps.length>=2);
  await answer('rb-explore','');assert((await page.locator('#rb-explore-fb').innerText()).includes('Введи число'));
  await answer('rb-explore',data.check+10000);assert((await page.locator('#rb-explore-fb').innerText()).startsWith('↩'));
  await answer('rb-explore',data.check);assert((await page.locator('#rb-explore-fb').innerText()).startsWith('✓'));models++;
  for(const c of data.controls){for(const value of [c.min,c.max]){await page.locator('#rb-'+c.name).fill(String(value));assert(!(await page.locator('#rb-model').innerHTML()).match(/NaN|Infinity|undefined/),id+' model at '+value);const result=await page.evaluate(id=>RB[id].check.answer(rbRead(RB[id])),id);await answer('rb-explore',String(result).replace('.',','));assert((await page.locator('#rb-explore-fb').innerText()).startsWith('✓'),id+' model at '+value)}}
  for(const [i,q] of data.bank.entries()){
   await answer('rb-p'+i,q.ans+10000);assert((await page.locator('#rb-p'+i+'-fb').innerText()).startsWith('↩'),id+' wrong practice');
   await answer('rb-p'+i,String(q.ans).replace('-', '−').replace('.',','));assert((await page.locator('#rb-p'+i+'-fb').innerText()).startsWith('✓'),id+' correct practice');practice++;
  }
  const before=await page.evaluate(id=>({done:state.completedVariants[id],wins:state.independentWins[lessons.find(x=>x.id===id).skill]}),id);await answer('rb-p0',data.bank[0].ans);assert.deepEqual(await page.evaluate(id=>({done:state.completedVariants[id],wins:state.independentWins[lessons.find(x=>x.id===id).skill]}),id),before);
  for(const [i,q] of data.quiz.entries()){
   await page.locator('[data-rb-quiz="'+i+'"]').click();assert((await page.locator('#rb-q'+i+'-fb').innerText()).startsWith('↩'));
   for(const j of q.correct)await page.locator('input[name="rb-q'+i+'"][value="'+j+'"]').check();await page.locator('[data-rb-quiz="'+i+'"]').click();assert((await page.locator('#rb-q'+i+'-fb').innerText()).startsWith('✓'),id+' quiz');quizzes++;
  }
  assert(await page.locator('#rb-m1-stage').isHidden());await answer('rb-m0',data.steps[0].ans+1);assert(await page.locator('#rb-m1-stage').isHidden());
  for(const [i,q] of data.steps.entries()){await answer('rb-m'+i,q.ans);assert((await page.locator('#rb-m'+i+'-fb').innerText()).startsWith('✓'));missions++}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile overflow');console.log('Checked '+id);
 }
 await page.reload();await page.click('#continueBtn');assert(await page.locator('#rb-m1-stage').isVisible());
 assert.deepEqual(await page.evaluate(()=>({coord:state.coordLearning,angle:state.angleLearning,triangle:state.triangleLearning,keys:[KEY,BACKUP_KEY],skills:state.skills['Збережена навичка']})),legacy);assert.equal(await page.evaluate(()=>state.testSentinel),'preserve-me');
 for(const width of [360,768,1280]){await page.setViewportSize({width,height:900});for(const id of ids){await page.evaluate(id=>openLesson(id),id);assert(await page.locator('[data-rebuilt]').count()===1);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' overflow '+width)}}
 await page.setViewportSize({width:1280,height:900});await page.evaluate(()=>directOpenLesson('alg-expr'));await page.locator('[data-lesson="phy-measure"]').click();assert.equal(await page.locator('[data-rebuilt]').getAttribute('data-rebuilt'),'phy-measure');
 await page.getByRole('button',{name:'На головну',exact:true}).click();for(const s of ['alg','geo','phy']){await page.locator('.subject-learn[data-subject="'+s+'"]').click();await page.locator('#mobileLessonSelect').waitFor({state:'attached'});await page.getByRole('button',{name:'На головну',exact:true}).click()}
 await page.evaluate(()=>directOpenLesson('alg-equation'));await page.getByRole('button',{name:'−5 з обох частин',exact:true}).click();await page.getByRole('button',{name:'÷3 обох частин',exact:true}).click();assert((await page.locator('#eqBalance').innerText()).includes('x = 5'));
 for(const id of ['alg-expr','alg-formulas','geo-parallel','geo-median','phy-measure','phy-graph','phy-torque','stem-water']){await page.evaluate(id=>directOpenLesson(id),id);await page.locator('#rb-model').screenshot({path:path.join(artifacts,id+'.png')})}
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>navigator.serviceWorker.controller);assert(await page.evaluate(()=>caches.has('stem7-pwa-v25')));await page.setViewportSize({width:390,height:844});await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof RB==='object'&&Object.keys(RB).length===lessons.filter(l=>l.id!=='alg-equation').length);await page.click('#continueBtn');await page.locator('#mobileLessonSelect').selectOption('phy-force');assert(await page.locator('#rb-model svg').count()===1);await context.setOffline(false);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({status:'PASS',navigationTopics:ids.length,practice,models,quizzes,missions,viewports:[360,390,768,1280],legacyProgressPreserved:true,offline:true,pageErrors:errors},null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
