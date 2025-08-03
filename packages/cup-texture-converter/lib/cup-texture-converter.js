'use strict';

const { createCanvas, loadImage } = require('canvas');
const sharp = require('sharp');

class CupTextureConverter {
    constructor(options = {}) {
        this.cupHeight = options.cupHeight || 100; // mm
        this.cupDiameter = options.cupDiameter || 80; // mm
        this.dpi = options.dpi || 300;
        this.bleedArea = options.bleedArea || 3; // mm
    }

    /**
     * Convert a flat texture image to a cylindrical cup wrap template
     * @param {string|Buffer} inputImage - Path to image or image buffer
     * @param {Object} options - Conversion options
     * @returns {Promise<Buffer>} - Cup wrap template as image buffer
     */
    async convertToCupWrap(inputImage, options = {}) {
        try {
            // Load the input image
            const image = await loadImage(inputImage);
            
            // Calculate cup wrap dimensions
            const circumference = Math.PI * this.cupDiameter;
            const wrapWidth = this.mmToPixels(circumference + (this.bleedArea * 2));
            const wrapHeight = this.mmToPixels(this.cupHeight + (this.bleedArea * 2));
            
            // Create canvas for the cup wrap
            const canvas = createCanvas(wrapWidth, wrapHeight);
            const ctx = canvas.getContext('2d');
            
            // Fill with white background
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, wrapWidth, wrapHeight);
            
            // Apply cylindrical mapping
            await this.applyCylindricalMapping(ctx, image, wrapWidth, wrapHeight, options);
            
            // Add printing guides if requested
            if (options.addGuides) {
                this.addPrintingGuides(ctx, wrapWidth, wrapHeight);
            }
            
            // Convert canvas to buffer
            const buffer = canvas.toBuffer('image/png');
            
            // Use sharp for final processing and optimization
            return await sharp(buffer)
                .png({ quality: 100, compressionLevel: 6 })
                .toBuffer();
                
        } catch (error) {
            throw new Error(`Failed to convert texture to cup wrap: ${error.message}`);
        }
    }

    /**
     * Apply cylindrical mapping to transform flat texture
     */
    async applyCylindricalMapping(ctx, sourceImage, wrapWidth, wrapHeight, options) {
        const sourceWidth = sourceImage.width;
        const sourceHeight = sourceImage.height;
        
        // Create temporary canvas for source image
        const tempCanvas = createCanvas(sourceWidth, sourceHeight);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(sourceImage, 0, 0);
        
        // Get source image data
        const sourceData = tempCtx.getImageData(0, 0, sourceWidth, sourceHeight);
        
        // Create destination image data
        const destData = ctx.createImageData(wrapWidth, wrapHeight);
        
        // Apply cylindrical projection
        for (let y = 0; y < wrapHeight; y++) {
            for (let x = 0; x < wrapWidth; x++) {
                // Convert wrap coordinates to normalized coordinates (0-1)
                const normalizedX = x / wrapWidth;
                const normalizedY = y / wrapHeight;
                
                // Apply cylindrical distortion
                const angle = normalizedX * 2 * Math.PI;
                const cylindricalX = (Math.sin(angle) + 1) / 2; // Map to 0-1
                const cylindricalY = normalizedY;
                
                // Map back to source image coordinates
                const sourceX = Math.floor(cylindricalX * sourceWidth);
                const sourceY = Math.floor(cylindricalY * sourceHeight);
                
                // Ensure coordinates are within bounds
                const clampedSourceX = Math.max(0, Math.min(sourceWidth - 1, sourceX));
                const clampedSourceY = Math.max(0, Math.min(sourceHeight - 1, sourceY));
                
                // Copy pixel data
                const sourceIndex = (clampedSourceY * sourceWidth + clampedSourceX) * 4;
                const destIndex = (y * wrapWidth + x) * 4;
                
                destData.data[destIndex] = sourceData.data[sourceIndex];         // R
                destData.data[destIndex + 1] = sourceData.data[sourceIndex + 1]; // G
                destData.data[destIndex + 2] = sourceData.data[sourceIndex + 2]; // B
                destData.data[destIndex + 3] = sourceData.data[sourceIndex + 3]; // A
            }
        }
        
        // Put the transformed image data on the canvas
        ctx.putImageData(destData, 0, 0);
    }

    /**
     * Add printing guides and cut lines
     */
    addPrintingGuides(ctx, width, height) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        const bleedPixels = this.mmToPixels(this.bleedArea);
        
        // Draw cut lines (outer edges of bleed area)
        ctx.strokeRect(0, 0, width, height);
        
        // Draw safe area (inner area without bleed)
        ctx.strokeRect(bleedPixels, bleedPixels, width - (bleedPixels * 2), height - (bleedPixels * 2));
        
        // Add corner marks
        const markSize = 10;
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(0, markSize);
        ctx.lineTo(0, 0);
        ctx.lineTo(markSize, 0);
        ctx.stroke();
        
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(width - markSize, 0);
        ctx.lineTo(width, 0);
        ctx.lineTo(width, markSize);
        ctx.stroke();
        
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(0, height - markSize);
        ctx.lineTo(0, height);
        ctx.lineTo(markSize, height);
        ctx.stroke();
        
        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(width - markSize, height);
        ctx.lineTo(width, height);
        ctx.lineTo(width, height - markSize);
        ctx.stroke();
    }

    /**
     * Convert millimeters to pixels based on DPI
     */
    mmToPixels(mm) {
        return Math.round((mm / 25.4) * this.dpi);
    }

    /**
     * Generate a cup template with guides (no texture)
     */
    async generateCupTemplate(options = {}) {
        const circumference = Math.PI * this.cupDiameter;
        const wrapWidth = this.mmToPixels(circumference + (this.bleedArea * 2));
        const wrapHeight = this.mmToPixels(this.cupHeight + (this.bleedArea * 2));
        
        const canvas = createCanvas(wrapWidth, wrapHeight);
        const ctx = canvas.getContext('2d');
        
        // Fill with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, wrapWidth, wrapHeight);
        
        // Add guides
        this.addPrintingGuides(ctx, wrapWidth, wrapHeight);
        
        // Add center line
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 5]);
        ctx.beginPath();
        ctx.moveTo(0, wrapHeight / 2);
        ctx.lineTo(wrapWidth, wrapHeight / 2);
        ctx.stroke();
        
        // Add text information
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '12px Arial';
        ctx.fillText(`Cup: Ø${this.cupDiameter}mm × ${this.cupHeight}mm`, 20, 30);
        ctx.fillText(`Wrap: ${Math.round(circumference)}mm × ${this.cupHeight}mm`, 20, 50);
        ctx.fillText(`DPI: ${this.dpi}`, 20, 70);
        
        const buffer = canvas.toBuffer('image/png');
        return await sharp(buffer)
            .png({ quality: 100, compressionLevel: 6 })
            .toBuffer();
    }
}

module.exports = CupTextureConverter;