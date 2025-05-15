# Text Selection Hook for Node.js and Electron
[![npm version](https://img.shields.io/npm/v/selection-hook?style=flat)](https://www.npmjs.org/package/selection-hook)

A native Node.js module with Node-API that allows monitoring text selections across applications using multiple methods.

## Features

Maybe the first-ever open-source, fully functional text selection tool.

- **Cross-application text selection monitoring**
  - Capture selected text content and its screen coordinates
  - Auto-triggers on user selection, or manual API triggers
  - Rich API to control the selection behaviors
- **Input event listeners**
  - Mouse events: `down/up/wheel/move`
  - Keyboard events: `keydown/keyup`
  - *No additional hooks required* – works natively.
- **Multi-method text extraction** (automatic fallback):
  - *UI Automation* (modern apps)
  - *Accessibility APIs* (legacy apps)
  - *Focused control* (active input fields)
  - *Clipboard fallback* (simulated `Ctrl+C` with optimizations)
- **Clipboard**
  - Read/write clipboard
- **Compatibility**
  - Node.js `v10+` | Electron `v3+`
  - TypeScript support included.


## Platform

Currently only supports Windows. macOS/Linux support is coming soon.

## Installation

```bash
npm install selection-hook
```

The npm package ships with a pre-built `.node` file — no rebuilding needed. For Electron rebuild issues, add these values to your `electron-forge` config to avoid rebuilding:

```javascript
rebuildConfig: {
    onlyModules: [],
},
```

## Demo

```bash
npm run demo
```

## Usage


```javascript
const SelectionHook = require('selection-hook');

// Create a new instance
// You can design it as a singleton pattern to avoid resource consumption from multiple instantiations
const selectionHook = new SelectionHook();

// Listen for text selection events
selectionHook.on('text-selection', (data) => {
  console.log('Selected text:', data.text);
  // For mouse start/end position and text range coornidates
  // see API Reference below.
});

// Start monitoring (with default configuration)
selectionHook.start();

// When you want to get the current selection directly
const currentSelection = selectionHook.getCurrentSelection();
if (currentSelection) {
  console.log('Current selection:', currentSelection.text);
}

// Stop, you can start it again
selectionHook.stop();
// Clean up when done
selectionHook.cleanup();
```

See [`examples/node-demo.js`](https://github.com/0xfullex/selection-hook/blob/main/examples/node-demo.js) for detailed usage.

## API Reference



### Constructor
```javascript
const hook = new SelectionHook();
```

### Methods

#### **`start(config?: SelectionConfig): boolean`**  
  Start monitoring text selections.
  
  Config options (with default values):
  ```javascript
  {
    debug?: false,                 // Enable debug logging
    enableMouseMoveEvent?: false,  // Enable mouse move tracking, can be set in runtime
    enableClipboard?: true,        // Enable clipboard fallback, can be set in runtime
    selectionPassiveMode?: false,  // Enable passive mode, can be set in runtime
    clipboardMode?: SelectionHook.ClipboardMode.DEFAULT, // Clipboard mode, can be set in runtime
    programList?: string[]         // Program list for clipboard mode, can be set in runtime
  }
  ```

  see [`SelectionHook.ClipboardMode`](#selectionhookclipboardmode) for details
  
#### **`stop(): boolean`**
  Stop monitoring text selections.

#### **`getCurrentSelection(): TextSelectionData | null`**  
  Get the current text selection if any exists.
  
#### **`enableMouseMoveEvent(): boolean`**  
  Enable mouse move events (high CPU usage). Disabled by default.
  
#### **`disableMouseMoveEvent(): boolean`**  
  Disable mouse move events. Disabled by default.
  
#### **`enableClipboard(): boolean`**  
  Enable clipboard fallback for text selection. Enabled by default.
  
#### **`disableClipboard(): boolean`**  
  Disable clipboard fallback for text selection. Enabled by default.
  
#### **`setClipboardMode(mode: ClipboardMode, programList?: string[]): boolean`**  
  Configure how clipboard fallback works with different programs. See `SelectionHook.ClipboardMode` constants for details.
  
#### **`setSelectionPassiveMode(passive: boolean): boolean`**  
  Set passive mode for selection (only triggered by getCurrentSelection, `text-selection` event will not be emitted). 
  
#### **`writeToClipboard(text: string): boolean`**  
  Write text to the system clipboard. This is useful for implementing custom copy functions.
  
#### **`readFromClipboard(): string | null`**  
  Read text from the system clipboard. Returns clipboard text content as string, or null if clipboard is empty or contains non-text data.
  
#### **`isRunning(): boolean`**  
  Check if selection-hook is currently running.
  
#### **`cleanup()`**  
  Release resources and stop monitoring.



### Events

#### **`text-selection`**

Emitted when text is selected, see [`TextSelectionData`](#textselectiondata) for `data` structure
  ```javascript
  hook.on('text-selection', (data: TextSelectionData) => {
    // data contains selection information
  });
  ```

#### **`mouse-move`**, **`mouse-up`**, **`mouse-down`**

Mouse events, see [`MouseEventData`](#mouseeventdata) for `data` structure 
  ```javascript
  hook.on('mouse-XXX', (data: MouseEventData) => {
    // data contains mouse coordinates and button info
  });
  ```

#### **`mouse-wheel`**

Mouse wheel events, see [`MouseWheelEventData`](#mousewheeleventdata) for `data` structure 
  ```javascript
  hook.on('mouse-wheel', (data: MouseWheelEventData) => {
    // data contains wheel direction info
  });
  ```

#### **`key-down`**, **`key-up`**

Keyboard events, see [`KeyboardEventData`](#keyboardeventdata) for `data` structure
  ```javascript
  hook.on('key-XXX', (data: KeyboardEventData) => {
    // data contains key code and modifier info
  });
  ```

#### **`status`**

Hook status changes
  ```javascript
  hook.on('status', (status: string) => {
    // status is a string, e.g. "started", "stopped"
  });
  ```

#### **`error`**

Error events
  Only display errors when `debug` set to `true` when `start()`
  ```javascript
  hook.on('error', (error: Error) => {
    // error is an Error object
  });
  ```

### Data Structure

**Note**: All coordinates are in physical coordinates (virtual screen coordinates) in Windows. You can use `screen.screenToDipPoint(point)` in Electron to convert the point to logical coordinates.

#### `TextSelectionData`
Represents text selection information including content, source application, and coordinates.

| Property        | Type                       | Description                                      |
| --------------- | -------------------------- | ------------------------------------------------ |
| `text`          | `string`                   | The selected text content                        |
| `programName`   | `string`                   | Name of the application where selection occurred |
| `startTop`      | `Point` | First paragraph's top-left coordinates (px)      |
| `startBottom`   | `Point` | First paragraph's bottom-left coordinates (px)   |
| `endTop`        | `Point` | Last paragraph's top-right coordinates (px)      |
| `endBottom`     | `Point` | Last paragraph's bottom-right coordinates (px)   |
| `mousePosStart` | `Point` | Mouse position when selection started (px)       |
| `mousePosEnd`   | `Point` | Mouse position when selection ended (px)         |
| `method`        | `SelectionMethod`          | Indicates which method was used to detect the text selection.   |
| `posLevel`      | `PositionLevel`            | Indicates which positional data is provided.            |

Type `Point` is `{ x: number; y: number }`

When `PositionLevel` is:
- `MOUSE_SINGLE`：only `mousePosStart` and `mousePosEnd` is provided, and `mousePosStart` equals `mousePosEnd`
- `MOUSE_DUAL`: only `mousePosStart` and `mousePosEnd` is provided 
- `SEL_FULL`: all the mouse position and paragraph's coordinates are provided


#### `MouseEventData`
Contains mouse click/movement information in screen coordinates.

| Property | Type     | Description                      |
| -------- | -------- | -------------------------------- |
| `x`      | `number` | Horizontal pointer position (px) |
| `y`      | `number` | Vertical pointer position (px)   |
| `button` | `number` | Same as WebAPIs' MouseEvent.button <br /> `0`=Left, `1`=Middle, `2`=Right, `3`=Back, `4`=Forward  |



#### `MouseWheelEventData`
Describes mouse wheel scrolling events.

| Property | Type     | Description                         |
| -------- | -------- | ----------------------------------- |
| `button` | `number` | `0`=Vertical, `1`=Horizontal scroll |
| `flag`   | `number` | `1`=Up/Right, `-1`=Down/Left        |



#### `KeyboardEventData`
Represents keyboard key presses/releases.

| Property   | Type      | Description                       |
| ---------- | --------- | --------------------------------- |
| `sys`      | `boolean` | System key pressed (Alt/Ctrl/Win) |
| `vkCode`   | `number`  | Windows virtual key code          |
| `scanCode` | `number`  | Hardware scan code                |
| `flags`    | `number`  | Additional state flags            |
| `type`     | `string?` | Internal event type               |
| `action`   | `string?` | `"key-down"` or `"key-up"`        |


### Constants

#### **`SelectionHook.SelectionMethod`**

Indicates which method was used to detect the text selection:
- `NONE`: No selection detected
- `UIA`: UI Automation
- `FOCUSCTL`: Focused control
- `ACCESSIBLE`: Accessibility interface
- `CLIPBOARD`: Clipboard fallback

#### **`SelectionHook.PositionLevel`**

Indicates which positional data is provided:
- `NONE`: No position information
- `MOUSE_SINGLE`: Only single mouse position
- `MOUSE_DUAL`: Mouse start and end positions (when dragging to select)
- `SEL_FULL`: Full selection coordinates (see [`TextSelectionData`](#textselectiondata) structure for details)
- `SEL_DETAILED`: Detailed selection coordinates (reserved for future use)

####  **`SelectionHook.ClipboardMode`**

- `DEFAULT`: Use clipboard for all programs
- `INCLUDE_LIST`: Only use clipboard for programs in list
- `EXCLUDE_LIST`: Use clipboard for all except programs in list

### TypeScript Support

This module includes TypeScript definitions. Import the module in TypeScript as:

```typescript
import {
  SelectionHookConstructor,
  SelectionHookInstance,
  SelectionConfig,
  TextSelectionData,
  MouseEventData,
  MouseWheelEventData,
  KeyboardEventData
} from "selection-hook";

// use `SelectionHookConstructor` for SelectionHook Class
const SelectionHook: SelectionHookConstructor = require("selection-hook");
// use `SelectionHookInstance` for SelectionHook instance
const hook: SelectionHookInstance = new SelectionHook();
```

See [`index.d.ts`](https://github.com/0xfullex/selection-hook/blob/main/index.d.ts) for details.