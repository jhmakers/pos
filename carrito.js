// Carrito de compra de DETALLES MAITE. Los productos se mantienen durante la sesión.
(function () {
 'use strict';
 const CLAVE = 'maiteCarritoV1';
 const CLAVE_PAGO = 'maitePagoEscaneadoV1';
 const $ = id => document.getElementById(id);
 const dinero = valor => 'S/ ' + Number(valor || 0).toFixed(2);
 let items = [];
 try {
  const guardado = JSON.parse(sessionStorage.getItem(CLAVE) || '[]');
  if (Array.isArray(guardado)) items = guardado.filter(x => x && x.codigo && Number(x.cantidad) > 0);
  const anteriores = JSON.parse(sessionStorage.getItem('maiteEscaneoMultipleV1') || '[]');
  if(Array.isArray(anteriores) && anteriores.length){
   for(const p of anteriores){
    if(!p || !p.codigo || !(Number(p.cantidad)>0))continue;
    const existente=items.find(x=>String(x.codigo).trim().toUpperCase()===String(p.codigo).trim().toUpperCase());
    if(existente){existente.cantidad+=Number(p.cantidad);if(!existente.imagen&&p.imagen)existente.imagen=p.imagen;}
    else items.push({codigo:String(p.codigo),nombre:String(p.nombre||'Producto'),precio:Number(p.precio)||0,cantidad:Number(p.cantidad),imagen:String(p.imagen||'')});
   }
   sessionStorage.setItem(CLAVE,JSON.stringify(items));
   sessionStorage.removeItem('maiteEscaneoMultipleV1');
  }
 } catch (e) { console.warn('No se pudo recuperar la lista anterior:',e); }
 function guardar() {
  try { sessionStorage.setItem(CLAVE, JSON.stringify(items)); }
  catch (e) { console.warn('No se pudo conservar el carrito:', e); }
  renderizar();
 }
 function catalogo() {
  return (typeof productosVigentesFirebase !== 'undefined' && Array.isArray(productosVigentesFirebase) && productosVigentesFirebase.length ? productosVigentesFirebase : window.catalogoOfflineActual) || [];
 }
 function agregar(id) {
  const p = catalogo().find(x => String(x.id) === String(id));
  if (!p) { alert('No se encontró este producto en el catálogo. Actualiza la página e inténtalo nuevamente.'); return; }
  const codigo = String(p.codigo || p.id || '').trim();
  if (!codigo) { alert('Este producto no tiene código válido.'); return; }
  const existente = items.find(x => x.codigo === codigo);
  if (existente) existente.cantidad++;
  else items.push({nombre:String(p.nombre || 'Producto'), codigo, precio:Math.max(0, Number(p.precio) || 0), cantidad:1, imagen:String(p.imagen || '')});
  guardar();
  const boton = $('botonCarrito');
  if (boton) { boton.classList.remove('carrito-salto'); void boton.offsetWidth; boton.classList.add('carrito-salto'); }
 }
 function cambiar(codigo, cambio) {
  const item = items.find(x => x.codigo === codigo);
  if (!item) return;
  item.cantidad += cambio;
  if (item.cantidad <= 0) items = items.filter(x => x !== item);
  guardar();
 }
 function eliminar(codigo) { items = items.filter(x => x.codigo !== codigo); guardar(); }
 function abrir(abierto) {
  const panel = $('panelCarrito');
  if (!panel) return;
  const mostrar = typeof abierto === 'boolean' ? abierto : panel.hidden;
  panel.hidden = !mostrar;
  $('botonCarrito')?.setAttribute('aria-expanded', String(mostrar));
  if (mostrar) $('cerrarCarrito')?.focus();
 }
 function pagar() {
  if (!items.length) { alert('Agrega al menos un producto al carrito.'); return; }
  try { sessionStorage.setItem(CLAVE_PAGO, JSON.stringify(items)); }
  catch (_) { alert('No hay espacio suficiente para preparar la compra.'); return; }
  location.href = 'pedidos.html?desde=escaner';
 }
 function renderizar() {
  const cantidad = items.reduce((s,p) => s + p.cantidad, 0);
  const total = items.reduce((s,p) => s + p.cantidad * p.precio, 0);
  if ($('cantidadCarrito')) $('cantidadCarrito').textContent = String(cantidad);
  if ($('totalCarrito')) $('totalCarrito').textContent = dinero(total);
  if ($('irPagarCarrito')) $('irPagarCarrito').disabled = !items.length;
  const cont = $('listaCarrito');
  if (!cont) return;
  cont.replaceChildren();
  if (!items.length) {
   const vacio = document.createElement('p'); vacio.className='carrito-vacio'; vacio.textContent='Tu carrito está vacío. Pulsa PEDIR en un producto para agregarlo.'; cont.append(vacio); return;
  }
  items.forEach(p => {
   const fila = document.createElement('div'); fila.className='carrito-fila';
   const img = document.createElement('img'); img.alt=p.nombre; img.loading='lazy'; img.className='carrito-img';
   const src = String(p.imagen || '');
   if (/^(https?:\/\/|data:image\/(?:png|jpeg|webp|gif|svg\+xml);base64,|\.?\.?\/)/i.test(src)) img.src=src;
   else { img.removeAttribute('src'); img.alt='Sin imagen'; }
   const datos = document.createElement('div'); datos.className='carrito-datos';
   const nombre = document.createElement('strong'); nombre.textContent=p.nombre;
   const precio = document.createElement('span'); precio.textContent=dinero(p.precio)+' c/u';
   const subtotal = document.createElement('span'); subtotal.textContent='Subtotal: '+dinero(p.cantidad*p.precio);
   const controles = document.createElement('div'); controles.className='carrito-cantidad';
   const menos = document.createElement('button'); menos.type='button'; menos.textContent='−'; menos.setAttribute('aria-label','Quitar una unidad de '+p.nombre); menos.onclick=()=>cambiar(p.codigo,-1);
   const n = document.createElement('span'); n.textContent=String(p.cantidad);
   const mas = document.createElement('button'); mas.type='button'; mas.textContent='+'; mas.setAttribute('aria-label','Agregar una unidad de '+p.nombre); mas.onclick=()=>cambiar(p.codigo,1);
   const quitar = document.createElement('button'); quitar.type='button'; quitar.className='carrito-quitar'; quitar.textContent='Eliminar'; quitar.onclick=()=>eliminar(p.codigo);
   controles.append(menos,n,mas,quitar); datos.append(nombre,precio,subtotal,controles); fila.append(img,datos); cont.append(fila);
  });
 }
 window.agregarAlCarrito = agregar;
 window.toggleCarrito = abrir;
 window.irAPagarCarrito = pagar;
 document.addEventListener('DOMContentLoaded', () => {
  $('botonCarrito')?.addEventListener('click', () => abrir());
  $('cerrarCarrito')?.addEventListener('click', () => abrir(false));
  $('irPagarCarrito')?.addEventListener('click', pagar);
  $('irEscanerCarrito')?.addEventListener('click', () => { location.href = 'scanner.html'; });
  renderizar();
 });
})();
