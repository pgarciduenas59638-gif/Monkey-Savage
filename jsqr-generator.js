/**
 * @fileoverview Generador de QR Profesional
 * @author Tu Nombre
 * @version 1.0.0
 * @description Generador de códigos QR con seguridad, privacidad y UX mejoradas
 */

class QRGenerator {
    constructor() {
        // DOM Elements Cache
        this.elements = {
            qrText: document.getElementById('qrText'),
            charCounter: document.getElementById('charCounter'),
            qrSize: document.getElementById('qrSize'),
            errorCorrection: document.getElementById('errorCorrection'),
            qrColor: document.getElementById('qrColor'),
            bgColor: document.getElementById('bgColor'),
            generateBtn: document.getElementById('generateBtn'),
            clearBtn: document.getElementById('clearBtn'),
            outputSection: document.getElementById('outputSection'),
            qrCanvas: document.getElementById('qrCanvas'),
            qrLoader: document.getElementById('qrLoader'),
            infoLength: document.getElementById('infoLength'),
            infoType: document.getElementById('infoType'),
            infoSize: document.getElementById('infoSize'),
            infoTimestamp: document.getElementById('infoTimestamp'),
            downloadBtn: document.getElementById('downloadBtn'),
            copyImageBtn: document.getElementById('copyImageBtn'),
            saveHistoryBtn: document.getElementById('saveHistoryBtn'),
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            validationMessage: document.getElementById('validationMessage')
        };

        // Configuration
        this.config = {
            maxHistoryItems: 12,
            maxChars: 2953, // Para nivel M
            similarCharThreshold: 60000, // 1 minuto
            qrCode: null,
            isGenerating: false
        };

        this.init();
    }

    /**
     * Inicializa el componente
     * @private
     */
    init() {
        this.attachEventListeners();
        this.loadHistory();
        this.updateCounter();
        this.checkInitialState();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    }

