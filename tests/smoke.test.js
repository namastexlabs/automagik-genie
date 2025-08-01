// Basic smoke test for automagik-genie
const path = require('path');
const fs = require('fs');

describe('Automagik Genie Basic Functionality', () => {
  test('Main entry point exists', () => {
    const mainPath = path.join(__dirname, '..', 'lib', 'init.js');
    expect(fs.existsSync(mainPath)).toBe(true);
  });

  test('CLI binary exists', () => {
    const binPath = path.join(__dirname, '..', 'bin', 'automagik-genie');
    expect(fs.existsSync(binPath)).toBe(true);
  });

  test('Update system components exist', () => {
    const updateDir = path.join(__dirname, '..', 'lib', 'update');
    expect(fs.existsSync(updateDir)).toBe(true);
    
    const components = ['backup.js', 'engine.js', 'ui.js', 'metadata.js'];
    components.forEach(component => {
      const componentPath = path.join(updateDir, component);
      expect(fs.existsSync(componentPath)).toBe(true);
    });
  });

  test('Templates directory exists', () => {
    const templatesPath = path.join(__dirname, '..', 'templates');
    expect(fs.existsSync(templatesPath)).toBe(true);
  });
});