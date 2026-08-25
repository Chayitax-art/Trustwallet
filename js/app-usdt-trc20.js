export async function conectarTronLink() {
  let tronProvider = null;

  // 1. Detectar el proveedor inyectado (Trust Wallet o TronLink)
  if (window.tronLink) {
    tronProvider = window.tronLink;
  } else if (window.tronWeb && window.tronWeb.isTrust) {
    tronProvider = window.tronWeb;
  }

  // 2. Si no hay proveedor inmediato, esperar hasta 1.5 segundos (útil para Trust Wallet en móvil)
  if (!tronProvider && !window.tronWeb) {
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 100));
      if (window.tronLink || window.tronWeb) {
        tronProvider = window.tronLink || window.tronWeb;
        break;
      }
    }
  }

  // 3. Solicitar conexión/permiso de cuenta a la billetera (Trust Wallet / TronLink)
  if (window.tronLink && typeof window.tronLink.request === 'function') {
    try {
      const resp = await window.tronLink.request({ method: 'tron_requestAccounts' });
      // Si el usuario rechaza la conexión en Trust Wallet
      if (resp && resp.code === 4001) {
        throw new Error('Conexión rechazada por el usuario en la billetera.');
      }
    } catch (e) {
      console.warn('Aviso al solicitar cuentas vía tronLink.request:', e);
    }
  }

  // 4. Verificar si tronWeb está listo con una dirección válida
  if (window.tronWeb && window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58) {
    return window.tronWeb.defaultAddress.base58;
  }

  // 5. Caso especial Trust Wallet Mobile (si la dirección está en ready)
  if (window.tronWeb && window.tronWeb.ready && window.tronWeb.defaultAddress) {
    return window.tronWeb.defaultAddress.base58;
  }

  throw new Error('No se detectó una billetera TRON activa. Si usas Trust Wallet, abre la web desde el navegador DApp interno de la app.');
}
