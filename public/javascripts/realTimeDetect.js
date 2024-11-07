const video = document.getElementById('video');
const startButton = document.getElementById('start-detection');
const stopButton = document.getElementById('stop-detection');
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const objectSelectForm = document.getElementById('object-selection-form');
let model, sessionID, selectedObjects = [];
let foundObjects = new Set();

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadModel() {
    model = await cocoSsd.load({ base: 'mobilenet_v2' });
}

async function detectFrame() {
    const predictions = await model.detect(video);
    context.clearRect(0, 0, canvas.width, canvas.height);
    const detections = [];

    predictions.forEach(prediction => {
        if (selectedObjects.includes(prediction.class) && prediction.score >= 0.85) {
            context.beginPath();
            context.rect(...prediction.bbox);
            context.lineWidth = 2;
            context.strokeStyle = 'red';
            context.fillStyle = 'red';
            context.stroke();

            context.fillStyle = 'white';
            context.fillRect(prediction.bbox[0], prediction.bbox[1] > 10 ? prediction.bbox[1] - 20 : 0,
                context.measureText(`${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`).width, 20);

            context.fillStyle = 'red';
            context.font = '16px Arial';
            context.fillText(
                `${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`,
                prediction.bbox[0],
                prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
            );

            if (!foundObjects.has(prediction.class)) {
                foundObjects.add(prediction.class);
                detections.push({
                    itemName: prediction.class,
                    boundingBox: prediction.bbox,
                    confidence: prediction.score
                });
                showAnimation(`Object ${foundObjects.size} (${prediction.class}) of ${selectedObjects.length} found`);
            }
        }
    });

    if (detections.length > 0) {
        const dataUrl = captureFrameWithCanvas();
        await logDetections(detections, dataUrl);
    }

    if (foundObjects.size < selectedObjects.length) {
        requestAnimationFrame(detectFrame);
    } else {
        console.log('All selected objects detected');
    }
}

function captureFrameWithCanvas() {
    const tempCanvas = document.createElement('canvas');
    const tempContext = tempCanvas.getContext('2d');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;

    tempContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    tempContext.drawImage(canvas, 0, 0);

    return tempCanvas.toDataURL('image/png');
}

async function logDetections(detections, dataUrl) {
    const response = await fetch('/realTimeDetect/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionID, detections, dataUrl })
    });

    if (!response.ok) {
        throw new Error('Failed to log detections');
    }
}

function showAnimation(message) {
    const animationMessage = document.getElementById('animation-message');
    animationMessage.innerText = message;
    animationMessage.style.display = 'block';
}

async function endSession() {
    const response = await fetch('/realTimeDetect/end', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionID })
    });

    if (!response.ok) {
        throw new Error('Failed to end detection session');
    }
}

startButton.addEventListener('click', async (event) => {
    event.preventDefault();
    selectedObjects = Array.from(objectSelectForm.querySelectorAll('input[name="selectedObjects"]:checked')).map(input => input.value);

    const response = await fetch('/realTimeDetect/start', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ selectedObjects })
    });

    const data = await response.json();
    sessionID = data.sessionID;

    await setupCamera();
    await loadModel();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    detectFrame();
});

stopButton.addEventListener('click', async () => {
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
    context.clearRect(0, 0, canvas.width, canvas.height);

    await endSession();
});