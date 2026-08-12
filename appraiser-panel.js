(function(){
  const money=v=>v===null||v===undefined||v===''?'':Number(v);
  const esc2=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let users=[];

  async function loadUsers(){
    const {data,error}=await sb.from('profiles').select('id,full_name,role').eq('is_active',true).order('full_name');
    if(error){console.error(error);return [];} users=data||[]; return users;
  }
  async function loadReviews(appraisalId){
    const {data,error}=await sb.from('appraisal_reviews').select('*').eq('appraisal_id',appraisalId).order('review_order');
    if(error){console.error(error);return [];} return data||[];
  }
  const userOptions=(selected)=>'<option value="">Select appraiser</option>'+users.map(u=>`<option value="${u.id}" ${u.id===selected?'selected':''}>${esc2(u.full_name||u.role||'User')}</option>`).join('');
  function row(n,r={}){return `<div class="appraiser-row" data-review-order="${n}"><div class="field"><label>Appraiser ${n}<select data-appraiser aria-label="Appraiser ${n}">${userOptions(r.appraiser_user_id)}</select></label></div><div class="field"><label>Trade<input data-trade type="number" step="1" inputmode="numeric" value="${esc2(money(r.trade_offer))}"></label></div><div class="field"><label>Buy<input data-buy type="number" step="1" inputmode="numeric" value="${esc2(money(r.buy_offer))}"></label></div><div class="field"><label>Consign<input data-consign type="number" step="1" inputmode="numeric" value="${esc2(money(r.consign_offer))}"></label></div></div>`}
  async function render(){
    const m=location.hash.match(/^#appraisals\/([^/]+)/); if(!m)return;
    const id=m[1], grid=document.querySelector('.detail-grid'); if(!grid)return;
    if(!users.length)await loadUsers(); const reviews=await loadReviews(id); if(location.hash!==`#appraisals/${id}`)return;
    document.getElementById('appraiserValuePanel')?.remove();
    const card=document.createElement('details'); card.className='appraisal-collapse appraiser-value-card'; card.id='appraiserValuePanel'; card.open=true;
    card.innerHTML=`<summary>Appraisers & Values<span class="collapse-chevron">⌄</span></summary><div class="collapse-body"><p class="muted">Assign up to three users and enter each appraiser's Trade, Buy, and Consign values.</p><div class="appraiser-value-grid">${[1,2,3].map(n=>row(n,reviews.find(r=>r.review_order===n))).join('')}</div><div class="detail-actions"><button id="saveAppraiserValues" class="btn primary" type="button">Save Appraiser Values</button></div></div>`;
    const appraisalSection=grid.querySelector('.appraisal-section');
    if(appraisalSection)grid.insertBefore(card,appraisalSection);else grid.appendChild(card);
    document.getElementById('saveAppraiserValues').onclick=()=>save(id);
  }
  async function save(appraisalId){
    const btn=document.getElementById('saveAppraiserValues'); if(btn){btn.disabled=true;btn.textContent='Saving…';}
    try{
      for(const el of document.querySelectorAll('#appraiserValuePanel .appraiser-row')){
        const review_order=Number(el.dataset.reviewOrder), appraiser_user_id=el.querySelector('[data-appraiser]').value;
        const trade=el.querySelector('[data-trade]').value,buy=el.querySelector('[data-buy]').value,consign=el.querySelector('[data-consign]').value;
        if(!appraiser_user_id){await sb.from('appraisal_reviews').delete().eq('appraisal_id',appraisalId).eq('review_order',review_order);continue;}
        const payload={appraisal_id:appraisalId,review_order,appraiser_user_id,trade_offer:trade===''?null:Number(trade),buy_offer:buy===''?null:Number(buy),consign_offer:consign===''?null:Number(consign),status:'submitted',submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()};
        const {error}=await sb.from('appraisal_reviews').upsert(payload,{onConflict:'appraisal_id,review_order'}); if(error)throw error;
      }
      if(typeof toast==='function')toast('Appraiser values saved.');
    }catch(e){console.error(e);if(typeof toast==='function')toast(e.message||'Could not save appraiser values.',true);}
    finally{if(btn){btn.disabled=false;btn.textContent='Save Appraiser Values';}}
  }
  function scheduleRender(){clearTimeout(window.__appraiserPanelTimer);window.__appraiserPanelTimer=setTimeout(render,160)}
  const obs=new MutationObserver(mutations=>{
    if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&!n.closest?.('#appraiserValuePanel'))))scheduleRender();
  });
  window.addEventListener('inventoryroad:appraisal-layout-ready',scheduleRender);
  window.addEventListener('hashchange',scheduleRender);
  window.addEventListener('load',()=>{const page=document.getElementById('pageContent');if(page)obs.observe(page,{childList:true,subtree:true});scheduleRender()});
})();