/**
 * @file Detects objects in the webcam feed using the COCO-SSD model.
 * This file contains the following functionalities:
 * - Setting up the webcam feed.
 * - Loading the COCO-SSD model for object detection.
 * - Detecting objects in the video feed and drawing bounding boxes and labels on a canvas.
 * - Event listeners for starting and stopping the object detection.
 */

// Import TensorFlow.js and COCO-SSD
const tf = require('@tensorflow/tfjs');
const cocoSsd = require('@tensorflow-models/coco-ssd');

/**
 * The video element that displays the webcam feed.
 * @type {HTMLElement}
 */
const video = document.getElementById('video');
/**
 * The start button element that starts the object detection
 * @type {HTMLElement}
 */
const startButton = document.getElementById('start');
/**
 * The stop button element that stops the object detection
 * @type {HTMLElement}
 */
const stopButton = document.getElementById('stop');
/**
 * The canvas element that displays the detected objects.
 * @type {HTMLCanvasElement}
 */
const canvas = document.createElement('canvas');
/**
 * The 2D drawing context of the canvas element.
 * @type {CanvasRenderingContext2D}
 */
const context = canvas.getContext('2d');
/**
 * The COCO-SSD model for object detection.
 */
let model;

/**
 * Sets up the camera by requesting access to the user's webcam.
 * @returns {Promise<HTMLVideoElement>} A promise that resolves with the video element when the camera is ready.
 */
async function setupCamera() {
    // Request access to the user's webcam with specified dimensions
    const stream = await navigator.mediaDevices.getUserMedia({
        video: {width: 640, height: 480},
    });
    // Set the video source to the webcam stream
    video.srcObject = stream;
    // Return a promise that resolves when the video metadata is loaded
    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
}

/**
 * Loads the COCO-SSD model for object detection.
 * @returns {Promise<void>} A promise that resolves when the model is loaded.
 */
async function loadModel() {
    // Load the COCO-SSD model and assign it to the model variable
    model = await cocoSsd.load();
}

/**
 * Detects objects in the current video frame and draws bounding boxes and labels on the canvas.
 * @returns {Promise<void>} A promise that resolves when the detection and drawing are complete.
 */
async function detectFrame() {
    // Detect objects in the video frame
    const predictions = await model.detect(video);
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    // Iterate over each prediction
    predictions.forEach(prediction => {
        // Draw bounding box
        context.beginPath();
        context.rect(...prediction.bbox);
        context.lineWidth = 2;
        context.strokeStyle = 'red';
        context.fillStyle = 'red';
        context.stroke();

        // Draw white background for text
        context.fillStyle = 'white';
        context.fillRect(prediction.bbox[0], prediction.bbox[1] > 10 ? prediction.bbox[1] - 20 : 0,
            context.measureText(`${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`).width, 20);

        // Draw text
        context.fillStyle = 'red';
        context.font = '16px Arial';
        context.fillText(
            `${prediction.class} (${(prediction.score * 100).toFixed(2)}%)`,
            prediction.bbox[0],
            prediction.bbox[1] > 10 ? prediction.bbox[1] - 5 : 10
        );
    });
    // Request the next animation frame to continue detection
    requestAnimationFrame(detectFrame);
}

/**
 * Event listener for the start button click event.
 * Sets up the camera, loads the model, and starts the detection loop.
 */
startButton.addEventListener('click', async () => {
    // Set up the camera
    await setupCamera();
    // Load the model
    await loadModel();
    // Set the canvas dimensions to match the video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    // Insert the canvas into the DOM after the video element
    video.parentNode.insertBefore(canvas, video.nextSibling);
    // Start the detection loop
    detectFrame();
});

/**
 * Event listener for the stop button click event.
 * Stops the video stream and clears the canvas.
 */
stopButton.addEventListener('click', () => {
    // Get the video stream
    const stream = video.srcObject;
    // Get all tracks from the stream
    const tracks = stream.getTracks();
    // Stop each track
    tracks.forEach(track => track.stop());
    // Clear the video source
    video.srcObject = null;
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
});
