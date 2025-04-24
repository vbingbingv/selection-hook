/**
 * Text Selection Hook - Test Application
 *
 * This test file demonstrates the functionality of the Node-API native module
 * for monitoring text selections across applications on Windows.
 *
 * Features demonstrated:
 * - Text selection detection (drag and double-click)
 * - Mouse and keyboard event monitoring
 * - Interactive controls for testing different features
 */

// ===========================
// === Module Dependencies ===
// ===========================
const SelectionHook = require("../index.js");

// ===========================
// === Configuration ========
// ===========================

/**
 * Configuration flags for event display
 * Toggle these using keyboard shortcuts during runtime
 */
const config = {
  showMouseMoveEvents: false, // High CPU usage when enabled
  showMouseEvents: false, // Mouse clicks and wheel events
  showKeyboardEvents: false, // Keyboard key press/release events
  clipboardFallbackEnabled: false, // Use clipboard as fallback for text selection
  clipboardMode: 0, // Default clipboard mode (see SelectionHook.ClipboardMode)
  passiveModeEnabled: false, // Passive mode for text selection
};

// Program list for clipboard mode
const programList = ["cursor.exe", "vscode.exe"];

/**
 * ANSI color codes for console output formatting
 */
const colors = {
  info: "\x1b[36m%s\x1b[0m", // Cyan - Used for general information
  success: "\x1b[32m%s\x1b[0m", // Green - Used for successful operations and selections
  warning: "\x1b[33m%s\x1b[0m", // Yellow - Used for position data and toggles
  error: "\x1b[31m%s\x1b[0m", // Red - Used for errors
  highlight: "\x1b[35m%s\x1b[0m", // Magenta - Used for keyboard events
};

// ===========================
// === Initialize Hook ======
// ===========================

// Create instance of the hook
const hook = new SelectionHook();

// Exit if initialization failed
if (!hook) {
  console.error(colors.error, "Failed to initialize text selection hook");
  process.exit(1);
}

// ===========================
// === Core Functions =======
// ===========================

/**
 * Main entry point - initializes and starts the application
 */
function main() {
  printWelcomeMessage();
  setupEventListeners();
  startHook();
  setupInputHandlers();
}

/**
 * Display welcome message and usage instructions
 */
function printWelcomeMessage() {
  console.log(colors.info, "=== Text Selection Hook Test ===");
  console.log("Testing mouse action detection for text selection");

  console.log("\nPlease perform the following actions:");
  console.log("1. Drag to select text (distance > 8px) - should log 'action_drag_selection'");
  console.log("2. Double-click to select text - should log 'action_dblclick_selection'");

  console.log("\nCoordinates Information:");
  console.log("  - startTop/startBottom: First paragraph's left-top and left-bottom points");
  console.log("  - endTop/endBottom: Last paragraph's right-top and right-bottom points");
  console.log("  - mousePosStart: Initial mouse position when selection started");
  console.log("  - mousePosEnd: Final mouse position when selection ended");

  console.log("\nKeyboard Controls:");
  console.log("  M - Toggle mouse move events (default: OFF)");
  console.log("  E - Toggle other mouse events (default: OFF)");
  console.log("  K - Toggle keyboard events (default: OFF)");
  console.log("  C - Display current selection");
  console.log("  B - Toggle clipboard fallback (default: OFF)");
  console.log("  L - Toggle clipboard mode (DEFAULT → EXCLUDE_LIST → INCLUDE_LIST)");
  console.log("  P - Toggle passive mode (default: OFF)");
  console.log("  ? - Show help");
  console.log("  Ctrl+C - Exit program");
  console.log("\nIn passive mode, press Alt key to trigger text selection");
}

/**
 * Start the hook and begin listening for events
 */
function startHook() {
  if (hook.start({ debug: true })) {
    console.log(colors.success, "Text selection listener started successfully");
    console.log(colors.info, "Mouse move events are disabled by default (press 'M' to toggle)");
  } else {
    console.error(colors.error, "Failed to start text selection listener");
  }
}

/**
 * Clean up resources and exit the application
 */
function cleanup() {
  console.log(colors.info, "\nStopping text selection listener...");

  // Make sure to disable mouse move events before stopping to reduce resource usage
  if (config.showMouseMoveEvents) {
    hook.disableMouseMoveEvent();
  }

  // Disable clipboard fallback if enabled
  if (config.clipboardFallbackEnabled) {
    hook.disableClipboard();
  }

  hook.stop();
  hook.cleanup();
  process.exit(0);
}

// ===========================
// === Event Listeners ======
// ===========================

/**
 * Set up all event listeners for the hook
 */
function setupEventListeners() {
  // Text selection events - our primary functionality
  hook.on("text-selection", (selectionData) => {
    showSelection(selectionData);
  });

  // Status events from the native module
  hook.on("status", (status) => {
    console.log(colors.info, "Listener status:", status);
  });

  // Setup mouse events
  setupMouseEventListeners();

  // Setup keyboard events
  setupKeyboardEventListeners();

  // Error events
  hook.on("error", (error) => {
    console.error(colors.error, "Error:", error.message);
  });
}

