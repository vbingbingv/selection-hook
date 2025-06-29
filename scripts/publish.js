#!/usr/bin/env node
const { execSync } = require('child_process')
const isWindows = process.platform === "win32"
const isMac = process.platform === "darwin"

if (isWindows) {
  console.log('exec npm run prebuild:win')
  execSync('npm run prebuild:win')
}
if (isMac) {
  console.log('exec npm run prebuild:mac')
  execSync('npm run prebuild:mac')
}
