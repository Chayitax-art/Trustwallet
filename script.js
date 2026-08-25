document.addEventListener('DOMContentLoaded', function () {
    // Referencias a elementos del DOM
    const amountInput = document.getElementById('amountInput');
    const addressInput = document.getElementById('addressInput');
    const sendBtn = document.getElementById('sendBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const maxBtn = document.getElementById('maxBtn');
    const statusDiv = document.getElementById('status');

    // 1. Activar / Desactivar estado del botón según el input de cantidad
    if (amountInput) {
        amountInput.addEventListener('input', function () {
            if (this.value.trim() !== '') {
                sendBtn.classList.add('active');
            } else {
                sendBtn.classList.remove('active');
            }
        });
    }

    // 2. Funcionalidad del botón Pegar
    if (pasteBtn && addressInput) {
        pasteBtn.addEventListener('click', async function () {
            try {
                const text = await navigator.clipboard.readText();
                addressInput.value = text;
            } catch (err) {
                console.error('Error al acceder al portapapeles:', err);
            }
        });
    }

    // 3. Funcionalidad del botón Máx.
    if (maxBtn && amountInput) {
        maxBtn.addEventListener('click', function () {
            // Asigna un valor de ejemplo o la totalidad del saldo si está disponible
            amountInput.value = '100'; 
            amountInput.dispatchEvent(new Event('input'));
        });
    }

    // 4. Manejo del clic en el botón principal para conectar / enviar
    if (sendBtn) {
        sendBtn.addEventListener('click', async function () {
            // Muestra mensaje de estado
            if (statusDiv) {
                statusDiv.textContent = 'Conectando billetera...';
                statusDiv.classList.add('active');
            }

            // Llamada a la función global de conexión (definida en app-usdt-trc20.js)
            if (typeof connectWallet === 'function') {
                const walletAddress = await connectWallet();

                if (walletAddress) {
                    sendBtn.textContent = 'Siguiente';
                    if (statusDiv) {
                        statusDiv.textContent = 'Billetera conectada: ' + walletAddress;
                        statusDiv.classList.add('success');
                    }
                } else {
                    if (statusDiv) {
                        statusDiv.textContent = 'No se pudo conectar la billetera. Verifica TronLink.';
                        statusDiv.classList.add('error');
                    }
                }
            } else {
                console.error('La función connectWallet no está definida. Revisa app-usdt-trc20.js');
            }
        });
    }
});
