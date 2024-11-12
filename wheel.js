const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
let sections = [];
let spinning = false;
let popupOpen = false; // Flag to track if SweetAlert2 popup is open
let confettiInterval;


document.getElementById('uploadLogoButton').addEventListener('click', function() {
    document.getElementById('logoFileInput').click();  // Trigger the file input
});

document.getElementById('logoFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            logoImage = new Image();
            logoImage.onload = function() {
                setLogoImage();  // Call function to display the logo
                drawWheel();  // Redraw the wheel to ensure logo displays correctly
            };
            logoImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

function setLogoImage(logoSrc = null) {
    const logoOverlay = document.getElementById('logoOverlay');
    if (logoOverlay) {
        // Determine the source of the logo: either from the passed logoSrc or from the global logoImage variable
        const logoToUse = logoSrc || (typeof logoImage !== 'undefined' ? logoImage.src : '');

        // If there's a valid logo source, set it and display the logo; otherwise, hide it
        if (logoToUse) {
            logoOverlay.src = logoToUse;
            logoOverlay.style.display = 'block'; // Show the logo
        } else {
            logoOverlay.style.display = 'none'; // Hide the logo if no source
        }

        // Calculate the inner circle's diameter based on the canvas width
        const innerCircleDiameter = canvas.width * 0.24; // Adjust size as needed

        // Set logo size to fit within the inner circle
        logoOverlay.style.width = `${innerCircleDiameter}px`;
        logoOverlay.style.height = `${innerCircleDiameter}px`;
    }

    drawWheel();  // Ensure the wheel is redrawn after updating the logo
}






const addNameBtn = document.getElementById('addNameBtn');
addNameBtn.addEventListener('click', addName);

// Get the fullscreen button
const fullscreenBtn = document.getElementById('fullscreenBtn');

// Add event listener for fullscreen button click
fullscreenBtn.addEventListener('click', toggleFullScreen);

// Function to toggle fullscreen mode
function toggleFullScreen() {
    const controlsDiv = document.getElementById('controls');
    if (!document.fullscreenElement) {
        // If not in fullscreen, request fullscreen for the entire document
        document.documentElement.requestFullscreen().then(() => {
            controlsDiv.style.display = 'none'; // Hide buttons
        }).catch((err) => {
            alert(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        // If already in fullscreen, exit fullscreen mode
        document.exitFullscreen();
        controlsDiv.style.display = 'flex'; // Show buttons again
    }
}


/// Detect fullscreen change and update the button text and visibility accordingly
document.addEventListener('fullscreenchange', () => {
    const controlsDiv = document.getElementById('controls');
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = 'Exit Fullscreen';
        controlsDiv.style.display = 'none'; // Hide buttons in fullscreen
    } else {
        fullscreenBtn.textContent = 'Fullscreen';
        controlsDiv.style.display = 'flex'; // Show buttons again
    }
});



const spinBtn = document.getElementById('spinBtn');
spinBtn.addEventListener('click', spinWheel);

const saveWheelBtn = document.getElementById('saveWheelBtn');
saveWheelBtn.addEventListener('click', saveWheel);

const resetWheelBtn = document.getElementById('resetWheelBtn');
resetWheelBtn.addEventListener('click', resetWheel);

const dingSound = new Audio('ding.mp3'); // Replace with your actual ding sound file

// Ensure the canvas is responsive
function resizeCanvas() {
    const minDimension = Math.min(window.innerWidth * 0.8, window.innerHeight * 0.8); // 80% of the smaller dimension
    canvas.width = minDimension;
    canvas.height = minDimension;
    drawWheel();  // Redraw the wheel after resizing

     // Resize and reposition the logo if it exists
     setLogoImage();
}

// Call this function on window resize
window.addEventListener('resize', resizeCanvas);

// Make sure canvas resizes correctly when the page loads
document.addEventListener('DOMContentLoaded', resizeCanvas);

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
        document.querySelector('.swal2-confirm').click();
    } else if (event.key === '2') {
        document.querySelector('.swal2-deny').click();
    } else if (event.key === 'p' || event.key === 'P') {
        Swal.close();
        stopConfetti(); // Stop confetti when popup is closed
        popupOpen = false; // Set the flag to false when the popup is closed
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
const applauseSound = new Audio('applause.mp3'); // Add applause sound

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
    const innerCircleRadius = radius * 0.25; // Adjust the size of the white circle (25% of the wheel radius)

    // Calculate font size based on canvas size (5% of the smaller dimension of canvas)
    const fontSize = Math.min(canvas.width, canvas.height) * 0.05;
    ctx.font = `bold ${fontSize}px Arial`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each section of the wheel
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

        // Ensure text does not go under the inner circle
        const maxTextWidth = radius - innerCircleRadius - 20;
        let textWidth = ctx.measureText(section.name).width;

        if (textWidth > maxTextWidth) {
            // Scale down font if text is too wide
            ctx.font = `bold ${fontSize * 0.8}px Arial`;
            textWidth = ctx.measureText(section.name).width;

            if (textWidth > maxTextWidth) {
                ctx.font = `bold ${fontSize * 0.6}px Arial`;
            }
        }

        // Position the text halfway between the inner circle and the edge
        ctx.fillText(section.name, (radius + innerCircleRadius) / 2, 0);
        ctx.restore();
    });

    // Draw the white static circle in the center
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerCircleRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF'; // White color for the inner circle
    ctx.fill();
    ctx.stroke(); // Optional: Add an outline to the white circle
}

