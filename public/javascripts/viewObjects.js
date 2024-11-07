// public/javascripts/viewObjects.js

function showImageModal(imagePath) {
    const modal = document.getElementById('image-modal');
    const modalImage = document.getElementById('modal-image');
    modalImage.src = imagePath; // Set the image source
    modal.style.display = 'block';
}

function closeImageModal() {
    const modal = document.getElementById('image-modal');
    modal.style.display = 'none';
}