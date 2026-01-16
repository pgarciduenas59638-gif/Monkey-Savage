/**
 * Generador de QR Profesional
 * Seguridad, privacidad y UX en mente
 */
class QRGenerator {
    constructor() {
        this.elements = {
            qrText: document.getElementById('qrText'),
            charCounter: document.getElementById('charCounter'),
            qrSize: document.getElementById('qrSize'),
            errorCorrection: document.getElementById('errorCorrection'),
            qrColor: document.getElementById('qrColor'),
            bgColor: document.getElementById('bgColor'),
            generateBtn: document.getElementById('generateBtn'),
            outputSection: document.getElementById('outputSection'),
            qrCanvas: document.getElementById('qrCanvas'),
            downloadBtn: document.getElementById('downloadBtn'),
            copyImageBtn: document.getElementById('copyImageBtn'),
            saveHistoryBtn: document.getElementById('saveHistoryBtn'),
            infoLength: document.getElementById('infoLength'),
            infoType: document.getElementById('infoType'),
            infoTimestamp: document.getElementById('infoTimestamp'),
            historyList: document.getElementById('historyList'),
            clearHistoryBtn: document.getElementById('clearHistoryBtn'),
            validationMessage: document.getElementById('validationMessage')
        };

        this.qrCode = null;
        this.maxChars = 2953; // Límite para nivel de error M

        this.init();
    }

    init() {
        // Event listeners
        this.elements.qrText.addEventListener('input', () => this.updateCounter());
        this.elements.generateBtn.addEventListener('click', () => this.generateQR());
        this.elements.downloadBtn.addEventListener('click', () => this.downloadQR());
        this.elements.copyImageBtn.addEventListener('click', () => this.copyImage());
        this.elements.saveHistoryBtn.addEventListener('click', () => this.saveToHistory());
        this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());

        // Cargar historial
        this.loadHistory();