function spinWheel() {
    if (spinning || sections.length === 0 || popupOpen) return;

    spinning = true;
    applauseSound.pause(); // Stop applause sound if it's playing
    const duration = 7000;
    const spins = 15;
    const endAngle = Math.random() * 2 * Math.PI;

    let start;
    let lastIndex = -1; // Track the last slice index

    function animate(timestamp) {
        if (!start) start = timestamp;
        const elapsed = timestamp - start;

        if (elapsed < duration) {
            const progress = elapsed / duration;
            // Modify the easing for smoother acceleration
            const easeInOutProgress = progress < 0.5 
                ? 3 * Math.pow(progress, 2)  // Accelerate
                : -1 + (4 - 2 * progress) * progress; // Decelerate

            const currentAngle = (spins * 2 * Math.PI * easeInOutProgress) + endAngle;

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(currentAngle);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);
            drawWheel();
            ctx.restore();

            // Determine the current winning index
            const winningIndex = Math.floor(((2 * Math.PI - (currentAngle % (2 * Math.PI))) / (2 * Math.PI)) * sections.length);

            // Play ding sound if the index has changed
            if (winningIndex !== lastIndex) {
                dingSound.currentTime = 0; // Reset sound to start
                dingSound.play();
                lastIndex = winningIndex; // Update the last index
            }

            requestAnimationFrame(animate);
        } else {
            spinning = false;
            applauseSound.play(); // Play applause sound at the end
            applauseSound.currentTime = 0; // Reset to start of the sound
            const totalAngle = spins * 2 * Math.PI + endAngle;
            const winnerIndex = Math.floor(((2 * Math.PI - (totalAngle % (2 * Math.PI))) / (2 * Math.PI)) * sections.length);
            const winner = sections[winnerIndex];

            if (winner.name === 'Spin Again') {
                Swal.fire({
                    title: 'You Get To Spin Again!',
                    confirmButtonText: 'Spin Again',
                    confirmButtonColor: '#3085d6',
                    showCancelButton: true,
                    denyButtonText: 'Remove',
                    showDenyButton: true,
                    cancelButtonText: 'Close',
                    willClose: () => {
                        stopConfetti();
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        stopConfetti();
                        spinWheel();
                    } else if (result.isDenied) {
                        sections.splice(winnerIndex, 1); // Remove "Spin Again" slice
                        drawWheel(); // Redraw the wheel
                    }
                });
                startConfetti();
            } else {
                Swal.fire({
                    title: 'Winner!',
                    text: `${winner.name} has won!`,
                    showCancelButton: true,
                    confirmButtonText: 'Replace',
                    denyButtonText: 'Remove',
                    cancelButtonText: 'Close',
                    showDenyButton: true,
                    willClose: () => {
                        applauseSound.pause(); // Stop applause sound when the popup closes
                        applauseSound.currentTime = 0; // Reset to start of applause sound
                        stopConfetti();
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        sections[winnerIndex].name = 'Spin Again';
                        drawWheel();
                    } else if (result.isDenied) {
                        sections.splice(winnerIndex, 1);
                        drawWheel();
                    }
                    stopConfetti();
                    popupOpen = false;
                });
                startConfetti();
            }
        }
    }

    requestAnimationFrame(animate);
}



