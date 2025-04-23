# Text Selection Hook for Node.js

A native Node.js module with Node-API that allows monitoring text selections across applications using multiple methods.

## Features

- Monitor text selections across all applications on Windows
- Detect selections made with mouse drag, double-clicking
- Get selected text content and coordinates
- Track mouse and keyboard events
- Supports multiple methods to get selected text:
  - UI Automation (modern applications)
  - Accessibility interfaces (legacy applications)
  - Focused control
  - Clipboard fallback (using simulated Ctrl+C, finetuned)
- For Node.js and Electron
  
## Requirements

- Windows ( MacOS/Linux platforms are on the way)
- Node-API v8+ (Node.js 18+ and Electron 23+)
- node-gyp build tools

## Installation

```bash
npm install selection-hook
```

## Usage

```javascript
const SelectionHook = require('selection-hook');

// Create a new instance
const selectionHook = new SelectionHook();

// Listen for text selection events
selectionHook.on('text-selection', (data) => {
  console.log('Selected text:', data.text);
  console.log('From program:', data.programName);
  console.log('Selection method:', data.method);
  console.log('Position level:', data.posLevel);
  
  // Position coordinates are available depending on the position level
  if (data.posLevel >= SelectionHook.PositionLevel.MOUSE_SINGLE) {
    console.log('Mouse position:', data.mousePosStart);
  }
  
  if (data.posLevel >= SelectionHook.PositionLevel.FULL) {
    console.log('Selection start:', data.startTop);
    console.log('Selection end:', data.endBottom);
  }
});

// Start monitoring (with default configuration)
selectionHook.start();

// Or start with custom configuration
selectionHook.start({
  debug: true,                                      // Enable debug logging
  enableMouseMoveEvent: false,                      // Disable high-CPU mouse move events
  enableClipboard: true,                            // Enable clipboard fallback
  selectionPassiveMode: false,                      // Enable automatic selection detection
  clipboardMode: SelectionHook.ClipboardMode.DEFAULT, // Default clipboard mode
  programList: []                                   // No program list
});

// When you want to get the current selection directly
const currentSelection = selectionHook.getCurrentSelection();
if (currentSelection) {
  console.log('Current selection:', currentSelection.text);
}

// Clean up when done
selectionHook.stop();
selectionHook.cleanup();
```

## API Reference

### SelectionHook Class

#### Constructor
```javascript
const hook = new SelectionHook();
```

#### Methods

- **start(config?: SelectionConfig): boolean**  
  Start monitoring text selections.
  
  Config options:
  ```javascript
  {
    debug: boolean,                     // Enable debug logging
    enableMouseMoveEvent: boolean,      // Enable mouse movement tracking
    enableClipboard: boolean,           // Enable clipboard fallback
    selectionPassiveMode: boolean,      // Enable passive mode
    clipboardMode: SelectionHook.ClipboardMode, // Clipboard mode
    programList: string[]               // Program list for clipboard mode
  }
  ```
  
- **stop(): boolean**  
  Stop monitoring text selections.
  
- **getCurrentSelection(): TextSelectionData | null**  
  Get the current text selection if any exists.
  
- **enableMouseMoveEvent(): boolean**  
  Enable mouse movement events (high CPU usage).
  
- **disableMouseMoveEvent(): boolean**  
  Disable mouse movement events.
  
- **enableClipboard(): boolean**  
  Enable clipboard fallback for text selection.
  
- **disableClipboard(): boolean**  
  Disable clipboard fallback for text selection.
  
- **setClipboardMode(mode: ClipboardMode, programList?: string[]): boolean**  
  Configure how clipboard fallback works with different programs.
  
- **setSelectionPassiveMode(passive: boolean): boolean**  
  Set passive mode for selection (only triggered by getCurrentSelection).
  
- **isRunning(): boolean**  
  Check if hook is currently running.
  
- **cleanup()**  
  Release resources and stop monitoring.

#### Constants

- **SelectionHook.SelectionMethod**
  - `NONE`: No selection method
  - `UIA`: UI Automation
  - `FOCUSCTL`: Focused control
  - `ACCESSIBLE`: Accessibility interface
  - `CLIPBOARD`: Clipboard fallback

- **SelectionHook.PositionLevel**
  - `NONE`: No position information
  - `MOUSE_SINGLE`: Only current mouse position
  - `MOUSE_DUAL`: Mouse start and end positions
  - `SEL_FULL`: Full selection coordinates
  - `SEL_DETAILED`: Detailed selection coordinates

- **SelectionHook.ClipboardMode**
  - `DEFAULT`: Use clipboard for all programs
  - `INCLUDE_LIST`: Only use clipboard for programs in list
  - `EXCLUDE_LIST`: Use clipboard for all except programs in list

#### Events

- **text-selection**: Emitted when text is selected
  ```javascript
  hook.on('text-selection', (data) => {
    // data contains selection information
  });
  ```

- **mouse-move**, **mouse-up**, **mouse-down**: Mouse events
  ```javascript
  hook.on('mouse-up', (data) => {
    // data contains mouse coordinates and button info
  });
  ```

- **mouse-wheel**: Mouse wheel events
  ```javascript
  hook.on('mouse-wheel', (data) => {
    // data contains wheel direction info
  });
  ```

- **key-down**, **key-up**: Keyboard events
  ```javascript
  hook.on('key-down', (data) => {
    // data contains key code and modifier info
  });
  ```

- **status**: Hook status changes
  ```javascript
  hook.on('status', (status) => {
    // status is a string, e.g. "started", "stopped"
  });
  ```

- **error**: Error events
  ```javascript
  hook.on('error', (error) => {
    // error is an Error object
  });
  ```

## TypeScript Support

This module includes TypeScript definitions. Import the module in TypeScript as:

```typescript
import SelectionHook, { TextSelectionData } from 'selection-hook';

const hook = new SelectionHook();
hook.on('text-selection', (data: TextSelectionData) => {
  // Type-safe access to selection data
});
```

## Examples

### Basic Usage

```javascript
const SelectionHook = require('selection-hook');
const hook = new SelectionHook();

hook.on('text-selection', (data) => {
  console.log(`Selected text: ${data.text}`);
  console.log(`Program: ${data.programName}`);
});

hook.on('error', (error) => {
  console.error('Error:', error.message);
});

hook.start();

// Clean up when exiting
process.on('exit', () => {
  hook.cleanup();
});
```

### Clipboard Mode

```javascript
const SelectionHook = require('selection-hook');
const hook = new SelectionHook();

// Only use clipboard fallback for specific applications
hook.start();
hook.setClipboardMode(
  SelectionHook.ClipboardMode.INCLUDE_LIST, 
  ['notepad.exe', 'wordpad']
);

hook.on('text-selection', (data) => {
  console.log(`Selected text from ${data.programName}: ${data.text}`);
});
```

