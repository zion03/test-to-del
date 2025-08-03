class TaperedImageCropper {
    constructor() {
        this.canvas = document.getElementById('imageCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.selectionBox = document.getElementById('selectionBox');
        this.selectionOverlay = document.getElementById('selectionOverlay');
        
        this.image = null;
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.selection = {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            active: false
        };
        
        this.isDragging = false;
        this.isResizing = false;
        this.dragStart = { x: 0, y: 0 };
        this.resizeHandle = null;
        
        this.taperAmount = 30;
        this.perspectiveAngle = 0;
        this.positionMode = 'single';
        
        this.initializeEventListeners();
        this.setupControls();
    }
    
    initializeEventListeners() {
        // File input
        document.getElementById('imageInput').addEventListener('change', (e) => {
            this.loadImage(e.target.files[0]);
        });
        
        // Canvas events
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        
        // Selection box events
        this.selectionBox.addEventListener('mousedown', this.onSelectionMouseDown.bind(this));
        
        // Corner and edge events
        const corners = this.selectionBox.querySelectorAll('.corner');
        const edges = this.selectionBox.querySelectorAll('.edge');
        
        corners.forEach(corner => {
            corner.addEventListener('mousedown', (e) => this.onResizeStart(e, corner.className));
        });
        
        edges.forEach(edge => {
            edge.addEventListener('mousedown', (e) => this.onResizeStart(e, edge.className));
        });
        
        // Global mouse events for dragging
        document.addEventListener('mousemove', this.onGlobalMouseMove.bind(this));
        document.addEventListener('mouseup', this.onGlobalMouseUp.bind(this));
    }
    
    setupControls() {
        // Toolbar buttons
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8));
        document.getElementById('resetZoom').addEventListener('click', () => this.resetView());
        document.getElementById('resetSelection').addEventListener('click', () => this.resetSelection());
        
        // Position tabs
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.positionMode = tab.dataset.position;
                this.updatePreview();
            });
        });
        
        // Taper amount slider
        const taperSlider = document.getElementById('taperAmount');
        const taperValue = document.getElementById('taperValue');
        taperSlider.addEventListener('input', (e) => {
            this.taperAmount = parseInt(e.target.value);
            taperValue.textContent = this.taperAmount + '%';
            this.updatePreview();
        });
        
        // Perspective angle slider
        const perspectiveSlider = document.getElementById('perspectiveAngle');
        const perspectiveValue = document.getElementById('perspectiveValue');
        perspectiveSlider.addEventListener('input', (e) => {
            this.perspectiveAngle = parseInt(e.target.value);
            perspectiveValue.textContent = this.perspectiveAngle + '°';
            this.updatePreview();
        });
        
        // Create cup button
        document.getElementById('createCup').addEventListener('click', () => {
            this.createTaperedImage();
        });
        
        // Back button
        document.getElementById('backBtn').addEventListener('click', () => {
            this.resetAll();
        });
    }
    
    loadImage(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.fitImageToCanvas();
                this.createDefaultSelection();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    fitImageToCanvas() {
        if (!this.image) return;
        
        const containerRect = this.canvas.parentElement.getBoundingClientRect();
        const maxWidth = containerRect.width - 40;
        const maxHeight = containerRect.height - 40;
        
        const imageAspect = this.image.width / this.image.height;
        const containerAspect = maxWidth / maxHeight;
        
        if (imageAspect > containerAspect) {
            this.canvas.width = maxWidth;
            this.canvas.height = maxWidth / imageAspect;
        } else {
            this.canvas.height = maxHeight;
            this.canvas.width = maxHeight * imageAspect;
        }
        
        this.scale = this.canvas.width / this.image.width;
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.drawImage();
    }
    
    drawImage() {
        if (!this.image) return;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.save();
        
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.drawImage(this.image, 0, 0);
        
        this.ctx.restore();
        this.drawGrid();
    }
    
    drawGrid() {
        const gridSize = 20 * this.scale;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    createDefaultSelection() {
        const width = this.canvas.width * 0.6;
        const height = this.canvas.height * 0.6;
        const x = (this.canvas.width - width) / 2;
        const y = (this.canvas.height - height) / 2;
        
        this.setSelection(x, y, width, height);
    }
    
    setSelection(x, y, width, height) {
        this.selection = { x, y, width, height, active: true };
        this.updateSelectionBox();
    }
    
    updateSelectionBox() {
        if (!this.selection.active) {
            this.selectionBox.style.display = 'none';
            return;
        }
        
        this.selectionBox.style.display = 'block';
        this.selectionBox.style.left = this.selection.x + 'px';
        this.selectionBox.style.top = this.selection.y + 'px';
        this.selectionBox.style.width = this.selection.width + 'px';
        this.selectionBox.style.height = this.selection.height + 'px';
    }
    
    onMouseDown(e) {
        if (this.selection.active) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.isDragging = true;
        this.dragStart = { x, y };
        this.setSelection(x, y, 0, 0);
    }
    
    onMouseMove(e) {
        if (!this.isDragging) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const width = Math.abs(x - this.dragStart.x);
        const height = Math.abs(y - this.dragStart.y);
        const startX = Math.min(x, this.dragStart.x);
        const startY = Math.min(y, this.dragStart.y);
        
        this.setSelection(startX, startY, width, height);
    }
    
    onMouseUp() {
        this.isDragging = false;
    }
    
    onSelectionMouseDown(e) {
        e.preventDefault();
        e.stopPropagation();
        
        this.isDragging = true;
        const rect = this.canvas.getBoundingClientRect();
        this.dragStart = {
            x: e.clientX - rect.left - this.selection.x,
            y: e.clientY - rect.top - this.selection.y
        };
    }
    
    onResizeStart(e, handle) {
        e.preventDefault();
        e.stopPropagation();
        
        this.isResizing = true;
        this.resizeHandle = handle;
        
        const rect = this.canvas.getBoundingClientRect();
        this.dragStart = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    onGlobalMouseMove(e) {
        if (this.isDragging && this.selection.active && !this.isResizing) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left - this.dragStart.x;
            const y = e.clientY - rect.top - this.dragStart.y;
            
            this.setSelection(
                Math.max(0, Math.min(x, this.canvas.width - this.selection.width)),
                Math.max(0, Math.min(y, this.canvas.height - this.selection.height)),
                this.selection.width,
                this.selection.height
            );
        } else if (this.isResizing) {
            this.handleResize(e);
        }
    }
    
    onGlobalMouseUp() {
        this.isDragging = false;
        this.isResizing = false;
        this.resizeHandle = null;
    }
    
    handleResize(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let { x, y, width, height } = this.selection;
        
        if (this.resizeHandle.includes('top-left')) {
            const newWidth = width + (x - mouseX);
            const newHeight = height + (y - mouseY);
            if (newWidth > 10 && newHeight > 10) {
                x = mouseX;
                y = mouseY;
                width = newWidth;
                height = newHeight;
            }
        } else if (this.resizeHandle.includes('top-right')) {
            const newWidth = mouseX - x;
            const newHeight = height + (y - mouseY);
            if (newWidth > 10 && newHeight > 10) {
                y = mouseY;
                width = newWidth;
                height = newHeight;
            }
        } else if (this.resizeHandle.includes('bottom-left')) {
            const newWidth = width + (x - mouseX);
            const newHeight = mouseY - y;
            if (newWidth > 10 && newHeight > 10) {
                x = mouseX;
                width = newWidth;
                height = newHeight;
            }
        } else if (this.resizeHandle.includes('bottom-right')) {
            const newWidth = mouseX - x;
            const newHeight = mouseY - y;
            if (newWidth > 10 && newHeight > 10) {
                width = newWidth;
                height = newHeight;
            }
        }
        
        this.setSelection(x, y, width, height);
    }
    
    onWheel(e) {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(zoomFactor);
    }
    
    zoom(factor) {
        this.scale *= factor;
        this.scale = Math.max(0.1, Math.min(5, this.scale));
        this.drawImage();
    }
    
    resetView() {
        this.fitImageToCanvas();
    }
    
    resetSelection() {
        this.selection.active = false;
        this.updateSelectionBox();
    }
    
    resetAll() {
        this.image = null;
        this.selection.active = false;
        this.updateSelectionBox();
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    updatePreview() {
        // Update the cup shape visualization based on current settings
        const cupShape = document.getElementById('cupShape');
        const segments = cupShape.querySelectorAll('.cup-segment');
        
        segments.forEach((segment, index) => {
            const value = parseFloat(segment.dataset.value);
            const intensity = this.taperAmount / 100;
            const alpha = 0.3 + (intensity * 0.7);
            segment.style.background = `rgba(255, 255, 255, ${alpha})`;
        });
    }
    
    createTaperedImage() {
        if (!this.image || !this.selection.active) {
            alert('Please select an image and create a selection first.');
            return;
        }
        
        // Create output canvas
        const outputCanvas = document.createElement('canvas');
        const outputCtx = outputCanvas.getContext('2d');
        
        // Set output dimensions
        const outputWidth = 400;
        const outputHeight = 600;
        outputCanvas.width = outputWidth;
        outputCanvas.height = outputHeight;
        
        // Calculate source coordinates in image space
        const sourceX = (this.selection.x - this.offsetX) / this.scale;
        const sourceY = (this.selection.y - this.offsetY) / this.scale;
        const sourceWidth = this.selection.width / this.scale;
        const sourceHeight = this.selection.height / this.scale;
        
        // Apply perspective transformation
        this.applyPerspectiveTransformation(
            outputCtx,
            sourceX, sourceY, sourceWidth, sourceHeight,
            outputWidth, outputHeight
        );
        
        // Download the result
        this.downloadImage(outputCanvas, 'tapered-image.png');
    }
    
    applyPerspectiveTransformation(ctx, sourceX, sourceY, sourceWidth, sourceHeight, outputWidth, outputHeight) {
        // Calculate taper effect
        const taperRatio = this.taperAmount / 100;
        const topWidth = outputWidth;
        const bottomWidth = outputWidth * (1 - taperRatio);
        const widthOffset = (topWidth - bottomWidth) / 2;
        
        // Define destination points for perspective transformation
        const destPoints = [
            // Top-left, Top-right, Bottom-right, Bottom-left
            [widthOffset, 0],
            [outputWidth - widthOffset, 0],
            [outputWidth, outputHeight],
            [0, outputHeight]
        ];
        
        // Source points (rectangle)
        const srcPoints = [
            [sourceX, sourceY],
            [sourceX + sourceWidth, sourceY],
            [sourceX + sourceWidth, sourceY + sourceHeight],
            [sourceX, sourceY + sourceHeight]
        ];
        
        // Apply transformation using multiple triangles for better quality
        this.drawPerspectiveImage(ctx, srcPoints, destPoints, outputWidth, outputHeight);
    }
    
    drawPerspectiveImage(ctx, srcPoints, destPoints, width, height) {
        // Simple approach: divide into strips and transform each
        const strips = 20;
        const stripHeight = height / strips;
        
        for (let i = 0; i < strips; i++) {
            const t1 = i / strips;
            const t2 = (i + 1) / strips;
            
            // Interpolate points for this strip
            const topLeft = this.interpolatePoint(destPoints[0], destPoints[3], t1);
            const topRight = this.interpolatePoint(destPoints[1], destPoints[2], t1);
            const bottomLeft = this.interpolatePoint(destPoints[0], destPoints[3], t2);
            const bottomRight = this.interpolatePoint(destPoints[1], destPoints[2], t2);
            
            // Source strip
            const srcTopLeft = this.interpolatePoint(srcPoints[0], srcPoints[3], t1);
            const srcTopRight = this.interpolatePoint(srcPoints[1], srcPoints[2], t1);
            const srcBottomLeft = this.interpolatePoint(srcPoints[0], srcPoints[3], t2);
            const srcBottomRight = this.interpolatePoint(srcPoints[1], srcPoints[2], t2);
            
            // Draw transformed strip
            ctx.save();
            this.setTransform(ctx, 
                [srcTopLeft, srcTopRight, srcBottomRight, srcBottomLeft],
                [topLeft, topRight, bottomRight, bottomLeft]
            );
            
            ctx.drawImage(this.image, 
                srcTopLeft[0], srcTopLeft[1], 
                srcTopRight[0] - srcTopLeft[0], srcBottomLeft[1] - srcTopLeft[1],
                topLeft[0], topLeft[1],
                topRight[0] - topLeft[0], bottomLeft[1] - topLeft[1]
            );
            
            ctx.restore();
        }
    }
    
    interpolatePoint(p1, p2, t) {
        return [
            p1[0] + (p2[0] - p1[0]) * t,
            p1[1] + (p2[1] - p1[1]) * t
        ];
    }
    
    setTransform(ctx, src, dest) {
        // Simplified transformation - in a real implementation you'd use proper matrix calculations
        const scaleX = (dest[1][0] - dest[0][0]) / (src[1][0] - src[0][0]);
        const scaleY = (dest[3][1] - dest[0][1]) / (src[3][1] - src[0][1]);
        const translateX = dest[0][0] - src[0][0] * scaleX;
        const translateY = dest[0][1] - src[0][1] * scaleY;
        
        ctx.setTransform(scaleX, 0, 0, scaleY, translateX, translateY);
    }
    
    downloadImage(canvas, filename) {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL();
        link.click();
    }
}

// Initialize the cropper when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TaperedImageCropper();
});