        // Atajo teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                this.generateQR();
            }
        });
    }

    updateCounter() {
        const length = this.elements.qrText.value.length;
        this.elements.charCounter.textContent = `${length} / ${this.maxChars}`;
        
        // Cambiar color si se acerca al límite
        if (length > this.maxChars * 0.9) {
            this.elements.charCounter.style.color = 'var(--danger-color)';
        } else if (length > this.maxChars * 0.7) {
            this.elements.charCounter.style.color = 'var(--warning-color)';
        } else {
            this.elements.charCounter.style.color = 'var(--text-secondary)';
        }
    }

    validateInput(text) {
        if (!text.trim()) {
            this.showValidation('❌ El texto no puede estar vacío', 'error');
            return false;
        }

        if (text.length > this.maxChars) {
            this.showValidation(`❌ Texto demasiado largo (${text.length}/${this.maxChars})`, 'error');
            return false;
        }

        // Detectar tipo de contenido
        const isURL = this.isURL(text);
        const isEmail = this.isEmail(text);
        const isTel = this.isPhone(text);
        
        const type = isURL ? 'URL' : isEmail ? 'Email' : isTel ? 'Teléfono' : 'Texto';
        this.elements.infoType.textContent = type;

        return true;
    }

    isURL(text) {
        try {
            new URL(text);
            return true;
        } catch {
            return /^https?:\/\//i.test(text);
        }
    }

    isEmail(text) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    }

    isPhone(text) {
        return /^tel:\+?\d+$/i.test(text) || /^\+?\d+$/.test(text);
    }

    generateQR() {
        const text = this.elements.qrText.value;
        
        if (!this.validateInput(text)) {
            return;
        }

        // Limpiar QR anterior
        this.elements.qrCanvas.innerHTML = '';
        this.qrCode = null;

        try {
            // Generar nuevo QR
            this.qrCode = new QRCode(this.elements.qrCanvas, {
                text: text,
                width: parseInt(this.elements.qrSize.value),
                height: parseInt(this.elements.qrSize.value),
                colorDark: this.elements.qrColor.value,
                colorLight: this.elements.bgColor.value,
                correctLevel: QRCode.CorrectLevel[this.elements.errorCorrection.value],
                quietZone: 10
            });

            // Mostrar sección de resultado
            this.elements.outputSection.style.display = 'block';
            this.elements.infoLength.textContent = text.length;
            this.elements.infoTimestamp.textContent = new Date().toLocaleString('es-ES');
            
            // Scroll suave
            this.elements.outputSection.scrollIntoView({ behavior: 'smooth' });
            
            this.showValidation('✅ QR generado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error generando QR:', error);
            this.showValidation('❌ Error al generar QR: ' + error.message, 'error');
        }
    }

    downloadQR() {
        if (!this.qrCode) {
            this.showValidation('❌ No hay QR para descargar', 'error');
            return;
        }

        const canvas = this.elements.qrCanvas.querySelector('canvas');
        if (!canvas) {
            this.showValidation('❌ QR no está listo', 'error');
            return;
        }

        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        this.showValidation('✅ QR descargado', 'success');
    }

    async copyImage() {
        if (!this.qrCode) {
            this.showValidation('❌ No hay QR para copiar', 'error');
            return;
        }

        const canvas = this.elements.qrCanvas.querySelector('canvas');
        if (!canvas) {
            this.showValidation('❌ QR no está listo', 'error');
            return;
        }

        try {
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            
            this.showValidation('✅ QR copiado al portapapeles', 'success');
        } catch (error) {
            console.error('Error copiando imagen:', error);
            
            // Fallback: copiar como data URL
            try {
                const dataURL = canvas.toDataURL('image/png');
                await navigator.clipboard.writeText(dataURL);
                this.showValidation('✅ Data URL copiada (pega en navegador)', 'success');
            } catch (fallbackError) {
                this.showValidation('❌ Error al copiar: ' + error.message, 'error');
            }
        }
    }

    saveToHistory() {
        if (!this.qrCode) {
            this.showValidation('❌ No hay QR para guardar', 'error');
            return;
        }

        const canvas = this.elements.qrCanvas.querySelector('canvas');
        const text = this.elements.qrText.value;
        const timestamp = Date.now();

        if (!canvas || !text) return;

        const historyItem = {
            id: timestamp,
            text: text,
            dataURL: canvas.toDataURL('image/png'),
            size: this.elements.qrSize.value,
            timestamp: timestamp
        };

        // Obtener historial actual
        let history = JSON.parse(localStorage.getItem('qrHistory') || '[]');
        
        // Evitar duplicados recientes
        const isDuplicate = history.some(item => 
            item.text === text && (timestamp - item.timestamp) < 60000
        );
        
        if (isDuplicate) {
            this.showValidation('⚠️ Este QR ya está en el historial reciente', 'success');
            return;
        }

        // Añadir nuevo item
        history.unshift(historyItem);
        
        // Limitar a 12 items
        history = history.slice(0, 12);
        
        // Guardar
        localStorage.setItem('qrHistory', JSON.stringify(history));
        
        this.loadHistory();
        this.showValidation('✅ QR guardado en historial', 'success');
    }

    loadHistory() {
        const history = JSON.parse(localStorage.getItem('qrHistory') || '[]');
        
        if (history.length === 0) {
            this.elements.historyList.innerHTML = '<p class="empty-history">No hay códigos QR guardados aún</p>';
            this.elements.clearHistoryBtn.style.display = 'none';
            return;
        }

        this.elements.clearHistoryBtn.style.display = 'block';
        
        this.elements.historyList.innerHTML = history.map(item => `
            <div class="history-item" onclick="qrGenerator.loadFromHistory('${item.id}')" title="${this.escapeHtml(item.text)}">
                <img src="${item.dataURL}" alt="QR" loading="lazy">
                <p>${this.escapeHtml(item.text.substring(0, 20))}${item.text.length > 20 ? '...' : ''}</p>
            </div>
        `).join('');
    }

    loadFromHistory(id) {
        const history = JSON.parse(localStorage.getItem('qrHistory') || '[]');
        const item = history.find(h => h.id == id);
        
        if (!item) return;

        // Cargar datos
        this.elements.qrText.value = item.text;
        this.elements.qrSize.value = item.size;
        this.updateCounter();
        
        // Regenerar QR
        this.generateQR();
        
        // Scroll arriba
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    clearHistory() {
        if (confirm('¿Seguro que quieres limpiar todo el historial?')) {
            localStorage.removeItem('qrHistory');
            this.loadHistory();
            this.showValidation('🗑️ Historial limpiado', 'success');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showValidation(message, type) {
        const msgEl = this.elements.validationMessage;
        msgEl.textContent = message;
        msgEl.className = `validation-message ${type}`;
        
        // Auto-hide después de 3s
        setTimeout(() => {
            msgEl.className = 'validation-message';
        }, 3000);
    }
}

// Inicializar
let qrGenerator;
document.addEventListener('DOMContentLoaded', () => {
    qrGenerator = new QRGenerator();
});