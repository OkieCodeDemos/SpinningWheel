const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
let sections = [];
let spinning = false;
let popupOpen = false;

const addNameBtn = document.getElementById('addNameBtn');
const spinBtn = document.getElementById('spinBtn');
const saveWheelBtn = document.getElementById('saveWheelBtn');
const resetWheelBtn = document.getElementById('resetWheelBtn');
const nameInput = document.getElementById('nameInput');
const colorInput = document.getElementById('colorInput');
const spinSound = document.getElementById('spinSound');

addNameBtn.addEventListener('click', addName);
addNameBtn.addEventListener('touchstart', addName); // Added touch event

spinBtn.addEventListener('click', spinWheel);
spinBtn.addEventListener('touchstart', spinWheel); // Added touch event

saveWheelBtn.addEventListener('click', saveWheel);
saveWheelBtn.addEventListener('touchstart', saveWheel); // Added touch event

resetWheelBtn.addEventListener('click', resetWheel);
resetWheelBtn.addEventListener('touchstart', resetWheel); // Added touch event

canvas.addEventListener('click', spinWheel);
canvas.addEventListener('touchstart', spinWheel); // Added touch event

function resizeCanvas() {
    // Set canvas width and height based on the wheel container's size
    const containerWidth = document.getElementById('wheelContainer').offsetWidth;
    canvas.width = containerWidth;
    canvas.height = containerWidth; // Keep canvas square
    drawWheel(); // Redraw the wheel whenever the size changes
}

function addName() {
    const name = nameInput.value.trim();
    const color = colorInput.value;
    if (name) {
        sections.push({ name, color });
        nameInput.value = '';
        colorInput.value = '#000000';
        drawWheel();
    } else {
        alert('Please enter a name');
    }
}

function drawWheel() {
    const radius = canvas.width / 2;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const anglePerSlice = 2 * Math.PI / sections.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    sections.forEach((section, index) => {
        const angle = index * anglePerSlice;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + anglePerSlice);
        ctx.closePath();

        ctx.fillStyle = section.color;
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + anglePerSlice / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isColorLight(section.color) ? '#000' : '#FFF';
        ctx.font = 'bold ' + Math.max(20, radius / 10) + 'px Arial';

        const maxTextWidth = radius - 20;
        const text = section.name;
        let textWidth = ctx.measureText(text).width;

        if (textWidth > maxTextWidth) {
            ctx.font = 'bold ' + Math.max(18, radius / 12) + 'px Arial';
            textWidth = ctx.measureText(text).width;

            if (textWidth > maxTextWidth) {
                ctx.font = 'bold ' + Math.max(16, radius / 14) + 'px Arial';
            }
        }

        ctx.fillText(text, radius / 2, 0);
        ctx.restore();
    });
}

function spinWheel() {
    if (spinning || sections.length === 0 || popupOpen) return;

    resizeCanvas(); // Adjust the canvas size before spinning

    spinning = true;
    spinSound.currentTime = 0;
    spinSound.play();

    const duration = 6000;
    const spins = 20;
    const endAngle = Math.random() * 2 * Math.PI;

    let start;

    function animate(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;

        if (elapsed < duration) {
            const progress = elapsed / duration;
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);

            const currentAngle = (spins * 2 * Math.PI * easeOutProgress) + endAngle;
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(currentAngle);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            drawWheel();
            ctx.restore();
            requestAnimationFrame(animate);
        } else {
            spinning = false;
            spinSound.pause();

            const totalAngle = spins * 2 * Math.PI + endAngle;
            const winningIndex = Math.floor(((2 * Math.PI - (totalAngle % (2 * Math.PI))) / (2 * Math.PI)) * sections.length);
            const winner = sections[winningIndex].name;

            popupOpen = true;

            Swal.fire({
                title: winner === "Spin Again" ? "Spin Again!" : `Congratulations, ${winner}!`,
                width: 600,
                padding: "3em",
                color: "#000",
                background: "#fff",
                customClass: {
                    popup: 'animated bounceInDown'
                },
                stopKeydownPropagation: false,
                didOpen: () => {
                    const confettiDuration = 15 * 1000;
                    const confettiAnimationEnd = Date.now() + confettiDuration;
                    const confettiDefaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

                    function randomInRange(min, max) {
                        return Math.random() * (max - min) + min;
                    }

                    confettiInterval = setInterval(function() {
                        const timeLeft = confettiAnimationEnd - Date.now();

                        if (timeLeft <= 0) {
                            clearInterval(confettiInterval);
                        }

                        const particleCount = 50 * (timeLeft / confettiDuration);
                        confetti({ ...confettiDefaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                        confetti({ ...confettiDefaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
                    }, 250);
                },
                willClose: () => {
                    popupOpen = false;
                    clearInterval(confettiInterval);
                    const confettiCanvas = document.querySelector('canvas.confetti-canvas');
                    if (confettiCanvas) {
                        confettiCanvas.remove();
                    }
                },
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'Replace',
                confirmButtonColor: '#FF0000',
                cancelButtonText: 'Close',
                denyButtonText: 'Remove',
                denyButtonColor: '#FF0000'
            }).then((result) => {
                if (result.isConfirmed) {
                    sections[winningIndex].name = 'Spin Again';
                    drawWheel();
                } else if (result.isDenied) {
                    sections.splice(winningIndex, 1);
                    drawWheel();
                }
            });
        }
    }

    requestAnimationFrame(animate);
}

function saveWheel() {
    localStorage.setItem('wheelSections', JSON.stringify(sections));
    alert('Wheel saved successfully!');
}

function resetWheel() {
    sections = [];
    drawWheel();
}

function loadSavedWheel() {
    const savedSections = localStorage.getItem('wheelSections');
    if (savedSections) {
        sections = JSON.parse(savedSections);
        drawWheel();
    }
}

function isColorLight(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance > 127.5;
}

window.addEventListener('resize', resizeCanvas); // Adjust canvas size on window resize
window.addEventListener('orientationchange', resizeCanvas); // Adjust canvas size on orientation change

loadSavedWheel();
resizeCanvas(); // Initial canvas size adjustment
drawWheel();