function startConfetti() {
    confettiInterval = setInterval(() => {
        confetti({
            particleCount: 120,
            spread: 360,
            angle: 90,
            origin: {
                x: Math.random(),
                y: Math.random()
            },
            gravity: 0.8
        });
    }, 350);
}

function stopConfetti() {
    clearInterval(confettiInterval);
    confetti({
        particleCount: 0 // This ensures no particles remain
    });
}

// Save wheel configuration to local storage
function saveWheel() {
    const data = JSON.stringify(sections);
    localStorage.setItem('savedWheel', data);
    alert('Wheel saved successfully!'); // Optional: Notify the user
}

// Reset wheel and clear saved data
function resetWheel() {
    sections = [];
    localStorage.removeItem('savedWheel'); // Clear saved wheel from local storage
    // Reset the logo (hide and clear the logo image)
    const logoOverlay = document.getElementById('logoOverlay');
    if (logoOverlay) {
        logoOverlay.style.display = 'none'; // Hide the logo
        logoOverlay.src = '';  // Clear the logo source
    }

    // Optionally, reset any other relevant settings (e.g., wheel rotation state, etc.)
    wheelRotation = 0;
    drawWheel(); // Redraw the wheel after reset
}

// Load wheel from local storage (if needed on page load)
function loadWheel() {
    const savedWheel = localStorage.getItem('savedWheel');
    if (savedWheel) {
        sections = JSON.parse(savedWheel);
        drawWheel();
    }
}

// Call loadWheel on page load if you want to load it when the page first opens
document.addEventListener('DOMContentLoaded', loadWheel);


// Export wheel configuration to a JSON file
function exportWheelConfig() {
    const config = {
        sections: sections,  // Wheel sections
        logo: document.getElementById('logoOverlay').src || "",  // The logo image (base64 or URL)
    };
    const configBlob = new Blob([JSON.stringify(config)], { type: 'application/json' });
    const url = URL.createObjectURL(configBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wheelConfig.json';  // Name of the exported file
    link.click();
    URL.revokeObjectURL(url);
}

// Add event listener for exporting configuration
document.getElementById('exportWheelBtn').addEventListener('click', exportWheelConfig);


// Handle the "Import JSON" button click
document.getElementById('importJsonBtn').addEventListener('click', function() {
    document.getElementById('jsonFileInput').click();  // Trigger the file input
});

// Load JSON file
document.getElementById('jsonFileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);

                // Validate and apply sections
                if (data.sections && Array.isArray(data.sections)) {
                    sections = data.sections;
                    drawWheel();
                } else {
                    alert('Invalid JSON structure. Ensure the file contains a "sections" array.');
                }

                // Load logo if available
                if (data.logo) {
                    setLogoImage(data.logo);  // Pass logo source to setLogoImage
                }

            } catch (error) {
                alert('Error reading JSON file: ' + error.message);
            }
        };
        reader.readAsText(file);
    } else {
        alert('Please upload a valid JSON file.');
    }
});


// Add event listener for exporting configuration
document.getElementById('exportWheelBtn').addEventListener('click', exportWheelConfig);
