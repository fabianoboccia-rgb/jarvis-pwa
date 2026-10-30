// JARVIS Interface JavaScript
// The microphone button drives the ElevenLabs ConvAI widget (hidden behind it).

class JARVISInterface {
    constructor() {
        this.chatMessages = document.getElementById('chatMessages');
        this.voiceButton = document.getElementById('voiceButton');
        this.voiceStatus = document.getElementById('voiceStatus');
        this.voiceIndicator = document.getElementById('voiceIndicator');
        this.indicatorLabel = this.voiceIndicator.querySelector('span');
        this.widget = document.querySelector('elevenlabs-convai');
        this.inCall = false;

        this.voiceButton.addEventListener('click', () => this.toggleConversation());
        this.startHUDAnimations();
        this.watchWidget();
    }

    // ---- Voice conversation (ElevenLabs widget) ----

    widgetButtons() {
        const root = this.widget && this.widget.shadowRoot;
        return root ? Array.from(root.querySelectorAll('button')) : [];
    }

    findButton(pattern) {
        return this.widgetButtons().find(b => pattern.test(b.getAttribute('aria-label') || b.textContent || ''));
    }

    toggleConversation() {
        const end = this.findButton(/encerrar|finalizar|desligar|end|hang/i);
        const start = this.findButton(/iniciar|ativar|chamada|start|call/i);
        if (end) {
            end.click();
        } else if (start) {
            this.setState('processing', 'CONECTANDO...');
            start.click();
        } else {
            this.addSystemMessage('[ERROR] WIDGET ELEVENLABS AINDA CARREGANDO');
        }
    }

    // Keep the HUD in sync with the widget: an "end call" button means a call is live.
    watchWidget() {
        const sync = () => {
            const root = this.widget.shadowRoot;
            if (!root) return;
            // Terms dialog must be visible so the user can accept it.
            this.widget.classList.toggle('show-terms', !!this.findButton(/aceitar|accept/i));
            const live = !!this.findButton(/encerrar|finalizar|desligar|end|hang/i);
            if (live === this.inCall) return;
            this.inCall = live;
            if (live) {
                this.addSystemMessage('[AUDIO] CONEXÃO ESTABELECIDA');
                this.setState('listening', 'ESCUTANDO...');
            } else {
                this.addSystemMessage('[AUDIO] CONVERSA ENCERRADA');
                this.setState('idle', 'SISTEMA ATIVO');
            }
        };
        const attach = () => {
            const root = this.widget.shadowRoot;
            if (!root) return setTimeout(attach, 500);
            new MutationObserver(sync).observe(root, { childList: true, subtree: true, attributes: true });
            sync();
        };
        attach();
    }

    setState(state, label) {
        this.voiceButton.className = `voice-button ${state}`;
        this.voiceStatus.querySelector('.status-text').textContent = label;
        this.voiceIndicator.classList.toggle('active', state === 'listening');
        this.indicatorLabel.textContent = label;
    }

    // ---- Chat log ----

    addUserMessage(message) {
        this.addMessage('user-message', `[USER] ${message}`);
    }

    addJARVISMessage(message) {
        this.addMessage('jarvis-message', `[JARVIS] ${message}`);
    }

    addSystemMessage(message) {
        this.addMessage('system-message', message);
    }

    addMessage(className, text) {
        const element = document.createElement('div');
        element.className = `message ${className}`;
        element.innerHTML = `
            <div class="message-content">
                <p>${this.escapeHtml(text)}</p>
                <span class="message-time">${this.getCurrentTime()}</span>
            </div>
        `;
        this.chatMessages.appendChild(element);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    getCurrentTime() {
        return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ---- HUD decoration ----

    startHUDAnimations() {
        const loadingBars = document.querySelectorAll('.loading-progress');
        const chartBars = document.querySelectorAll('.bar');
        const chartLabels = document.querySelectorAll('.chart-labels span');
        const circles = document.querySelectorAll('.display-circle .circle-label');
        const logContent = document.querySelector('.log-content');

        setInterval(() => {
            loadingBars.forEach(bar => {
                const width = parseInt(bar.style.width, 10);
                const next = Math.max(20, Math.min(100, width + (Math.random() - 0.5) * 10));
                bar.style.width = next + '%';
            });
        }, 2000);

        setInterval(() => {
            chartBars.forEach((bar, index) => {
                const height = Math.floor(Math.random() * 50) + 30;
                bar.style.height = height + '%';
                chartLabels[index].textContent = height;
            });
        }, 3000);

        setInterval(() => {
            circles.forEach(circle => {
                if (Math.random() > 0.7) {
                    circle.textContent = Math.floor(Math.random() * 100);
                }
            });
        }, 3000);

        const logEntries = [
            '[SCAN] SYSTEM INTEGRITY CHECK',
            '[DATA] PROCESSING USER QUERY',
            '[AI] NEURAL NETWORK ACTIVE',
            '[SECURITY] ENCRYPTION ENABLED',
            '[MONITOR] REAL-TIME ANALYSIS',
            '[STATUS] ALL SYSTEMS OPERATIONAL'
        ];
        setInterval(() => {
            const line = document.createElement('div');
            line.className = 'log-line';
            line.textContent = logEntries[Math.floor(Math.random() * logEntries.length)];
            logContent.appendChild(line);
            while (logContent.children.length > 8) {
                logContent.firstElementChild.remove();
            }
        }, 5000);
    }
}

const jarvis = new JARVISInterface();
window.jarvisInterface = jarvis;

// Space bar toggles the conversation, same as the mic button
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        jarvis.toggleConversation();
    }
});

// Home-screen app (PWA): lets the page open instantly and work offline
// (minus voice, which always needs the network) once added to the iPhone's
// home screen. Harmless when loaded as a plain page in a browser tab.
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch((error) => {
            console.error('Service worker registration failed:', error);
        });
    });
}
