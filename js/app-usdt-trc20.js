(function () {
    'use strict';

    // ============================================================
    // IMPORTANTE:
    //
    // ESTE ARCHIVO NO AGREGA NINGÚN addEventListener AL BOTÓN.
    //
    // sendBtn puede seguir apuntando a connectBtn mediante
    // tu proxy del HTML.
    //
    // El click principal lo controla exclusivamente script.js.
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

        const wallet =
            await connect();

        const amount =
            data.amount;

        const destination =
            data.destination;

        // --------------------------------------------------------
        // MENSAJE EXPLÍCITO
        // --------------------------------------------------------

        const message =
            'Confirmación de wallet\n\n' +

            'Wallet: ' +
            wallet.address +

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


        if (
            !wallet.tronWeb.trx ||
            typeof wallet.tronWeb.trx.signMessageV2 !== 'function'
        ) {
            throw new Error(
                'signMessageV2 no está disponible.'
            );
        }


        const signature =
            await wallet.tronWeb.trx.signMessageV2(
                message
            );


        if (!signature) {
            throw new Error(
                'No se recibió ninguna firma.'
            );
        }


        return {
            address:
                wallet.address,

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
    // USDT TRC20 mainnet:
    // TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj
    //
    // Esta función solamente consulta saldo.
    // No realiza transferencias.
    // ============================================================

    async function getUSDTBalance(address) {

        try {

            const wallet =
                await connect();


            const USDT_CONTRACT =
                'TXLAQ63Xg1NAzckPwKHvzw7CSEmLMEqcdj';


            const contract =
                await wallet.tronWeb
                    .contract()
                    .at(USDT_CONTRACT);


            const rawBalance =
                await contract
                    .balanceOf(address)
                    .call();


            // USDT usa 6 decimales
            const balance =
                Number(rawBalance.toString()) /
                1_000_000;


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
    // EXPONER FUNCIONES
    // ============================================================

    window.TRON_APP = {
        connect,
        signVerificationMessage,
        verifySignature,
        getUSDTBalance
    };


    // ============================================================
    // DETECTAR WALLET INICIAL
    // ============================================================

    if (
        window.tronWeb &&
        window.tronWeb.defaultAddress
    ) {

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
    }

})();
