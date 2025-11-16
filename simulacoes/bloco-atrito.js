// Espera a página HTML carregar antes de rodar o script
window.addEventListener('DOMContentLoaded', () => {

    // --- 1. Constantes e Parâmetros Iniciais ---
    const g = 9.81;
    const LARGURA_METROS = 20.0;
    const DT = 1 / 60.0;
    const VERMELHO = 'red';
    const CORES_GRAFICO = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

    // --- 2. Referências do HTML (DOM Elements) ---
    // Canvas Principal
    const simCanvas = document.getElementById('simCanvas');
    const simCtx = simCanvas.getContext('2d');
    
    // Canvas dos Gráficos
    const chartVT_canvas = document.getElementById('chartVT');
    const ctxVT = chartVT_canvas.getContext('2d');
    const chartVX_canvas = document.getElementById('chartVX');
    const ctxVX = chartVX_canvas.getContext('2d');

    // Controles
    const muSlider = document.getElementById('muSlider');
    const vSlider = document.getElementById('vSlider');
    const muValueSpan = document.getElementById('muValue');
    const vValueSpan = document.getElementById('vValue');
    const startButton = document.getElementById('startButton');
    const resetButton = document.getElementById('resetButton');

    // Mapeamento: pixels do canvas para metros da simulação
    const PIXELS_POR_METRO = simCanvas.width / LARGURA_METROS;
    const CHAO_Y = 150;
    const TAMANHO_BLOCO_PIXELS = 40;

    // --- 3. A Classe de Simulação (Tradução ATUALIZADA do Python) ---
    class SimulationState {
        constructor() {
            this.colors = CORES_GRAFICO;
            this.reset(0); // Começa parado
            this.isRunning = false; // Começa parado
        }

        reset(v_inicial) {
            // Históricos para os gráficos (como no Python)
            this.t_history = [0];
            this.v_history = [v_inicial];
            this.x_history = [0];
            this.t_segments = [[0]];
            this.v_segments = [[v_inicial]];
            this.x_segments = [[0]];
            
            this.tempo = 0.0;
            this.posMetros = 0.0;
            this.velMetros = v_inicial;
            this.velAntiga = v_inicial;
            this.vInicial = v_inicial;
            this.colorIndex = 0;
            
            // NÃO setamos isRunning = true aqui.
        }

        update(mu) {
            if (!this.isRunning) return; // Só atualiza se estiver rodando
            
            if (this.velMetros === 0.0 && this.velAntiga === 0.0) {
                this.isRunning = false;
                return;
            }

            this.velAntiga = this.velMetros;
            let aceleracao_x = 0.0;
            let bateuNaParede = false;

            if (this.velMetros !== 0) {
                aceleracao_x = -mu * g;
                if (this.velMetros < 0) {
                    aceleracao_x = -aceleracao_x;
                }
            }

            this.velMetros += aceleracao_x * DT;
            this.posMetros += this.velMetros * DT;

            if ((this.velAntiga > 0 && this.velMetros < 0) || (this.velAntiga < 0 && this.velMetros > 0)) {
                this.velMetros = 0.0;
            }

            const tamanhoBlocoMetros = TAMANHO_BLOCO_PIXELS / PIXELS_POR_METRO;
            if (this.posMetros + tamanhoBlocoMetros > LARGURA_METROS) {
                this.posMetros = LARGURA_METROS - tamanhoBlocoMetros;
                this.velMetros = -this.velMetros;
                bateuNaParede = true;
            }
            if (this.posMetros < 0) {
                this.posMetros = 0;
                this.velMetros = -this.velMetros;
                bateuNaParede = true;
            }

            // Lógica de salvar dados (idêntica ao seu Python)
            if (this.velMetros !== 0.0 || this.velAntiga !== 0.0) {
                this.tempo += DT;
                this.t_history.push(this.tempo);
                this.v_history.push(this.velMetros);
                this.x_history.push(this.posMetros);

                if (bateuNaParede) {
                    this.t_segments[this.t_segments.length - 1].push(this.tempo);
                    this.v_segments[this.v_segments.length - 1].push(this.velAntiga);
                    this.x_segments[this.x_segments.length - 1].push(this.posMetros);

                    this.t_segments[this.t_segments.length - 1].push(this.tempo);
                    this.v_segments[this.v_segments.length - 1].push(this.velMetros);
                    this.x_segments[this.x_segments.length - 1].push(this.posMetros);

                    this.colorIndex = (this.colorIndex + 1) % this.colors.length;
                    this.t_segments.push([this.tempo]);
                    this.v_segments.push([this.velMetros]);
                    this.x_segments.push([this.posMetros]);
                } else {
                    this.t_segments[this.t_segments.length - 1].push(this.tempo);
                    this.v_segments[this.v_segments.length - 1].push(this.velMetros);
                    this.x_segments[this.x_segments.length - 1].push(this.posMetros);
                }
            }
        }
    }

    // --- 4. Funções de Desenho (Animação e Gráficos) ---
    
    function drawSimulation(sim) {
        simCtx.clearRect(0, 0, simCanvas.width, simCanvas.height);
        simCtx.fillStyle = '#555';
        simCtx.fillRect(0, CHAO_Y, simCanvas.width, 5);
        simCtx.fillStyle = VERMELHO;
        const xPixel = sim.posMetros * PIXELS_POR_METRO;
        const yPixel = CHAO_Y - TAMANHO_BLOCO_PIXELS;
        simCtx.fillRect(xPixel, yPixel, TAMANHO_BLOCO_PIXELS, TAMANHO_BLOCO_PIXELS);
    }

    // Função genérica para desenhar eixos
    function drawChartAxes(ctx, canvas, xLabel, yLabel, xMax, yMin, yMax) {
        const padding = 30; // Espaço para os labels
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = "10px Arial";
        ctx.fillStyle = "#333";

        // Eixo Y
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.stroke();

        // Eixo X (pode estar no meio se yMin < 0)
        let yZero = yMax / (yMax - yMin);
        let yZeroPixel = padding + (yZero * (canvas.height - 2 * padding));
        if (yMax < 0) yZeroPixel = padding;
        if (yMin > 0) yZeroPixel = canvas.height - padding;
        
        ctx.beginPath();
        ctx.moveTo(padding, yZeroPixel);
        ctx.lineTo(canvas.width - padding, yZeroPixel);
        ctx.stroke();
        
        // Labels
        ctx.fillText(yLabel, padding + 5, padding - 5);
        ctx.fillText(xLabel, canvas.width - padding - 15, yZeroPixel + 10);
        ctx.fillText(yMax.toFixed(1), padding + 5, padding + 10);
        ctx.fillText(yMin.toFixed(1), padding + 5, canvas.height - padding + 5);
        ctx.fillText(xMax.toFixed(1), canvas.width - padding - 5, yZeroPixel + 10);
    }

    // Função para mapear valor para pixel
    function mapCoords(value, minVal, maxVal, minPixel, maxPixel) {
        if (maxVal - minVal === 0) return (minPixel + maxPixel) / 2;
        return ((value - minVal) / (maxVal - minVal)) * (maxPixel - minPixel) + minPixel;
    }

    function drawGraphs(sim) {
        const padding = 30;
        
        // --- 1. Gráfico V x T ---
        let vMax = Math.max(Math.abs(sim.vInicial), 5); // Limite mínimo de 5 m/s
        let vMin = -vMax;
        let tMax = Math.max(sim.tempo, 3); // Limite mínimo de 3 s
        
        drawChartAxes(ctxVT, chartVT_canvas, "t(s)", "v(m/s)", tMax, vMin, vMax);
        
        for (let i = 0; i < sim.t_segments.length; i++) {
            ctxVT.beginPath();
            ctxVT.strokeStyle = sim.colors[i % sim.colors.length];
            ctxVT.lineWidth = 2;
            for (let j = 0; j < sim.t_segments[i].length; j++) {
                let x = mapCoords(sim.t_segments[i][j], 0, tMax, padding, chartVT_canvas.width - padding);
                let y = mapCoords(sim.v_segments[i][j], vMin, vMax, chartVT_canvas.height - padding, padding);
                if (j === 0) ctxVT.moveTo(x, y);
                else ctxVT.lineTo(x, y);
            }
            ctxVT.stroke();
        }

        // --- 2. Gráfico V x X ---
        let xMax = LARGURA_METROS;
        
        drawChartAxes(ctxVX, chartVX_canvas, "x(m)", "v(m/s)", xMax, vMin, vMax);
        
        for (let i = 0; i < sim.x_segments.length; i++) {
            ctxVX.beginPath();
            ctxVX.strokeStyle = sim.colors[i % sim.colors.length];
            ctxVX.lineWidth = 2;
            for (let j = 0; j < sim.x_segments[i].length; j++) {
                let x = mapCoords(sim.x_segments[i][j], 0, xMax, padding, chartVX_canvas.width - padding);
                let y = mapCoords(sim.v_segments[i][j], vMin, vMax, chartVX_canvas.height - padding, padding);
                if (j === 0) ctxVX.moveTo(x, y);
                else ctxVX.lineTo(x, y);
            }
            ctxVX.stroke();
        }
    }


    // --- 5. O "Game Loop" ---
    
    const sim = new SimulationState();
    
    function simulationLoop() {
        const muAtual = parseFloat(muSlider.value);
        sim.update(muAtual); // A lógica de 'isRunning' está dentro do update
        
        drawSimulation(sim);
        drawGraphs(sim);
        
        requestAnimationFrame(simulationLoop);
    }

    // --- 6. Funções de Controle (Botões e Sliders) ---

    // NOVO: Botão Iniciar
    function startSimulation() {
        const v_ini = parseFloat(vSlider.value);
        sim.reset(v_ini); // Prepara a simulação com a nova v_inicial
        sim.isRunning = true; // Inicia o movimento
    }

    // ATUALIZADO: Botão Resetar
    function resetSimulation() {
        sim.reset(0); // Reseta para v_inicial = 0
        sim.isRunning = false; // Garante que esteja parado
        
        // Limpa e redesenha tudo no estado inicial (parado)
        drawSimulation(sim);
        drawGraphs(sim);
    }
    
    startButton.addEventListener('click', startSimulation);
    resetButton.addEventListener('click', resetSimulation);

    muSlider.addEventListener('input', (e) => {
        muValueSpan.textContent = e.target.value;
    });
    
    vSlider.addEventListener('input', (e) => {
        vValueSpan.textContent = e.target.value;
    });

    // --- 7. Iniciar a Simulação ---
    resetSimulation();    // Prepara a simulação no estado inicial (parado)
    simulationLoop();     // Inicia o loop de animação (que desenha, mas não move)
});