    /**
     * Adjunta todos los event listeners
     * @private
     */
    attachEventListeners() {
        this.elements.qrText.addEventListener('input', () => this.updateCounter());
        this.elements.generateBtn.addEventListener('click', () => this.generateQR());
        this.elements.clearBtn.addEventListener('click', () => this.clearForm());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadQR());
        this.elements.copyImageBtn.addEventListener('click', () => this.copyImage());
        this.elements.saveHistoryBtn.addEventListener('click', () => this.saveToHistory());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.elements.qrSize.addEventListener('change', () => this.autoRegenerate());
    }

    /**
     * Maneja atajos de teclado
     * @private
     * @param {KeyboardEvent} e
     */
    handleKeyboard(e) {
        // Ctrl/Cmd + Enter para generar
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            this.generateQR();
        }
        
        // Esc para limpiar
        if (e.key === 'Escape') {
            e.preventDefault();
            this.clearForm();
        }
    }

    /**
     * Verifica si hay datos inicialmente
     * @private
     */
    checkInitialState() {
        if (this.elements.qrText.value.trim()) {
            this.generateQR();
        }
    }

    /**
     * Actualiza el contador de caracteres
     * @public
     */
    updateCounter() {
        const length = this.elements.qrText.value.length;
        const max = this.config.maxChars;
        
        this.elements.charCounter.textContent = `${length} / ${max} caracteres`;

        // Cambiar color según el uso
        const counter = this.elements.charCounter;
        if (length > max * 0.9) {
            counter.style.color = 'var(--danger-color)';
            counter.style.fontWeight = '700';
        } else if (length > max * 0.7) {
            counter.style.color = 'var(--warning-color)';
            counter.style.fontWeight = '600';
        } else {
            counter.style.color = 'var(--text-secondary)';
            counter.style.fontWeight = '500';
        }
    }

    /**
     * Valida el texto de entrada
     * @private
     * @param {string} text - Texto a validar
     * @returns {boolean}
     */
    validateInput(text) {
        const trimmed = text.trim();
        
        if (!trimmed) {
            this.showValidation('❌ El texto no puede estar vacío', 'error');
            this.elements.qrText.classList.add('error');
            return false;
        }

        if (trimmed.length > this.config.maxChars) {
            this.showValidation(`❌ Texto demasiado largo (${trimmed.length}/${this.config.maxChars})`, 'error');
            this.elements.qrText.classList.add('error');
            return false;
        }

        // Detectar tipo de contenido
        const type = this.detectContentType(trimmed);
        this.elements.infoType.textContent = type;
        
        this.elements.qrText.classList.remove('error');
        this.hideValidation();
        return true;
    }

    /**
     * Detecta el tipo de contenido
     * @private
     * @param {string} text
     * @returns {string}
     */
    detectContentType(text) {
        if (this.isURL(text)) return '🔗 URL';
        if (this.isEmail(text)) return '✉️ Email';
        if (this.isPhone(text)) return '📞 Teléfono';
        if (this.isWiFi(text)) return '📶 WiFi';
        return '📝 Texto';
    }

    /**
     * Verifica si es URL válida
     * @private
     * @param {string} text
     * @returns {boolean}
     */
    isURL(text) {
        try {
            new URL(text);
            return true;
        } catch {
            return /^(https?:\/\/)?([^\s.]+\.)+[a-z]{2,}(\/.*)?$/i.test(text);
        }
    }

    /**
     * Verifica si es email
     * @private
     * @param {string} text
     * @returns {boolean}
     */
    isEmail(text) {
        return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(text) || 
               /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    }

    /**
     * Verifica si es teléfono
     * @private
     * @param {string} text
     * @returns {boolean}
     */
    isPhone(text) {
        return /^tel:\+?\d+$/i.test(text) || /^\+?\d+$/.test(text);
    }

    /**
     * Verifica si es configuración WiFi
     * @private
     * @param {string} text
     * @returns {boolean}
     */
    isWiFi(text) {
        return /^WIFI:/i.test(text);
    }

    /**
     * Genera el código QR
     * @public
     * @returns {Promise<void>}
     */
    async generateQR() {
        const text = this.elements.qrText.value;
        
        if (!this.validateInput(text)) {
            return;
        }

        if (this.config.isGenerating) {
            this.showValidation('⏳ Generando QR, por favor espera...', 'success');
            return;
        }

        this.config.isGenerating = true;
        this.showLoader(true);
        this.hideValidation();
        
        try {
            // Limpiar QR anterior
            this.clearPreviousQR();
            
            // Generar nuevo QR
            await this.createQRCode(text);
            
            // Actualizar UI
            this.updateOutputInfo(text);
            this.showOutputSection();
            this.showValidation('✅ QR generado exitosamente', 'success');
            
        } catch (error) {
            console.error('QR Generation Error:', error);
            this.showValidation(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.config.isGenerating = false;
            this.showLoader(false);
        }
    }

    /**
     * Limpia el QR anterior
     * @private
     */
    clearPreviousQR() {
        if (this.config.qrCode) {
            this.elements.qrCanvas.innerHTML = '';
            this.config.qrCode = null;
        }
    }

    /**
     * Crea el objeto QRCode
     * @private
     * @param {string} text
     * @returns {Promise<void>}
     */
    createQRCode(text) {
        return new Promise((resolve, reject) => {
            try {
                const size = parseInt(this.elements.qrSize.value);
                this.config.qrCode = new QRCode(this.elements.qrCanvas, {
                    text: text,
                    width: size,
                    height: size,
                    colorDark: this.elements.qrColor.value,
                    colorLight: this.elements.bgColor.value,
                    correctLevel: QRCode.CorrectLevel[this.elements.errorCorrection.value],
                    quietZone: 10,
                    onRenderingEnd: resolve
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Actualiza información del QR generado
     * @private
     * @param {string} text
     */
    updateOutputInfo(text) {
        this.elements.infoLength.textContent = text.length;
        this.elements.infoSize.textContent = `${this.elements.qrSize.value} × ${this.elements.qrSize.value}`;
        this.elements.infoTimestamp.textContent = new Date().toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Muestra la sección de salida
     * @private
     */
    showOutputSection() {
        this.elements.outputSection.style.display = 'block';
        this.elements.outputSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
        });
    }

    /**
     * Auto-regenera si hay texto
     * @private
     */
    autoRegenerate() {
        if (this.elements.qrText.value.trim()) {
            setTimeout(() => this.generateQR(), 300);
        }
    }

    /**
     * Muestra/oculta el loader
     * @private
     * @param {boolean} show
     */
    showLoader(show) {
        this.elements.qrLoader.style.display = show ? 'block' : 'none';
        this.elements.qrCanvas.style.display = show ? 'none' : 'block';
    }

    /**
     * Descarga el QR como PNG
     * @public
     */
    downloadQR() {
        if (!this.config.qrCode) {
            this.showValidation('❌ No hay QR para descargar', 'error');
            return;
        }

        const canvas = this.elements.qrCanvas.querySelector('canvas');
        if (!canvas) {
            this.showValidation('❌ Error: Canvas no encontrado', 'error');
            return;
        }

        try {
            const link = document.createElement('a');
            link.download = `qr-code-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            
            this.showValidation('✅ QR descargado correctamente', 'success');
        } catch (error) {
            console.error('Download Error:', error);
            this.showValidation('❌ Error al descargar', 'error');
        }
    }

    /**
     * Copia el QR al portapapeles
     * @public
     * @returns {Promise<void>}
     */
    async copyImage() {
        if (!this.config.qrCode) {
            this.showValidation('❌ No hay QR para copiar', 'error');
            return;
        }

        const canvas = this.elements.qrCanvas.querySelector('canvas');
        if (!canvas) {
            this.showValidation('❌ Error: Canvas no encontrado', 'error');
            return;
        }

        try {
            const blob = await new Promise(resolve => 
                canvas.toBlob(resolve, 'image/png', 1.0)
            );

            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            
            this.showValidation('✅ QR copiado al portapapeles', 'success');
        } catch (error) {
            console.error('Copy Image Error:', error);
            
            // Fallback: copiar como data URL
            try {
                const dataURL = canvas.toDataURL('image/png');
                await navigator.clipboard.writeText(dataURL);
                this.showValidation('✅ Data URL copiada (pega en navegador)', 'success');
            } catch (fallbackError) {
                console.error('Fallback Copy Error:', fallbackError);
                this.showValidation('❌ Error al copiar: Navegador no compatible', 'error');
            }
        }
    }

    /**
     * Guarda el QR en el historial local
     * @public
     */
    saveToHistory() {
        if (!this.config.qrCode) {
            this.showValidation('❌ No hay QR para guardar', 'error');
            return;
        }

        const canvas = this.elements.qrCanvas.querySelector('canvas');
        const text = this.elements.qrText.value;
        
        if (!canvas || !text) {
            this.showValidation('❌ Error: Datos incompletos', 'error');
            return;
        }

        try {
            // Evitar duplicados recientes
            if (this.isDuplicateRecent(text)) {
                this.showValidation('⚠️ Este QR ya está en el historial reciente', 'success');
                return;
            }

            const historyItem = this.createHistoryItem(canvas, text);
            this.addToHistory(historyItem);
            this.loadHistory();
            
            this.showValidation('✅ QR guardado en historial local', 'success');
        } catch (error) {
            console.error('Save History Error:', error);
            this.showValidation('❌ Error al guardar historial', 'error');
        }
    }

    /**
     * Verifica si es un duplicado reciente
     * @private
     * @param {string} text
     * @returns {boolean}
     */
    isDuplicateRecent(text) {
        const history = this.getHistory();
        const now = Date.now();
        
        return history.some(item => 
            item.text === text && (now - item.timestamp) < this.config.similarCharThreshold
        );
    }

    /**
     * Crea un item de historial
     * @private
     * @param {HTMLCanvasElement} canvas
     * @param {string} text
     * @returns {object}
     */
    createHistoryItem(canvas, text) {
        return {
            id: Date.now(),
            text: text,
            dataURL: canvas.toDataURL('image/png', 1.0),
            size: this.elements.qrSize.value,
            timestamp: Date.now(),
            type: this.detectContentType(text)
        };
    }

    /**
     * Añade un item al historial
     * @private
     * @param {object} item
     */
    addToHistory(item) {
        const history = this.getHistory();
        history.unshift(item);
        
        // Limitar cantidad
        if (history.length > this.config.maxHistoryItems) {
            history.splice(this.config.maxHistoryItems);
        }
        
        this.setHistory(history);
    }

    /**
     * Obtiene el historial desde localStorage
     * @private
     * @returns {Array}
     */
    getHistory() {
        try {
            const stored = localStorage.getItem('qrHistory');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error reading history:', error);
            return [];
        }
    }

    /**
     * Guarda el historial en localStorage
     * @private
     * @param {Array} history
     */
    setHistory(history) {
        try {
            localStorage.setItem('qrHistory', JSON.stringify(history));
        } catch (error) {
            console.error('Error saving history:', error);
            this.showValidation('❌ Error: Almacenamiento lleno', 'error');
        }
    }

    /**
     * Carga y renderiza el historial
     * @public
     */
    loadHistory() {
        const history = this.getHistory();
        
        if (history.length === 0) {
            this.renderEmptyHistory();
            return;
        }

        this.renderHistory(history);
    }

    /**
     * Renderiza el historial vacío
     * @private
     */
    renderEmptyHistory() {
        this.elements.historyList.innerHTML = 
            '<p class="empty-state">No hay códigos QR guardados. Genera uno y presiona "Guardar Historial".</p>';
        this.elements.clearHistoryBtn.style.display = 'none';
    }

    /**
     * Renderiza el historial con items
     * @private
     * @param {Array} history
     */
    renderHistory(history) {
        this.elements.historyList.innerHTML = history.map(item => `
            <div class="history-item" 
                 onclick="qrGenerator.loadFromHistory('${item.id}')" 
                 title="${this.escapeHtml(item.text)}"
                 role="listitem">
                <img src="${item.dataURL}" alt="QR: ${this.escapeHtml(item.text.slice(0, 50))}" loading="lazy">
                <p>${this.escapeHtml(this.truncateText(item.text, 20))}</p>
                <small>${this.formatDate(item.timestamp)}</small>
            </div>
        `).join('');
        
        this.elements.clearHistoryBtn.style.display = 'block';
    }

    /**
     * Carga un QR del historial
     * @public
     * @param {string} id
     */
    loadFromHistory(id) {
        const history = this.getHistory();
        const item = history.find(h => h.id == id);
        
        if (!item) {
            this.showValidation('❌ QR no encontrado en historial', 'error');
            return;
        }

        // Restaurar datos
        this.elements.qrText.value = item.text;
        this.elements.qrSize.value = item.size;
        this.updateCounter();
        this.generateQR();
        
        // Scroll arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Limpia el formulario
     * @public
     */
    clearForm() {
        this.elements.qrText.value = '';
        this.elements.outputSection.style.display = 'none';
        this.clearPreviousQR();
        this.updateCounter();
        this.hideValidation();
    }

    /**
     * Limpia todo el historial
     * @public
     */
    clearHistory() {
        if (confirm('⚠️ ¿Seguro que quieres eliminar TODO el historial? Esta acción no se puede deshacer.')) {
            try {
                localStorage.removeItem('qrHistory');
                this.loadHistory();
                this.showValidation('🗑️ Historial eliminado', 'success');
            } catch (error) {
                console.error('Clear History Error:', error);
                this.showValidation('❌ Error al limpiar historial', 'error');
            }
        }
    }

    /**
     * Muestra mensaje de validación
     * @private
     * @param {string} message
     * @param {'success'|'error'} type
     */
    showValidation(message, type) {
        const msgEl = this.elements.validationMessage;
        msgEl.textContent = message;
        msgEl.className = `validation-message ${type}`;
        msgEl.style.display = 'block';

        // Auto-hide después de 3-5 segundos
        const duration = type === 'success' ? 3000 : 5000;
        this.validationTimeout = setTimeout(() => {
            this.hideValidation();
        }, duration);
    }

    /**
     * Oculta el mensaje de validación
     * @private
     */
    hideValidation() {
        if (this.validationTimeout) {
            clearTimeout(this.validationTimeout);
        }
        this.elements.validationMessage.style.display = 'none';
    }

    /**
     * Trunca texto a longitud específica
     * @private
     * @param {string} text
     * @param {number} maxLength
     * @returns {string}
     */
    truncateText(text, maxLength) {
        return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
    }

    /**
     * Formatea fecha para mostrar
     * @private
     * @param {number} timestamp
     * @returns {string}
     */
    formatDate(timestamp) {
        return new Date(timestamp).toLocaleString('es-ES', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Escapa HTML para prevenir XSS
     * @private
     * @param {string} text
     * @returns {string}
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// ===== INICIALIZACIÓN =====
// Esperar a que QRCode.js esté listo
function initQRGenerator() {
    if (typeof QRCode !== 'undefined') {
        window.qrGenerator = new QRGenerator();
    } else {
        setTimeout(initQRGenerator, 100);
    }
}

// Verificar soporte de características
function checkBrowserSupport() {
    const issues = [];
    
    if (!navigator.clipboard) {
        issues.push('API de portapapeles no soportada');
    }
    
    if (!window.crypto) {
        issues.push('Web Crypto API no soportada');
    }
    
    if (issues.length > 0) {
        console.warn('Browser Support Issues:', issues);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        checkBrowserSupport();
        initQRGenerator();
    });
} else {
    checkBrowserSupport();