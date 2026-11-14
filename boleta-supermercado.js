// Ticket térmico estilo supermercado (80 mm). Es un comprobante de pedido,
// no una boleta electrónica autorizada por SUNAT.
(function(){
'use strict';
const escapeHtml = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const soles = n => 'S/ ' + (Number(n)||0).toFixed(2);
const fila = (etiqueta,valor,destacado=false) => valor ? `<div class="dato${destacado?' dato-destacado':''}"><span>${escapeHtml(etiqueta)}</span><span>${escapeHtml(valor)}</span></div>` : '';
function productos(p){
 if(Array.isArray(p.items)&&p.items.length) return p.items.map(x=>({nombre:String(x.nombre||'Producto'),codigo:String(x.codigo||''),cantidad:Math.max(1,Number(x.cantidad)||1),precio:Number(x.precio)||0}));
 return [{nombre:String(p.producto||'Producto'),codigo:String(p.codigo||''),cantidad:Math.max(1,Number(p.cantidad)||1),precio:Number(p.precio)||0}];
}
function contenido(p){
 const items=productos(p), total=items.reduce((s,x)=>s+x.cantidad*x.precio,0);
 const tienda=localStorage.getItem('nombreTienda')||'MI TIENDA';
 const tel=localStorage.getItem('contactoTienda')||'';
 const logo=localStorage.getItem('logoTienda')||'';
 const logoSeguro=/^(data:image\/(?:png|jpeg|gif|webp);base64,|https:\/\/)/i.test(logo) ? logo : '';
 const fecha=p.fechaCreacion?new Date(p.fechaCreacion):new Date();
 const fechaTexto=Number.isNaN(fecha.getTime())?new Date().toLocaleString('es-PE'):fecha.toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'});
 const listado=items.map(item=>`<div class="item"><div class="producto producto-destacado">${escapeHtml(item.nombre)}</div>${item.codigo?`<div class="codigo">Código: ${escapeHtml(item.codigo)}</div>`:''}<div class="linea-producto"><span>${item.cantidad} × ${soles(item.precio)}</span><strong class="subtotal-item">${soles(item.cantidad*item.precio)}</strong></div></div>`).join('');
 const mensaje=String(p.mensajePedido||'').trim();
 const cierre=localStorage.getItem('mensajeTicket')||'';
 return `<div class="cabecera">${logoSeguro?`<img class="logo-ticket" src="${escapeHtml(logoSeguro)}" alt="Logo de tienda">`:''}<div class="nombre-tienda">${escapeHtml(tienda)}</div>${tel?`<div class="contacto">Tel: ${escapeHtml(tel)}</div>`:''}</div>
 <div class="separador"></div>
 <div class="cabecera"><div class="tipo">BOLETA DE PEDIDO</div><div class="subtipo">TICKET DE COMPRA</div></div>
 <div class="separador"></div>
 <section class="datos-ticket">${fila('Pedido N°:',p.numero||'')}${fila('Fecha:',fechaTexto,true)}${fila('Cliente:',p.cliente||'Público general',true)}${fila('DNI:',p.dniCliente,true)}${fila('Teléfono:',p.telefonoCliente,true)}${fila('Dirección:',p.direccionCliente,true)}</section>
 <div class="separador"></div>
 <div class="titulos">DESCRIPCIÓN / CANT. × P.U.</div>
 <div class="separador"></div>
 <section class="articulos-ticket">${listado}</section>
 <div class="separador"></div>
 <div class="resumen"><span>ARTÍCULOS</span><strong>${items.reduce((s,x)=>s+x.cantidad,0)}</strong></div>
 <div class="total"><span>TOTAL A PAGAR</span><strong>${soles(total)}</strong></div>
 <div class="separador"></div>
 ${mensaje?`<div class="nota"><strong>NOTA:</strong> ${escapeHtml(mensaje)}</div>`:''}
 <div class="pie">${cierre?`<div>${escapeHtml(cierre)}</div>`:''}<strong>¡GRACIAS POR SU COMPRA!</strong><div>VUELVA PRONTO</div><small>Comprobante de pedido. No es comprobante electrónico SUNAT.</small></div>`;
}
const estilo=`
@page{size:80mm auto;margin:0}
.boleta-supermercado,.boleta-supermercado *{box-sizing:border-box!important}
.boleta-supermercado{width:80mm!important;max-width:100%!important;padding:4mm!important;margin:0 auto!important;background:white!important;color:#000!important;font:12px/1.45 Arial,Helvetica,sans-serif!important;text-align:left!important;overflow-wrap:anywhere!important;box-shadow:none!important;border:0!important}
.boleta-supermercado *{color:#000!important;background:transparent!important;text-shadow:none!important;box-shadow:none!important;letter-spacing:normal!important;border-radius:0!important}
.boleta-supermercado .cabecera{text-align:center!important}
.boleta-supermercado .logo-ticket{display:block!important;width:auto!important;height:auto!important;max-width:14mm!important;max-height:14mm!important;object-fit:contain!important;margin:0 auto 2mm!important;padding:0!important;border:0!important}
.boleta-supermercado .nombre-tienda{font-size:19px!important;font-weight:800!important;line-height:1.2!important;margin:2px 0!important}
.boleta-supermercado .contacto{font-size:11px!important}
.boleta-supermercado .tipo{font-size:14px!important;font-weight:800!important;line-height:1.2!important}
.boleta-supermercado .subtipo{font-size:11px!important;letter-spacing:.5px!important}
.boleta-supermercado .separador{height:0!important;border-top:1px dashed #777!important;font-size:0!important;line-height:0!important;margin:9px 0!important;display:block!important;overflow:hidden!important}
.boleta-supermercado .datos-ticket .dato{display:block!important;margin:4px 0!important;font-size:13px!important;line-height:1.5!important}
.boleta-supermercado .datos-ticket .dato span:first-child{font-weight:400!important;margin-right:4px!important}
.boleta-supermercado .datos-ticket .dato span:last-child{text-align:left!important;font-weight:400!important}
.boleta-supermercado .datos-ticket .dato-destacado span:first-child{font-weight:700!important}
.boleta-supermercado .datos-ticket .dato-destacado span:last-child{font-weight:400!important}
.boleta-supermercado .titulos{font-size:10px!important;font-weight:700!important;display:block!important}
.boleta-supermercado .item{padding:5px 0!important;border-bottom:0!important;margin:0!important}
.boleta-supermercado .producto{display:block!important;width:auto!important;height:auto!important;font-size:12px!important;font-weight:400!important;padding:0!important;margin:0!important;border:0!important;min-height:0!important}
.boleta-supermercado .producto-destacado{font-weight:700!important}
.boleta-supermercado .codigo{display:block!important;font-size:11px!important;margin:1px 0!important;padding:0!important;border:0!important;min-height:0!important}
.boleta-supermercado .linea-producto{display:flex!important;justify-content:space-between!important;gap:6px!important;font-size:11px!important;margin:3px 0 0!important}
.boleta-supermercado .linea-producto strong{white-space:nowrap!important;font-weight:700!important}
.boleta-supermercado .resumen{display:flex!important;justify-content:space-between!important;font-size:11px!important;margin:6px 0!important;font-weight:400!important}
.boleta-supermercado .total{display:flex!important;justify-content:space-between!important;gap:6px!important;font-size:13px!important;font-weight:800!important;margin:4px 0!important;padding:2px 0!important}
.boleta-supermercado .total strong{white-space:nowrap!important}
.boleta-supermercado .pie{text-align:center!important;padding:4px 0 2px!important;font-size:10px!important}
.boleta-supermercado .pie strong{display:block!important;font-size:11px!important;margin:7px 0 3px!important}
.boleta-supermercado .pie small{display:block!important;font-size:9px!important;line-height:1.35!important;margin-top:10px!important}
@media screen{.boleta-supermercado{box-shadow:0 1px 8px #0002!important}}
@media print{html,body{margin:0!important;padding:0!important;background:#fff!important;width:80mm!important}.boleta-supermercado{margin:0!important;width:80mm!important;max-width:80mm!important;box-shadow:none!important}.boleta-supermercado .item{break-inside:avoid!important}}
`;

function obtenerPedido(){try{return JSON.parse(localStorage.getItem('ultimoPedido')||'null')}catch(_){return null}}
function actualizarVista(p){
 const previo=document.getElementById('ticket');
 if(!previo)return;
 previo.className='ticket-vista-supermercado';
 previo.innerHTML='<style>'+estilo+'</style><div class="boleta-supermercado">'+contenido(p)+'</div>';
 previo.style.display='block';
}
window.vistaPreviaBoletaSupermercado=function(){
 let p=obtenerPedido();
 // Vista preliminar, sin guardar aún un pedido ni duplicar registros
 if(new URLSearchParams(location.search).get('desde')==='escaner'){
   try{const list=JSON.parse(sessionStorage.getItem('maitePagoEscaneadoV1')||'[]');
     if(Array.isArray(list)&&list.length){p={numero:'VISTA PREVIA',fechaCreacion:Date.now(),items:list,
       cliente:document.getElementById('cliente')?.value||'',dniCliente:document.getElementById('dniCliente')?.value||'',
       telefonoCliente:document.getElementById('telefonoCliente')?.value||'',direccionCliente:document.getElementById('direccionCliente')?.value||'',
       mensajePedido:document.getElementById('mensajePedido')?.value||''};}
   }catch(_){/* opcional */}
 } else {
   try{const x=JSON.parse(localStorage.getItem('productoActualPedido')||'null');
     if(x){p={numero:'VISTA PREVIA',fechaCreacion:Date.now(),producto:x.nombre,codigo:x.codigo,precio:x.precio,cantidad:1,
       cliente:document.getElementById('cliente')?.value||'',dniCliente:document.getElementById('dniCliente')?.value||'',
       telefonoCliente:document.getElementById('telefonoCliente')?.value||'',direccionCliente:document.getElementById('direccionCliente')?.value||'',
       mensajePedido:document.getElementById('mensajePedido')?.value||''};}
   }catch(_){/* opcional */}
 }
 if(!p){alert('Selecciona primero un producto para ver su boleta.');return;}
 actualizarVista(p);
 document.getElementById('ticket')?.scrollIntoView({behavior:'smooth',block:'start'});
};
// Impresión A4 para PC/PDF, o papel continuo de 80 mm para impresoras térmicas.
// Ambas opciones utilizan el mismo HTML de la vista previa.
window.mostrarBoletaSupermercado=function(modo='termica'){
 const p=obtenerPedido();
 if(!p){alert('Primero selecciona productos para generar la boleta.');return;}
 actualizarVista(p);
 const termica=(modo==='termica');
 const v=window.open('','_blank','width=560,height=850');
 if(!v){alert('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes e inténtalo nuevamente.');return;}
 const html=contenido(p);
 // En PC el papel predeterminado es A4 para que un ticket corto no se reparta en hojas.
 // Para térmica se fija el tamaño del rollo a la altura real del contenido.
 const cssPagina = termica
  ? '@page{size:80mm 200mm;margin:0}'
  : '@page{size:A4 portrait;margin:12mm}';
 // Se quita el @page de 80 mm del estilo compartido: entraba en conflicto con A4.
 const estiloVentana=estilo.replace('@page{size:80mm auto;margin:0}', '')
  .replace('@media print{html,body{margin:0!important;padding:0!important;background:#fff!important;width:80mm!important}.boleta-supermercado{margin:0!important;width:80mm!important;max-width:80mm!important;box-shadow:none!important}.boleta-supermercado .item{break-inside:avoid!important}}','');
 const estiloTermica = termica ? `
  /* Impresora de recibos: ancho físico fijo, sin transform ni scale */
  @media screen,print {
    html,body{width:80mm!important;min-width:80mm!important;max-width:80mm!important;height:auto!important;overflow:visible!important;margin:0!important;padding:0!important}
    #hoja-impresion{width:80mm!important;min-width:80mm!important;max-width:80mm!important;margin:0!important;padding:0!important;transform:none!important;zoom:1!important}
    #hoja-impresion .boleta-supermercado{width:80mm!important;min-width:80mm!important;max-width:80mm!important;padding:3mm 4mm!important;margin:0!important;font-size:13px!important;transform:none!important;zoom:1!important}
    #hoja-impresion .nombre-tienda{font-size:21px!important}
    #hoja-impresion .tipo{font-size:15px!important}
    #hoja-impresion .datos-ticket .dato,#hoja-impresion .linea-producto,#hoja-impresion .resumen{font-size:13px!important}
    #hoja-impresion .producto{font-size:14px!important}
    #hoja-impresion .total{font-size:14px!important}
  }
  @media print {
    html,body{print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}
    #hoja-impresion .boleta-supermercado .item{break-inside:avoid!important;page-break-inside:avoid!important}
  }` : '';
 const estiloA4 = termica ? '' : `
  /* Vista para hoja A4: vertical y a tamaño legible, no miniaturizada. */
  @media screen, print {
   #hoja-impresion {width:120mm!important;max-width:120mm!important;margin:0 auto!important}
   #hoja-impresion .boleta-supermercado {width:120mm!important;max-width:120mm!important;padding:8mm!important;font-size:16px!important;line-height:1.45!important}
   #hoja-impresion .nombre-tienda{font-size:28px!important}
   #hoja-impresion .logo-ticket{max-width:21mm!important;max-height:21mm!important}
   #hoja-impresion .contacto,#hoja-impresion .subtipo,#hoja-impresion .codigo,#hoja-impresion .titulos,#hoja-impresion .pie{font-size:14px!important}
   #hoja-impresion .tipo{font-size:20px!important}
   #hoja-impresion .datos-ticket .dato,#hoja-impresion .linea-producto,#hoja-impresion .resumen{font-size:16px!important}
   #hoja-impresion .producto{font-size:17px!important}
   #hoja-impresion .total{font-size:19px!important}
   #hoja-impresion .pie strong{font-size:16px!important}
   #hoja-impresion .pie small{font-size:11px!important}
  }
  @media print {
   html,body{width:auto!important;max-width:none!important;margin:0!important;padding:0!important;overflow:visible!important}
   #hoja-impresion{break-inside:auto!important;page-break-inside:auto!important}
   .boleta-supermercado{break-inside:auto!important;page-break-inside:auto!important}
   .boleta-supermercado .item{break-inside:avoid!important}
  }`;
 v.document.open();
 v.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boleta - ${escapeHtml(p.numero||'Pedido')}</title><style>${estiloVentana}
 ${cssPagina}
 html,body{background:#fff!important;margin:0!important;padding:0!important}
 #hoja-impresion{width:80mm;max-width:100%;margin:0 auto;display:block}
 #hoja-impresion .boleta-supermercado{width:80mm!important;max-width:80mm!important;margin:0 auto!important;box-shadow:none!important}
 ${estiloA4}
 ${estiloTermica}
 </style></head><body><div id="hoja-impresion"><main class="boleta-supermercado">${html}</main></div></body></html>`);
 v.document.close();
 const imprimir=async()=>{
  try{await Promise.all(Array.from(v.document.images).map(i=> i.complete?Promise.resolve():new Promise(resolve=>{i.addEventListener('load',resolve,{once:true});i.addEventListener('error',resolve,{once:true});setTimeout(resolve,1800)})));}catch(_){}
  const recibo=v.document.querySelector('.boleta-supermercado');
  if(!recibo)return;
  if(termica){
   // Ajustar la longitud del rollo sin alterar el ancho de 80 mm.
   const altoMm=Math.max(100,Math.ceil((recibo.scrollHeight/96*25.4)+12));
   const regla=v.document.createElement('style');
   regla.textContent='@page{size:80mm '+altoMm+'mm;margin:0}';
   v.document.head.appendChild(regla);
  }
  // En A4 NO se usa transform:scale: producía un ticket diminuto.
  v.focus();v.print();
 };
 if(v.document.readyState==='complete')imprimir();
 else v.addEventListener('load',imprimir,{once:true});
};
})();
