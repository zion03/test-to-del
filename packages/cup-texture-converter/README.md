# Cup Texture Converter

Convert flat textures into cylindrical cup wrap templates for printing on cups and cylindrical objects.

## Features

- 🎯 **Cylindrical Mapping**: Transforms flat textures to curved cup wraps using cylindrical projection
- 📏 **Precise Dimensions**: Supports custom cup dimensions (height, diameter) with accurate measurements
- 🖨️ **Print-Ready**: Generates high-resolution templates with bleed areas and cutting guides
- 📐 **Multiple Formats**: Create blank templates or convert existing textures
- ⚙️ **Configurable**: Adjustable DPI, bleed areas, and cup specifications

## Installation

```bash
npm install cup-texture-converter
```

### Dependencies

This package requires `canvas` and `sharp` for image processing:

```bash
npm install canvas sharp
```

Note: `canvas` may require additional system dependencies. See [node-canvas installation guide](https://github.com/Automattic/node-canvas#compiling) for details.

## Quick Start

```javascript
const CupTextureConverter = require('cup-texture-converter');

// Initialize converter with cup specifications
const converter = new CupTextureConverter({
    cupHeight: 100,      // 100mm height
    cupDiameter: 80,     // 80mm diameter  
    dpi: 300,           // 300 DPI for printing
    bleedArea: 3        // 3mm bleed area
});

// Convert a flat texture to cup wrap
const cupWrap = await converter.convertToCupWrap('input-texture.png', {
    addGuides: true  // Include printing guides
});

// Save the result
require('fs').writeFileSync('cup-wrap.png', cupWrap);
```

## API Reference

### Constructor

```javascript
new CupTextureConverter(options)
```

**Options:**
- `cupHeight` (number): Cup height in millimeters (default: 100)
- `cupDiameter` (number): Cup diameter in millimeters (default: 80)
- `dpi` (number): Output resolution in DPI (default: 300)
- `bleedArea` (number): Bleed area in millimeters (default: 3)

### Methods

#### `convertToCupWrap(inputImage, options)`

Converts a flat texture image to a cylindrical cup wrap template.

**Parameters:**
- `inputImage` (string|Buffer): Path to image file or image buffer
- `options` (object): Conversion options
  - `addGuides` (boolean): Include printing guides and cut lines

**Returns:** Promise<Buffer> - PNG image buffer of the cup wrap

#### `generateCupTemplate(options)`

Generates a blank cup template with guides and measurements.

**Parameters:**
- `options` (object): Template options (currently unused, reserved for future features)

**Returns:** Promise<Buffer> - PNG image buffer of the blank template

## How It Works

### Cylindrical Projection

The converter uses cylindrical projection to transform flat textures:

1. **Input Processing**: Loads and analyzes the flat texture image
2. **Coordinate Mapping**: Maps each pixel from rectangular coordinates to cylindrical coordinates
3. **Distortion Correction**: Applies mathematical transformation to account for the curved surface
4. **Output Generation**: Creates a wrap template that will appear correct when wrapped around a cylinder

### Mathematical Transformation

For each pixel at position (x, y) in the output wrap:
- Convert to normalized coordinates (0-1)
- Apply cylindrical transformation: `angle = x * 2π`
- Map to source image: `sourceX = (sin(angle) + 1) / 2`
- Sample the source pixel and copy to output

### Print Specifications

- **Dimensions**: Calculated based on cup circumference (π × diameter) plus bleed area
- **Resolution**: Configurable DPI for professional printing
- **Guides**: Optional cutting guides, safe areas, and alignment marks
- **Bleed Area**: Extra margin for printing tolerance

## Examples

### Basic Usage

```javascript
const converter = new CupTextureConverter();
const result = await converter.convertToCupWrap('my-texture.jpg');
```

### Custom Cup Size

```javascript
const converter = new CupTextureConverter({
    cupHeight: 120,     // Tall cup
    cupDiameter: 90,    // Wide cup
    dpi: 600,          // High resolution
    bleedArea: 5       // Extra bleed
});
```

### Generate Templates for Multiple Sizes

```javascript
const sizes = [
    { name: 'small', height: 80, diameter: 60 },
    { name: 'medium', height: 100, diameter: 80 },
    { name: 'large', height: 120, diameter: 90 }
];

for (const size of sizes) {
    const converter = new CupTextureConverter({
        cupHeight: size.height,
        cupDiameter: size.diameter
    });
    
    const template = await converter.generateCupTemplate();
    fs.writeFileSync(`template-${size.name}.png`, template);
}
```

## Printing Guidelines

### Recommended Settings
- **DPI**: 300-600 for professional printing
- **Bleed Area**: 3-5mm depending on printer requirements
- **File Format**: PNG for best quality, JPEG for smaller files

### Pre-Press Checklist
1. ✅ Verify cup dimensions match your physical cups
2. ✅ Check that bleed area meets printer requirements
3. ✅ Ensure resolution is appropriate for print size (300+ DPI)
4. ✅ Test print on paper first to verify alignment
5. ✅ Use cutting guides for precise trimming

## Common Cup Sizes

| Size | Diameter | Height | Circumference |
|------|----------|--------|---------------|
| Small | 60mm | 80mm | ~188mm |
| Medium | 80mm | 100mm | ~251mm |
| Large | 90mm | 120mm | ~283mm |
| XL | 100mm | 140mm | ~314mm |

## Troubleshooting

### Image Quality Issues
- Increase DPI for sharper output
- Use high-resolution source images
- Ensure source image aspect ratio works well with cup dimensions

### Alignment Problems  
- Enable printing guides (`addGuides: true`)
- Verify cup measurements are accurate
- Test with paper template before printing on material

### Performance
- Use appropriate DPI (300-600 is usually sufficient)
- Consider image size vs. output requirements
- Process images in batches for multiple cups

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.