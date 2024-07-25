const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
let sections = [];
let spinning = false;
let popupOpen = false; // Flag to track if SweetAlert2 popup is open

const addNameBtn = document.getElementById('addNameBtn');
addNameBtn.addEventListener('click', addName);

const spinBtn = document.getElementById('spinBtn');
spinBtn.addEventListener('click', spinWheel);

const saveWheelBtn = document.getElementById('saveWheelBtn');
saveWheelBtn.addEventListener('click', saveWheel);

const resetWheelBtn = document.getElementById('resetWheelBtn');
resetWheelBtn.addEventListener('click', resetWheel);

const wheelNameInput = document.getElementById('wheelNameInput');

document.addEventListener('keydown', (event) => {
    if (popupOpen) {
        handlePopupKey(event);
    } else {
        handleMainKey(event);
    }
});

canvas.addEventListener('click', () => {
    if (!spinning && !popupOpen) {
        spinWheel();
    }
});

function handleMainKey(event) {
    if ((event.key === 's' || event.key === 'S') && !spinning) {
        spinWheel();
    } else if (event.key === '0') {
        toggleButtons();
    }
}

function handlePopupKey(event) {
    if (event.key === '1') {
        // Trigger 'Replace' button
        document.querySelector('.swal2-confirm').click();
    } else if (event.key === '2') {
        // Trigger 'Remove' button
        document.querySelector('.swal2-deny').click();
    } else if (event.key === 'p' || event.key === 'P') {
        Swal.close();
    }
}

function toggleButtons() {
    const controlsDiv = document.getElementById('controls');
    const buttons = controlsDiv.querySelectorAll('button');
    const nameInput = document.getElementById('nameInput');
    const colorInput = document.getElementById('colorInput');

    buttons.forEach(button => {
        button.style.display = button.style.display === 'none' ? 'inline-block' : 'none';
    });

    nameInput.style.display = nameInput.style.display === 'none' ? 'inline-block' : 'none';
    colorInput.style.display = colorInput.style.display === 'none' ? 'inline-block' : 'none';
}

const spinSound = new Audio('spinner-sound-36693.mp3');

function addName() {
    const nameInput = document.getElementById('nameInput');
    const colorInput = document.getElementById('colorInput');
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

function isColorLight(color) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    return luminance > 186;
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
        ctx.font = 'bold 40px Arial';

        const maxTextWidth = radius - 20;
        const text = section.name;
        let textWidth = ctx.measureText(text).width;

        if (textWidth > maxTextWidth) {
            ctx.font = 'bold 18px Arial';
            textWidth = ctx.measureText(text).width;

            if (textWidth > maxTextWidth) {
                ctx.font = 'bold 16px Arial';
            }
        }

        ctx.fillText(text, radius / 2, 0);
        ctx.restore();
    });
}

function spinWheel() {
    if (spinning || sections.length === 0 || popupOpen) return;

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

            popupOpen = true; // Set flag to indicate popup is open

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
                    popupOpen = false; // Reset flag when popup closes
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

loadSavedWheel(); // Load the saved wheel if available
drawWheel();
