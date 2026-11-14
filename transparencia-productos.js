// Editor de transparencia: elimina solo las zonas similares conectadas al punto elegido.
// La imagen definitiva se guarda únicamente al crear/actualizar el producto.
(() => {
  let original = null;
  let vista = null;
  let punto = null;
  const $ = id => document.getElementById(id);
  const informar = mensaje => { if ($('estadoTransparencia')) $('estadoTransparencia').textContent = mensaje; };

  function dibujar(datos) {
    const canvas = $('lienzoTransparencia');
    if (!canvas) return;
    const ctx = canvas.getContext('2d', {willReadFrequently:true});
    ctx.putImageData(datos, 0, 0);
  }

  window.abrirEditorTransparencia = async function() {
    const origen = (typeof imagenProducto !== 'undefined' ? imagenProducto : '') || $('productoVista')?.getAttribute('src');
    if (!origen) { alert('Primero selecciona una imagen o pulsa Editar en un producto registrado.'); return; }
    const img = new Image();
    // Evita usar píxeles remotos sin autorización CORS.
    if (/^https?:/i.test(origen)) img.crossOrigin = 'anonymous';
    try {
      await new Promise((resolve,reject) => {
        img.onload = resolve; img.onerror = reject; img.src = origen;
      });
      const canvas = $('lienzoTransparencia');
      const escala = Math.min(450 / img.naturalWidth, 450 / img.naturalHeight, 1);
      canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
      const ctx = canvas.getContext('2d', {willReadFrequently:true});
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      original = ctx.getImageData(0,0,canvas.width,canvas.height);
      vista = null;
      punto = [0,0];
      $('herramientasTransparencia').hidden = false;
      $('toleranciaTransparencia').value = '40';
      $('valorToleranciaTransparencia').textContent = '40';
      canvas.onclick = evento => {
        const rect = canvas.getBoundingClientRect();
        punto = [Math.min(canvas.width-1,Math.max(0,Math.floor((evento.clientX-rect.left) * canvas.width/rect.width))),
                 Math.min(canvas.height-1,Math.max(0,Math.floor((evento.clientY-rect.top) * canvas.height/rect.height)))];
        window.cambiarToleranciaTransparencia();
      };
      window.cambiarToleranciaTransparencia();
    } catch (e) {
      console.error('Error al leer la imagen para quitar fondo:',e);
      alert('No se pudo procesar la imagen actual. Si está alojada en otro servidor sin permiso CORS, vuelve a subirla desde tu dispositivo.');
    }
  };

  function quitarFondo(base, x, y, tolerancia) {
    const {width:w,height:h,data:pix} = base;
    const out = new ImageData(new Uint8ClampedArray(pix),w,h);
    const start = (y*w+x)*4;
    const r=pix[start],g=pix[start+1],b=pix[start+2];
    const umbral = tolerancia*tolerancia*3;
    const visitados=new Uint8Array(w*h);
    const cola=new Int32Array(w*h);
    let primero=0,ultimo=0;
    const agregar=(idx)=>{
      if(idx<0||idx>=w*h||visitados[idx])return;
      visitados[idx]=1;
      const off=idx*4,dr=pix[off]-r,dg=pix[off+1]-g,db=pix[off+2]-b;
      if(dr*dr+dg*dg+db*db<=umbral){cola[ultimo++]=idx;out.data[off+3]=0;}
    };
    agregar(y*w+x);
    while(primero<ultimo){
      const idx=cola[primero++],px=idx%w,py=(idx/w)|0;
      if(px>0) agregar(idx-1);
      if(px<w-1) agregar(idx+1);
      if(py>0) agregar(idx-w);
      if(py<h-1) agregar(idx+w);
    }
    return {image:out,removed:ultimo};
  }

  window.cambiarToleranciaTransparencia = function(){
    if(!original||!punto)return;
    const t=Number($('toleranciaTransparencia').value);
    $('valorToleranciaTransparencia').textContent = String(t);
    const resultado=quitarFondo(original,punto[0],punto[1],t);
    vista=resultado.image;
    dibujar(vista);
    informar(resultado.removed ? `${resultado.removed} píxeles del fondo retirados. Si se ve bien, usa esta imagen.` : 'No se detectó un fondo similar. Toca un punto del fondo.');
  };

  window.aplicarTransparenciaProducto = function(){
    if(!vista)return;
    const canvas=$('lienzoTransparencia');
    const png=canvas.toDataURL('image/png');
    // Firestore limita el tamaño de documentos; evita una conversión silenciosa fallida.
    if(png.length>850000){
      alert('La imagen PNG es demasiado grande para guardarla. Usa una fotografía más pequeña o recórtala antes de subirla.');
      return;
    }
    imagenProducto=png;
    $('productoVista').src=png;
    informar('Imagen transparente aplicada. Pulsa CREAR PRODUCTO o GUARDAR CAMBIOS para conservarla.');
    $('herramientasTransparencia').hidden=true;
    original=null;vista=null;punto=null;
  };

  window.cancelarTransparenciaProducto = function(){
    $('herramientasTransparencia').hidden=true;
    original=null;vista=null;punto=null;
  };

  // Cierra la edición anterior al elegir otra foto o producto.
  $('productoInput')?.addEventListener('change',window.cancelarTransparenciaProducto);
  document.querySelector('#listaProductos')?.addEventListener('click',e=>{
    if(e.target.closest('button[onclick^="editarProducto"]'))window.cancelarTransparenciaProducto();
  });
})();
