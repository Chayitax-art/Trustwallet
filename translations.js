// translations.js - Diccionario de idiomas

const diccionario = {
  es: {
    titulo: "Enviar USDT",
    botonConectar: "Conectar Billetera",
    montoLabel: "Cantidad"
  },
  en: {
    titulo: "Send USDT",
    botonConectar: "Connect Wallet",
    montoLabel: "Amount"
  }
};

let idiomaActual = 'es';

function cambiarIdioma(nuevoIdioma) {
  if (!diccionario[nuevoIdioma]) return;
  idiomaActual = nuevoIdioma;

  // Actualizar elementos que tengan el atributo data-i18n
  document.querySelectorAll('[data-i18n]').forEach(elemento => {
    const clave = elemento.getAttribute('data-i18n');
    if (diccionario[idiomaActual][clave]) {
      elemento.innerText = diccionario[idiomaActual][clave];
    }
  });
}