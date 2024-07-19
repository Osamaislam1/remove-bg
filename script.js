document.addEventListener('DOMContentLoaded', function () {
    const inputField = document.getElementById('userImg');
    const removeBackgroundButton = document.getElementById('removeBackground');
    const imagePreview = document.getElementById('imagePreview');
    const bgRemove = document.getElementById('bgRemove');
    const downloadButton = document.getElementById('downloadButton');
    const thresholdSlider = document.getElementById('thresholdSlider');
    const undoButton = document.getElementById('undoButton');
    const resetButton = document.getElementById('resetButton');
    const dropZone = document.getElementById('dropZone');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const bgColorPicker = document.getElementById('bgColorPicker');
    let originalImage = null;
    let cropper = null;

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            imagePreview.innerHTML = '';
            imagePreview.appendChild(img);
            originalImage = img;
            if (cropper) cropper.destroy();
            cropper = new Cropper(img, {
                viewMode: 1,
                autoCropArea: 1,
                ready: function () {
                    cropper.setCropBoxData({ left: 0, top: 0, width: img.width, height: img.height });
                },
            });
        }
        reader.readAsDataURL(file);
    }

    inputField.addEventListener('change', function () {
        const file = this.files[0];
        loadImage(file);
    });

    dropZone.addEventListener('dragover', function (e) {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', function () {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', function (e) {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        loadImage(file);
    });

    removeBackgroundButton.addEventListener('click', function () {
        if (!originalImage) return;
        loadingIndicator.style.display = 'block';
        const croppedCanvas = cropper.getCroppedCanvas();
        const src = cv.imread(croppedCanvas);
        const dst = new cv.Mat();
        cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
        cv.Canny(src, dst, 50, 100, 3, false);
        cv.threshold(src, dst, parseInt(thresholdSlider.value), 255, cv.THRESH_BINARY);

        const backgroundColor = cv.Mat.zeros(src.rows, src.cols, src.type());
        const color = bgColorPicker.value.match(/\w\w/g).map(x => parseInt(x, 16));
        backgroundColor.setTo(new cv.Scalar(color[0], color[1], color[2], 255));

        cv.addWeighted(backgroundColor, 1, dst, 1, 0, dst);
        cv.imshow('bgRemove', dst);
        src.delete();
        dst.delete();
        backgroundColor.delete();

        const canvas = document.getElementById('bgRemove');
        const dataUrl = canvas.toDataURL('image/png');
        downloadButton.href = dataUrl;
        downloadButton.download = 'background_removed_image.png';
        downloadButton.style.display = 'inline-block';
        loadingIndicator.style.display = 'none';
    });

    undoButton.addEventListener('click', function () {
        if (originalImage) {
            imagePreview.innerHTML = '';
            imagePreview.appendChild(originalImage);
            if (cropper) cropper.destroy();
            cropper = new Cropper(originalImage, {
                viewMode: 1,
                autoCropArea: 1,
                ready: function () {
                    cropper.setCropBoxData({ left: 0, top: 0, width: originalImage.width, height: originalImage.height });
                },
            });
        }
        bgRemove.getContext('2d').clearRect(0, 0, bgRemove.width, bgRemove.height);
        downloadButton.style.display = 'none';
    });

    resetButton.addEventListener('click', function () {
        inputField.value = null;
        imagePreview.innerHTML = '';
        bgRemove.getContext('2d').clearRect(0, 0, bgRemove.width, bgRemove.height);
        downloadButton.style.display = 'none';
        originalImage = null;
        if (cropper) cropper.destroy();
        cropper = null;
        thresholdSlider.value = 120;
        bgColorPicker.value = '#ffffff';
    });
});
