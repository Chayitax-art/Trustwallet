document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    // ============================================================
    // ELEMENTOS
    // ============================================================

    const btn = document.getElementById('connectBtn');
    const input = document.getElementById('amountInput');
    const addressInput = document.getElementById('addressInput');
    const status = document.getElementById('status');
    const clearBtn = document.querySelector('.clear');
    const maxBtn = document.querySelector('.max');
    const pasteBtn = document.querySelector('.address-action.paste');

    let connectedAddress = null;
    let tronWebInstance = null;


    // ============================================================
    // ESTADO / MENSAJES
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
    // CANTIDAD
    // ============================================================

    function getAmount() {
        if (!input) return NaN;

        const normalized = input.value
            .trim()
            .replace(',', '.');

        return Number(normalized);
    }


    // ============================================================
    // VALIDAR DIRECCIÓN TRON
    // ============================================================

    function basicTronAddressCheck(address) {
        return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
    }


    function isValidTronAddress(address) {

        if (!basicTronAddressCheck(address)) {
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

            console.warn(
                '[TRON] No se pudo validar con TronWeb:',
                error
            );
        }

        return true;
    }


    // ============================================================
    // CONECTAR TRONLINK
    // ============================================================

    async function conectarTronLink() {

        if (!window.tronLink && !window.tronWeb) {
            throw new Error(
                'TronLink no está disponible.'
            );
        }

        if (
            window.tronLink &&
            typeof window.tronLink.request === 'function'
        ) {

            console.log(
                '[TRON] Solicitando acceso a TronLink...'
            );

            const response =
                await window.tronLink.request({
                    method: 'tron_requestAccounts'
                });

            console.log(
                '[TRON] Respuesta de conexión:',
                response
            );

            if (
                response &&
                response.code &&
                response.code !== 200
            ) {
                throw new Error(
                    response.message ||
                    'La conexión con TronLink fue rechazada.'
                );
            }
        }


        if (!window.tronWeb) {
            throw new Error(
                'TronWeb no está disponible.'
            );
        }


        const address =
            window.tronWeb.defaultAddress &&
            window.tronWeb.defaultAddress.base58
                ? window.tronWeb.defaultAddress.base58
                : '';


        if (!address) {
            throw new Error(
                'No hay ninguna wallet conectada.'
            );
        }


        tronWebInstance = window.tronWeb;
        connectedAddress = address;


        console.log(
            '[TRON] Wallet obtenida:',
            connectedAddress
        );


        return {
            address: connectedAddress,
            tronWeb: tronWebInstance
        };
    }


    // ============================================================
    // ASEGURAR CONEXIÓN
    // ============================================================

    async function ensureWalletConnected() {

        return await conectarTronLink();
    }


    // ============================================================
    // FIRMAR MENSAJE
    // ============================================================

    async function firmarMensajeConTronLink(
        amount,
        destination
    ) {

        if (!window.tronWeb) {
            throw new Error(
                'TronLink no está disponible.'
            );
        }


        const walletAddress =
            window.tronWeb.defaultAddress &&
            window.tronWeb.defaultAddress.base58
                ? window.tronWeb.defaultAddress.base58
                : '';


        if (!walletAddress) {
            throw new Error(
                'No hay una wallet conectada.'
            );
        }


        const mensaje =
            'Confirmación de wallet\n\n' +
            'Wallet: ' + walletAddress +
            '\nRed: TRON' +
            '\nCantidad indicada: ' + amount + ' USDT' +
            '\nDirección indicada: ' + destination +
            '\nFecha: ' + new Date().toISOString();


        console.log(
            '[TRON] Mensaje a firmar:',
            mensaje
        );


        if (
            !window.tronWeb.trx ||
            typeof window.tronWeb.trx.signMessageV2 !== 'function'
        ) {
            throw new Error(
                'signMessageV2 no está disponible.'
            );
        }


        const firma =
            await window.tronWeb.trx.signMessageV2(
                mensaje
            );


        if (!firma) {
            throw new Error(
                'No se recibió ninguna firma.'
            );
        }


        console.log(
            '[TRON] Firma recibida:',
            firma
        );


        return {
            address: walletAddress,
            message: mensaje,
            signature: firma
        };
    }


    // ============================================================
    // VERIFICAR FIRMA
    // ============================================================

    async function verificarFirmaTron(
        message,
        signature,
        expectedAddress
    ) {

        try {

            if (
                !window.tronWeb ||
                !window.tronWeb.trx ||
                typeof window.tronWeb.trx.verifyMessageV2 !== 'function'
            ) {

                console.warn(
                    '[TRON] verifyMessageV2 no está disponible.'
                );

                return false;
            }


            const recoveredAddress =
                await window.tronWeb.trx.verifyMessageV2(
                    message,
                    signature
                );


            console.log(
                '[TRON] Dirección recuperada:',
                recoveredAddress
            );


            console.log(
                '[TRON] Dirección esperada:',
                expectedAddress
            );


            return (
                recoveredAddress ===
                expectedAddress
            );

        } catch (error) {

            console.error(
                '[TRON] Error verificando firma:',
                error
            );

            return false;
        }
    }


    // ============================================================
    // BOTÓN INICIAL
    // ============================================================

    if (btn) {
        setButton('Siguiente');
    }


    // ============================================================
    // INPUT CANTIDAD
    // ============================================================

    if (input) {

        input.addEventListener(
            'input',
            function () {

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
            }
        );
    }


    // ============================================================
    // BOTÓN LIMPIAR
    // ============================================================

    if (clearBtn && input) {

        clearBtn.addEventListener(
            'click',
            function () {

                input.value = '';

                input.dispatchEvent(
                    new Event(
                        'input',
                        {
                            bubbles: true
                        }
                    )
                );

                input.focus();
            }
        );
    }


    // ============================================================
    // BOTÓN PEGAR
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
    // BOTÓN MÁX.
    // ============================================================

    if (maxBtn) {

        maxBtn.addEventListener(
            'click',
            function () {

                setStatus(
                    'La función Máx. todavía no consulta el saldo USDT.',
                    'error'
                );
            }
        );
    }


    // ============================================================
    // BOTÓN SIGUIENTE
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


                // ------------------------------------------------
                // VALIDAR CANTIDAD
                // ------------------------------------------------

                if (
                    !Number.isFinite(amount) ||
                    amount <= 0
                ) {

                    setStatus(
                        'Ingresa una cantidad válida de USDT.',
                        'error'
                    );

                    if (input) {
                        input.focus();
                    }

                    return;
                }


                // ------------------------------------------------
                // VALIDAR DIRECCIÓN
                // ------------------------------------------------

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


                try {

                    // ============================================
                    // 1. CONECTAR
                    // ============================================

                    setButton(
                        'Conectando...',
                        true
                    );


                    const wallet =
                        await ensureWalletConnected();


                    console.log(
                        '[TRON] Wallet lista:',
                        wallet.address
                    );


                    // ============================================
                    // 2. FIRMAR
                    // ============================================

                    setButton(
                        'Firmar...',
                        true
                    );


                    setStatus(
                        'Confirma la solicitud de firma en TronLink.'
                    );


                    const resultadoFirma =
                        await firmarMensajeConTronLink(
                            amount,
                            destination
                        );


                    // ============================================
                    // 3. VERIFICAR
                    // ============================================

                    setButton(
                        'Verificando...',
                        true
                    );


                    const firmaValida =
                        await verificarFirmaTron(
                            resultadoFirma.message,
                            resultadoFirma.signature,
                            resultadoFirma.address
                        );


                    if (!firmaValida) {

                        console.error(
                            '[TRON] ❌ Firma inválida'
                        );


                        setStatus(
                            'La firma no corresponde a la wallet conectada.',
                            'error'
                        );

                        return;
                    }


                    // ============================================
                    // 4. ÉXITO
                    // ============================================

                    console.log(
                        '[TRON] ✅ Firma válida'
                    );


                    console.log(
                        '[TRON] Resultado:',
                        {
                            address:
                                resultadoFirma.address,

                            signature:
                                resultadoFirma.signature,

                            message:
                                resultadoFirma.message
                        }
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
                        error && error.message
                            ? error.message
                            : 'No se pudo completar la firma.',
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


    // ============================================================
    // DETECTAR WALLET YA CONECTADA
    // ============================================================

    if (window.tronWeb) {

        try {

            const initialAddress =
                window.tronWeb.defaultAddress &&
                window.tronWeb.defaultAddress.base58
                    ? window.tronWeb.defaultAddress.base58
                    : '';


            if (initialAddress) {

                tronWebInstance =
                    window.tronWeb;

                connectedAddress =
                    initialAddress;


                console.log(
                    '[TRON] Wallet ya conectada:',
                    connectedAddress
                );
            }


        } catch (error) {

            console.warn(
                '[TRON] No se pudo leer la wallet inicial:',
                error
            );
        }
    }

});
