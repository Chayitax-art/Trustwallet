document.addEventListener('DOMContentLoaded', function () {
    // 1. Obtener referencias a los elementos del HTML
    var btn = document.getElementById('connectBtn');
    var input = document.getElementById('amountInput');
    var addressInput = document.getElementById('addressInput');

    // 2. Configurar el texto inicial del botón
    if (btn) {
        btn.textContent = 'Siguiente';

        // 3. AGREGAR LA ACCIÓN AL HACER CLIC EN EL BOTÓN
        btn.addEventListener('click', async function () {
            var monto = input ? input.value.trim() : '';
            var direccionDestino = addressInput ? addressInput.value.trim() : '';

            // Validar que el usuario haya escrito un monto antes de continuar
            if (!monto || parseFloat(monto) <= 0) {
                alert('Por favor, ingresa una cantidad válida de USDT.');
                return;
            }

            console.log('Procesando envío de:', monto, 'USDT a:', direccionDestino);

            // Ejecutar la lógica de conexión / transacción Web3
            try {
                if (typeof conectarTronLink === 'function') {
                    var billetera = await conectarTronLink();
                    console.log('Conectado exitosamente con la billetera:', billetera);
                } else {
                    alert('Procesando transacción por ' + monto + ' USDT...');
                }
            } catch (error) {
                console.error('Error durante el proceso:', error);
                alert('Error al conectar: ' + error.message);
            }
        });
    }

    // 4. Cambiar el color del botón en tiempo real cuando se escribe un valor
    if (input) {
        input.addEventListener('input', function () {
            if (btn) {
                btn.style.background = this.value.trim() !== '' ? 'blue' : '#908cf2';
            }
        });
    }
});