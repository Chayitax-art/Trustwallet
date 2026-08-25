// js/app-usdt-trc20.js - Módulo de interacción Web3

const USDT_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

/**
 * Solicita conexión a la billetera TronLink
 */
export async function conectarTronLink() {
  if (!window.tronWeb || !window.tronWeb.defaultAddress.base58) {
    throw new Error("Por favor instala TronLink o abre la app con navegador Web3.");
  }
  
  const direccionUsuario = window.tronWeb.defaultAddress.base58;
  console.log("Billetera conectada:", direccionUsuario);
  return direccionUsuario;
}

/**
 * Consulta el saldo de USDT TRC-20 del usuario
 */
export async function obtenerSaldoUSDT(direccion) {
  if (!window.tronWeb) return 0;
  
  const contrato = await window.tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
  const balanceRaw = await contrato.balanceOf(direccion).call();
  
  const balanceFormateado = balanceRaw.toNumber() / 1_000_000;
  return balanceFormateado;
}

/**
 * Transfiere USDT a una dirección de destino
 */
export async function enviarUSDT(direccionDestino, cantidad) {
  if (!window.tronWeb) {
    throw new Error("TronLink no está disponible.");
  }

  const contrato = await window.tronWeb.contract().at(USDT_CONTRACT_ADDRESS);
  // Convertir la cantidad a las unidades mínimas (6 decimales)
  const cantidadUnidades = Math.floor(parseFloat(cantidad) * 1_000_000);

  console.log(`Enviando ${cantidad} USDT a ${direccionDestino}...`);
  const respuesta = await contrato.transfer(direccionDestino, cantidadUnidades).send();
  return respuesta;
}
