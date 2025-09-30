// Aguarda o carregamento completo do DOM antes de executar o script
document.addEventListener('DOMContentLoaded', () => {

    // Seleção dos elementos da interface (DOM elements)
    const initialVelocitySlider = document.getElementById('initialVelocity');
    const launchAngleSlider = document.getElementById('launchAngle');
    const gravityInput = document.getElementById('gravity');
    const initialVelocityValue = document.getElementById('initialVelocityValue');
    const launchAngleValue = document.getElementById('launchAngleValue');
    const launchButton = document.getElementById('launchButton');
    
    const rangeValueEl = document.getElementById('rangeValue');
    const heightValueEl = document.getElementById('heightValue');
    const timeValueEl = document.getElementById('timeValue');
    const vxValueEl = document.getElementById('vxValue');
    const vyValueEl = document.getElementById('vyValue');
    
    const ctx = document.getElementById('trajectoryChart').getContext('2d');
    let trajectoryChart;
    let animationFrameId;

    // Função para calcular os dados físicos
    function calculatePhysics() {
        const v0 = parseFloat(initialVelocitySlider.value);
        const angleDeg = parseFloat(launchAngleSlider.value);
        const g = parseFloat(gravityInput.value) || 9.8;
        const angleRad = angleDeg * (Math.PI / 180);
        
        const v0x = v0 * Math.cos(angleRad);
        const v0y = v0 * Math.sin(angleRad);
        
        const timeOfFlight = (2 * v0y) / g;
        const maxRange = v0x * timeOfFlight;
        const maxHeight = (v0y * v0y) / (2 * g);
        
        return { v0, angleRad, g, v0x, v0y, timeOfFlight, maxRange, maxHeight };
    }
    
    // Função para atualizar os resultados na interface
    function updateResults() {
        const { v0x, v0y, timeOfFlight, maxRange, maxHeight } = calculatePhysics();
        
        rangeValueEl.textContent = `${maxRange.toFixed(2)} m`;
        heightValueEl.textContent = `${maxHeight.toFixed(2)} m`;
        timeValueEl.textContent = `${timeOfFlight.toFixed(2)} s`;
        vxValueEl.textContent = `${v0x.toFixed(2)} m/s`;
        vyValueEl.textContent = `${v0y.toFixed(2)} m/s`;
    }

    // Função para gerar os pontos da trajetória para o gráfico
    function createTrajectoryData() {
        const { v0, angleRad, g, v0x, timeOfFlight } = calculatePhysics();
        const data = [];
        const steps = 100;
        
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * timeOfFlight;
            const x = v0x * t;
            const y = (v0 * Math.sin(angleRad) * t) - (0.5 * g * t * t);
            if (y >= 0) {
                data.push({ x, y });
            }
        }
        return data;
    }

    // Função para desenhar ou atualizar o gráfico
    function drawChart() {
        const trajectoryData = createTrajectoryData();
        const { maxRange, maxHeight } = calculatePhysics();

        if (trajectoryChart) {
            trajectoryChart.destroy();
        }

        trajectoryChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Trajetória',
                    data: trajectoryData,
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    borderWidth: 3,
                    pointRadius: 0,
                    fill: true,
                    tension: 0.1
                }, {
                    label: 'Projétil',
                    data: [],
                    backgroundColor: '#C81E1E',
                    pointRadius: 6,
                    pointStyle: 'circle',
                    showLine: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Distância (m)', font: { size: 14 } },
                        min: 0,
                        max: Math.ceil(maxRange / 10) * 10 || 10
                    },
                    y: {
                        type: 'linear',
                        title: { display: true, text: 'Altura (m)', font: { size: 14 } },
                        min: 0,
                        max: Math.ceil(maxHeight / 10) * 10 || 10
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                },
                animation: { duration: 0 }
            }
        });
    }
    
    // Função para animar o lançamento do projétil no gráfico
    function animateLaunch() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        launchButton.disabled = true;

        const trajectoryData = createTrajectoryData();
        const totalFrames = 120; // Duração da animação em quadros
        let currentFrame = 0;

        function animationStep() {
            if (currentFrame > totalFrames) {
                trajectoryChart.data.datasets[1].data = [trajectoryData[trajectoryData.length - 1]];
                trajectoryChart.update();
                launchButton.disabled = false;
                return;
            }

            const progress = currentFrame / totalFrames;
            const dataIndex = Math.floor(progress * (trajectoryData.length - 1));
            const currentPoint = trajectoryData[dataIndex];
            
            if (currentPoint) {
                trajectoryChart.data.datasets[1].data = [currentPoint];
                trajectoryChart.update();
            }

            currentFrame++;
            animationFrameId = requestAnimationFrame(animationStep);
        }

        animationFrameId = requestAnimationFrame(animationStep);
    }

    // Função principal para atualizar toda a interface
    function updateUI() {
        initialVelocityValue.textContent = `${initialVelocitySlider.value} m/s`;
        launchAngleValue.textContent = `${launchAngleSlider.value}°`;
        updateResults();
        drawChart();
    }

    // Adiciona "escutadores" de eventos para os controles
    initialVelocitySlider.addEventListener('input', updateUI);
    launchAngleSlider.addEventListener('input', updateUI);
    gravityInput.addEventListener('change', updateUI);
    launchButton.addEventListener('click', animateLaunch);
    
    // Inicializa a interface assim que a página é carregada
    updateUI();
});