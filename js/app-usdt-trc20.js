// Configuración de USDT en TRON (Mainnet)
const USDT_TRC20_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

let currentAccount = null;

// Esperar a que la billetera inyecte el proveedor
async function getTronWeb() {
    return new Promise((resolve) => {
        if (window.tronWeb && window.tronWeb.ready) {
            return resolve(window.tronWeb);
        }

        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(() => {
            attempts++;
            if (window.tronWeb && window.tronWeb.ready) {
                clearInterval(interval);
                resolve(window.tronWeb);
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                resolve(null);
            }
        }, 300); // Revisa cada 300ms por 3 segundos
    });
}

// Función principal de conexión
async function connectWallet() {
    try {
        // 1. Verificar si existe la extensión/proveedor TronLink u otra DApp wallet
        if (window.tronLink) {
            // Solicitar acceso a la billetera (Abre la ventana emergente)
            const res = await window.tronLink.request({ method: 'tron_requestAccounts' });
            
            if (res.code === 200 || res.code === 4001) {
                // Conexión aceptada o ya otorgada
                if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
                    currentAccount = window.tronWeb.defaultAddress.base58;
                    console.log("Wallet conectada:", currentAccount);
                    return currentAccount;
                }
            }
        }

        // 2. Fallback: Reintento por ventana de tiempo si la billetera tarda en responder
        const tronWeb = await getTronWeb();
        if (tronWeb && tronWeb.defaultAddress.base58) {
            currentAccount = tronWeb.defaultAddress.base58;
            console.log("Wallet conectada (TronWeb):", currentAccount);
            return currentAccount;
        }

        // 3. Si no hay proveedor detectado
        alert("No se detectó ninguna billetera TRON (TronLink, Trust Wallet, etc.). Por favor instala o abre la aplicación desde tu billetera.");
        return null;

    } catch (error) {
        console.error("Error al conectar la billetera:", error);
        return null;
    }
}

// Escuchar evento de clic en el botón de conexión
document.addEventListener('DOMContentLoaded', () => {
    const connectBtn = document.getElementById('sendBtn') || document.getElementById('connectBtn');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', async () => {
            const address = await connectWallet();
            if (address) {
                // Actualizar interfaz al conectar con éxito
                connectBtn.textContent = 'Siguiente';
            }
        });
    }
});
