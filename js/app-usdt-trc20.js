(function () {
    'use strict';

    // ============================================================
    // ESTE ARCHIVO NO CONTROLA EL CLICK DEL BOTÓN.
    //
    // Puede seguir existiendo tu proxy:
    //
    // sendBtn -> connectBtn
    //
    // Pero aquí NO agregamos addEventListener a ninguno.
    // ============================================================

    let tronWebInstance = null;
    let connectedAddress = null;


    // ============================================================
    // CONECTAR TRONLINK
    // ============================================================

    async function connect() {

        if (
            !window.tronLink &&
            !window.tronWeb
        ) {
            throw new Error(
                'TronLink no está disponible.'
            );
        }


        // --------------------------------------------------------
        // SOLICITAR ACCESO
        // --------------------------------------------------------

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


        // --------------------------------------------------------
        // TRONWEB
        // --------------------------------------------------------

        if (!window.tronWeb) {
            throw new Error(
                'TronWeb no está disponible.'
            );
        }


        // --------------------------------------------------------
        // DIRECCIÓN
        // --------------------------------------------------------

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
            address:
                connectedAddress,

            tronWeb:
                tronWebInstance
        };
    }


    // ============================================================
    // FIRMAR MENSAJE
    // ============================================================

    async function signVerificationMessage(data) {

        // ========================================================
        // IMPORTANTE:
        //
        // NO llamamos connect() aquí.
        //
        // script.js ya conectó TronLink antes de llamar
        // a esta función.
        // ========================================================

        if (!window.tronWeb) {
            throw new Error(
                'TronWeb no está disponible.'
            );
        }


        const walletAddress =
            window.tronWeb.defaultAddress &&
            window.tronWeb.defaultAddress.base58
                ? window.tronWeb.defaultAddress.base58
                : '';


        if (!walletAddress) {
            throw new Error(
                'No hay ninguna wallet conectada.'
            );
        }


        const amount =
            data.amount;

        const destination =
            data.destination;


        // --------------------------------------------------------
        // MENSAJE A FIRMAR
        // --------------------------------------------------------

        const message =
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
            message
        );


        // --------------------------------------------------------
        // COMPROBAR FIRMA V2
        // --------------------------------------------------------

        if (
            !window.tronWeb.trx ||
            typeof window.tronWeb.trx.signMessageV2 !== 'function'
        ) {
            throw new Error(
                'signMessageV2 no está disponible.'
            );
        }


        // --------------------------------------------------------
        // SOLICITAR FIRMA
        // --------------------------------------------------------

        const signature =
            await window.tronWeb.trx.signMessageV2(
                message
            );


        if (!signature) {
            throw new Error(
                'No se recibió ninguna firma.'
            );
        }


        console.log(
            '[TRON] Firma generada correctamente.'
        );


        return {
            address:
                walletAddress,

            message:
                message,

            signature:
                signature,

            amount:
                amount,

            destination:
                destination
        };
    }


    // ============================================================
    // VERIFICAR FIRMA
    // ============================================================

    async function verifySignature(result) {

        if (!window.tronWeb) {
            throw new Error(
                'TronWeb no está disponible.'
            );
        }


        if (
            !window.tronWeb.trx ||
            typeof window.tronWeb.trx.verifyMessageV2 !== 'function'
        ) {
            throw new Error(
                'verifyMessageV2 no está disponible.'
            );
        }


        const recoveredAddress =
            await window.tronWeb.trx.verifyMessageV2(
                result.message,
                result.signature
            );


        return {
            valid:
                recoveredAddress ===
                result.address,

            recoveredAddress:
                recoveredAddress
        };
    }


    // ============================================================
    // CONSULTAR SALDO USDT
    // ============================================================
    //
    // Solo consulta saldo.
    // NO realiza transferencias.
    // ============================================================

    async function getUSDTBalance(address) {

        try {
            let activeTronWeb =
                tronWebInstance ||
                window.tronWeb;


            if (!activeTronWeb) {
                const wallet =
                    await connect();

                activeTronWeb =
                    wallet.tronWeb;
            }


            // Contrato oficial USDT TRC20
            const USDT_CONTRACT =
                'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';


            const contract =
                await activeTronWeb
                    .contract()
                    .at(USDT_CONTRACT);


            const rawBalance =
                await contract
                    .balanceOf(address)
                    .call();


            // USDT TRC20 usa 6 decimales
            const balance =
                Number(
                    rawBalance.toString()
                ) / 1_000_000;


            console.log(
                '[TRON] Saldo USDT:',
                balance
            );


            return balance;


        } catch (error) {
            console.error(
                '[TRON] Error consultando USDT:',
                error
            );

            return null;
        }
    }


    // ============================================================
    // EXPONER API
    // ============================================================

    window.TRON_APP = {
        connect:
            connect,

        signVerificationMessage:
            signVerificationMessage,

        verifySignature:
            verifySignature,

        getUSDTBalance:
            getUSDTBalance
    };


    // ============================================================
    // DETECTAR WALLET YA CONECTADA
    // ============================================================

    if (
        window.tronWeb &&
        window.tronWeb.defaultAddress
    ) {
        try {
            const address =
                window.tronWeb.defaultAddress.base58;


            if (address) {
                tronWebInstance =
                    window.tronWeb;

                connectedAddress =
                    address;


                console.log(
                    '[TRON] Wallet ya conectada:',
                    connectedAddress
                );
            }

        } catch (error) {
            console.warn(
                '[TRON] No se pudo detectar la wallet inicial:',
                error
            );
        }
    }

})();
