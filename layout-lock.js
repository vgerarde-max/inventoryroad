(function(){
  const nativeOpen=window.open.bind(window);

  function injectLayoutLock(w){
    try{
      if(!w||w.closed||!w.document||!w.document.head)return;
      const title=(w.document.title||'').toLowerCase();
      if(!title.includes('customer offer')&&!title.includes('market value sheet'))return;
      if(w.document.getElementById('inventoryroad-layout-lock'))return;

      const style=w.document.createElement('style');
      style.id='inventoryroad-layout-lock';

      if(title.includes('customer offer')){
        style.textContent=`
          html,body{min-width:8.05in!important;overflow-x:auto!important;}
          .sheet{width:8.05in!important;min-width:8.05in!important;max-width:8.05in!important;margin-left:auto!important;margin-right:auto!important;padding:0!important;}
          .title{font-size:24px!important;text-align:center!important;}
          .options{display:grid!important;grid-template-columns:repeat(3,1fr)!important;}
          .option{min-height:3.62in!important;}
          .sign-row{display:grid!important;grid-template-columns:1.05fr 1.35fr 1.35fr!important;gap:.55in!important;}
          .footer{display:block!important;}
          @media(max-width:850px){
            html,body{min-width:8.05in!important;}
            .sheet{width:8.05in!important;min-width:8.05in!important;max-width:8.05in!important;}
            .title{font-size:24px!important;}
            .options{grid-template-columns:repeat(3,1fr)!important;}
            .option{min-height:3.62in!important;}
            .sign-row{grid-template-columns:1.05fr 1.35fr 1.35fr!important;gap:.55in!important;}
            .footer{display:block!important;}
          }
          @media print{
            html,body{min-width:0!important;overflow:visible!important;}
            .sheet{width:8.05in!important;min-width:8.05in!important;max-width:8.05in!important;margin:0 auto!important;}
            .options{grid-template-columns:repeat(3,1fr)!important;}
            .sign-row{grid-template-columns:1.05fr 1.35fr 1.35fr!important;}
          }
        `;
      }else{
        style.textContent=`
          html,body{min-width:8.1in!important;overflow-x:auto!important;}
          .sheet{width:8.1in!important;min-width:8.1in!important;max-width:8.1in!important;margin-left:auto!important;margin-right:auto!important;padding:.08in .04in!important;}
          .header{display:grid!important;grid-template-columns:1.55in 1fr 1.55in!important;}
          .title{text-align:center!important;font-size:25px!important;margin:0!important;}
          .grid3{display:grid!important;grid-template-columns:1.25fr .72fr .85fr!important;}
          .grid2{display:grid!important;grid-template-columns:1fr 1fr!important;}
          .specs{display:grid!important;grid-template-columns:repeat(4,1fr)!important;}
          .internalTop{display:grid!important;grid-template-columns:1fr 1fr 1fr!important;}
          .equipment{font-size:8.2px!important;}
          @media(max-width:850px){
            html,body{min-width:8.1in!important;}
            .sheet{width:8.1in!important;min-width:8.1in!important;max-width:8.1in!important;padding:.08in .04in!important;}
            .header{grid-template-columns:1.55in 1fr 1.55in!important;}
            .title{text-align:center!important;font-size:25px!important;margin:0!important;}
            .grid3{grid-template-columns:1.25fr .72fr .85fr!important;}
            .grid2{grid-template-columns:1fr 1fr!important;}
            .specs{grid-template-columns:repeat(4,1fr)!important;}
            .internalTop{grid-template-columns:1fr 1fr 1fr!important;}
            .equipment{font-size:8.2px!important;}
          }
          @media print{
            html,body{min-width:0!important;overflow:visible!important;}
            .sheet{width:8.1in!important;min-width:8.1in!important;max-width:8.1in!important;margin:0 auto!important;padding:.08in .04in!important;}
            .header{grid-template-columns:1.55in 1fr 1.55in!important;}
            .grid3{grid-template-columns:1.25fr .72fr .85fr!important;}
            .specs{grid-template-columns:repeat(4,1fr)!important;}
            .internalTop{grid-template-columns:1fr 1fr 1fr!important;}
          }
        `;
      }
      w.document.head.appendChild(style);
    }catch(_e){}
  }

  window.open=function(){
    const w=nativeOpen(...arguments);
    if(!w)return w;
    const apply=()=>injectLayoutLock(w);
    try{
      w.addEventListener('load',apply);
      const nativeClose=w.document.close.bind(w.document);
      w.document.close=function(){
        nativeClose();
        setTimeout(apply,0);
        setTimeout(apply,50);
      };
    }catch(_e){}
    return w;
  };
})();
