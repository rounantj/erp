// Precisa ser o primeiro import de index.js: o Ant Design guarda a referência do ResizeObserver
// quando o módulo carrega, e os imports rodam antes do corpo do arquivo.

window.addEventListener("error", (e) => {
  if (e.message && e.message.includes("ResizeObserver loop")) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// O overlay de erros do dev server registra seu listener antes do bundle, então o filtro acima
// não o alcança; adiar as notificações para o próximo frame evita que o aviso seja disparado.
if (process.env.NODE_ENV === "development" && window.ResizeObserver) {
  const NativeResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class extends NativeResizeObserver {
    constructor(callback) {
      super((entries, observer) => window.requestAnimationFrame(() => callback(entries, observer)));
    }
  };
}

const originalError = console.error;
console.error = (...args) => {
  if (typeof args[0] === "string" && args[0].includes("ResizeObserver")) return;
  originalError(...args);
};
