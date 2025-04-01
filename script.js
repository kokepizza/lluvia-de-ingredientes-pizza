// Inicialización del canvas
const canvas = document.getElementById('pizzaCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Variables para el seguimiento del mouse
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;

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

// Función para crear un nuevo emoji
function createEmoji(x, y) {
    // Limitar el número de emojis cayendo
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
    // Calcular la altura actual de acumulación
    const currentFillHeight = canvas.height - (fillLevel * maxFillHeight);
    
    if (emoji.y + emoji.size / 2 >= currentFillHeight) {
        // El emoji ha alcanzado la superficie
        emoji.y = currentFillHeight - emoji.size / 2;
        emoji.settled = true;
        
        // Añadir el emoji a los asentados (si no hay demasiados)
        if (settledEmojis.length < maxSettledEmojis) {
            settledEmojis.push({
                value: emoji.value,
                x: emoji.x,
                y: emoji.y,
                size: emoji.size,
                rotation: emoji.rotation
            });
        }
        
        // Actualizar el nivel de llenado
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
    
    // Si llegamos al 50%, vaciar
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
    // Crear el efecto de explosión
    createExplosionEffect();
    
    // Vaciar el arreglo de emojis acumulados
    settledEmojis.length = 0;
    
    // Resetear el nivel de llenado
    fillLevel = 0;
    fillLevelElement.style.height = '0%';
}

// Función para crear un efecto de explosión
function createExplosionEffect() {
    // Limpiar emojis de explosión anteriores
    explosionEmojis.length = 0;
    
    // Crear partículas que salen disparadas en grupos
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

// Función para actualizar los emojis de la explosión
function updateExplosionEmojis() {
    for (let i = explosionEmojis.length - 1; i >= 0; i--) {
        const emoji = explosionEmojis[i];
        
        emoji.x += emoji.velocityX;
        emoji.y += emoji.velocityY;
        emoji.velocityY += 0.3; // Gravedad
        emoji.rotation += emoji.rotationSpeed;
        emoji.opacity -= emoji.fadeSpeed;
        
        // Eliminar cuando sean transparentes
        if (emoji.opacity <= 0) {
            explosionEmojis.splice(i, 1);
        }
    }
}

// Función para actualizar los emojis
function updateEmojis() {
    // Actualizar los emojis que caen
    for (let i = fallingEmojis.length - 1; i >= 0; i--) {
        const emoji = fallingEmojis[i];
        
        // Lógica para emojis normales que caen
        emoji.y += emoji.velocityY;
        emoji.x += emoji.velocityX;
        emoji.velocityY += 0.05; // Gravedad
        emoji.velocityX *= 0.99; // Resistencia
        emoji.rotation += emoji.rotationSpeed;
        
        // Comprobar colisiones
        if (checkEmojiCollision(emoji)) {
            fallingEmojis.splice(i, 1);
        }
        
        // Colisión con los bordes del canvas
        if (emoji.x < 0 || emoji.x > canvas.width) {
            emoji.velocityX *= -0.7;
        }
        
        // Eliminar si salen de la pantalla por abajo
        if (emoji.y > canvas.height + emoji.size) {
            fallingEmojis.splice(i, 1);
        }
    }
    
    // Actualizar los emojis de explosión
    updateExplosionEmojis();
}

// Función para dibujar los emojis
function drawEmojis() {
    // Dibujar emojis acumulados (usando batching)
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
    
    // Dibujar emojis cayendo
    for (const emoji of fallingEmojis) {
        ctx.save();
        ctx.translate(emoji.x, emoji.y);
        ctx.rotate(emoji.rotation);
        ctx.font = `${emoji.size}px Arial`;
        ctx.fillText(emoji.value, 0, 0);
        ctx.restore();
    }
    
    // Dibujar emojis de explosión
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
    // Control de FPS para estabilizar la animación
    if (!lastTime) lastTime = timestamp;
    const elapsed = timestamp - lastTime;
    
    if (elapsed > frameInterval) {
        lastTime = timestamp - (elapsed % frameInterval);
        
        // Limpiar el canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Crear emojis si el mouse está presionado y no hay explosión activa
        if (!explosionActive) {
            if (isMouseDown) {
                // Limitar la creación de emojis
                const emojisToCreate = Math.min(3, maxFallingEmojis - fallingEmojis.length);
                for (let i = 0; i < emojisToCreate; i++) {
                    createEmoji(mouseX, mouseY);
                }
            } else if (Math.random() < 0.1 && fallingEmojis.length < maxFallingEmojis) {
                createEmoji(mouseX, mouseY);
            }
        }
        
        // Actualizar emojis
        updateEmojis();
        
        // Dibujar la línea de superficie
        drawSurface();
        
        // Dibujar todos los emojis
        drawEmojis();
    }
    
    // Continuar la animación
    requestAnimationFrame(animate);
}

// Event listeners para el mouse
canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
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
    // Actualizar la altura máxima de acumulación
    maxFillHeight = canvas.height * 0.5;
}

// Ajustar tamaño del canvas cuando cambia el tamaño de la ventana
window.addEventListener('resize', handleResize);

// Iniciar la animación
requestAnimationFrame(animate);