(function(){
  const escAudit=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={customer_name:'Customer name',customer_phone:'Phone',customer_email:'Email',salesperson:'Salesperson',customer_address_line1:'Address',customer_address_line2:'Address 2',customer_city:'City',customer_state:'State',customer_postal_code:'ZIP',customer_country:'Country',preferred_contact_method:'Preferred contact',year:'Year',make:'Make',model:'Model',floorplan:'Floorplan',vin:'VIN',rv_type:'RV type',mileage:'Mileage',slide_count:'Slide count',generator_present:'Generator present',generator_type:'Generator type',generator_hours:'Generator hours',title_status:'Title status',lien_holder:'Lien holder',estimated_payoff:'Estimated payoff',vehicle_store_id:'Location',store_id:'Store',assigned_user_id:'Assigned user',status:'Status',estimated_recon:'Estimated recon',manager_recon:'Manager recon',recommended_recon_grade:'Recommended recon grade',manager_recon_grade:'Manager recon grade',recon_grade_reason:'Recon grade reason',acv:'ACV',wholesale_value:'Wholesale value',retail_value:'Retail value',book_wholesale_value:'Book wholesale value',book_retail_value:'Book retail value',book_source:'Book source',book_value_date:'Book value date',comps_search_url:'Comps search URL',comp_1_price:'Comparable 1 price',comp_2_price:'Comparable 2 price',comp_3_price:'Comparable 3 price',final_trade_offer:'Final trade offer',final_buy_offer:'Final buy offer',final_consign_offer:'Final consign offer',offer_status_text:'Offer status',customer_notes:'Customer notes',comps_notes:'Comps notes',requested_human_follow_up:'Human follow-up requested',follow_up_section:'Follow-up section'};
  const moneyFields=new Set(['estimated_payoff','estimated_recon','manager_recon','acv','wholesale_value','retail_value','book_wholesale_value','book_retail_value','comp_1_price','comp_2_price','comp_3_price','final_trade_offer','final_buy_offer','final_consign_offer']);
  let history=[];
  function section(title,body,open=true,cls=''){return `<details class="appraisal-collapse ${cls}" ${open?'open':''}><summary>${escAudit(title)}<span class="collapse-chevron">⌄</span></summary><div class="collapse-body">${body}</div></details>`;}
  function currentAppraisal(){const m=location.hash.match(/^#appraisals\/([^/]+)/);return m&&typeof state!=='undefined'?state.appraisals.find(a=>String(a.id)===m[1]):null;}
  function formatWhen(v){return v?new Date(v).toLocaleString('en-US',{month:'numeric',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';}
  function fieldValue(v,key){
    if(v===null||v===undefined||v==='')return 'blank';
    if((key==='vehicle_store_id'||key==='store_id')&&typeof storeName==='function')return storeName(v);
    if(moneyFields.has(key)&&!Number.isNaN(Number(v)))return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v));
    if(v==='true')return 'Yes';if(v==='false')return 'No';
    return String(v);
  }
  function consignField(a){return `<div class="field"><label>Final consign offer<input data-field="final_consign_offer" type="number" value="${escAudit(a.final_consign_offer??'')}"></label></div>`;}
  function compFields(a){return `<div class="field"><label>Comparable 1 price<input data-field="comp_1_price" type="number" value="${escAudit(a.comp_1_price??'')}"></label></div><div class="field"><label>Comparable 2 price<input data-field="comp_2_price" type="number" value="${escAudit(a.comp_2_price??'')}"></label></div><div class="field"><label>Comparable 3 price<input data-field="comp_3_price" type="number" value="${escAudit(a.comp_3_price??'')}"></label></div>`;}
  function organizeFinalOffers(fields,a){
    if(!fields)return;
    if(!fields.querySelector('[data-field="comp_1_price"]')){const notes=fields.querySelector('[data-field="comps_notes"]')?.closest('.field');if(notes)notes.insertAdjacentHTML('beforebegin',compFields(a));else fields.insertAdjacentHTML('beforeend',compFields(a));}
    if(!fields.querySelector('[data-field="final_consign_offer"]'))fields.insertAdjacentHTML('beforeend',consignField(a));
    const trade=fields.querySelector('[data-field="final_trade_offer"]')?.closest('.field');
    const buy=fields.querySelector('[data-field="final_buy_offer"]')?.closest('.field');
    const consign=fields.querySelector('[data-field="final_consign_offer"]')?.closest('.field');
    if(!trade||!buy||!consign)return;
    const row=document.createElement('div');row.className='final-offer-row field full';trade.parentNode.insertBefore(row,trade);row.append(trade,buy,consign);
  }
  async function loadHistory(id){
    const {data,error}=await sb.from('status_history')
      .select('id,note,changed_at,changed_by,field_name,old_value,new_value,profiles:changed_by(full_name)')
      .eq('appraisal_id',id)
      .order('changed_at',{ascending:false});
    if(error){console.error(error);history=[];return;}history=data||[];
  }
  function auditTitle(h){
    const field=labels[h.field_name]||h.field_name||'Record';
    if(h.note==='Field added')return `${field} added`;
    if(h.note==='Field cleared')return `${field} cleared`;
    if(h.note==='Field changed')return `${field} changed`;
    return h.field_name?`${field} updated`:'Record updated';
  }
  function auditDetail(h){
    if(!h.field_name)return escAudit(h.note||'Changes saved');
    const oldVal=fieldValue(h.old_value,h.field_name),newVal=fieldValue(h.new_value,h.field_name);
    if(h.note==='Field added')return escAudit(newVal);
    if(h.note==='Field cleared')return `${escAudit(oldVal)} → blank`;
    return `${escAudit(oldVal)} → ${escAudit(newVal)}`;
  }
  function historyHtml(a){
    const initial=`<div class="history-item"><div class="history-main"><strong>Submission created</strong><div class="muted">Initial customer submission</div></div><div class="history-meta">${escAudit(a.salesperson||'Customer / external form')}<br>${escAudit(formatWhen(a.submitted_at||a.created_at))}</div></div>`;
    const items=history.map(h=>`<div class="history-item"><div class="history-main"><strong>${escAudit(auditTitle(h))}</strong><div class="muted">${auditDetail(h)}</div></div><div class="history-meta">${escAudit(h.profiles?.full_name||'System / external form')}<br>${escAudit(formatWhen(h.changed_at))}</div></div>`).join('');
    return `<div class="submission-summary"><dl class="kv"><dt>Status</dt><dd><span class="badge ${escAudit(a.status)}">${escAudit(typeof statusLabel==='function'?statusLabel(a.status,APPRAISAL_STATUSES):a.status)}</span></dd><dt>Submitted</dt><dd>${escAudit(formatWhen(a.submitted_at))}</dd><dt>Source</dt><dd>${escAudit(a.external_source||'—')}</dd><dt>Submission ID</dt><dd>${escAudit(a.external_submission_id||'—')}</dd></dl></div><h3 class="history-title">Change History</h3><div class="change-history">${items}${initial}</div>`;
  }
  async function saveClean(a){
    const b=document.getElementById('saveAppraisal');
    if(b){b.disabled=true;b.dataset.old=b.textContent;b.textContent='Saving…';}
    const p={};
    document.querySelectorAll('#pageContent [data-field]').forEach(el=>{
      const key=el.dataset.field;
      let v=el.value;
      if(el.type==='number')v=v===''?null:Number(v);
      p[key]=v;
    });
    p.vehicle_store_id=p.vehicle_store_id||null;
    const {data,error}=await sb.from('appraisals').update(p).eq('id',a.id).select().single();
    if(b){b.disabled=false;b.textContent=b.dataset.old||'Save Changes';}
    if(error){if(typeof toast==='function')toast(error.message,true);else alert(error.message);return;}
    const idx=state.appraisals.findIndex(x=>String(x.id)===String(a.id));
    if(idx>=0)state.appraisals[idx]=data;
    if(typeof toast==='function')toast('Appraisal saved.');
    if(typeof renderAppraisalDetail==='function')renderAppraisalDetail(a.id);
  }
  function bindActions(a){
    const save=document.getElementById('saveAppraisal');
    if(save&&!save.dataset.rebound){save.dataset.rebound='1';save.addEventListener('click',e=>{e.preventDefault();saveClean(a);});}
    const del=document.getElementById('deleteAppraisal');
    if(del&&!del.dataset.rebound){del.dataset.rebound='1';del.addEventListener('click',e=>{e.preventDefault();if(typeof window.deleteAppraisal==='function')window.deleteAppraisal(a.id);else if(typeof deleteAppraisal==='function')deleteAppraisal(a.id);});}
  }
  function enhance(){
    const a=currentAppraisal(),page=document.getElementById('pageContent');if(!a||!page)return;
    const grid=page.querySelector('.detail-grid');if(!grid||grid.querySelector(':scope > .appraisal-collapse'))return;
    const main=grid.querySelector(':scope > section.card'),aside=grid.querySelector(':scope > aside');if(!main||!aside)return;
    const parts=[...main.querySelectorAll(':scope > .section')];if(parts.length<3)return;
    const customer=parts[0].querySelector('.fields')?.outerHTML||'';
    const vehicle=parts[1].querySelector('.fields')?.outerHTML||'';
    const appraisalFieldsEl=parts[2].querySelector('.fields');organizeFinalOffers(appraisalFieldsEl,a);
    const appraisalFields=appraisalFieldsEl?.outerHTML||'';const actions=parts[2].querySelector('.detail-actions')?.outerHTML||'';
    grid.className='grid detail-grid appraisal-section-stack';
    grid.innerHTML=`${section('Customer',customer,true,'customer-section')}${section('Vehicle',vehicle,true,'vehicle-section')}${section('Submission',historyHtml(a),false,'submission-section')}${section('Photos','<div id="appraisalPhotos">Loading photos…</div>',false,'photos-section')}${section('Appraisal',appraisalFields+actions,true,'appraisal-section')}`;
    bindActions(a);if(typeof loadPhotos==='function')loadPhotos('appraisal',a.id);window.dispatchEvent(new CustomEvent('inventoryroad:appraisal-layout-ready',{detail:{id:a.id}}));
  }
  async function refresh(){const a=currentAppraisal();if(!a)return;await loadHistory(a.id);enhance();}
  let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(refresh,80)};
  const obs=new MutationObserver(()=>{const a=currentAppraisal(),grid=document.querySelector('#pageContent .detail-grid');if(a&&grid&&!grid.querySelector(':scope > .appraisal-collapse'))schedule();});
  window.addEventListener('hashchange',schedule);
  window.addEventListener('load',()=>{const p=document.getElementById('pageContent');if(p)obs.observe(p,{childList:true,subtree:true});schedule();});
})();