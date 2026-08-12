(function(){
  const escAudit=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={customer_name:'Customer name',customer_phone:'Phone',customer_email:'Email',salesperson:'Salesperson',customer_address_line1:'Address',customer_city:'City',customer_state:'State',customer_postal_code:'ZIP',year:'Year',make:'Make',model:'Model',floorplan:'Floorplan',vin:'VIN',rv_type:'RV type',mileage:'Mileage',vehicle_store_id:'Location',status:'Status',estimated_recon:'Estimated recon',manager_recon:'Manager recon',acv:'ACV',wholesale_value:'Wholesale value',retail_value:'Retail value',final_trade_offer:'Final trade offer',final_buy_offer:'Final buy offer',customer_notes:'Customer notes',comps_notes:'Comps notes'};
  let history=[];

  function section(title,body,open=true,cls=''){
    return `<details class="appraisal-collapse ${cls}" ${open?'open':''}><summary>${escAudit(title)}<span class="collapse-chevron">⌄</span></summary><div class="collapse-body">${body}</div></details>`;
  }
  function currentAppraisal(){const m=location.hash.match(/^#appraisals\/([^/]+)/);return m&&typeof state!=='undefined'?state.appraisals.find(a=>String(a.id)===m[1]):null;}
  function formatWhen(v){return v?new Date(v).toLocaleString('en-US',{month:'numeric',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';}
  function value(v,key){if(v===null||v===undefined||v==='')return 'blank';if(key==='vehicle_store_id'&&typeof storeName==='function')return storeName(v);return String(v);}
  function changeNote(changes){return Object.entries(changes).map(([k,c])=>`${labels[k]||k}: ${value(c.from,k)} → ${value(c.to,k)}`).join(' • ');}

  async function loadHistory(id){
    const {data,error}=await sb.from('status_history').select('id,note,changed_at,changed_by,profiles:changed_by(full_name)').eq('appraisal_id',id).order('changed_at',{ascending:false});
    if(error){console.error(error);history=[];return;}history=data||[];
  }
  function historyHtml(a){
    const initial=`<div class="history-item"><div class="history-main"><strong>Submission created</strong><div class="muted">Initial customer submission</div></div><div class="history-meta">${escAudit(a.salesperson||'Customer / external form')}<br>${escAudit(formatWhen(a.submitted_at||a.created_at))}</div></div>`;
    const items=history.map(h=>`<div class="history-item"><div class="history-main"><strong>Record updated</strong><div class="muted">${escAudit(h.note||'Changes saved')}</div></div><div class="history-meta">${escAudit(h.profiles?.full_name||'User')}<br>${escAudit(formatWhen(h.changed_at))}</div></div>`).join('');
    return `<div class="submission-summary"><dl class="kv"><dt>Status</dt><dd><span class="badge ${escAudit(a.status)}">${escAudit(typeof statusLabel==='function'?statusLabel(a.status,APPRAISAL_STATUSES):a.status)}</span></dd><dt>Submitted</dt><dd>${escAudit(formatWhen(a.submitted_at))}</dd><dt>Source</dt><dd>${escAudit(a.external_source||'—')}</dd><dt>Submission ID</dt><dd>${escAudit(a.external_submission_id||'—')}</dd></dl></div><h3 class="history-title">Change History</h3><div class="change-history">${items}${initial}</div>`;
  }
  function snapshot(){const o={};document.querySelectorAll('#pageContent [data-field]').forEach(el=>o[el.dataset.field]=el.value);return o;}
  function diff(before,after){const out={};Object.keys(after).forEach(k=>{if(String(before[k]??'')!==String(after[k]??''))out[k]={from:before[k]??'',to:after[k]??''};});return out;}
  async function logChanges(id,changes){if(!Object.keys(changes).length)return;const uid=state.session?.user?.id;if(!uid)return;const {error}=await sb.from('status_history').insert({appraisal_id:id,changed_by:uid,note:changeNote(changes),changed_at:new Date().toISOString()});if(error)console.error('Could not save appraisal history',error);}

  function enhance(){
    const a=currentAppraisal(),page=document.getElementById('pageContent');if(!a||!page||page.dataset.collapsibleReady==='1')return;
    const grid=page.querySelector('.detail-grid');if(!grid)return;
    const main=grid.querySelector(':scope > section.card'),aside=grid.querySelector(':scope > aside');if(!main||!aside)return;
    const parts=[...main.querySelectorAll(':scope > .section')];if(parts.length<3)return;
    const customer=parts[0].querySelector('.fields')?.outerHTML||'';
    const vehicle=parts[1].querySelector('.fields')?.outerHTML||'';
    const appraisalFields=parts[2].querySelector('.fields')?.outerHTML||'';
    const actions=parts[2].querySelector('.detail-actions')?.outerHTML||'';
    const photos=aside.querySelector('#appraisalPhotos')?.outerHTML||'<div id="appraisalPhotos">Loading photos…</div>';
    page.dataset.collapsibleReady='1';
    grid.className='grid appraisal-section-stack';
    grid.innerHTML=`${section('Customer',customer,true,'customer-section')}${section('Vehicle',vehicle,true,'vehicle-section')}${section('Submission',historyHtml(a),false,'submission-section')}${section('Photos',photos,false,'photos-section')}${section('Appraisal',appraisalFields+actions,true,'appraisal-section')}`;
    const save=document.getElementById('saveAppraisal');if(save){const original=save.onclick;save.addEventListener('click',async()=>{const before={...a};const after=snapshot();await new Promise(r=>setTimeout(r,500));await logChanges(a.id,diff(before,after));});}
  }
  async function refresh(){const a=currentAppraisal();if(!a)return;await loadHistory(a.id);enhance();}
  const obs=new MutationObserver(()=>{if(currentAppraisal()&&!document.getElementById('pageContent')?.dataset.collapsibleReady)refresh();});
  window.addEventListener('hashchange',()=>setTimeout(refresh,80));
  window.addEventListener('load',()=>{const p=document.getElementById('pageContent');if(p)obs.observe(p,{childList:true,subtree:true});setTimeout(refresh,100);});
})();
