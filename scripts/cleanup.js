#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Files to keep in the Release directory
const filesToKeep = [
  "selection_hook.node", // The main binary
  ".forge-meta", // Metadata file
];

// Files to keep in the build directory
const buildFilesToKeep = [
  "Release", // Keep the Release directory
];

function cleanup() {
  // Paths to clean
  const buildDir = path.join(__dirname, "../build");
  const releaseDir = path.join(buildDir, "Release");

  if (!fs.existsSync(buildDir)) {
    console.log("Cleanup successful: nothing to clean");
    return;
  }

  try {
    // 1. Clean the Release directory
    if (fs.existsSync(releaseDir)) {
      // Get all files in the Release directory
      const files = fs.readdirSync(releaseDir);

      // Delete files that are not in the keep list
      for (const file of files) {
        const filePath = path.join(releaseDir, file);

        // If it's the obj directory, remove it completely
        if (file === "obj" && fs.statSync(filePath).isDirectory()) {
          if (process.platform === "win32") {
            try {
              execSync(`rmdir /s /q "${filePath}"`, { stdio: "ignore" });
            } catch (e) {
              throw new Error(`Failed to remove obj directory: ${e.message}`);
            }
          } else {
            try {
              execSync(`rm -rf "${filePath}"`, { stdio: "ignore" });
            } catch (e) {
              throw new Error(`Failed to remove obj directory: ${e.message}`);
            }
          }
          continue;
        }

        // For regular files, check if they should be kept
        if (!fs.statSync(filePath).isDirectory() && !filesToKeep.includes(file)) {
          fs.unlinkSync(filePath);
        }
      }
    }

    // 2. Clean the build directory (remove .vcxproj files, etc.)
    const buildFiles = fs.readdirSync(buildDir);

    for (const file of buildFiles) {
      // Skip directories in the keep list
      if (buildFilesToKeep.includes(file)) continue;

      const filePath = path.join(buildDir, file);

      // Remove all vcx files and other non-essential files
      if (
        !fs.statSync(filePath).isDirectory() &&
        (file.endsWith(".vcxproj") ||
          file.endsWith(".vcxproj.filters") ||
          file.endsWith(".sln") ||
          file.endsWith(".gypi"))
      ) {
        fs.unlinkSync(filePath);
      }
    }

    console.log("Cleanup successful");
  } catch (err) {
    console.error("Cleanup failed:", err.message);
  }
}

// Run cleanup if this script is called directly
if (require.main === module) {
  cleanup();
}

module.exports = cleanup;
