document.addEventListener('DOMContentLoaded', function () {
    'use strict';

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

        // Primero hacemos una comprobación básica
        if (!basicTronAddressCheck(address)) {
            return false;
        }

        // Si TronWeb está disponible hacemos
        // una validación más precisa
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
                'TronLink no está disponible. Instala o abre TronLink y vuelve a intentarlo.'
            );

        }

        // Solicitar acceso a la wallet
        if (
            window.tronLink &&
            typeof window.tronLink.request === 'function'
        ) {

            const response = await window.tronLink.request({
                method: 'tron_requestAccounts'
            });

            // TronLink puede devolver un código
            // cuando el usuario rechaza la conexión
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

        // TronLink normalmente inyecta window.tronWeb
        const injectedTronWeb = window.tronWeb;

        if (!injectedTronWeb) {

            throw new Error(
                'TronLink está presente, pero TronWeb todavía no está disponible.'
            );

        }

        // Obtener dirección de la wallet
        const address =
            injectedTronWeb.defaultAddress &&
            injectedTronWeb.defaultAddress.base58
                ? injectedTronWeb.defaultAddress.base58
                : '';

        if (!address) {

            throw new Error(
                'No se pudo obtener la dirección de la cuenta conectada.'
            );

        }

        tronWebInstance = injectedTronWeb;
        connectedAddress = address;

        return {
            address: connectedAddress,
            tronWeb: tronWebInstance
        };
    }

    // ============================================================
    // COMPROBAR SI YA ESTÁ CONECTADO
    // ============================================================

    async function ensureWalletConnected() {

        if (
            connectedAddress &&
            tronWebInstance &&
            tronWebInstance.defaultAddress &&
            tronWebInstance.defaultAddress.base58
        ) {

            return {
                address: connectedAddress,
                tronWeb: tronWebInstance
            };

        }

        return conectarTronLink();
    }

    // ============================================================
    // MOSTRAR CONFIRMACIÓN
    // ============================================================

    function showConfirmation(
        amount,
        destination,
        walletAddress
    ) {

        const shortWallet =
            walletAddress.slice(0, 6) +
            '...' +
            walletAddress.slice(-6);

        const shortDestination =
            destination.slice(0, 6) +
            '...' +
            destination.slice(-6);

        setStatus(
            'Listo para confirmar: ' +
            amount +
            ' USDT → ' +
            shortDestination +
            ' | Wallet: ' +
            shortWallet,
            'success'
        );

        console.log(
            '[TRON] Confirmación preparada:',
            {
                token: 'USDT',
                network: 'TRON',
                amount: amount,
                destination: destination,
                wallet: walletAddress
            }
        );
    }

    // ============================================================
    // BOTÓN INICIAL
    // ============================================================

    if (btn) {
        setButton('Siguiente');
    }

    // ============================================================
    // INPUT DE CANTIDAD
    // ============================================================

    if (input) {

        input.addEventListener(
            'input',
            function () {

                // Permitir solamente números,
                // punto y coma decimal
                const cleaned =
                    this.value.replace(/[^\d.,]/g, '');

                if (cleaned !== this.value) {
                    this.value = cleaned;
                }

                // Cambiar color del botón
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
    // BOTÓN X PARA BORRAR CANTIDAD
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

                    // Aunque el input sea readonly,
                    // JavaScript puede cambiar su valor
                    addressInput.value = text;

                    if (!isValidTronAddress(text)) {

                        setStatus(
                            'La dirección pegada no parece ser una dirección TRON válida.',
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
                    'La función Máx. necesita primero consultar el saldo USDT de la wallet.',
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
                        'Falta la dirección TRON de destino.',
                        'error'
                    );

                    return;
                }

                if (!isValidTronAddress(destination)) {

                    setStatus(
                        'La dirección de destino no es una dirección TRON válida.',
                        'error'
                    );

                    return;
                }

                // ------------------------------------------------
                // CONECTAR WALLET
                // ------------------------------------------------

                try {

                    setButton(
                        'Conectando...',
                        true
                    );

                    const wallet =
                        await ensureWalletConnected();

                    setButton(
                        'Preparando...',
                        true
                    );

                    // --------------------------------------------
                    // PREPARAR CONFIRMACIÓN
                    // --------------------------------------------

                    showConfirmation(
                        amount,
                        destination,
                        wallet.address
                    );

                } catch (error) {

                    console.error(
                        '[TRON]',
                        error
                    );

                    setStatus(
                        error && error.message
                            ? error.message
                            : 'No se pudo conectar con TronLink.',
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
    // DETECTAR SI TRONLINK YA ESTABA CONECTADO
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
