// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const canvas = document.getElementById('warehouseCanvas');
const ctx = canvas.getContext('2d');

let bgImage = null;
let rackX = 375;
let rackY = 250;
let isDragging = false;
let dragStartX, dragStartY;

// File Upload Handler (Image & PDF)
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type === "application/pdf") {
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            pdfjsLib.getDocument(typedarray).promise.then(pdf => {
                pdf.getPage(1).then(page => {
                    const tempCanvas = document.createElement('canvas');
                    const tempCtx = tempCanvas.getContext('2d');
                    const viewport = page.getViewport({ scale: 1.5 });

                    tempCanvas.width = viewport.width;
                    tempCanvas.height = viewport.height;

                    const renderContext = {
                        canvasContext: tempCtx,
                        viewport: viewport
                    };

                    page.render(renderContext).promise.then(() => {
                        bgImage = new Image();
                        bgImage.onload = function() {
                            drawCanvas();
                        };
                        bgImage.src = tempCanvas.toDataURL();
                    });
                });
            });
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        const reader = new FileReader();
        reader.onload = function(e) {
            bgImage = new Image();
            bgImage.onload = function() {
                drawCanvas();
            };
            bgImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function calculate() {
    const length = parseFloat(document.getElementById('depotL').value) || 0;
    const width = parseFloat(document.getElementById('depotW').value) || 0;
    const height = parseFloat(document.getElementById('depotH').value) || 0;

    const surface = length * width;
    const volume = surface * height;

    document.getElementById('resSurface').innerText = `${surface} m²`;
    document.getElementById('resVolume').innerText = `${volume} m³`;

    const bays = parseInt(document.getElementById('numBays').value) || 1;
    const levels = parseInt(document.getElementById('numLevels').value) || 1;

    const numEchelles = bays + 1;
    const numLisses = bays * levels * 2;
    const totalPrice = (numEchelles * 240) + (numLisses * 50) + (numEchelles * 35) + (numEchelles * 2 * 12);

    document.getElementById('resTotalPrice').innerText = `${totalPrice.toLocaleString('fr-FR')} TND`;
    drawCanvas();
}

function drawCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImage) {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#11151c';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#8b949e';
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("Importer un fichier PDF ou Image pour afficher le plan", canvas.width / 2, canvas.height / 2);
    }

    const bays = parseInt(document.getElementById('numBays').value) || 1;
    const levels = parseInt(document.getElementById('numLevels').value) || 1;
    const angle = parseInt(document.getElementById('rackAngle').value) || 0;

    const bayWidth = 40;
    const rackWidth = bays * bayWidth;
    const rackHeight = 60;

    ctx.save();
    ctx.translate(rackX, rackY);
    ctx.rotate((angle * Math.PI) / 180);

    ctx.fillStyle = 'rgba(31, 111, 235, 0.4)';
    ctx.strokeStyle = '#58a6ff';
    ctx.lineWidth = 2;
    ctx.fillRect(-rackWidth/2, -rackHeight/2, rackWidth, rackHeight);
    ctx.strokeRect(-rackWidth/2, -rackHeight/2, rackWidth, rackHeight);

    ctx.strokeStyle = '#3fb950';
    ctx.lineWidth = 2;
    for (let i = 0; i <= bays; i++) {
        let x = -rackWidth/2 + (i * bayWidth);
        ctx.beginPath();
        ctx.moveTo(x, -rackHeight/2);
        ctx.lineTo(x, rackHeight/2);
        ctx.stroke();
    }

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${bays} Travées (${levels} Niveaux)`, 0, 4);

    ctx.restore();
}

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (Math.abs(mouseX - rackX) < 120 && Math.abs(mouseY - rackY) < 120) {
        isDragging = true;
        dragStartX = mouseX - rackX;
        dragStartY = mouseY - rackY;
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        rackX = (e.clientX - rect.left) - dragStartX;
        rackY = (e.clientY - rect.top) - dragStartY;
        drawCanvas();
    }
});

canvas.addEventListener('mouseup', () => isDragging = false);
canvas.addEventListener('mouseleave', () => isDragging = false);

document.addEventListener('DOMContentLoaded', calculate);