/**
 * Set up mouse-related event listeners
 */
function setupMouseEventListeners() {
  // Mouse move events (high CPU usage - disabled by default)
  hook.on("mouse-move", (eventData) => {
    if (config.showMouseMoveEvents) {
      console.log(colors.warning, "Mouse move:", `x: ${eventData.x}, y: ${eventData.y}`);
    }
  });

  // Mouse button events
  hook.on("mouse-up", (eventData) => {
    if (config.showMouseEvents) {
      console.log(
        colors.warning,
        "Mouse up:",
        `button: ${eventData.button}, x: ${eventData.x}, y: ${eventData.y}`
      );
    }
  });

  hook.on("mouse-down", (eventData) => {
    if (config.showMouseEvents) {
      console.log(
        colors.warning,
        "Mouse down:",
        `button: ${eventData.button}, x: ${eventData.x}, y: ${eventData.y}`
      );
    }
  });

  // Mouse wheel events
  hook.on("mouse-wheel", (eventData) => {
    if (config.showMouseEvents) {
      console.log(
        colors.warning,
        "Mouse wheel:",
        `button: ${eventData.button}, direction: ${eventData.flag > 0 ? "up/right" : "down/left"}`
      );
    }
  });
}

/**
 * Set up keyboard-related event listeners
 */
function setupKeyboardEventListeners() {
  // Key down events
  hook.on("key-down", (eventData) => {
    if (config.showKeyboardEvents) {
      console.log(
        colors.highlight,
        "Key down:",
        `vkCode: ${eventData.vkCode}, scanCode: ${eventData.scanCode}, flags: ${eventData.flags}${
          eventData.sys ? ", system key" : ""
        }`
      );
    }

    // Special handling for Alt key (vkCode 164) to get current selection in passive mode
    if (eventData.vkCode === 164 && config.passiveModeEnabled) {
      console.log(colors.info, "Alt pressed, requesting current selection in passive mode");
      const selectionData = hook.getCurrentSelection();
      if (selectionData) {
        showSelection(selectionData);
      } else {
        console.log(colors.warning, "No selection data available");
      }
    }
  });

  // Key up events
  hook.on("key-up", (eventData) => {
    if (config.showKeyboardEvents) {
      console.log(
        colors.highlight,
        "Key up:",
        `vkCode: ${eventData.vkCode}, scanCode: ${eventData.scanCode}, flags: ${eventData.flags}${
          eventData.sys ? ", system key" : ""
        }`
      );
    }
  });
}

// ===========================
// === User Input Handling ==
// ===========================

/**
 * Configure handlers for user input
 */
function setupInputHandlers() {
  // Set up standard input in raw mode for immediate key handling
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", handleKeyPress);

  // Handle Ctrl+C for graceful exit
  process.on("SIGINT", cleanup);
}

/**
 * Process keyboard input from the user
 * @param {Buffer} key - The key buffer from stdin
 */
function handleKeyPress(key) {
  const keyStr = key.toString();

  // Exit on Ctrl+C
  if (keyStr === "\u0003") {
    cleanup();
    return;
  }

  switch (keyStr.toLowerCase()) {
    case "m": // Toggle mouse move events
      toggleMouseMoveEvents();
      break;

    case "e": // Toggle other mouse events
      config.showMouseEvents = !config.showMouseEvents;
      console.log(colors.success, `Mouse events: ${config.showMouseEvents ? "ON" : "OFF"}`);
      break;

    case "k": // Toggle keyboard events
      config.showKeyboardEvents = !config.showKeyboardEvents;
      console.log(colors.success, `Keyboard events: ${config.showKeyboardEvents ? "ON" : "OFF"}`);
      break;

    case "c": // Display current selection
      const selectionData = hook.getCurrentSelection();
      if (selectionData) {
        console.log(colors.success, "Current selection retrieved");
        showSelection(selectionData);
      } else {
        console.log(colors.warning, "No current selection available");
      }
      break;

    case "b": // Toggle clipboard fallback
      config.clipboardFallbackEnabled = !config.clipboardFallbackEnabled;

      if (config.clipboardFallbackEnabled) {
        // Enable clipboard fallback in the native module
        const success = hook.enableClipboard();
        if (success) {
          console.log(colors.success, "Clipboard fallback: ENABLED");
        } else {
          config.clipboardFallbackEnabled = false;
          console.log(colors.error, "Failed to enable clipboard fallback");
        }
      } else {
        // Disable clipboard fallback in the native module
        const success = hook.disableClipboard();
        if (success) {
          console.log(colors.warning, "Clipboard fallback: DISABLED");
        } else {
          console.log(colors.error, "Failed to disable clipboard fallback");
        }
      }
      break;

    case "l": // Toggle clipboard mode
      toggleClipboardMode();
      break;

    case "p": // Toggle passive mode
      togglePassiveMode();
      break;

    case "?": // Show help
      printWelcomeMessage();
      break;
  }
}

