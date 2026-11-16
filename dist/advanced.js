(() => {
  'use strict';
  const api = window.BrahmaAPI;
  if (!api) return;
  const $ = selector => document.querySelector(selector);
  const w = () => api.getWorkspace();
  const e = api.esc;
  const fmt = api.fmtNum;
  const money = api.money;
  const signed = api.signedMoney;
  const icon = name => `<svg class="ui-icon" aria-hidden="true"><use href="./icons.svg#${name}"/></svg>`;
  const value = (record, key) => typeof record[key] === 'number' ? record[key] : 0;
  const today = () => new Date().toLocaleDateString('en-CA');
  let selectedCycleId = '';
  let editingCycleId = '';
  let draftPlan = null;

  function fieldArea(name) {
    return w().fields.find(field => field.name === name)?.area ?? null;
  }
  function cycleRows(cycle) {
    return w().records.filter(record => record.cycleId === cycle.id);
  }
  function cycleSummary(cycle) {
    const rows = cycleRows(cycle);
    const totals = api.totals(rows);
    const area = cycle.area || fieldArea(cycle.field);
    const sales = rows.filter(record => record.activity === 'Sale' && record.revenue != null);
    const harvests = rows.filter(record => record.activity === 'Harvest' && record.unit === 'kg' && record.quantity != null);
    return {rows,totals,area,sales,harvests,net:totals.revenue-totals.cost};
  }
  function latestHealth(records) {
    return [...records].filter(record => record.health).sort((a,b)=>b.date.localeCompare(a.date))[0] || null;
  }
  function statusLabel(status) {
    return status === 'harvested' ? 'Harvested' : status === 'planned' ? 'Planned' : 'Active';
  }
  function quality() {
    const workspace = w();
    const issues = [];
    const total = workspace.records.length;
    const unlinked = workspace.records.filter(record => !record.cycleId).length;
    const noArea = workspace.fields.filter(field => !(field.area > 0)).length;
    const irrigation = workspace.records.filter(record => record.activity === 'Irrigation');
    const noWater = irrigation.filter(record => !(record.water > 0)).length;
    const harvest = workspace.records.filter(record => record.activity === 'Harvest');
    const noHarvest = harvest.filter(record => record.unit !== 'kg' || !(record.quantity > 0)).length;
    const sales = workspace.records.filter(record => record.activity === 'Sale');
    const noRevenue = sales.filter(record => record.revenue == null).length;
    const cyclesWithoutHarvest = workspace.cycles.filter(cycle => {
      const summary = cycleSummary(cycle);
      return summary.sales.length && !summary.harvests.length;
    }).length;
    if(unlinked) issues.push({count:unlinked,title:'Records without a crop cycle',detail:'Link rows in the spreadsheet for reliable cycle economics.',view:'sheet'});
    if(noArea) issues.push({count:noArea,title:'Fields without area',detail:'Area is needed for per-acre comparisons.',view:'settings'});
    if(noWater) issues.push({count:noWater,title:'Irrigation rows without litres',detail:'Add measured water to compare field use.',view:'sheet'});
    if(noHarvest) issues.push({count:noHarvest,title:'Harvest rows without kg',detail:'Weighed harvests support yield and water efficiency.',view:'sheet'});
    if(noRevenue) issues.push({count:noRevenue,title:'Sales without revenue',detail:'Complete the sale amount before judging returns.',view:'sheet'});
    if(cyclesWithoutHarvest) issues.push({count:cyclesWithoutHarvest,title:'Sold cycles without weighed harvest',detail:'Add harvest weight before calculating yield per acre.',view:'cycles'});
    const eligible = total + workspace.fields.length + irrigation.length + harvest.length + sales.length;
    const incomplete = unlinked + noArea + noWater + noHarvest + noRevenue;
    const score = eligible ? Math.max(0,Math.round((eligible-incomplete)/eligible*100)) : 0;
    return {issues,score,unlinked,total};
  }

  function renderHero() {
    const active = w().cycles.filter(c=>c.status==='active').length;
    const open = w().tasks.filter(t=>t.status!=='done').length;
    const q = quality();
    $('#heroStrip').innerHTML = `<div class="hero-main"><span class="hero-overline"><span class="live-dot"></span> FARM WORKSPACE · LOCAL MODE</span><h2>Make the next decision<br><em>with the whole picture.</em></h2><p>One connected view of every field, crop cycle and farm activity.</p><div class="hero-actions"><button class="hero-primary" data-view="cycles">Explore crop cycles <span>↗</span></button><button class="hero-secondary" data-view="planner">Open planner →</button></div></div><div class="hero-side"><div><strong>${active}</strong><span>Active cycles</span></div><div><strong>${open}</strong><span>Open tasks</span></div><div><strong>${q.score}%</strong><span>Record completeness</span></div></div><div class="hero-pattern" aria-hidden="true"></div>`;
  }
  function renderOverviewFields() {
    const fields=w().fields;
    $('#overviewFields').innerHTML = fields.length ? fields.slice(0,4).map(field=>{
      const rows=w().records.filter(r=>r.field===field.name);
      const totals=api.totals(rows);
      const health=latestHealth(rows);
      const cycles=w().cycles.filter(c=>c.field===field.name&&c.status==='active').length;
      return `<button class="field-overview-card" data-view="water"><div class="field-card-top"><span class="field-glyph">${icon('field')}</span><span class="field-area">${field.area?`${fmt(field.area,2)} ac`:'Area needed'}</span></div><strong>${e(field.name)}</strong><small>${cycles} active cycle${cycles===1?'':'s'} · ${rows.length} record${rows.length===1?'':'s'}</small><div class="field-card-bottom"><span><b>${fmt(totals.water)} L</b> water logged</span><span class="health-dot ${health?e(health.health.toLowerCase()):'none'}"></span></div></button>`;
    }).join('') : '<div class="empty-state span-all">Add your first field in Farm settings to build a field view.</div>';
  }
  function renderTasks() {
    const open=w().tasks.filter(task=>task.status!=='done').sort((a,b)=>a.dueDate.localeCompare(b.dueDate));
    const done=w().tasks.filter(task=>task.status==='done').sort((a,b)=>b.dueDate.localeCompare(a.dueDate));
    const row=(task,completed)=>`<div class="task-row ${completed?'task-done':''}"><button class="task-check" data-task-toggle="${e(task.id)}" aria-label="${completed?'Reopen':'Mark'} ${e(task.title)} ${completed?'task':'done'}">${completed?'✓':''}</button><div class="task-content"><strong>${e(task.title)}</strong><span>${e(task.field||'Whole farm')} · ${e(api.prettyDate(task.dueDate))}</span></div><span class="task-priority ${task.priority==='high'&&!completed?'high':''}">${completed?'Done':task.priority==='high'?'Priority':'To do'}</span></div>`;
    $('#overviewTasks').innerHTML=(open.length?open.slice(0,4).map(task=>row(task,false)).join(''):'<div class="empty-state">All clear. Add a task to keep work visible.</div>')+(done.length?`<div class="task-subhead">Completed · ${done.length}</div>${done.slice(0,3).map(task=>row(task,true)).join('')}`:'');
  }
  function renderQuality() {
    const q=quality();
    $('#overviewQuality').innerHTML=`<div class="quality-score"><div class="quality-ring" style="--score:${q.score}"><span>${q.score}%</span></div><div><strong>Record completeness</strong><p>${q.total} activity record${q.total===1?'':'s'} · ${w().cycles.length} crop cycle${w().cycles.length===1?'':'s'}</p></div></div><div class="quality-tips">${q.issues.length?q.issues.slice(0,2).map(issue=>`<div><strong>${e(issue.title)}</strong><small>${issue.count}</small></div>`).join(''):'<div><strong>Core fields are complete</strong><small>Ready</small></div>'}</div><button class="text-link" data-view="insights">Inspect evidence quality →</button>`;
  }
  function renderOverview() {renderHero();renderOverviewFields();renderTasks();renderQuality();}

  function renderCycles() {
    const cycles=[...w().cycles].sort((a,b)=>b.startDate.localeCompare(a.startDate));
    const active=cycles.filter(c=>c.status==='active').length;
    const finished=cycles.filter(c=>c.status==='harvested').length;
    const unlinked=quality().unlinked;
    $('#cycleSummary').innerHTML=`<div><span>Active cycles</span><strong>${active}</strong></div><div><span>Harvested cycles</span><strong>${finished}</strong></div><div><span>Unlinked records</span><strong>${unlinked}</strong></div>`;
    if(!cycles.length){$('#cycleGrid').innerHTML='<div class="empty-panel">Create a crop cycle to connect planting, water, harvest and sales into one story.</div>';$('#cycleDetail').style.display='none';return;}
    if(!cycles.some(c=>c.id===selectedCycleId))selectedCycleId=cycles[0].id;
    $('#cycleGrid').innerHTML=cycles.map(c=>{
      const s=cycleSummary(c);
      const latest=latestHealth(s.rows);
      return `<button class="cycle-card ${c.id===selectedCycleId?'selected':''}" data-cycle-select="${e(c.id)}"><div class="cycle-card-header"><span class="cycle-avatar">${e(c.crop.slice(0,1).toUpperCase())}</span><span class="status-pill ${e(c.status)}">${statusLabel(c.status)}</span></div><h3>${e(c.crop)}</h3><p>${e(c.field)} · ${s.area?`${fmt(s.area,2)} ac`:'Area missing'}</p><div class="cycle-card-stats"><span><small>Recorded net</small><strong class="${s.net<0?'negative':''}">${signed(s.net)}</strong></span><span><small>Water</small><strong>${fmt(s.totals.water)} L</strong></span></div><div class="cycle-card-foot"><span>${e(api.prettyDate(c.startDate))}</span><span>${latest?`Health: ${e(latest.health)}`:`${s.rows.length} record${s.rows.length===1?'':'s'}`}</span></div></button>`;
    }).join('');
    const c=cycles.find(c=>c.id===selectedCycleId),s=cycleSummary(c);
    const missing=s.rows.filter(r=>r.activity==='Sale'&&r.revenue==null).length;
    const linked=s.rows.length;
    const candidates=w().records.filter(r=>!r.cycleId&&r.field===c.field&&r.crop.toLowerCase()===c.crop.toLowerCase()&&r.date>=c.startDate&&(!c.endDate||r.date<=c.endDate));
    $('#cycleDetail').style.display='block';
    $('#cycleDetail').innerHTML=`<div class="cycle-detail-head"><div><div class="eyebrow">CYCLE DETAIL · ${e(c.field)}</div><h2>${e(c.crop)} <span>${e(api.prettyDate(c.startDate))}${c.endDate?` — ${e(api.prettyDate(c.endDate))}`:''}</span></h2><p>${e(c.notes||'All linked records and economics for this growing cycle.')}</p></div><div class="cycle-actions"><button class="outline-button" data-cycle-edit="${e(c.id)}">Edit</button><button class="primary-button" data-action="add" data-cycle-id="${e(c.id)}">Add record</button></div></div><div class="cycle-quick-actions"><span>Log to this cycle</span>${[['Irrigation','water','Water'],['Health','health','Health'],['Harvest','harvest','Harvest'],['Sale','sale','Sale']].map(([activity,iconName,label])=>`<button data-quick-activity="${activity}" data-cycle-id="${e(c.id)}">${icon(iconName)} ${label}</button>`).join('')}</div><div class="cycle-metrics"><div><span>Recorded revenue</span><strong>${money(s.totals.revenue)}</strong></div><div><span>Recorded costs</span><strong>${money(s.totals.cost)}</strong></div><div><span>Recorded net</span><strong class="${s.net<0?'negative':''}">${signed(s.net)}</strong></div><div><span>Water logged</span><strong>${fmt(s.totals.water)} L</strong></div><div><span>Harvested weight</span><strong>${s.totals.harvest?`${fmt(s.totals.harvest)} kg`:'Unknown'}</strong></div><div><span>Yield / acre</span><strong>${s.totals.harvest&&s.area?`${fmt(s.totals.harvest/s.area)} kg`:'Unknown'}</strong></div></div><div class="cycle-detail-bottom"><div><strong>${linked} linked record${linked===1?'':'s'}</strong><span>${s.sales.length?`${s.sales.length} sale${s.sales.length===1?'':'s'} recorded`:'No sale recorded'}${missing?` · ${missing} sale amount missing`:''}</span></div>${candidates.length?`<button class="text-link" data-cycle-link="${e(c.id)}">Link ${candidates.length} matching unlinked row${candidates.length===1?'':'s'} →</button>`:''}</div><div class="cycle-records">${s.rows.length?[...s.rows].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,5).map(r=>`<div><span class="timeline-dot"></span><span>${e(api.prettyDate(r.date))}</span><strong>${e(r.activity)}</strong><span>${r.revenue!=null?`+${money(r.revenue)}`:r.cost!=null?`−${money(r.cost)}`:r.water!=null?`${fmt(r.water)} L`:'—'}</span></div>`).join(''):'<p>No linked activity yet. Add a record or link matching rows.</p>'}</div><button class="delete-text" data-cycle-delete="${e(c.id)}">Delete cycle</button>`;
  }

  function renderWater() {
    const fields=w().fields;
    const total=api.totals().water;
    const harvest=api.totals().harvest;
    const logged=fields.filter(f=>w().records.some(r=>r.field===f.name&&r.water>0)).length;
    $('#waterSummary').innerHTML=`<div><span>Total logged</span><strong>${fmt(total)} L</strong></div><div><span>Fields with water data</span><strong>${logged} / ${fields.length}</strong></div><div><span>Litres / harvested kg</span><strong>${harvest?fmt(total/harvest,1):'Unknown'}</strong></div>`;
    const values=fields.map(field=>({field,water:api.totals(w().records.filter(r=>r.field===field.name)).water}));
    const max=Math.max(1,...values.map(v=>v.water));
    $('#waterByField').innerHTML=values.length?values.map(({field,water})=>`<div class="water-bar-row"><div><strong>${e(field.name)}</strong><span>${fmt(water)} L${field.area?` · ${fmt(water/field.area)} L/ac`:''}</span></div><div class="water-track"><span style="width:${Math.max(2,water/max*100)}%"></span></div></div>`).join(''):'<div class="empty-state">Add fields to see water distribution.</div>';
    const observations=fields.map(field=>({field,health:latestHealth(w().records.filter(r=>r.field===field.name))}));
    $('#healthByField').innerHTML=observations.length?observations.map(({field,health})=>`<div class="health-row"><span class="health-indicator ${health?e(health.health.toLowerCase()):'none'}"></span><div><strong>${e(field.name)}</strong><small>${health?`${e(health.crop)} · ${e(api.prettyDate(health.date))}`:'No health observation'}</small></div><span class="health-status">${health?e(health.health):'Unknown'}</span></div>`).join(''):'<div class="empty-state">No field observations yet.</div>';
    $('#fieldProfiles').innerHTML=fields.length?`<div class="profile-grid">${fields.map(field=>{const rows=w().records.filter(r=>r.field===field.name),totals=api.totals(rows),cycleCount=w().cycles.filter(c=>c.field===field.name).length;return `<div class="profile-card"><div class="profile-icon">${icon('field')}</div><h3>${e(field.name)}</h3><p>${field.area?`${fmt(field.area,2)} acres`:'Area unknown'} · ${cycleCount} crop cycles</p><div><span>Water</span><strong>${fmt(totals.water)} L</strong></div><div><span>Recorded net</span><strong>${signed(totals.revenue-totals.cost)}</strong></div><div><span>Activity</span><strong>${rows.length} records</strong></div></div>`;}).join('')}</div>`:'<div class="empty-state">Your field profiles will appear after you add land in Settings.</div>';
  }

  function renderCycleInsights() {
    const cycles=[...w().cycles].sort((a,b)=>cycleSummary(b).net-cycleSummary(a).net);
    $('#cycleInsights').innerHTML=cycles.length?cycles.map(c=>{const s=cycleSummary(c);return `<div class="cycle-insight-row"><div><span class="tiny-crop-avatar">${e(c.crop.slice(0,1).toUpperCase())}</span><span><strong>${e(c.crop)}</strong><small>${e(c.field)} · ${e(c.startDate.slice(0,7))}</small></span></div><div><strong class="${s.net<0?'negative':''}">${signed(s.net)}</strong><small>${s.sales.length?'Sale recorded':'No sale yet'}</small></div></div>`;}).join(''):'<div class="empty-state">Add a crop cycle to compare its economics.</div>';
  }
  function renderQualityInsights() {
    const q=quality();
    $('#qualityInsights').innerHTML=`<div class="quality-inline"><strong>${q.score}%</strong><span>record completeness across core entries</span></div>${q.issues.length?q.issues.slice(0,5).map(issue=>`<button class="quality-issue" data-view="${issue.view}"><span class="issue-count">${issue.count}</span><span><strong>${e(issue.title)}</strong><small>${e(issue.detail)}</small></span></button>`).join(''):'<div class="empty-state">Core record fields are complete. Keep logging new activity.</div>'}`;
  }

  function planMetrics(plan) {
    const yieldKg=plan.area*plan.yieldPerAcre;
    const revenue=yieldKg*plan.pricePerKg;
    const cost=plan.area*plan.costPerAcre;
    const water=plan.waterPerAcre==null?null:plan.area*plan.waterPerAcre;
    return {yieldKg,revenue,cost,water,net:revenue-cost,breakEven:yieldKg>0?cost/yieldKg:null,downside:yieldKg*.8*plan.pricePerKg*.85-cost};
  }
  function renderPlanResult() {
    if(!draftPlan){$('#planResult').innerHTML='<div class="plan-empty"><span><svg class="ui-icon" aria-hidden="true"><use href="./icons.svg#planner"/></svg></span><h3>A clearer decision starts here.</h3><p>Enter your own yield, price and cost assumptions to inspect a scenario.</p></div>';return;}
    const p=draftPlan,m=planMetrics(p);
    const references=w().cycles.filter(c=>c.crop.toLowerCase()===p.crop.toLowerCase()&&cycleSummary(c).sales.length).map(c=>({cycle:c,summary:cycleSummary(c)}));
    $('#planResult').innerHTML=`<div class="plan-result-head"><span>ESTIMATED NET · ${e(p.crop.toUpperCase())}</span><strong class="${m.net<0?'negative':''}">${signed(m.net)}</strong><small>For ${fmt(p.area,2)} acres in ${e(p.field)} · ${e(p.month)}</small></div><div class="plan-metrics"><div><span>Expected revenue</span><strong>${money(m.revenue)}</strong></div><div><span>Expected cost</span><strong>${money(m.cost)}</strong></div><div><span>Break-even price</span><strong>${m.breakEven==null?'Unknown':`₹${fmt(m.breakEven,2)} / kg`}</strong></div><div><span>Planned water</span><strong>${m.water==null?'Not entered':`${fmt(m.water)} L`}</strong></div></div><div class="downside-box"><div><strong>Stress test</strong><span>What if yield falls 20% and price falls 15%?</span></div><b class="${m.downside<0?'negative':''}">${signed(m.downside)}</b></div><div class="plan-reference"><strong>Evidence from your farm</strong><p>${references.length?`${references.length} ${e(p.crop)} cycle${references.length===1?' has':'s have'} a recorded sale. Their results can inform assumptions, but seasons and prices differ.`:'No completed sale cycle for this crop yet. Treat all inputs as unverified assumptions.'}</p></div><div class="plan-result-actions"><span>Scenario estimate · not a forecast</span><button class="primary-button" data-plan-save>Save scenario</button></div>`;
  }
  function renderSavedPlans() {
    const plans=[...w().plans].sort((a,b)=>(b.savedAt||'').localeCompare(a.savedAt||''));
    $('#savedPlans').innerHTML=plans.length?plans.map(p=>{const m=planMetrics(p);return `<div class="saved-plan"><div><span class="saved-plan-icon">${icon('planner')}</span><span><strong>${e(p.crop)} · ${e(p.field)}</strong><small>${e(p.month)} · ${fmt(p.area,2)} acres</small></span></div><strong class="${m.net<0?'negative':''}">${signed(m.net)}</strong><div class="saved-plan-actions"><button data-plan-load="${e(p.id)}">Open</button><button data-plan-delete="${e(p.id)}" aria-label="Delete plan">×</button></div></div>`;}).join(''):'<div class="empty-panel">Saved scenarios will appear here. They are estimates, separate from your actual ledger.</div>';
  }
  function renderPlanner() {
    const select=$('#planField'),selected=select.value;
    select.innerHTML=w().fields.map(f=>`<option value="${e(f.name)}">${e(f.name)}</option>`).join('');
    if(selected&&w().fields.some(f=>f.name===selected))select.value=selected;
    renderPlanResult();renderSavedPlans();
  }
  function render(){renderOverview();renderCycles();renderWater();renderCycleInsights();renderQualityInsights();renderPlanner();}

  function openCycle(id='') {
    if(!w().fields.length){api.showView('settings');api.notify('Add a field before creating a crop cycle.');return;}
    editingCycleId=id;
    const form=$('#cycleForm');form.reset();
    $('#cycleField').innerHTML=w().fields.map(f=>`<option value="${e(f.name)}">${e(f.name)}</option>`).join('');
    const cycle=w().cycles.find(c=>c.id===id);
    $('#cycleDialogTitle').textContent=cycle?'Edit crop cycle':'New crop cycle';
    form.elements.startDate.value=cycle?.startDate||today();
    if(cycle){for(const key of ['field','crop','endDate','status','notes'])form.elements[key].value=cycle[key]||'';form.elements.area.value=cycle.area??'';}
    else form.elements.area.value=fieldArea(form.elements.field.value)??'';
    $('#cycleDialog').showModal();
  }
  function saveCycle(event) {
    event.preventDefault();
    const data=new FormData(event.target),field=String(data.get('field')||''),crop=String(data.get('crop')||'').trim();
    const startDate=String(data.get('startDate')||''),endDate=String(data.get('endDate')||'');
    if(endDate&&endDate<startDate){api.notify('End date must be after the start date.');return;}
    const area=api.number(data.get('area'));
    if(area!=null&&area<=0){api.notify('Area must be greater than zero.');return;}
    const existing=w().cycles.find(c=>c.id===editingCycleId);
    if(existing&&cycleRows(existing).length&&(existing.field!==field||existing.crop.toLowerCase()!==crop.toLowerCase())){api.notify('Unlink its records before changing the cycle field or crop.');return;}
    const cycle={id:existing?.id||api.uid(),field,crop,area,startDate,endDate,status:String(data.get('status')||'active'),notes:String(data.get('notes')||'').trim()};
    if(existing)Object.assign(existing,cycle);else w().cycles.push(cycle);
    selectedCycleId=cycle.id;$('#cycleDialog').close();api.save();api.showView('cycles');api.notify(existing?'Crop cycle updated.':'Crop cycle created.');
  }
  function openTask() {
    $('#taskForm').reset();
    $('#taskField').innerHTML='<option value="">Whole farm</option>'+w().fields.map(f=>`<option value="${e(f.name)}">${e(f.name)}</option>`).join('');
    $('#taskForm').elements.dueDate.value=today();$('#taskDialog').showModal();
  }
  function saveTask(event) {
    event.preventDefault();const form=new FormData(event.target);
    w().tasks.push({id:api.uid(),title:String(form.get('title')||'').trim(),field:String(form.get('field')||''),dueDate:String(form.get('dueDate')||''),priority:String(form.get('priority')||'normal'),status:'open'});
    $('#taskDialog').close();api.save();api.notify('Task added to the workboard.');
  }
  function calculatePlan(event) {
    event.preventDefault();const form=new FormData(event.target);
    const p={field:String(form.get('field')||''),crop:String(form.get('crop')||'').trim(),month:String(form.get('month')||''),area:Number(form.get('area')),yieldPerAcre:Number(form.get('yield')),pricePerKg:Number(form.get('price')),costPerAcre:Number(form.get('cost')),waterPerAcre:api.number(form.get('water'))};
    if(!p.field||!p.crop||!p.month||![p.area,p.yieldPerAcre,p.pricePerKg,p.costPerAcre].every(Number.isFinite)||p.area<=0||p.yieldPerAcre<0||p.pricePerKg<0||p.costPerAcre<0){api.notify('Check all scenario inputs.');return;}
    draftPlan=p;renderPlanResult();api.notify('Scenario calculated from your assumptions.');
  }
  function loadPlan(id) {
    const p=w().plans.find(x=>x.id===id);if(!p)return;
    api.showView('planner');const form=$('#plannerForm');
    for(const [key,value] of Object.entries({field:p.field,crop:p.crop,month:p.month,area:p.area,yield:p.yieldPerAcre,price:p.pricePerKg,cost:p.costPerAcre,water:p.waterPerAcre??''}))form.elements[key].value=value;
    draftPlan={...p};renderPlanResult();window.scrollTo({top:0,behavior:'smooth'});
  }
  function bind() {
    $('#newCycleButton').onclick=()=>openCycle();$('#cycleForm').addEventListener('submit',saveCycle);
    $('#closeCycleDialog').onclick=$('#cancelCycleDialog').onclick=()=>$('#cycleDialog').close();
    $('#cycleField').addEventListener('change',()=>{if(!editingCycleId)$('#cycleForm').elements.area.value=fieldArea($('#cycleField').value)??'';});
    $('#addTaskButton').onclick=openTask;$('#taskForm').addEventListener('submit',saveTask);
    $('#closeTaskDialog').onclick=$('#cancelTaskDialog').onclick=()=>$('#taskDialog').close();
    $('#plannerForm').addEventListener('submit',calculatePlan);
    $('#planField').addEventListener('change',()=>{$('#plannerForm').elements.area.value=fieldArea($('#planField').value)??'';});
    $('#plannerForm').elements.month.value=today().slice(0,7);
    document.addEventListener('click',event=>{
      const task=event.target.closest('[data-task-toggle]');if(task){const item=w().tasks.find(x=>x.id===task.dataset.taskToggle);if(item){item.status=item.status==='done'?'open':'done';api.save();api.notify(item.status==='done'?'Task marked done.':'Task reopened.');}return;}
      const select=event.target.closest('[data-cycle-select]');if(select){selectedCycleId=select.dataset.cycleSelect;renderCycles();return;}
      const edit=event.target.closest('[data-cycle-edit]');if(edit){openCycle(edit.dataset.cycleEdit);return;}
      const link=event.target.closest('[data-cycle-link]');if(link){const cycle=w().cycles.find(c=>c.id===link.dataset.cycleLink);if(!cycle)return;const rows=w().records.filter(r=>!r.cycleId&&r.field===cycle.field&&r.crop.toLowerCase()===cycle.crop.toLowerCase()&&r.date>=cycle.startDate&&(!cycle.endDate||r.date<=cycle.endDate));api.confirm('Link matching rows?',`${rows.length} unlinked record${rows.length===1?'':'s'} match ${cycle.crop} in ${cycle.field} during this cycle. Review the dates before linking.`,'Link records',()=>{rows.forEach(r=>r.cycleId=cycle.id);api.save();api.notify(`${rows.length} record${rows.length===1?'':'s'} linked.`);});return;}
      const del=event.target.closest('[data-cycle-delete]');if(del){const cycle=w().cycles.find(c=>c.id===del.dataset.cycleDelete);if(!cycle)return;api.confirm('Delete this crop cycle?',`The ${cycle.crop} cycle will be removed. Its ${cycleRows(cycle).length} linked records will stay in the ledger and become unlinked.`,'Delete cycle',()=>{w().records.forEach(r=>{if(r.cycleId===cycle.id)r.cycleId='';});w().cycles=w().cycles.filter(c=>c.id!==cycle.id);selectedCycleId='';api.save();api.notify('Crop cycle deleted; records preserved.');});return;}
      if(event.target.closest('[data-plan-save]')){if(!draftPlan)return;w().plans.push({...draftPlan,id:api.uid(),savedAt:new Date().toISOString()});api.save();api.notify('Scenario saved.');return;}
      const planLoad=event.target.closest('[data-plan-load]');if(planLoad){loadPlan(planLoad.dataset.planLoad);return;}
      const planDelete=event.target.closest('[data-plan-delete]');if(planDelete){const plan=w().plans.find(p=>p.id===planDelete.dataset.planDelete);if(plan)api.confirm('Delete saved scenario?',`Remove the ${plan.crop} plan for ${plan.field}? Farm records will stay untouched.`,'Delete plan',()=>{w().plans=w().plans.filter(p=>p.id!==plan.id);api.save();api.notify('Scenario deleted.');});}
    });
  }
  window.BrahmaAdvanced={render,quality};bind();render();
})();
