(function(){
  const money=v=>v===null||v===undefined||v===''?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v));
  const text=v=>v===null||v===undefined||v===''?'—':String(v);
  const safe=v=>text(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const vehicle=a=>[a.year,a.make,a.model,a.floorplan].filter(Boolean).join(' ')||'RV';
  const locationName=a=>typeof storeName==='function'?storeName(a.vehicle_store_id||a.store_id):'—';
  const row=(label,value)=>`<tr><th>${safe(label)}</th><td>${safe(value)}</td></tr>`;
  const moneyRow=(label,value)=>`<tr><th>${safe(label)}</th><td class="money">${safe(money(value))}</td></tr>`;

  function shell(title,a,body){
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${safe(title)} | InventoryRoad</title><style>
    *{box-sizing:border-box}body{font-family:Arial,Helvetica,sans-serif;margin:0;color:#111827;background:#f3f4f6}.page{max-width:900px;margin:24px auto;background:#fff;padding:36px;box-shadow:0 2px 14px rgba(0,0,0,.08)}.top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:3px solid #111827;padding-bottom:18px;margin-bottom:24px}.brand{font-size:26px;font-weight:800}.subtitle{font-size:13px;color:#6b7280;margin-top:4px}.doc-title{text-align:right}.doc-title h1{margin:0;font-size:26px}.doc-title p{margin:6px 0 0;color:#6b7280}.summary{display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:24px}.summary div{padding:9px 0;border-bottom:1px solid #e5e7eb}.summary b{display:block;font-size:11px;text-transform:uppercase;color:#6b7280;margin-bottom:3px}.section{margin-top:24px}.section h2{font-size:15px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 10px;border-bottom:2px solid #111827;padding-bottom:7px}table{width:100%;border-collapse:collapse}th,td{padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}th{width:42%;font-size:12px;color:#4b5563}.money{font-size:18px;font-weight:700}.offers{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}.offer{border:2px solid #111827;padding:18px;text-align:center;border-radius:8px}.offer .label{font-size:12px;text-transform:uppercase;color:#6b7280}.offer .amount{font-size:28px;font-weight:800;margin-top:8px}.notes{white-space:pre-wrap;line-height:1.45;border:1px solid #d1d5db;padding:14px;min-height:70px}.signatures{display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-top:54px}.sig{border-top:1px solid #111827;padding-top:8px;font-size:12px;color:#4b5563}.actions{text-align:right;max-width:900px;margin:18px auto}.actions button{background:#111827;color:#fff;border:0;border-radius:6px;padding:10px 16px;font-weight:700;cursor:pointer}@media print{body{background:#fff}.page{box-shadow:none;margin:0;max-width:none;padding:20px}.actions{display:none}}@media(max-width:650px){.page{margin:0;padding:22px}.top{display:block}.doc-title{text-align:left;margin-top:18px}.summary,.offers,.signatures{grid-template-columns:1fr}}
    </style></head><body><div class="actions"><button onclick="window.print()">Print</button></div><main class="page"><div class="top"><div><div class="brand">InventoryRoad</div><div class="subtitle">RV Appraisal & Inventory Management</div></div><div class="doc-title"><h1>${safe(title)}</h1><p>${safe(new Date().toLocaleDateString())}</p></div></div><div class="summary"><div><b>Customer</b>${safe(a.customer_name||'—')}</div><div><b>Salesperson</b>${safe(a.salesperson||'—')}</div><div><b>Vehicle</b>${safe(vehicle(a))}</div><div><b>VIN</b>${safe(a.vin||'—')}</div><div><b>Location</b>${safe(locationName(a))}</div><div><b>Status</b>${safe(a.offer_status_text||a.status||'—')}</div></div>${body}</main></body></html>`;
  }

  function openDoc(html){
    const w=window.open('','_blank');
    if(!w){ if(typeof toast==='function') toast('Please allow pop-ups to open the form.',true); return; }
    w.document.open();w.document.write(html);w.document.close();
  }

  function openMarketValue(a){
    const body=`<section class="section"><h2>Market & Book Values</h2><table>${moneyRow('Book wholesale',a.book_wholesale_value)}${moneyRow('Book retail',a.book_retail_value)}${row('Book source',a.book_source)}${row('Book value date',a.book_value_date)}${moneyRow('Wholesale value',a.wholesale_value)}${moneyRow('Retail value',a.retail_value)}</table></section><section class="section"><h2>Recon & Appraisal</h2><table>${moneyRow('Estimated recon',a.estimated_recon)}${moneyRow('Manager recon',a.manager_recon)}${row('Recommended recon grade',a.recommended_recon_grade)}${row('Manager recon grade',a.manager_recon_grade)}${moneyRow('ACV',a.acv)}</table></section><section class="section"><h2>Comparables / Notes</h2><div class="notes">${safe(a.comps_notes||'No comps notes entered.')}</div></section><section class="signatures"><div class="sig">Appraiser / Manager</div><div class="sig">Date</div></section>`;
    openDoc(shell('Market Value',a,body));
  }

  function openCustomerOffer(a){
    const address=[a.customer_address_line1,a.customer_address_line2,a.customer_city,a.customer_state,a.customer_postal_code].filter(Boolean).join(', ');
    const body=`<section class="section"><h2>Customer Offer</h2><div class="offers"><div class="offer"><div class="label">Trade-In</div><div class="amount">${safe(money(a.final_trade_offer))}</div></div><div class="offer"><div class="label">Straight Buy</div><div class="amount">${safe(money(a.final_buy_offer))}</div></div><div class="offer"><div class="label">Consignment</div><div class="amount">${safe(money(a.final_consign_offer))}</div></div></div></section><section class="section"><h2>Customer Information</h2><table>${row('Phone',a.customer_phone)}${row('Email',a.customer_email)}${row('Address',address||'—')}</table></section>${a.customer_notes?`<section class="section"><h2>Notes</h2><div class="notes">${safe(a.customer_notes)}</div></section>`:''}<section class="signatures"><div class="sig">Customer Signature</div><div class="sig">Date</div></section>`;
    openDoc(shell('Customer Offer',a,body));
  }

  function getAppraisal(id){
    return typeof state!=='undefined'&&Array.isArray(state.appraisals)?state.appraisals.find(a=>String(a.id)===String(id)):null;
  }

  function wireButton(btn,type,id){
    btn.addEventListener('click',e=>{
      e.preventDefault();e.stopPropagation();
      const a=getAppraisal(id);
      if(!a) return;
      type==='market'?openMarketValue(a):openCustomerOffer(a);
    });
  }

  function addDashboardButtons(){
    if(location.hash!=='#appraisals') return;
    const table=document.querySelector('#appTable table');
    if(!table||table.dataset.formsReady==='1') return;
    const head=table.querySelector('thead tr');
    if(head){const th=document.createElement('th');th.textContent='Forms';head.appendChild(th);}
    table.querySelectorAll('tbody tr[data-id]').forEach(tr=>{
      const td=document.createElement('td');
      td.style.whiteSpace='nowrap';
      const market=document.createElement('button');market.type='button';market.className='btn ghost small-btn';market.textContent='Market Value';market.style.marginRight='6px';
      const offer=document.createElement('button');offer.type='button';offer.className='btn ghost small-btn';offer.textContent='Customer Offer';
      wireButton(market,'market',tr.dataset.id);wireButton(offer,'offer',tr.dataset.id);
      td.append(market,offer);tr.appendChild(td);
    });
    table.dataset.formsReady='1';
  }

  function addDetailButtons(){
    if(!location.hash.startsWith('#appraisals/')) return;
    const id=location.hash.split('/')[1];
    const host=document.getElementById('pageContent');
    if(!host||document.getElementById('appraisalFormButtons')) return;
    const a=getAppraisal(id);if(!a) return;
    const wrap=document.createElement('div');wrap.id='appraisalFormButtons';wrap.className='detail-actions';wrap.style.marginBottom='16px';
    const market=document.createElement('button');market.type='button';market.className='btn ghost';market.textContent='Market Value';market.style.marginRight='8px';
    const offer=document.createElement('button');offer.type='button';offer.className='btn ghost';offer.textContent='Customer Offer';
    wireButton(market,'market',id);wireButton(offer,'offer',id);wrap.append(market,offer);host.insertBefore(wrap,host.firstChild);
  }

  function refresh(){setTimeout(()=>{addDashboardButtons();addDetailButtons();},0)}
  const observer=new MutationObserver(refresh);
  window.addEventListener('DOMContentLoaded',()=>{observer.observe(document.body,{childList:true,subtree:true});refresh();});
  window.addEventListener('hashchange',refresh);
})();