/**
 * Toggle mouse move event tracking
 * Mouse move events use significant CPU resources, so they're disabled by default
 */
function toggleMouseMoveEvents() {
  config.showMouseMoveEvents = !config.showMouseMoveEvents;

  if (config.showMouseMoveEvents) {
    // Enable mouse move events in the native module
    const success = hook.enableMouseMoveEvent();
    if (success) {
      console.log(colors.success, "Mouse move events: ENABLED");
    } else {
      config.showMouseMoveEvents = false;
      console.log(colors.error, "Failed to enable mouse move events");
    }
  } else {
    // Disable mouse move events in the native module
    const success = hook.disableMouseMoveEvent();
    if (success) {
      console.log(colors.warning, "Mouse move events: DISABLED");
    } else {
      console.log(
        colors.error,
        "Failed to disable mouse move events, but events won't be displayed"
      );
    }
  }
}

/**
 * Toggle passive mode for text selection
 * In passive mode, the hook doesn't automatically monitor selections
 * and requires manual triggering (e.g., with Alt key)
 */
function togglePassiveMode() {
  config.passiveModeEnabled = !config.passiveModeEnabled;

  // Set passive mode in the native module
  const success = hook.setSelectionPassiveMode(config.passiveModeEnabled);
  if (success) {
    console.log(
      colors.success,
      `Passive mode: ${config.passiveModeEnabled ? "ENABLED" : "DISABLED"}`
    );
    if (config.passiveModeEnabled) {
      console.log(colors.info, "Press Alt key (vkCode 164) to trigger text selection manually");
    }
  } else {
    config.passiveModeEnabled = !config.passiveModeEnabled; // Revert the toggle
    console.log(colors.error, "Failed to set passive mode");
  }
}

/**
 * Get clipboard mode name from numeric value
 * @param {number} mode - Clipboard mode value
 * @returns {string} Mode name
 */
function getClipboardModeName(mode) {
  const modeNames = {
    [SelectionHook.ClipboardMode.DEFAULT]: "DEFAULT",
    [SelectionHook.ClipboardMode.EXCLUDE_LIST]: "EXCLUDE_LIST",
    [SelectionHook.ClipboardMode.INCLUDE_LIST]: "INCLUDE_LIST",
  };
  return modeNames[mode] || "UNKNOWN";
}

/**
 * Toggle clipboard mode (DEFAULT -> EXCLUDE_LIST -> INCLUDE_LIST -> DEFAULT)
 */
function toggleClipboardMode() {
  // Rotate through the modes
  config.clipboardMode = (config.clipboardMode + 1) % 3;

  // Apply the new mode if clipboard fallback is enabled
  const success = hook.setClipboardMode(config.clipboardMode, programList);
  if (success) {
    console.log(
      colors.success,
      `Clipboard mode set to ${getClipboardModeName(config.clipboardMode)} for ${programList.join(
        ", "
      )}`
    );
  } else {
    console.log(colors.error, "Failed to set clipboard mode");
  }
}

// ===========================
// === Utility Functions ====
// ===========================

/**
 * Display text selection data
 * @param {Object} selectionData - Selection data from the hook
 */
function showSelection(selectionData) {
  if (!selectionData) {
    return;
  }

  console.log(colors.info, "=== Detected selected text ===");

  console.log(selectionData.text);

  // Selection method and position level maps
  const methodMap = {
    0: "None",
    1: "UI Automation",
    2: "Focus Control",
    3: "Accessibility",
    4: "Clipboard",
  };

  const posLevelMap = {
    0: "None",
    1: "Mouse Single",
    2: "Mouse Dual",
    3: "Selection Full",
    4: "Selection Detailed",
  };

  console.log(colors.warning, "=== Selection Information ===");
  console.log(colors.warning, "Program Name:", selectionData.programName);
  console.log(
    colors.warning,
    "Method: ",
    `${methodMap[selectionData.method] || selectionData.method}`
  );
  console.log(
    colors.warning,
    "Position Level: ",
    `${posLevelMap[selectionData.posLevel] || selectionData.posLevel}`
  );

  // Display all available coordinates
  if (selectionData.posLevel >= 1) {
    console.log(
      colors.warning,
      "Mouse: ",
      `(${selectionData.mousePosStart.x}, ${selectionData.mousePosStart.y}) -> (${selectionData.mousePosEnd.x}, ${selectionData.mousePosEnd.y})`
    );
  }
  if (selectionData.posLevel >= 3) {
    console.log(
      colors.warning,
      `   startTop(${selectionData.startTop.x}, ${selectionData.startTop.y})\t   endTop(${selectionData.endTop.x}, ${selectionData.endTop.y})`
    );
    console.log(
      colors.warning,
      `startBottom(${selectionData.startBottom.x}, ${selectionData.startBottom.y})\tendBottom(${selectionData.endBottom.x}, ${selectionData.endBottom.y})`
    );
  }
}

// ===========================
// === Start Application ====
// ===========================

// Launch the application
main();
