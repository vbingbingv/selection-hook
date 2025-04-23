/**
 * Node Selection Hook
 *
 * This module provides a Node.js interface for monitoring text selections
 * across applications on Windows using UI Automation and Accessibility APIs.
 */

const EventEmitter = require("events");
const gypBuild = require("node-gyp-build");
const path = require("path");

let nativeModule = null;
// Make debugFlag a private module variable to avoid global state issues
let _debugFlag = false;

try {
  if (process.platform !== "win32") {
    throw new Error("This module only supports Windows platform");
  }
  nativeModule = gypBuild(path.resolve(__dirname));
} catch (err) {
  console.error("Failed to load native module:", err.message);
}

class SelectionHook extends EventEmitter {
  static SelectionMethod = {
    NONE: 0,
    UIA: 1,
    FOCUSCTL: 2,
    ACCESSIBLE: 3,
    CLIPBOARD: 4,
  };

  static PositionLevel = {
    NONE: 0,
    MOUSE_SINGLE: 1,
    MOUSE_DUAL: 2,
    SEL_FULL: 3,
    SEL_DETAILED: 4,
  };

  static ClipboardMode = {
    DEFAULT: 0,
    INCLUDE_LIST: 1,
    EXCLUDE_LIST: 2,
  };

  constructor() {
    super();
    this._instance = null;
    this._running = false;

    if (!nativeModule) {
      throw new Error("Native module failed to load - only works on Windows");
    }
  }

  /**
   * Start monitoring text selections
   * @param {boolean} debug Enable debug logging
   * @returns {boolean} Success status
   */
  start(config = null) {
    const defaultConfig = this._getDefaultConfig();

    _debugFlag = config?.debug ?? defaultConfig.debug;

    if (this._running) {
      this._logDebug("Text selection hook already running");
      return true;
    }

    if (!this._instance) {
      try {
        this._instance = new nativeModule.TextSelectionHook();
      } catch (err) {
        this._handleError("Failed to create hook instance", err);
        return false;
      }
    }

    if (config) {
      this._initByConfig(defaultConfig, config);
    }

    try {
      const callback = (data) => {
        if (!data) return;

        switch (data.type) {
          case "text-selection":
            const formattedData = this._formatSelectionData(data);
            if (formattedData) {
              this.emit("text-selection", formattedData);
            }
            break;
          case "mouse-event":
            this.emit(data.action, data);
            break;
          case "keyboard-event":
            this.emit(data.action, data);
            break;
          case "status":
            this.emit("status", data.status);
            break;
          case "error":
            this.emit("error", new Error(data.error));
            break;
        }
      };

      this._instance.start(callback);
      this._running = true;
      this.emit("status", "started");
      return true;
    } catch (err) {
      this._handleError("Failed to start hook", err);
      return false;
    }
  }

  /**
   * Stop monitoring text selections
   * @returns {boolean} Success status
   */
  stop() {
    if (!this._instance || !this._running) {
      this._logDebug("Text selection hook not running");
      return true;
    }

    try {
      this._instance.stop();
      this._running = false;
      this.emit("status", "stopped");
      return true;
    } catch (err) {
      this._handleError("Failed to stop hook", err);
      this._running = false;
      return false;
    }
  }

  /**
   * Get current text selection
   * @returns {object|null} Selection data or null
   */
  getCurrentSelection() {
    if (!this._instance || !this._running) {
      this._logDebug("Text selection hook not running");
      return null;
    }

    try {
      const data = this._instance.getCurrentSelection();
      return this._formatSelectionData(data);
    } catch (err) {
      this._handleError("Failed to get current selection", err);
      return null;
    }
  }

  /**
   * Enable mousemove events (high CPU usage)
   * @returns {boolean} Success status
   */
  enableMouseMoveEvent() {
    if (!this._checkRunning()) return false;

    try {
      this._instance.enableMouseMoveEvent();
      return true;
    } catch (err) {
      this._handleError("Failed to enable mouse move events", err);
      return false;
    }
  }

  /**
   * Disable mousemove events
   * @returns {boolean} Success status
   */
  disableMouseMoveEvent() {
    if (!this._checkRunning()) return false;

    try {
      this._instance.disableMouseMoveEvent();
      return true;
    } catch (err) {
      this._handleError("Failed to disable mouse move events", err);
      return false;
    }
  }

  /**
   * Enable clipboard fallback for text selection
   * Uses Ctrl+C as a last resort to get selected text
   * @returns {boolean} Success status
   */
  enableClipboard() {
    if (!this._checkRunning()) return false;

    try {
      this._instance.enableClipboard();
      return true;
    } catch (err) {
      this._handleError("Failed to enable clipboard fallback", err);
      return false;
    }
  }

