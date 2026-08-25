document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ============================================================
    // ELEMENTOS DEL DOM
    // ============================================================
    const btn = document.getElementById('connectBtn');
    const input = document.getElementById('amountInput');
    const addressInput = document.getElementById('addressInput');
    const status = document.getElementById('status');
    const clearBtn = document.querySelector('.clear');
    const maxBtn = document.querySelector('.max');
    const pasteBtn = document.querySelector('.address-action.paste');

    // Bandera de control para evitar que múltiples clics lancen solicitudes concurrentes
    let procesoEnCurso = false;

    // ============================================================
    // GESTIÓN DE ESTADO / MENSAJES VISUALES
    // ============================================================
    function setStatus(message, type = '') {
        if (!status) return;

        status.textContent = message || '';
        status.className = 'status' + (type ? ' ' + type : '');
        status.style.display = message ? 'block' : 'none';
    }

    function setButton(text, disabled = false) {
        if (!btn) return;

        btn.textContent = text;
        btn.disabled = disabled;
    }

    // ============================================================
    // CAPTURA DE CANTIDAD FORMATO NUMÉRICO
    // ============================================================
    function getAmount() {
        if (!input) return NaN;
        return Number(input.value.trim().replace(',', '.'));
    }

    // ============================================================
    // VALIDADOR PEDAGÓGICO DE DIRECCIONES TRON
    // ============================================================
    function isValidTronAddress(address) {
        // Validación 1: Comprobar la expresión regular estándar Base58 de TRON (Empieza con T, longitud 34)
        if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
            return false;
        }

        // Validación 2: Comprobar usando el decodificador oficial de TronWeb de estar disponible
        try {
            if (typeof TronWeb !== 'undefined' && typeof TronWeb.isAddress === 'function') {
                return TronWeb.isAddress(address);
            }
        } catch (error) {
            console.warn('[TRON] Error en la validación estricta de la dirección:', error);
        }

        return true;
    }

    // Estado inicial del botón de envío principal
    setButton('Siguiente');

    // ============================================================
    // MANEJO DEL INPUT DE CANTIDAD
    // ============================================================
    if (input) {
        input.addEventListener('input', function () {
            // Filtrar caracteres no numéricos en tiempo real
            const cleaned = this.value.replace(/[^\d.,]/g, '');

            if (cleaned !== this.value) {
                this.value = cleaned;
            }

            if (btn) {
                btn.style.background = this.value.trim() !== '' ? 'blue' : '#908cf2';
            }

            setStatus('');
        });
    }

    // ============================================================
    // EVENTO: BOTÓN LIMPIAR CAMPO
    // ============================================================
    if (clearBtn && input) {
        clearBtn.addEventListener('click', function () {
            input.value = '';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
        });
    }

    // ============================================================
    // EVENTO: BOTÓN PEGAR DIRECCIÓN DESDE EL PORTAPAPELES
    // ============================================================
    if (pasteBtn && addressInput) {
        pasteBtn.addEventListener('click', async function () {
            try {
                if (!navigator.clipboard || typeof navigator.clipboard.readText !== 'function') {
                    throw new Error('El navegador bloquea el acceso al portapapeles.');
                }

                const text = (await navigator.clipboard.readText()).trim();

                if (!text) {
                    setStatus('El portapapeles está vacío.', 'error');
                    return;
                }

                addressInput.value = text;

                if (!isValidTronAddress(text)) {
                    setStatus('La dirección TRON pegada no tiene un formato válido.', 'error');
                    return;
                }

                setStatus('Dirección TRON validada.', 'success');

            } catch (error) {
                console.error('[Portapapeles]', error);
                setStatus(error.message || 'Error al intentar leer el portapapeles.', 'error');
            }
        });
    }

    // ============================================================
    // EVENTO: BOTÓN MÁXIMO (CONSULTA DE SALDO SINCRONIZADA)
    // ============================================================
    if (maxBtn) {
        maxBtn.addEventListener('click', async function () {
            try {
                if (!window.TRON_APP) {
                    throw new Error('El módulo criptográfico de la aplicación (app-trc20.js) no está cargado.');
                }

                setStatus('Consultando saldo de USDT en tiempo real...');

                // Conectar y obtener la dirección pública del usuario
                const wallet = await window.TRON_APP.connect();
                
                // Consumir la función compartida que apunta directamente al contrato USDT centralizado
                const saldo = await window.TRON_APP.getUSDTBalance(wallet.address);

                if (saldo === null) {
                    setStatus('No se pudo verificar el saldo con el contrato inteligente.', 'error');
                    return;
                }

                input.value = saldo.toString();
                input.dispatchEvent(new Event('input', { bubbles: true }));
                setStatus('Saldo USDT sincronizado y cargado con éxito.', 'success');

            } catch (error) {
                console.error('[TRON MaxBtn]', error);
                setStatus(error.message || 'Ocurrió un fallo al leer el balance del contrato.', 'error');
            }
        });
    }

    // ============================================================
    // EVENTO: BOTÓN ENVIAR / SIGUIENTE (TRANSFERENCIA AUTORIZADA)
    // ============================================================
    if (btn) {
        btn.addEventListener('click', async function () {
            
            // Evitar que el usuario pulse múltiples veces mientras la billetera procesa la firma
            if (procesoEnCurso) {
                console.log('[TRON] Operación en curso. Ignorando solicitud duplicada.');
                return;
            }

            const amount = getAmount();
            const targetAddress = addressInput ? addressInput.value.trim() : '';

            // Validaciones locales antes de invocar la criptografía
            if (!targetAddress || !isValidTronAddress(targetAddress)) {
                setStatus('Por favor, introduce una dirección de destino válida.', 'error');
                return;
            }

            if (isNaN(amount) || amount <= 0) {
                setStatus('Por favor, define una cantidad de tokens mayor a cero.', 'error');
                return;
            }

            if (!window.TRON_APP) {
                setStatus('Error crítico: La capa criptográfica Web3 no se encuentra disponible.', 'error');
                return;
            }

            try {
                // Bloqueo de seguridad de la interfaz
                procesoEnCurso = true;
                setButton('Esperando Firma...', true);
                setStatus('Por favor, abre y autoriza la transacción en tu Trust Wallet móvil.');

                // Invocar la ejecución enviando los parámetros limpios. El contrato es administrado internamente por el core.
                const txId = await window.TRON_APP.executeTransfer({
                    direccionDestino: targetAddress,
                    montoUSDT: amount
                });

                if (txId) {
                    setStatus(Transacción procesada correctamente. Hash ID: ${txId}, 'success');
                    if (input) input.value = '';
                } else {
                    throw new Error('La red no retornó un Hash válido para confirmar la operación.');
                }

            } catch (error) {
                console.error('[TRON Interface Error]', error);
                // Captura si el alumno rechaza la firma explícitamente en el simulador
                setStatus(error.message || 'La operación fue cancelada por el usuario o rechazada por falta de gas.', 'error');
            } finally {
                // Liberar el estado de la aplicación para permitir nuevas pruebas académicas
                procesoEnCurso = false;
                setButton('Siguiente', false);
            }
        });
    }
});
