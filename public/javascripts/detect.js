const video = document.getElementById('video');
const startButton = document.getElementById('start');
const stopButton = document.getElementById('stop');
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
let model;

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {width: 640, height: 480},
    });
    video.srcObject = stream;
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

async function loadModel() {
    model = await cocoSsd.load();
}

async function detectFrame() {
    const predictions = await model.detect(video);
    context.clearRect(0, 0, canvas.width, canvas.height);
    predictions.forEach(prediction => {
        context.beginPath();
        context.rect(...prediction.bbox);
        context.lineWidth = 2;
        context.strokeStyle = 'red';
        context.fillStyle = 'red';
        context.stroke();

        // Draw white background for text
        context.fillStyle = 'white';
        context.fillRect(prediction.bbox[0], prediction.bbox[1] > 10 ? prediction.bbox[1] - 20 : 0, context.measureText(`${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`).width, 20);

        // Draw text
        context.fillStyle = 'red';
        context.font = '16px Arial';
        context.fillText(
            `${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`,
            prediction.bbox[0],
            prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
        );
    });
    requestAnimationFrame(detectFrame);
}

startButton.addEventListener('click', async () => {
    await setupCamera();
    await loadModel();
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    video.parentNode.insertBefore(canvas, video.nextSibling);
    detectFrame();
});

stopButton.addEventListener('click', () => {
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    video.srcObject = null;
    context.clearRect(0, 0, canvas.width, canvas.height);
});
