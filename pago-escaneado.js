// Traspaso de varios artículos desde el escáner al módulo existente de boletas.
(function(){
'use strict';
let items=[];
let pedidoGenerado=null;
const $=id=>document.getElementById(id);
const dinero=n=>'S/ '+Number(n||0).toFixed(2);
const texto=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function importe(){return items.reduce((sum,p)=>sum+p.cantidad*p.precio,0);}
function vista(){
 const cont=$('productoPedido');cont.innerHTML='';
 const tabla=document.createElement('div');tabla.className='detalle-pago-escaneado';
 items.forEach(p=>{
  const fila=document.createElement('div');fila.style.cssText='display:flex;gap:12px;align-items:center;border-bottom:1px solid currentColor;padding:10px 0';
  const media=document.createElement('div');media.style.cssText='width:65px;height:65px;flex-shrink:0;display:flex;align-items:center;justify-content:center';
  const imagen=String(p.imagen||'');
  if(/^(https?:\/\/|data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,|\.?\.?\/)/i.test(imagen)){
   const img=document.createElement('img');img.src=imagen;img.alt=p.nombre;img.style.cssText='width:100%;height:100%;object-fit:contain';img.onerror=()=>{media.textContent='📦';img.remove()};media.append(img);
  }else media.textContent='📦';
  const info=document.createElement('div');info.style.cssText='flex:1;min-width:0;overflow-wrap:anywhere';
  info.innerHTML='<strong>'+texto(p.nombre)+'</strong><div>Código: '+texto(p.codigo)+'</div><div>'+p.cantidad+' × '+dinero(p.precio)+'</div>';
  const subtotal=document.createElement('strong');subtotal.textContent=dinero(p.cantidad*p.precio);
  fila.append(media,info,subtotal);tabla.append(fila);
 });
 cont.append(tabla);
 $('totalPedido').textContent='Total a pagar: '+dinero(importe());
 $('tituloSeleccionPedido').textContent='Productos de la compra ('+items.length+')';
 $('avisoPagoEscaneado').hidden=false;
 $('avisoPagoEscaneado').textContent='Los productos y cantidades vienen del carrito o del escáner.';
}
function crearPedido(){
 if(pedidoGenerado)return pedidoGenerado;
 const total=importe();
 const anticipo=0;
 const numero='PED-'+String(Date.now());
 const fecha=new Date().toLocaleDateString('es-PE');
 const pedido={numero,fechaCreacion:Date.now(),fechaPedido:fecha,
  producto:items.map(p=>p.nombre).join(', '),codigo:items.map(p=>p.codigo).join(', '),
  precio:total,cantidad:items.reduce((s,p)=>s+p.cantidad,0),total,subtotal:total,
  items:items.map(p=>({nombre:p.nombre,codigo:p.codigo,precio:p.precio,cantidad:p.cantidad})),
  anticipo,saldo:total-anticipo,...obtenerDatosClientePedido(),
  fechaEntrega:'',mensajePedido:$('mensajePedido').value,estado:'Pendiente'};
 localStorage.setItem('ultimoPedido',JSON.stringify(pedido));
 try{
  const pedidos=JSON.parse(localStorage.getItem('pedidos')||'[]');
  pedidos.push(pedido);localStorage.setItem('pedidos',JSON.stringify(pedidos));
 }catch(e){console.warn('No se pudo guardar el historial local:',e);}
 if(typeof sincronizarPedidoFirebase==='function'){
  try{Promise.resolve(sincronizarPedidoFirebase(pedido)).catch(e=>console.warn('No se pudo sincronizar pedido:',e));}
  catch(e){console.warn('Error de sincronización:',e);}
 }
 pedidoGenerado=pedido;
 $('ticket').innerHTML='<h2>'+texto(localStorage.getItem('nombreTienda')||'Tienda')+'</h2>'+ 
  '<p>BOLETA DE PEDIDO: '+texto(numero)+'</p><p>Cliente: '+texto(pedido.cliente)+'</p>'+
  '<p>DNI: '+texto(pedido.dniCliente)+'</p><p>Teléfono: '+texto(pedido.telefonoCliente)+'</p><p>Dirección: '+texto(pedido.direccionCliente)+'</p>'+ 
  pedido.items.map(p=>'<p>'+texto(p.nombre)+' · '+texto(p.codigo)+' · '+p.cantidad+' × '+dinero(p.precio)+' = '+dinero(p.precio*p.cantidad)+'</p>').join('')+
  '<strong>Total a pagar: '+dinero(total)+'</strong>';
 return pedido;
}
window.iniciarPagoEscaneado=function(){
 let cargados=[];
 try{cargados=JSON.parse(sessionStorage.getItem('maitePagoEscaneadoV1')||'[]');}catch(_){}
 items=Array.isArray(cargados)?cargados.filter(p=>p&&p.codigo&&Number(p.cantidad)>0).map(p=>({
  nombre:String(p.nombre||'Producto'),codigo:String(p.codigo),precio:Math.max(0,Number(p.precio)||0),
  cantidad:Math.floor(Number(p.cantidad)),imagen:String(p.imagen||'')
 })):[];
 if(!items.length){
  $('productoPedido').textContent='No hay productos para pagar. Vuelve a la tienda o al escáner.';
  $('totalPedido').textContent='Total: S/ 0.00';
  $('tituloSeleccionPedido').textContent='Sin productos';
  return;
 }
 vista();
 window.imprimirTicket=function(){crearPedido();if(typeof mostrarBoletaSupermercado==='function')mostrarBoletaSupermercado();else alert('No se pudo abrir la boleta.');};
 window.imprimirTicketTermico=function(){crearPedido();if(typeof mostrarBoletaSupermercado==='function')mostrarBoletaSupermercado('termica');else alert('No se pudo abrir la boleta.');};
 window.guardarPDF=function(){crearPedido();if(typeof mostrarBoletaSupermercado==='function')mostrarBoletaSupermercado();else alert('No se pudo abrir la boleta.');};
};
})();
