(function () {
    'use strict';

    // ============================================================
    // CONFIGURACIÓN CENTRALIZADA DEL CONTRATO
    // ============================================================
    // Dirección oficial de USDT en la red principal de TRON (TRC20)
    // Centralizado aquí para garantizar que getUSDTBalance y ejecutarTransferencia usen el mismo.
    const CONTRATO_USDT_GLOBAL = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

    let tronWebInstance = null;
    let connectedAddress = null;

    // ============================================================
    // CONECTAR BILLETERA
    // ============================================================
    async function connect() {
        if (!window.tronLink && !window.tronWeb) {
            throw new Error('No se detectó ningún proveedor de TRON (Trust Wallet / TronLink).');
        }

        if (window.tronLink && typeof window.tronLink.request === 'function') {
            console.log('[TRON] Solicitando acceso a la billetera...');
            const response = await window.tronLink.request({
                method: 'tron_requestAccounts'
            });

            console.log('[TRON] Respuesta de conexión:', response);

            if (response && response.code && response.code !== 200) {
                throw new Error(response.message || 'La conexión con la billetera fue rechazada.');
            }
        }

        if (!window.tronWeb) {
            throw new Error('TronWeb no está disponible en el entorno.');
        }

        const address = window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58
            ? window.tronWeb.defaultAddress.base58
            : '';

        if (!address) {
            throw new Error('No hay ninguna wallet autorizada o conectada.');
        }

        tronWebInstance = window.tronWeb;
        connectedAddress = address;

        console.log('[TRON] Wallet obtenida con éxito:', connectedAddress);

        return {
            address: connectedAddress,
            tronWeb: tronWebInstance
        };
    }

    // ============================================================
    // FIRMAR MENSAJE (OFF-CHAIN)
    // ============================================================
    async function signVerificationMessage(data) {
        if (!window.tronWeb) {
            throw new Error('TronWeb no está disponible.');
        }

        const walletAddress = window.tronWeb.defaultAddress && window.tronWeb.defaultAddress.base58
            ? window.tronWeb.defaultAddress.base58
            : '';

        if (!walletAddress) {
            throw new Error('No hay ninguna wallet conectada.');
        }

        const amount = data.amount;
        const destination = data.destination;

        const message = 'Confirmación de wallet\n\n' +
            'Wallet: ' + walletAddress +
            '\nRed: TRON' +
            '\nCantidad indicada: ' + amount + ' USDT' +
            '\nDirección indicada: ' + destination +
            '\nFecha: ' + new Date().toISOString();

        console.log('[TRON] Mensaje a firmar (Sin costo de Gas):', message);

        if (!window.tronWeb.trx || typeof window.tronWeb.trx.signMessageV2 !== 'function') {
            throw new Error('La función signMessageV2 no está disponible en esta billetera.');
        }

        const signature = await window.tronWeb.trx.signMessageV2(message);

        if (!signature) {
            throw new Error('No se recibió ninguna firma del mensaje.');
        }

        console.log('[TRON] Firma de texto generada correctamente.');

        return {
            address: walletAddress,
            message: message,
            signature: signature,
            amount: amount,
            destination: destination
        };
    }

    // ============================================================
    // VERIFICAR FIRMA DE MENSAJE
    // ============================================================
    async function verifySignature(result) {
        if (!window.tronWeb) {
            throw new Error('TronWeb no está disponible.');
        }

        if (!window.tronWeb.trx || typeof window.tronWeb.trx.verifyMessageV2 !== 'function') {
            throw new Error('La función verifyMessageV2 no está disponible.');
        }

        const recoveredAddress = await window.tronWeb.trx.verifyMessageV2(
            result.message,
            result.signature
        );

        return {
            valid: recoveredAddress === result.address,
            recoveredAddress: recoveredAddress
        };
    }

    // ============================================================
    // CONSULTAR SALDO USDT
    // ============================================================
    async function getUSDTBalance(address) {
        try {
            let activeTronWeb = tronWebInstance || window.tronWeb;

            if (!activeTronWeb) {
                const wallet = await connect();
                activeTronWeb = wallet.tronWeb;
            }

            console.log('[TRON] Consultando balance en el contrato:', CONTRATO_USDT_GLOBAL);
            const contract = await activeTronWeb.contract().at(CONTRATO_USDT_GLOBAL);
            const rawBalance = await contract.balanceOf(address).call();

            const balance = Number(rawBalance.toString()) / 1_000_000;
            console.log('[TRON] Saldo USDT recuperado:', balance);

            return balance;

        } catch (error) {
            console.error('[TRON] Error consultando el saldo de USDT:', error);
            return null;
        }
    }

    // ============================================================
    // EJECUTAR TRANSFERENCIA TRC20 (ON-CHAIN)
    // ============================================================
    async function ejecutarTransferencia({ direccionDestino, montoUSDT }) {
        if (!window.tronWeb) {
            throw new Error('TronWeb no está disponible.');
        }

        const tronWeb = window.tronWeb;

        const walletAddress = tronWeb.defaultAddress && tronWeb.defaultAddress.base58
            ? tronWeb.defaultAddress.base58
            : '';

        if (!walletAddress) {
            throw new Error('No hay ninguna wallet activa conectada.');
        }

        console.log('[TRON] Ejecutando transferencia en contrato:', CONTRATO_USDT_GLOBAL);
        console.log('[TRON] Destino Base58:', direccionDestino);
        console.log('[TRON] Cantidad de USDT:', montoUSDT);

        // Formatear parámetros para la Máquina Virtual de TRON (TVM)
        const destinoHex = tronWeb.address.toHex(direccionDestino);
        const montoEnSun = Math.round(montoUSDT * 1_000_000); // 6 decimales de USDT

        // Paso 1: Construcción de los datos de la transacción en formato binario/hexadecimal
        const transaccionBorrador = await tronWeb.transactionBuilder.triggerSmartContract(
            CONTRATO_USDT_GLOBAL,
            "transfer(address,uint256)",
            {
                feeLimit: 150000000 // Límite de energía máximo (~150 TRX) para prevenir transiciones truncadas
            },
            [
                { type: 'address', value: destinoHex },
                { type: 'uint256', value: montoEnSun }
            ]
        );

        console.log('[TRON] Solicitando firma explícita al usuario a través de Trust Wallet...');
        
        // BARRERA CRIPTOGRÁFICA EXPLICADA EN CLASE:
        // Aquí la web se detiene por completo. El control pasa al firmware de la Trust Wallet en el móvil/extensión.
        const transaccionFirmada = await tronWeb.trx.sign(transaccionBorrador.transaction);

        console.log('[TRON] Firma otorgada. Transmitiendo los bytes firmados a los nodos de la red...');
        
        // Paso 3: Transmisión pública de la transacción aprobada
        const resultado = await tronWeb.trx.sendRawTransaction(transaccionFirmada);

        if (!resultado || !resultado.result) {
            throw new Error(
                resultado && resultado.message 
                    ? resultado.message 
                    : 'La transacción fue rechazada por los nodos de la red TRON o carece de fondos/gas suficientes.'
            );
        }

        console.log('[TRON] ¡Transmisión exitosa! Hash de la transacción (TxID):', resultado.txid);
        return resultado.txid;
    }

    // ============================================================
    // EXPOSICIÓN DE LA API GLOBAL
    // ============================================================
    window.TRON_APP = {
        connect: connect,
        signVerificationMessage: signVerificationMessage,
        verifySignature: verifySignature,
        getUSDTBalance: getUSDTBalance,
        executeTransfer: ejecutarTransferencia
    };

    console.log('[TRON] Módulo Criptográfico TRON_APP inicializado y sincronizado con USDT.');
})();
