#!/usr/bin/env node

const supportPlatform = ['darwin', 'win32'];
const supportArch = ['arm64', 'x64'];

const isSupport = supportPlatform.includes(process.platform)
  supportArch.includes(process.arch);

console.log(`installing @haier/selection-hook pkg, current platform: ${process.platform}, current arch: ${process.arch}`)
console.log(`support in your machine: ${isSupport}`)