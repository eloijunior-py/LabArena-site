// Espera a página HTML carregar antes de rodar o script
window.addEventListener('DOMContentLoaded', () => {

    // --- 1. Constantes e Parâmetros Iniciais ---
    const g = 9.81;            // Gravidade (m/s^2)
    const LARGURA_METROS = 20.0; // O "plano" tem 20 metros
    const DT = 1 / 60.0;       // Nosso "delta_t" (Δt) fixo (60 quadros/s)
    const VERMELHO = 'red';

    // --- 2. Referências do HTML (DOM Elements) ---
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d'); // O "pincel" para desenhar
    
    const muSlider = document.getElementById('muSlider');
    const vSlider = document.getElementById('vSlider');
    const muValueSpan = document.getElementById('muValue');
    const vValueSpan = document.getElementById('vValue');
    const resetButton = document.getElementById('resetButton');

    // Mapeamento: pixels do canvas para metros da simulação
    const PIXELS_POR_METRO = canvas.width / LARGURA_METROS;
    const CHAO_Y = 150; // Posição Y do chão (em pixels)
    const TAMANHO_BLOCO_PIXELS = 40; // Tamanho do bloco (em pixels)

    // --- 3. A Classe de Simulação (Tradução do Python) ---
    // 'self' vira 'this'
    // 'def __init__' vira 'constructor'
    // 'def update' vira 'update'
    
    class SimulationState {
        constructor() {
            // Não precisamos dos históricos de segmento por enquanto
            this.tempo = 0.0;
            this.posMetros = 0.0;
            this.velMetros = 0.0;
            this.velAntiga = 0.0;
            this.vInicial = 5.0;
            this.isRunning = false; // Novo: controla se a simulação está rodando
        }

        reset(v_inicial) {
            this.tempo = 0.0;
            this.posMetros = 0.0;
            this.velMetros = v_inicial;
            this.velAntiga = v_inicial;
            this.vInicial = v_inicial;
            this.isRunning = true; // Inicia a simulação
        }

        // Esta é a sua lógica de 'update' do Python, traduzida
        update(mu) {
            // Se o bloco já parou, não fazemos nada
            if (!this.isRunning) return;
            
            if (this.velMetros == 0.0 && this.velAntiga == 0.0) {
                this.isRunning = false;
                return;
            }

            this.velAntiga = this.velMetros;
            let aceleracao_x = 0.0;

            if (this.velMetros != 0) {
                aceleracao_x = -mu * g;
                if (this.velMetros < 0) {
                    aceleracao_x = -aceleracao_x;
                }
            }

            this.velMetros += aceleracao_x * DT;
            this.posMetros += this.velMetros * DT;

            // Condição de Parada
            if ((this.velAntiga > 0 && this.velMetros < 0) || (this.velAntiga < 0 && this.velMetros > 0)) {
                this.velMetros = 0.0;
            }

            // Colisão com as Paredes
            const tamanhoBlocoMetros = TAMANHO_BLOCO_PIXELS / PIXELS_POR_METRO;
            
            if (this.posMetros + tamanhoBlocoMetros > LARGURA_METROS) {
                this.posMetros = LARGURA_METROS - tamanhoBlocoMetros;
                this.velMetros = -this.velMetros;
            }
            if (this.posMetros < 0) {
                this.posMetros = 0;
                this.velMetros = -this.velMetros;
            }
            
            // Avança o tempo
            this.tempo += DT;
        }
    }

    // --- 4. Funções de Desenho (Substitui o Matplotlib.patches) ---
    
    function draw(sim) {
        // 1. Limpa a tela
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 2. Desenha o chão
        ctx.fillStyle = '#555'; // Cor do chão
        ctx.fillRect(0, CHAO_Y, canvas.width, 5); // x, y, largura, altura

        // 3. Desenha o Bloco
        ctx.fillStyle = VERMELHO;
        
        // Converte a posição de METROS para PIXELS
        const xPixel = sim.posMetros * PIXELS_POR_METRO;
        
        // O 'y' do bloco (em pixels)
        const yPixel = CHAO_Y - TAMANHO_BLOCO_PIXELS;

        ctx.fillRect(xPixel, yPixel, TAMANHO_BLOCO_PIXELS, TAMANHO_BLOCO_PIXELS);
    }


    // --- 5. O "Game Loop" (Substitui o FuncAnimation) ---
    
    const sim = new SimulationState(); // Cria nosso objeto de simulação
    
    function simulationLoop() {
        // 1. Pega os valores atuais dos sliders
        const muAtual = parseFloat(muSlider.value);
        
        // 2. Roda um passo da física
        sim.update(muAtual);
        
        // 3. Desenha o resultado na tela
        draw(sim);
        
        // 4. Pede ao navegador para chamar esta função de novo no próximo quadro
        // Isso cria um loop contínuo
        requestAnimationFrame(simulationLoop);
    }

    // --- 6. Funções de Controle (Botões e Sliders) ---

    function resetSimulation() {
        const v_ini = parseFloat(vSlider.value);
        sim.reset(v_ini);
    }
    
    // Conecta a função 'resetSimulation' ao clique do botão
    resetButton.addEventListener('click', resetSimulation);

    // Atualiza os textinhos dos sliders
    muSlider.addEventListener('input', (e) => {
        muValueSpan.textContent = e.target.value;
    });
    
    vSlider.addEventListener('input', (e) => {
        vValueSpan.textContent = e.target.value;
    });

    // --- 7. Iniciar a Simulação ---
    resetSimulation();    // Prepara a simulação
    simulationLoop();     // Inicia o loop de animação
});
