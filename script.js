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
    // MENSAJES
    // ============================================================

    function setStatus(message, type = '') {

        if (!status) return;

        status.textContent = message || '';

        status.className =
            'status' +
            (type ? ' ' + type : '');

        status.style.display =
            message ? 'block' : 'none';
    }


    // ============================================================
    // BOTÓN
    // ============================================================

    function setButton(text, disabled = false) {

        if (!btn) return;

        btn.textContent = text;
        btn.disabled = disabled;
    }


    // ============================================================
    // OBTENER CANTIDAD
    // ============================================================

    function getAmount() {

        if (!input) return NaN;

        const normalized =
            input.value
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
                '[TRON] Error validando dirección:',
                error
            );
        }

        return true;
    }


    // ============================================================
    // CONECTAR TRONLINK
    // ============================================================

    async function conectarTronLink() {

        console.log(
            '[TRON] Intentando conectar TronLink...'
        );


        if (!window.tronLink && !window.tronWeb) {

            throw new Error(
                'TronLink no está disponible.'
            );
        }


        // --------------------------------------------------------
        // PEDIR ACCESO A LA WALLET
        // --------------------------------------------------------

        if (
            window.tronLink &&
            typeof window.tronLink.request === 'function'
        ) {

            const response =
                await window.tronLink.request({
                    method: 'tron_requestAccounts'
                });


            console.log(
                '[TRON] Respuesta TronLink:',
                response
            );


            if (
                response &&
                response.code &&
                response.code !== 200
            ) {

                throw new Error(
                    response.message ||
                    'La conexión fue rechazada.'
                );
            }
        }


        // --------------------------------------------------------
        // OBTENER TRONWEB INYECTADO
        // --------------------------------------------------------

        const injectedTronWeb =
            window.tronWeb;


        if (!injectedTronWeb) {

            throw new Error(
                'TronWeb no está disponible.'
            );
        }


        // --------------------------------------------------------
        // OBTENER DIRECCIÓN
        // --------------------------------------------------------

        const address =
            injectedTronWeb.defaultAddress &&
            injectedTronWeb.defaultAddress.base58
                ? injectedTronWeb.defaultAddress.base58
                : '';


        if (!address) {

            throw new Error(
                'No se pudo obtener la dirección de la wallet.'
            );
        }


        tronWebInstance =
            injectedTronWeb;

        connectedAddress =
            address;


        console.log(
            '[TRON] Wallet conectada:',
            connectedAddress
        );


        return {

            address:
                connectedAddress,

            tronWeb:
                tronWebInstance
        };
    }


    // ============================================================
    // COMPROBAR CONEXIÓN
    // ============================================================

async function ensureWalletConnected() {

    // Solicitar acceso a TronLink
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
    }

    // Comprobar TronWeb
    if (!window.tronWeb) {

        throw new Error(
            'TronWeb no está disponible.'
        );
    }

    // Obtener la wallet actualmente seleccionada
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

    tronWebInstance =
        window.tronWeb;

    connectedAddress =
        address;

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


        // --------------------------------------------------------
        // MENSAJE QUE EL USUARIO VA A FIRMAR
        // --------------------------------------------------------

        const mensaje =

            'Confirmación de wallet\n\n' +

            'Wallet: ' +
            walletAddress +

            '\nRed: TRON' +

            '\nCantidad indicada: ' +
            amount +
            ' USDT' +

            '\nDirección indicada: ' +
            destination +

            '\nFecha: ' +
            new Date().toISOString();


        console.log(
            '[TRON] Mensaje a firmar:',
            mensaje
        );


        // --------------------------------------------------------
        // PEDIR FIRMA A TRONLINK
        // --------------------------------------------------------

        if (
            !window.tronWeb.trx ||
            typeof window.tronWeb.trx.signMessageV2 !== 'function'
        ) {

            throw new Error(
                'Esta versión de TronLink no permite signMessageV2.'
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

            address:
                walletAddress,

            message:
                mensaje,

            signature:
                firma
        };
    }


    // ============================================================
    // BOTÓN INICIAL
    // ============================================================

    if (btn) {

        setButton(
            'Siguiente'
        );
    }


    // ============================================================
    // INPUT CANTIDAD
    // ============================================================

    if (input) {

        input.addEventListener(
            'input',
            function () {

                // Eliminar caracteres no válidos

                const cleaned =
                    this.value.replace(
                        /[^\d.,]/g,
                        ''
                    );


                if (cleaned !== this.value) {

                    this.value =
                        cleaned;
                }


                // Cambiar color

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

    if (
        clearBtn &&
        input
    ) {

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

    if (
        pasteBtn &&
        addressInput
    ) {

        pasteBtn.addEventListener(
            'click',
            async function () {

                try {

                    if (
                        !navigator.clipboard ||
                        typeof navigator.clipboard.readText !== 'function'
                    ) {

                        throw new Error(
                            'El navegador no permite acceder al portapapeles.'
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


                    addressInput.value =
                        text;


                    if (
                        !isValidTronAddress(text)
                    ) {

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
                    'Primero debemos implementar la consulta del saldo USDT.',
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


                const amount =
                    getAmount();


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


                if (
                    !isValidTronAddress(
                        destination
                    )
                ) {

                    setStatus(
                        'La dirección TRON no es válida.',
                        'error'
                    );

                    return;
                }


                try {

                    // ============================================
                    // 1. CONECTAR WALLET
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
                    // 2. SOLICITAR FIRMA
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
                    // 3. FIRMA COMPLETADA
                    // ============================================

                    console.log(
                        '[TRON] Firma completada:',
                        resultadoFirma
                    );


                    setStatus(
                        'Firma realizada correctamente.',
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
                '[TRON] Error leyendo wallet:',
                error
            );
        }
    }

});
