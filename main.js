
        // Elements
        const video = document.getElementById('camera');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const startCaptureButton = document.getElementById('startCapture');
        const photoCountInput = document.getElementById('photoCount');
        const frameColorInput = document.getElementById('frameColor');
        const colorValue = document.getElementById('colorValue');
        const photoStrip = document.getElementById('photoStrip');
        const downloadButton = document.getElementById('downloadStrip');
        const shareBtn = document.getElementById('shareBtn');
        const resetBtn = document.getElementById('resetBtn');
        const countdownEl = document.getElementById('countdown');
        const decreaseBtn = document.getElementById('decreaseCount');
        const increaseBtn = document.getElementById('increaseCount');
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        // Variables
        let currentFilter = 'normal';
        let isCapturing = false;
        let photoStripDataURL = null;
        
        // Initialize camera
        function initCamera() {
            navigator.mediaDevices.getUserMedia({ video: true, audio: false })
                .then(stream => {
                    video.srcObject = stream;
                })
                .catch(err => {
                    console.error(`Camera error: ${err}`);
                    photoStrip.innerHTML = `
                        <div class="photo-slot" style="grid-column: 1 / -1; text-align: center; padding: 30px;">
                            <i class="fas fa-exclamation-triangle" style="color: #ef4444; font-size: 3rem;"></i>
                            <h3 style="margin-top: 20px; color: #475569;">Camera Access Required</h3>
                            <p style="margin-top: 10px; color: #94a3b8;">Please allow camera access to use this photo booth.</p>
                        </div>
                    `;
                });
        }
        
        // Update color value display
        frameColorInput.addEventListener('input', () => {
            colorValue.textContent = frameColorInput.value;
            document.documentElement.style.setProperty('--frame', frameColorInput.value);
        });
        
        // Photo count controls
        decreaseBtn.addEventListener('click', () => {
            if (photoCountInput.value > 1) {
                photoCountInput.value = parseInt(photoCountInput.value) - 1;
                updatePhotoSlots();
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            if (photoCountInput.value < 5) {
                photoCountInput.value = parseInt(photoCountInput.value) + 1;
                updatePhotoSlots();
            }
        });
        
        photoCountInput.addEventListener('change', () => {
            let value = parseInt(photoCountInput.value);
            if (value < 1) value = 1;
            if (value > 5) value = 5;
            photoCountInput.value = value;
            updatePhotoSlots();
        });
        
        function updatePhotoSlots() {
            const count = parseInt(photoCountInput.value);
            let slotsHTML = '';
            
            for (let i = 0; i < count; i++) {
                slotsHTML += `
                    <div class="photo-slot">
                        <i class="fas fa-camera"></i>
                        <span class="photo-label">Photo ${i+1}</span>
                    </div>
                `;
            }
            
            photoStrip.innerHTML = slotsHTML;
        }
        
        // Filter selection
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
            });
        });
        
        // Start capture process
        startCaptureButton.addEventListener('click', () => {
            if (isCapturing) return;
            
            const numPhotos = parseInt(photoCountInput.value);
            const frameColor = frameColorInput.value;
            
            // Update photo slots to show loading
            const slots = photoStrip.querySelectorAll('.photo-slot');
            slots.forEach((slot, index) => {
                slot.innerHTML = `
                    <i class="fas fa-spinner loading"></i>
                    <span class="photo-label">Capturing photo ${index+1}</span>
                `;
            });
            
            startCaptureButton.disabled = true;
            startCaptureButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Capturing...';
            
            capturePhotos(numPhotos, frameColor);
        });
        
        // Main photo capture function
        function capturePhotos(numPhotos, frameColor) {
            isCapturing = true;
            const images = [];
            let currentPhoto = 0;
            
            function captureNextPhoto() {
                if (currentPhoto < numPhotos) {
                    // Show countdown
                    let countdown = 3;
                    countdownEl.textContent = countdown;
                    countdownEl.classList.add('active');
                    
                    const countdownInterval = setInterval(() => {
                        countdown--;
                        countdownEl.textContent = countdown;
                        
                        if (countdown <= 0) {
                            clearInterval(countdownInterval);
                            countdownEl.classList.remove('active');
                            
                            // Capture the photo after a slight delay
                            setTimeout(() => {
                                canvas.width = video.videoWidth;
                                canvas.height = video.videoHeight;
                                
                                // Apply horizontal flip
                                ctx.save();
                                ctx.scale(-1, 1);
                                ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
                                ctx.restore();
                                
                                // Apply filter
                                applyFilter(ctx, currentFilter);
                                
                                // Create image
                                const img = document.createElement('img');
                                img.src = canvas.toDataURL('image/png');
                                img.classList.add('photo-item');
                                
                                // Create frame element
                                const frame = document.createElement('div');
                                frame.classList.add('photo-frame');
                                
                                // Create overlay
                                const overlay = document.createElement('div');
                                overlay.classList.add('photo-overlay');
                                overlay.innerHTML = `<i class="fas fa-heart"></i> Glamour Photo Booth`;
                                
                                // Create label
                                const label = document.createElement('span');
                                label.classList.add('photo-label');
                                label.textContent = `Photo ${currentPhoto+1}`;
                                
                                // Add to photo strip
                                const slot = photoStrip.children[currentPhoto];
                                slot.innerHTML = '';
                                slot.appendChild(img);
                                slot.appendChild(frame);
                                slot.appendChild(overlay);
                                slot.appendChild(label);
                                
                                images.push(img.src);
                                currentPhoto++;
                                
                                // Capture next photo
                                setTimeout(captureNextPhoto, 1000);
                            }, 300);
                        }
                    }, 1000);
                } else {
                    // Create photo strip
                    createPhotoStrip(images, frameColor);
                    isCapturing = false;
                    startCaptureButton.disabled = false;
                    startCaptureButton.innerHTML = '<i class="fas fa-play-circle"></i> Start Capture Session';
                }
            }
            
            captureNextPhoto();
        }
        
        // Apply filter to the image
        function applyFilter(context, filter) {
            context.save();
            
            switch(filter) {
                case 'grayscale':
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imageData.data;
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = avg;
                        data[i + 1] = avg;
                        data[i + 2] = avg;
                    }
                    context.putImageData(imageData, 0, 0);
                    break;
                case 'sepia':
                    context.filter = 'sepia(100%)';
                    context.drawImage(canvas, 0, 0);
                    break;
                case 'vintage':
                    context.filter = 'contrast(1.1) brightness(1.1) saturate(1.3) sepia(0.3)';
                    context.drawImage(canvas, 0, 0);
                    break;
            }
            
            context.restore();
        }
        
        // Create photo strip
        function createPhotoStrip(images, frameColor) {
            const stripCanvas = document.createElement('canvas');
            const stripCtx = stripCanvas.getContext('2d');
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const padding = 40;
            const spacing = 20;
            
            const numPhotos = images.length;
            const stripHeight = (imgHeight * numPhotos) + (spacing * (numPhotos - 1)) + (padding * 2);
            stripCanvas.width = imgWidth + (padding * 2);
            stripCanvas.height = stripHeight;
            
            // Draw background
            stripCtx.fillStyle = frameColor;
            stripCtx.fillRect(0, 0, stripCanvas.width, stripHeight);
            
            // Draw white background for photos
            stripCtx.fillStyle = '#ffffff';
            stripCtx.fillRect(padding, padding, imgWidth, stripHeight - padding * 2);
            
            // Draw images
            let loadedCount = 0;
            images.forEach((src, index) => {
                const img = new Image();
                img.src = src;
                img.onload = () => {
                    const yPos = padding + (index * (imgHeight + spacing));
                    stripCtx.drawImage(img, padding, yPos, imgWidth, imgHeight);
                    
                    // Draw frame on strip
                    stripCtx.strokeStyle = frameColor;
                    stripCtx.lineWidth = 10;
                    stripCtx.strokeRect(padding, yPos, imgWidth, imgHeight);
                    
                    loadedCount++;
                    
                    if (loadedCount === numPhotos) {
                        // Add decorative border
                        stripCtx.strokeStyle = frameColor;
                        stripCtx.lineWidth = 10;
                        stripCtx.strokeRect(padding, padding, imgWidth, stripHeight - padding * 2);
                        
                        // Add footer
                        stripCtx.fillStyle = frameColor;
                        stripCtx.fillRect(0, stripHeight - 50, stripCanvas.width, 50);
                        
                        // Add footer text
                        stripCtx.font = 'bold 18px "Montserrat", sans-serif';
                        stripCtx.fillStyle = '#ffffff';
                        stripCtx.textAlign = 'center';
                        stripCtx.fillText('Glamour Photo Booth • ' + new Date().toLocaleString(), stripCanvas.width / 2, stripHeight - 15);
                        
                        // Add header text
                        stripCtx.font = '700 32px "Montserrat", sans-serif';
                        stripCtx.fillStyle = frameColor;
                        stripCtx.textAlign = 'center';
                        stripCtx.fillText('Your Special Moments', stripCanvas.width / 2, 30);
                        
                        // Set download URL
                        photoStripDataURL = stripCanvas.toDataURL('image/png');
                        downloadButton.href = photoStripDataURL;
                    }
                };
            });
        }
        
        // Share photo strip
        shareBtn.addEventListener('click', () => {
            if (!photoStripDataURL) {
                alert('Please capture photos first!');
                return;
            }
            
            // Convert data URL to blob
            fetch(photoStripDataURL)
                .then(res => res.blob())
                .then(blob => {
                    if (navigator.share) {
                        navigator.share({
                            title: 'My Photo Booth Creation',
                            text: 'Check out my awesome photo strip!',
                            files: [new File([blob], 'photobooth.png', { type: 'image/png' })]
                        })
                        .catch(console.error);
                    } else {
                        // Fallback for browsers without Web Share API
                        const link = document.createElement('a');
                        link.href = photoStripDataURL;
                        link.download = 'glamour_photobooth.png';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                });
        });
        
        // Reset photo strip
        resetBtn.addEventListener('click', () => {
            photoStripDataURL = null;
            downloadButton.removeAttribute('href');
            updatePhotoSlots();
        });
        
        // Initialize
        window.addEventListener('DOMContentLoaded', () => {
            initCamera();
            colorValue.textContent = frameColorInput.value;
            document.documentElement.style.setProperty('--frame', frameColorInput.value);
        });