  /**
   * Disable clipboard fallback for text selection
   * Will not use Ctrl+C to get selected text
   * @returns {boolean} Success status
   */
  disableClipboard() {
    if (!this._checkRunning()) return false;

    try {
      this._instance.disableClipboard();
      return true;
    } catch (err) {
      this._handleError("Failed to disable clipboard fallback", err);
      return false;
    }
  }

  /**
   * Set clipboard mode and program list for text selection
   *
   * Configures how the clipboard fallback mechanism works for different programs.
   * Mode can be:
   * - DEFAULT: Use clipboard for all programs
   * - INCLUDE_LIST: Only use clipboard for programs in the list
   * - EXCLUDE_LIST: Use clipboard for all programs except those in the list
   *
   * @param {number} mode - Clipboard mode (SelectionHook.ClipboardMode)
   * @param {string[]} programList - Array of program names to include/exclude.
   * @returns {boolean} Success status
   */
  setClipboardMode(mode, programList = []) {
    if (!this._checkRunning()) return false;

    const validModes = Object.values(SelectionHook.ClipboardMode);
    if (!validModes.includes(mode)) {
      this._handleError("Invalid clipboard mode", new Error("Invalid argument"));
      return false;
    }

    if (!Array.isArray(programList)) {
      this._handleError("Program list must be an array", new Error("Invalid argument"));
      return false;
    }

    try {
      this._instance.setClipboardMode(mode, programList);
      return true;
    } catch (err) {
      this._handleError("Failed to set clipboard mode and list", err);
      return false;
    }
  }

  /**
   * Set selection passive mode
   * @param {boolean} passive - Passive mode
   * @returns {boolean} Success status
   */
  setSelectionPassiveMode(passive) {
    if (!this._checkRunning()) return false;

    try {
      this._instance.setSelectionPassiveMode(passive);
      return true;
    } catch (err) {
      this._handleError("Failed to set selection passive mode", err);
      return false;
    }
  }

  /**
   * Check if hook is running
   * @returns {boolean} Running status
   */
  isRunning() {
    return this._running;
  }

  /**
   * Release resources
   */
  cleanup() {
    this.stop();
    this._instance = null;
  }

  _getDefaultConfig() {
    return {
      debug: false,
      enableMouseMoveEvent: false,
      enableClipboard: true,
      selectionPassiveMode: false,
      clipboardMode: SelectionHook.ClipboardMode.DEFAULT,
      programList: [],
    };
  }

  _initByConfig(defaultConfig, userConfig) {
    const config = {};

    // Only keep values that exist in userConfig and differ from defaultConfig
    for (const key in userConfig) {
      if (userConfig[key] !== defaultConfig[key]) {
        config[key] = userConfig[key];
      }
    }

    // Apply the filtered config
    if (config.enableMouseMoveEvent !== undefined) {
      if (config.enableMouseMoveEvent) {
        this._instance.enableMouseMoveEvent();
      } else {
        this._instance.disableMouseMoveEvent();
      }
    }

    if (config.enableClipboard !== undefined) {
      if (config.enableClipboard) {
        this._instance.enableClipboard();
      } else {
        this._instance.disableClipboard();
      }
    }

    if (config.selectionPassiveMode !== undefined) {
      this._instance.setSelectionPassiveMode(config.selectionPassiveMode);
    }

    if (config.clipboardMode !== undefined || config.programList !== undefined) {
      this._instance.setClipboardMode(
        config.clipboardMode ?? defaultConfig.clipboardMode,
        config.programList ?? defaultConfig.programList
      );
    }
  }

  _formatSelectionData(data) {
    if (!data) return null;

    return {
      text: data.text,
      programName: data.programName,
      startTop: { x: data.startTopX, y: data.startTopY },
      startBottom: { x: data.startBottomX, y: data.startBottomY },
      endTop: { x: data.endTopX, y: data.endTopY },
      endBottom: { x: data.endBottomX, y: data.endBottomY },
      mousePosStart: { x: data.mouseStartX, y: data.mouseStartY },
      mousePosEnd: { x: data.mouseEndX, y: data.mouseEndY },
      method: data.method || 0,
      posLevel: data.posLevel || 0,
    };
  }

  // Private helper methods
  _checkRunning() {
    if (!this._instance || !this._running) {
      this._logDebug("Text selection hook not running");
      return false;
    }
    return true;
  }

  _handleError(message, err) {
    if (!_debugFlag) return;

    const errorMsg = `${message}: ${err.message}`;
    console.error(errorMsg);
    this.emit("error", new Error(errorMsg));
  }

  _logDebug(message) {
    if (_debugFlag) {
      console.warn(message);
    }
  }
}

module.exports = SelectionHook;
