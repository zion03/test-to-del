const CupTextureConverter = require('./lib/cup-texture-converter');
const fs = require('fs').promises;
const path = require('path');

async function main() {
    try {
        // Initialize the converter with cup specifications
        const converter = new CupTextureConverter({
            cupHeight: 100,      // 100mm height
            cupDiameter: 80,     // 80mm diameter
            dpi: 300,           // 300 DPI for high quality printing
            bleedArea: 3        // 3mm bleed area
        });

        console.log('Cup Texture Converter Example');
        console.log('================================');

        // Example 1: Generate a blank cup template
        console.log('\n1. Generating blank cup template...');
        const template = await converter.generateCupTemplate();
        await fs.writeFile('cup-template.png', template);
        console.log('✓ Blank template saved as cup-template.png');

        // Example 2: Convert a texture image (if available)
        const sampleImagePath = 'sample-texture.png';
        
        // Create a sample texture if it doesn't exist
        if (!await fileExists(sampleImagePath)) {
            console.log('\n2. Creating sample texture...');
            await createSampleTexture(sampleImagePath);
            console.log('✓ Sample texture created as sample-texture.png');
        }

        // Convert the texture to cup wrap
        console.log('\n3. Converting texture to cup wrap...');
        const cupWrap = await converter.convertToCupWrap(sampleImagePath, {
            addGuides: true  // Include printing guides
        });
        await fs.writeFile('cup-wrap-output.png', cupWrap);
        console.log('✓ Cup wrap saved as cup-wrap-output.png');

        // Example 3: Different cup sizes
        console.log('\n4. Creating templates for different cup sizes...');
        
        const sizes = [
            { name: 'small', height: 80, diameter: 60 },
            { name: 'medium', height: 100, diameter: 80 },
            { name: 'large', height: 120, diameter: 90 }
        ];

        for (const size of sizes) {
            const sizeConverter = new CupTextureConverter({
                cupHeight: size.height,
                cupDiameter: size.diameter,
                dpi: 300,
                bleedArea: 3
            });
            
            const sizeTemplate = await sizeConverter.generateCupTemplate();
            await fs.writeFile(`cup-template-${size.name}.png`, sizeTemplate);
            console.log(`✓ ${size.name} cup template (${size.diameter}×${size.height}mm) saved`);
        }

        console.log('\n✨ All examples completed successfully!');
        console.log('\nGenerated files:');
        console.log('- cup-template.png (blank template)');
        console.log('- sample-texture.png (sample input texture)');
        console.log('- cup-wrap-output.png (converted cup wrap)');
        console.log('- cup-template-small.png, cup-template-medium.png, cup-template-large.png');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function createSampleTexture(outputPath) {
    const { createCanvas } = require('canvas');
    
    // Create a simple gradient texture as an example
    const canvas = createCanvas(400, 200);
    const ctx = canvas.getContext('2d');
    
    // Create a radial gradient
    const gradient = ctx.createRadialGradient(200, 100, 0, 200, 100, 150);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.5, '#4ecdc4');
    gradient.addColorStop(1, '#45b7d1');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 200);
    
    // Add some pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 400; i += 20) {
        for (let j = 0; j < 200; j += 20) {
            if ((i + j) % 40 === 0) {
                ctx.fillRect(i, j, 10, 10);
            }
        }
    }
    
    // Add text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SAMPLE TEXTURE', 200, 100);
    
    const buffer = canvas.toBuffer('image/png');
    await fs.writeFile(outputPath, buffer);
}

// Run the example
if (require.main === module) {
    main();
}