// Inicialización del canvas
const canvas = document.getElementById('pizzaCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables para el seguimiento del mouse
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;
let hasMouseMoved = false;

// Arreglo para almacenar los emojis activos
const fallingEmojis = [];

// Arreglo para almacenar los emojis acumulados en el fondo
const settledEmojis = [];

// Arreglo para almacenar los emojis de explosión
const explosionEmojis = [];

// Variables para control de FPS
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

// Nivel de llenado actual (0-1)
let fillLevel = 0;
const fillLevelElement = document.getElementById('fillLevel');

// Emojis relacionados con pizza
const pizzaEmojis = [
    '🍕', '🧀', '🍅', '🫑', '🍄', '🥓', '🌶️', '🍍', '🧅', '🫒', '🥩', '🥖'
];

// Altura máxima de acumulación (50% de la altura del canvas)
let maxFillHeight = canvas.height * 0.5;

// Número máximo de emojis acumulados
const maxSettledEmojis = 500;

// Número máximo de emojis de explosión
const maxExplosionEmojis = 200;

// Límite de emojis cayendo al mismo tiempo
const maxFallingEmojis = 100;

// Explosión en curso
let explosionActive = false;

// Variables para el menú
let gameRunning = false;
const startButton = document.getElementById('startButton');
const menu = document.getElementById('menu');

// Función para iniciar el juego
function startGame() {
    gameRunning = true;
    menu.style.display = 'none';
    requestAnimationFrame(animate);
}

// Función para detener el juego
function stopGame() {
    gameRunning = false;
    stopButton.disabled = true;
}

// Función para reiniciar el juego
function restartGame() {
    stopGame();
    resetGame();
    startGame();
}

// Función para reiniciar el estado del juego
function resetGame() {
    fallingEmojis.length = 0;
    settledEmojis.length = 0;
    explosionEmojis.length = 0;
    fillLevel = 0;
    fillLevelElement.style.height = '0%';
}

// Función para crear un nuevo emoji
function createEmoji(x, y) {
    if (fallingEmojis.length >= maxFallingEmojis) return;
    const emoji = {
        value: pizzaEmojis[Math.floor(Math.random() * pizzaEmojis.length)],
        x: x + (Math.random() - 0.5) * 30,
        y: y,
        size: 20 + Math.random() * 20,
        velocityX: (Math.random() - 0.5) * 3,
        velocityY: Math.random() * 2 + 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.05,
        settled: false
    };
    fallingEmojis.push(emoji);
}

// Función para comprobar si un emoji ha alcanzado la superficie de acumulación
function checkEmojiCollision(emoji) {
    const currentFillHeight = canvas.height - (fillLevel * maxFillHeight);
    if (emoji.y + emoji.size / 2 >= currentFillHeight) {
        emoji.y = currentFillHeight - emoji.size / 2;
        emoji.settled = true;
        if (settledEmojis.length < maxSettledEmojis) {
            settledEmojis.push({
                value: emoji.value,
                x: emoji.x,
                y: emoji.y,
                size: emoji.size,
                rotation: emoji.rotation
            });
        }
        updateFillLevel();
        return true;
    }
    return false;
}

// Función para actualizar el nivel de llenado
function updateFillLevel() {
    const newFillLevel = Math.min(settledEmojis.length / maxSettledEmojis, 1);
    fillLevel = newFillLevel;
    fillLevelElement.style.height = (fillLevel * 100) + '%';
    if (fillLevel >= 0.5 && !explosionActive) {
        explosionActive = true;
        setTimeout(() => {
            clearSettledEmojis();
            setTimeout(() => {
                explosionActive = false;
            }, 1500);
        }, 300);
    }
}

// Función para vaciar los emojis acumulados
function clearSettledEmojis() {
    createExplosionEffect();
    settledEmojis.length = 0;
    fillLevel = 0;
    fillLevelElement.style.height = '0%';
}

// Función para crear un efecto de explosión
function createExplosionEffect() {
    explosionEmojis.length = 0;
    for (let i = 0; i < maxExplosionEmojis; i++) {
        const x = Math.random() * canvas.width;
        const y = canvas.height - Math.random() * (maxFillHeight / 2);
        const emoji = {
            value: pizzaEmojis[Math.floor(Math.random() * pizzaEmojis.length)],
            x: x,
            y: y,
            size: 10 + Math.random() * 15,
            velocityX: (Math.random() - 0.5) * 15,
            velocityY: -Math.random() * 15,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.2,
            opacity: 1,
            fadeSpeed: 0.01 + Math.random() * 0.03
        };
        explosionEmojis.push(emoji);
    }
}

// Función para actualizar los emojis
function updateEmojis() {
    for (let i = fallingEmojis.length - 1; i >= 0; i--) {
        const emoji = fallingEmojis[i];
        emoji.y += emoji.velocityY;
        emoji.x += emoji.velocityX;
        emoji.velocityY += 0.05;
        emoji.velocityX *= 0.99;
        emoji.rotation += emoji.rotationSpeed;
        if (checkEmojiCollision(emoji)) {
            fallingEmojis.splice(i, 1);
        }
        if (emoji.x < 0 || emoji.x > canvas.width) {
            emoji.velocityX *= -0.7;
        }
        if (emoji.y > canvas.height + emoji.size) {
            fallingEmojis.splice(i, 1);
        }
    }
    updateExplosionEmojis();
}

// Función para actualizar los emojis de explosión
function updateExplosionEmojis() {
    for (let i = explosionEmojis.length - 1; i >= 0; i--) {
        const emoji = explosionEmojis[i];
        emoji.x += emoji.velocityX;
        emoji.y += emoji.velocityY;
        emoji.velocityY += 0.3;
        emoji.rotation += emoji.rotationSpeed;
        emoji.opacity -= emoji.fadeSpeed;
        if (emoji.opacity <= 0) {
            explosionEmojis.splice(i, 1);
        }
    }
}

// Función para dibujar los emojis
function drawEmojis() {
    ctx.save();
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const emoji of settledEmojis) {
        ctx.save();
        ctx.translate(emoji.x, emoji.y);
        ctx.rotate(emoji.rotation);
        ctx.fillText(emoji.value, 0, 0);
        ctx.restore();
    }
    for (const emoji of fallingEmojis) {
        ctx.save();
        ctx.translate(emoji.x, emoji.y);
        ctx.rotate(emoji.rotation);
        ctx.font = `${emoji.size}px Arial`;
        ctx.fillText(emoji.value, 0, 0);
        ctx.restore();
    }
    for (const emoji of explosionEmojis) {
        ctx.save();
        ctx.globalAlpha = emoji.opacity;
        ctx.translate(emoji.x, emoji.y);
        ctx.rotate(emoji.rotation);
        ctx.font = `${emoji.size}px Arial`;
        ctx.fillText(emoji.value, 0, 0);
        ctx.restore();
    }
    ctx.restore();
}

