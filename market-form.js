(function(){
  const TEMPLATE='/market%20value%20sheet.pdf';
  const LIB='https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js';

  const val=v=>v===null||v===undefined?'':String(v);
  const money=v=>v===null||v===undefined||v===''?'':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v));
  const today=()=>new Date().toLocaleDateString('en-US');

  function loadPdfLib(){
    if(window.PDFLib)return Promise.resolve(window.PDFLib);
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=LIB;s.async=true;
      s.onload=()=>window.PDFLib?resolve(window.PDFLib):reject(new Error('PDF library did not load'));
      s.onerror=()=>reject(new Error('Unable to load PDF library'));
      document.head.appendChild(s);
    });
  }

  function fit(text,max=34){
    text=val(text).trim();
    return text.length>max?text.slice(0,max-1)+'…':text;
  }

  async function getAppraiserRows(appraisalId){
    if(typeof sb==='undefined'||!appraisalId)return [];
    const {data,error}=await sb.from('appraisal_reviews')
      .select('review_order,trade_offer,buy_offer,consign_offer,appraiser_user_id,profiles:appraiser_user_id(full_name)')
      .eq('appraisal_id',appraisalId)
      .order('review_order');
    if(error){console.error('Could not load appraisers for Market Value Sheet',error);return [];}
    return data||[];
  }

  async function buildMarketPdf(a){
    const {PDFDocument,StandardFonts,rgb}=await loadPdfLib();
    const [src,reviews]=await Promise.all([
      fetch(TEMPLATE,{cache:'no-store'}),
      getAppraiserRows(a.id)
    ]);
    if(!src.ok)throw new Error('Market Value Sheet template not found');
    const pdf=await PDFDocument.load(await src.arrayBuffer());
    const font=await pdf.embedFont(StandardFonts.Helvetica);
    const bold=await pdf.embedFont(StandardFonts.HelveticaBold);
    const pages=pdf.getPages();
    if(pages.length<2)throw new Error('Market Value Sheet template must be two pages');

    const p1=pages[0], p2=pages[1];
    const sx=p1.getWidth()/612, sy=p1.getHeight()/792;
    const TEXT_Y_OFFSET=2.5;
    const draw=(page,text,x,y,size=8,opts={})=>{
      if(text===null||text===undefined||text==='')return;
      const yOffset=opts.yOffset===undefined?TEXT_Y_OFFSET:opts.yOffset;
      page.drawText(fit(text,opts.max||55),{x:x*sx,y:(y+yOffset)*sy,size:size*Math.min(sx,sy),font:opts.bold?bold:font,color:rgb(0,0,0)});
    };

    draw(p1,a.customer_name,124,704,8.5,{max:38});
    draw(p1,today(),402,704,8.5,{max:14});
    draw(p1,a.salesperson,516,704,8.5,{max:18});
    draw(p1,a.customer_address_line1,126,681,8,{max:34});
    draw(p1,a.customer_city,337,681,8,{max:20});
    draw(p1,a.customer_state,484,681,8,{max:4});
    draw(p1,a.customer_postal_code,535,681,8,{max:10});
    draw(p1,a.customer_phone,124,659,8,{max:18});
    draw(p1,a.customer_email,286,659,8,{max:34});
    draw(p1,a.year,104,619,8.2,{max:6});
    draw(p1,a.make,191,619,8.2,{max:22});
    draw(p1,a.model,329,619,8.2,{max:25});
    draw(p1,a.floorplan,512,619,8.2,{max:14});
    draw(p1,a.mileage,431,588,8.2,{max:12});
    draw(p1,a.lien_holder,121,98,8.2,{max:28});
    draw(p1,money(a.estimated_payoff),496,98,8.2,{max:16});

    const store=(typeof storeName==='function')?storeName(a.vehicle_store_id||a.store_id):'';
    draw(p2,store,117,692,8.3,{max:25});
    draw(p2,today(),500,692,8.3,{max:14});
    draw(p2,money(a.estimated_payoff),129,667,8.3,{max:16});
    draw(p2,`${money(a.book_wholesale_value)} / ${money(a.book_retail_value)}`,178,624,8.3,{max:28});
    draw(p2,money(a.manager_recon??a.estimated_recon),485,624,8.3,{max:16});
    draw(p2,money(a.acv),80,604,8.3,{max:14});
    draw(p2,money(a.retail_value),220,604,8.3,{max:14});
    draw(p2,a.mileage,425,584,8.3,{max:12});
    draw(p2,a.vin,92,564,8.3,{max:24});

    const bidRows=[515,493,471];
    reviews.slice(0,3).forEach((r,i)=>{
      const y=bidRows[i];
      const manager=r.profiles?.full_name||'Appraiser';
      draw(p2,manager,43,y,7.7,{max:22});
      draw(p2,money(r.trade_offer),177,y,8.1,{max:14});
      draw(p2,money(r.buy_offer),299,y,8.1,{max:14});
      draw(p2,money(r.consign_offer),421,y,8.1,{max:14});
    });

    // Actual comparable prices, one per appraisal row in the Comps column.
    [a.comp_1_price,a.comp_2_price,a.comp_3_price].forEach((price,i)=>{
      draw(p2,money(price),350,bidRows[i],8.1,{max:14});
    });

    const finalY=449;
    draw(p2,'FINAL',43,finalY,7.7,{max:10,bold:true});
    draw(p2,money(a.final_trade_offer),177,finalY,8.1,{max:14,bold:true});
    draw(p2,money(a.final_buy_offer),299,finalY,8.1,{max:14,bold:true});
    draw(p2,money(a.final_consign_offer),421,finalY,8.1,{max:14,bold:true});

    return pdf.save();
  }

  async function openMarket(a){
    let w=window.open('','_blank');
    if(!w){if(typeof toast==='function')toast('Please allow pop-ups to open the form.',true);return;}
    w.document.write('<!doctype html><title>Preparing Market Value Sheet…</title><body style="font-family:Arial;padding:24px">Preparing exact Market Value Sheet PDF…</body>');
    try{
      const bytes=await buildMarketPdf(a);
      const blob=new Blob([bytes],{type:'application/pdf'});
      const url=URL.createObjectURL(blob);
      w.location.replace(url);
      setTimeout(()=>URL.revokeObjectURL(url),120000);
    }catch(err){
      console.error(err);
      w.close();
      if(typeof toast==='function')toast('Could not create Market Value Sheet: '+err.message,true);
      else alert('Could not create Market Value Sheet: '+err.message);
    }
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('button');
    if(!b||b.textContent.trim()!=='Market Value')return;
    const tr=b.closest('tr[data-id]');
    let id=tr&&tr.dataset.id;
    if(!id&&location.hash.startsWith('#appraisals/'))id=location.hash.split('/')[1];
    if(!id||typeof state==='undefined'||!Array.isArray(state.appraisals))return;
    const a=state.appraisals.find(x=>String(x.id)===String(id));
    if(!a)return;
    e.preventDefault();e.stopImmediatePropagation();
    openMarket(a);
  },true);
})();