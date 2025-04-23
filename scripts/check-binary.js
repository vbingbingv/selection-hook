#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

function checkBinary() {
  const binaryPath = path.join(__dirname, "../build/Release/selection_hook.node");

  if (fs.existsSync(binaryPath)) {
    console.log("Binary already exists, skipping build");
    return true;
  } else {
    console.log("Binary not found, build is needed");
    return false;
  }
}

// Run the check if this script is called directly
if (require.main === module) {
  process.exit(checkBinary() ? 0 : 1);
}

module.exports = checkBinary;
