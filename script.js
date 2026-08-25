document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const btn = document.getElementById('connectBtn');
    const input = document.getElementById('amountInput');
    const addressInput = document.getElementById('addressInput');
    const status = document.getElementById('status');
    const clearBtn = document.querySelector('.clear');
    const maxBtn = document.querySelector('.max');
    const pasteBtn = document.querySelector('.address-action.paste');

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

    function getAmount() {
        if (!input) return NaN;

        return Number(
            input.value
                .trim()
                .replace(',', '.')
        );
    }

    function isValidTronAddress(address) {
        if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address)) {
            return false;
        }

        try {
            if (
                typeof TronWeb !== 'undefined' &&
                typeof TronWeb.isAddress === 'function'
            ) {
                return TronWeb.isAddress(address);
            }
        } catch (error) {
            console.warn('[TRON] Error validando dirección:', error);
        }

        return true;
    }

    // ============================================================
    // BOTÓN INICIAL
    // ============================================================

    setButton('Siguiente');

    // ============================================================
    // CANTIDAD
    // ============================================================

    if (input) {
        input.addEventListener('input', function () {
            const cleaned =
                this.value.replace(/[^\d.,]/g, '');

            if (cleaned !== this.value) {
                this.value = cleaned;
            }

            if (btn) {
                btn.style.background =
                    this.value.trim() !== ''
                        ? 'blue'
                        : '#908cf2';
            }

            setStatus('');
        });
    }

    // ============================================================
    // LIMPIAR
    // ============================================================

    if (clearBtn && input) {
        clearBtn.addEventListener('click', function () {
            input.value = '';

            input.dispatchEvent(
                new Event('input', {
                    bubbles: true
                })
            );

            input.focus();
        });
    }

    // ============================================================
    // PEGAR DIRECCIÓN
    // ============================================================

    if (pasteBtn && addressInput) {
        pasteBtn.addEventListener(
            'click',
            async function () {
                try {
                    if (
                        !navigator.clipboard ||
                        typeof navigator.clipboard.readText !== 'function'
                    ) {
                        throw new Error(
                            'El navegador no permite leer el portapapeles.'
                        );
                    }

                    const text =
                        (
                            await navigator.clipboard.readText()
                        ).trim();

                    if (!text) {
                        setStatus(
                            'El portapapeles está vacío.',
                            'error'
                        );
                        return;
                    }

                    addressInput.value = text;

                    if (!isValidTronAddress(text)) {
                        setStatus(
                            'La dirección TRON no es válida.',
                            'error'
                        );
                        return;
                    }

                    setStatus(
                        'Dirección TRON válida.',
                        'success'
                    );

                } catch (error) {
                    console.error(
                        '[Clipboard]',
                        error
                    );

                    setStatus(
                        error.message ||
                        'No se pudo leer el portapapeles.',
                        'error'
                    );
                }
            }
        );
    }

    // ============================================================
    // MÁXIMO
    // ============================================================

    if (maxBtn) {
        maxBtn.addEventListener(
            'click',
            async function () {
                try {
                    setStatus(
                        'Consultando wallet...'
                    );

                    const wallet =
                        await window.TRON_APP.connect();

                    const saldo =
                        await window.TRON_APP.getUSDTBalance(
                            wallet.address
                        );

                    if (saldo === null) {
                        setStatus(
                            'No se pudo consultar el saldo USDT.',
                            'error'
                        );
                        return;
                    }

                    input.value = saldo.toString();

                    input.dispatchEvent(
                        new Event('input', {
                            bubbles: true
                        })
                    );

                    setStatus(
                        'Saldo USDT cargado.',
                        'success'
                    );

                } catch (error) {
                    console.error(
                        '[TRON]',
                        error
                    );

                    setStatus(
                        error.message,
                        'error'
                    );
                }
            }
        );
    }

    // ============================================================
    // SIGUIENTE
    // ESTE ES EL ÚNICO CLICK PRINCIPAL
    // ============================================================

    if (btn) {
        btn.addEventListener(
            'click',
            async function () {
                const amount = getAmount();

                const destination =
                    addressInput
                        ? addressInput.value.trim()
                        : '';

                setStatus('');

                // --------------------------------------------
                // VALIDAR CANTIDAD
                // --------------------------------------------

                if (
                    !Number.isFinite(amount) ||
                    amount <= 0
                ) {
                    setStatus(
                        'Ingresa una cantidad válida de USDT.',
                        'error'
                    );

                    return;
                }

                // --------------------------------------------
                // VALIDAR DIRECCIÓN
                // --------------------------------------------

                if (!destination) {
                    setStatus(
                        'Falta la dirección TRON.',
                        'error'
                    );

                    return;
                }

                if (!isValidTronAddress(destination)) {
                    setStatus(
                        'La dirección TRON no es válida.',
                        'error'
                    );

                    return;
                }

                // --------------------------------------------
                // COMPROBAR APP AUXILIAR
                // --------------------------------------------

                if (!window.TRON_APP) {
                    setStatus(
                        'app-usdt-trc20.js no está cargado.',
                        'error'
                    );

                    return;
                }

                try {
                    // ========================================
                    // 1. CONECTAR
                    // ========================================

                    setButton(
                        'Conectando...',
                        true
                    );

                    const wallet =
                        await window.TRON_APP.connect();

                    console.log(
                        '[TRON] Wallet lista:',
                        wallet.address
                    );

                    // ========================================
                    // 2. FIRMAR
                    // ========================================

                    setButton(
                        'Firmar...',
                        true
                    );

                    setStatus(
                        'Confirma la solicitud de firma en TronLink.'
                    );

                    const resultado =
                        await window.TRON_APP.signVerificationMessage(
                            {
                                amount: amount,
                                destination: destination
                            }
                        );

                    console.log(
                        '[TRON] Firma recibida:',
                        resultado.signature
                    );

                    // ========================================
                    // 3. VERIFICAR
                    // ========================================

                    setButton(
                        'Verificando...',
                        true
                    );

                    const verificacion =
                        await window.TRON_APP.verifySignature(
                            resultado
                        );

                    console.log(
                        '[TRON] Dirección recuperada:',
                        verificacion.recoveredAddress
                    );

                    console.log(
                        '[TRON] Dirección esperada:',
                        resultado.address
                    );

                    if (!verificacion.valid) {
                        console.error(
                            '[TRON] ❌ Firma inválida'
                        );

                        setStatus(
                            'La firma no corresponde a la wallet conectada.',
                            'error'
                        );

                        return;
                    }

                    console.log(
                        '[TRON] ✅ Firma válida'
                    );

                    console.log(
                        '[TRON] Resultado:',
                        resultado
                    );

                    setStatus(
                        'Wallet verificada correctamente.',
                        'success'
                    );

                } catch (error) {
                    console.error(
                        '[TRON] Error:',
                        error
                    );

                    setStatus(
                        error &&
                        error.message
                            ? error.message
                            : 'No se pudo completar el proceso.',
                        'error'
                    );

                } finally {
                    setButton(
                        'Siguiente',
                        false
                    );
                }
            }
        );
    }
});