// Función para dibujar la línea de superficie
function drawSurface() {
    const surfaceY = canvas.height - (fillLevel * maxFillHeight);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, surfaceY);
    ctx.lineTo(canvas.width, surfaceY);
    ctx.stroke();
    ctx.restore();
}

// Función principal de animación
function animate(timestamp) {
    if (!gameRunning) return;
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    if (elapsed > frameInterval) {
        lastTime = timestamp - (elapsed % frameInterval);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (!explosionActive && hasMouseMoved) {
            if (isMouseDown) {
                const emojisToCreate = Math.min(3, maxFallingEmojis - fallingEmojis.length);
                for (let i = 0; i < emojisToCreate; i++) {
                    createEmoji(mouseX, mouseY);
                }
            } else if (Math.random() < 0.1 && fallingEmojis.length < maxFallingEmojis) {
                createEmoji(mouseX, mouseY);
            }
        }
        updateEmojis();
        drawSurface();
        drawEmojis();
    }
    requestAnimationFrame(animate);
}

// Event listeners para el mouse
canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    hasMouseMoved = !hasMouseMoved ? true : hasMouseMoved;
});

canvas.addEventListener('mousedown', () => {
    isMouseDown = true;
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

// Función para manejar el cambio de tamaño de la ventana
function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    maxFillHeight = canvas.height * 0.5;
}

// Ajustar tamaño del canvas cuando cambia el tamaño de la ventana
window.addEventListener('resize', handleResize);

// Event listener para el botón de Start
startButton.addEventListener('click', startGame);

// Mostrar el menú al inicio
menu.style.display = 'block';