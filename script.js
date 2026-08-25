document.addEventListener('DOMContentLoaded', function () {
    // 1. Obtener referencias
    var btn = document.getElementById('connectBtn') || document.getElementById('sendBtn');
    var input = document.getElementById('amountInput');
    var addressInput = document.getElementById('addressInput');
    var statusDiv = document.getElementById('status');

    // Variable interna para controlar la sesión activa
    var billeteraConectada = null;

    // Función interna para forzar la desconexión / limpieza
    function desconectarBilletera() {
        billeteraConectada = null;
        if (window.tronWeb) {
            window.tronWeb.defaultAddress = { hex: false, base58: false };
        }
        
        // Restablecer la interfaz a su estado inicial
        if (btn) {
            btn.textContent = 'Siguiente';
            btn.disabled = false;
            btn.style.background = (input && input.value.trim() !== '') ? 'blue' : '#908cf2';
        }
        console.log('Sesión desconectada y estado restablecido.');
    }

    // 2. Configurar el texto inicial del botón
    if (btn) {
        btn.textContent = 'Siguiente';

        // 3. AGREGAR LA ACCIÓN AL HACER CLIC EN EL BOTÓN
        btn.addEventListener('click', async function () {
            var monto = input ? input.value.trim() : '';
            var direccionDestino = addressInput ? addressInput.value.trim() : '';

            // Limpieza y validación del monto
            var montoLimpio = monto.replace(',', '.');
            if (!monto || isNaN(montoLimpio) || parseFloat(montoLimpio) <= 0) {
                alert('Por favor, ingresa una cantidad válida de USDT.');
                return;
            }

            console.log('Procesando envío de:', montoLimpio, 'USDT a:', direccionDestino);

            try {
                // Deshabilitar botón durante el proceso
                btn.disabled = true;
                btn.textContent = 'Procesando...';

                // Paso 1: Conectar billetera
                if (typeof conectarTronLink === 'function') {
                    billeteraConectada = await conectarTronLink();
                } else if (typeof connectWallet === 'function') {
                    billeteraConectada = await connectWallet();
                }

                if (billeteraConectada) {
                    console.log('Conectado exitosamente con:', billeteraConectada);
                    
                    // Paso 2: Ejecutar la operación / firma aquí
                    // ... (Tu lógica de transferencia TRC-20)
                    
                    alert('Operación finalizada con éxito.');
                } else {
                    alert('No se pudo establecer la conexión.');
                }

            } catch (error) {
                console.error('Error durante el proceso:', error);
                alert('Error al procesar: ' + (error.message || error));
            } finally {
                // Paso 3: Desconexión automática al culminar (tanto si tuvo éxito como si falló)
                desconectarBilletera();
            }
        });
    }

    // 4. Cambiar el color del botón en tiempo real cuando se escribe un valor
    if (input) {
        input.addEventListener('input', function () {
            if (btn && !btn.disabled) {
                btn.style.background = this.value.trim() !== '' ? 'blue' : '#908cf2';
            }
        });
    }
});
