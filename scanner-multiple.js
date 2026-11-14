// Escaneo a demanda y lista acumulativa (sin modificar productos ni pedidos).
(() => {
'use strict';
const $ = id => document.getElementById(id);
const clave = 'maiteCarritoV1';
const claveAnterior = 'maiteEscaneoMultipleV1';
const modoAdmin = localStorage.getItem('modoEscaneoProducto') === '1';
const lista = cargarLista();
let camaraActiva = false;
let esperandoCodigo = false;
let candidato = null;
let ultimoDetectado = 0;
let procesando = false;

function cargarLista(){
 // La tienda y el escáner comparten el mismo carrito durante esta sesión.
 // Migrar los productos del escáner anterior una sola vez para no perderlos.
 try {
  const actual = JSON.parse(sessionStorage.getItem(clave) || '[]');
  const carrito = Array.isArray(actual) ? actual.filter(p => p && p.codigo && Number(p.cantidad)>0) : [];
  if (modoAdmin) return carrito; // El lector del administrador no cambia el carrito.
  const anterior = JSON.parse(sessionStorage.getItem(claveAnterior) || '[]');
  if (Array.isArray(anterior) && anterior.length) {
   for(const p of anterior){
    if (!p || !p.codigo || !(Number(p.cantidad)>0)) continue;
    const existente = carrito.find(x=>normalizarCodigo(x.codigo)===normalizarCodigo(p.codigo));
    if(existente){
     existente.cantidad += Number(p.cantidad);
     if (!existente.imagen && p.imagen) existente.imagen = p.imagen;
    }else carrito.push({codigo:String(p.codigo),nombre:String(p.nombre||'Producto'),precio:Number(p.precio)||0,cantidad:Number(p.cantidad),imagen:String(p.imagen||'')});
   }
   sessionStorage.setItem(clave,JSON.stringify(carrito));
   sessionStorage.removeItem(claveAnterior);
  }
  return carrito;
 } catch(e) { console.warn('No se pudo cargar el carrito compartido:',e); return []; }
}
function guardarLista(){
 if(modoAdmin)return;
 try {sessionStorage.setItem(clave, JSON.stringify(lista));} catch(e){console.warn('No se pudo guardar escaneo', e);}
}
function mensaje(txt){ $('resultado').textContent = txt; }
function estado(txt){ $('estado').textContent = txt; }
function escapar(s){return String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function moneda(n){return Number(n || 0).toFixed(2);}
function imagenValida(valor){
 const src=String(valor||'').trim();
 return /^(https?:\/\/|data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,|\.?\.?\/)/i.test(src) ? src : '';
}
function miniaturaProducto(p){
 const marco=document.createElement('div');marco.className='miniatura-escaneo';
 const src=imagenValida(p.imagen);
 if(src){
  const img=document.createElement('img');img.src=src;img.alt='Imagen de '+String(p.nombre||'producto');img.loading='lazy';
  img.onerror=()=>{img.remove();marco.classList.add('sin-imagen');marco.textContent='📦';};
  marco.append(img);
 }else{marco.classList.add('sin-imagen');marco.textContent='📦';}
 return marco;
}
function sincronizarImagenes(){
 let cambiado=false;
 for(const p of lista){
  const original=buscarProducto(p.codigo);
  if(original && original.imagen && original.imagen!==p.imagen){p.imagen=original.imagen;cambiado=true;}
 }
 if(cambiado)pintar();
}
function catalogo(){
 // Se usa el catálogo validado de Firebase; evita depender de una variable todavía sin cargar.
 if(typeof productosVigentesFirebase !== 'undefined' && Array.isArray(productosVigentesFirebase)) return productosVigentesFirebase;
 if(window.catalogoOfflineActual && Array.isArray(window.catalogoOfflineActual)) return window.catalogoOfflineActual;
 try {
  const copia=JSON.parse(localStorage.getItem('detallesmaite_catalogo_confirmado_v1')||'null');
  if(copia && Array.isArray(copia.productos)) return copia.productos;
 }catch(_){ }
 return [];
}
function normalizarCodigo(valor){return String(valor??'').trim().replace(/\s+/g,'').toUpperCase();}
function buscarProducto(codigo){return catalogo().find(p => normalizarCodigo(p.codigo)===normalizarCodigo(codigo));}
async function esperarCatalogo(){
 if(typeof cargarProductosDesdeFirebase!=='function') return;
 // El escáner manual nunca debe quedar bloqueado si falla la conexión.
 await Promise.race([
  Promise.resolve().then(()=>cargarProductosDesdeFirebase()).catch(()=>false),
  new Promise(resolve=>setTimeout(()=>resolve(false),6000))
 ]);
}
function pintar(){
 const ul=$('listaEscaneados'); ul.innerHTML='';
 if(!lista.length){ const li=document.createElement('li');li.textContent='Todavía no hay productos.';ul.append(li); }
 for(const p of lista){
  const li=document.createElement('li');
  const info=document.createElement('div');
  info.innerHTML=`<strong>${escapar(p.nombre)}</strong><small>Código: ${escapar(p.codigo)} · S/ ${moneda(p.precio)} c/u</small>`;
  const controles=document.createElement('span'); controles.className='cantidad-controles';
  const menos=document.createElement('button');menos.type='button';menos.textContent='−';menos.setAttribute('aria-label','Restar una unidad');menos.onclick=()=>cambiarCantidad(p.codigo,-1);
  const num=document.createElement('strong');num.textContent=p.cantidad;
  const mas=document.createElement('button');mas.type='button';mas.textContent='+';mas.setAttribute('aria-label','Agregar una unidad');mas.onclick=()=>cambiarCantidad(p.codigo,1);
  controles.append(menos,num,mas);li.append(miniaturaProducto(p),info,controles);ul.append(li);
 }
 const cantidad=lista.reduce((s,p)=>s+Number(p.cantidad),0);
 const total=lista.reduce((s,p)=>s+Number(p.cantidad)*Number(p.precio||0),0);
 $('totalUnidades').textContent=cantidad+' unidad'+(cantidad===1?'':'es')+' · '+lista.length+' producto'+(lista.length===1?'':'s')+' diferente'+(lista.length===1?'':'s');
 $('totalEscaneo').textContent='Total: S/ '+moneda(total);
 $('vaciarEscaneo').disabled=!lista.length;
 $('pagarEscaneo').disabled=!lista.length;
 guardarLista();
}
function cambiarCantidad(codigo,delta){
 const p=lista.find(x=>x.codigo===codigo);if(!p)return;
 p.cantidad+=delta;
 if(p.cantidad<=0)lista.splice(lista.indexOf(p),1);
 pintar();
}
function beep(){
 try{const C=window.AudioContext||window.webkitAudioContext;if(!C)return;const a=new C();const o=a.createOscillator();const g=a.createGain();o.frequency.value=1000;g.gain.value=.08;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.12);o.onended=()=>a.close();}catch(_){ }
 if(navigator.vibrate)navigator.vibrate(80);
}
async function anadirCodigo(valor,origen='camara'){
 const codigo=String(valor??'').trim();
 if(!codigo){mensaje('⚠️ Escribe un código antes de pulsar Añadir.');$('codigoManual').focus();return false;}
 if(procesando){mensaje('⏳ Se está procesando otro producto. Intenta nuevamente.');return false;}
 procesando=true;
 const botonManual=$('agregarManual');
 botonManual.disabled=true;
 try{
  if(modoAdmin){
   localStorage.setItem('codigoEscaneadoProducto',codigo);
   localStorage.removeItem('modoEscaneoProducto');
   location.href='administracion.html';return true;
  }
  let p=buscarProducto(codigo);
  if(!p){
   mensaje('🔎 Buscando el producto '+codigo+' en el catálogo...');
   await esperarCatalogo();
   p=buscarProducto(codigo);
  }
  if(!p){
   mensaje('❌ El código '+codigo+' no está registrado en el catálogo o no se pudo cargar Firebase. Verifica el código en Administración y vuelve a intentar.');
   return false;
  }
  const codigoReal=String(p.codigo??codigo).trim();
  const existente=lista.find(x=>normalizarCodigo(x.codigo)===normalizarCodigo(codigoReal));
  if(existente){existente.cantidad+=1;existente.precio=Number(p.precio)||0;existente.nombre=String(p.nombre||existente.nombre);existente.imagen=String(p.imagen||'');}
  else lista.push({codigo:codigoReal,nombre:String(p.nombre||'Producto'),precio:Number(p.precio)||0,imagen:String(p.imagen||''),cantidad:1});
  beep();pintar();mensaje('✅ Añadido: '+String(p.nombre||'Producto')+' · Código: '+codigoReal);
  if(origen==='manual'){$('codigoManual').value='';$('codigoManual').focus();}
  return true;
 }catch(e){
  console.error(e);mensaje('❌ No se pudo agregar. Comprueba la conexión y vuelve a intentarlo.');return false;
 }finally{
  procesando=false;esperandoCodigo=false;
  $('gatillo').disabled=false;botonManual.disabled=false;
 }
}
function gatillo(){
 if(procesando)return;
 if(!camaraActiva){mensaje('📷 Cámara no disponible. Escribe el código y pulsa Añadir.');return;}
 const reciente=candidato && Date.now()-ultimoDetectado<1800;
 if(reciente){esperandoCodigo=false;anadirCodigo(candidato);}
 else{esperandoCodigo=true;estado('🎯 Gatillo activado. Mantén el código dentro del marco.');mensaje('🔎 Buscando el siguiente código...');}
}
function iniciarCamara(){
 if(typeof Quagga==='undefined'){estado('⚠️ Lector no disponible. Puedes ingresar el código manualmente.');return;}
 estado('📷 Solicitando permiso de cámara...');
 Quagga.init({
  inputStream:{type:'LiveStream',target:$('scanner'),constraints:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}},
  locator:{patchSize:'medium',halfSample:true},numOfWorkers:Math.min(navigator.hardwareConcurrency||2,4),frequency:10,
  decoder:{readers:['code_128_reader','ean_reader','ean_8_reader','upc_reader','upc_e_reader','code_39_reader','codabar_reader','2of5_reader']},locate:true
 },err=>{
  if(err){console.error(err);estado('⚠️ No se pudo abrir la cámara. Usa el código manual.');return;}
  Quagga.start();camaraActiva=true;estado('✅ Cámara activa. Apunta al código y pulsa el gatillo.');
  try{const track=Quagga.CameraAccess.getActiveTrack();track?.applyConstraints?.({advanced:[{focusMode:'continuous'}]}).catch(()=>{});}catch(_){ }
 });
 Quagga.onDetected(data=>{
  const codigo=String(data?.codeResult?.code||'').trim();if(!codigo)return;
  candidato=codigo;ultimoDetectado=Date.now();
  if(esperandoCodigo){esperandoCodigo=false;anadirCodigo(codigo);}
 });
}
window.addEventListener('DOMContentLoaded',()=>{
 pintar();sincronizarImagenes();$('gatillo').addEventListener('click',gatillo);
 $('pagarEscaneo').addEventListener('click',()=>{
  if(!lista.length){mensaje('⚠️ Escanea al menos un producto antes de pagar.');return;}
  const items=lista.map(p=>({codigo:p.codigo,nombre:p.nombre,precio:Number(p.precio),cantidad:Number(p.cantidad),imagen:p.imagen||''}));
  sessionStorage.setItem('maitePagoEscaneadoV1',JSON.stringify(items));
  window.location.href='pedidos.html?desde=escaner';
 });
 $('formularioManual').addEventListener('submit',e=>{e.preventDefault();anadirCodigo($('codigoManual').value,'manual');});
 $('vaciarEscaneo').addEventListener('click',()=>{if(lista.length && confirm('¿Vaciar todos los productos escaneados?')){lista.length=0;pintar();mensaje('Lista vaciada.');}});
 if(modoAdmin){$('seccionLista').hidden=true;estado('Escaneo de código para el administrador.');}
 if(typeof cargarProductosDesdeFirebase==='function')Promise.resolve(cargarProductosDesdeFirebase()).then(()=>sincronizarImagenes()).catch(e=>console.warn('Catálogo no disponible:',e));
 window.addEventListener('catalogo-offline-listo',sincronizarImagenes);
 iniciarCamara();
});
window.addEventListener('pagehide',()=>{if(camaraActiva && typeof Quagga!=='undefined'){try{Quagga.stop();}catch(_){}}});
})();
