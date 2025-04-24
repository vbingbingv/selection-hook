{
  "targets": [
    {
      "target_name": "selection-hook",
      "cflags!": [ "-fno-exceptions" ],
      "cflags_cc!": [ "-fno-exceptions" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [ 
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        # Use NAPI version 8, supports Node.js 18 and above, Electron 23 and above
        "NAPI_VERSION=8" 
      ],
      "conditions": [
        ['OS=="win"', {
          "sources": [ 
            "src/windows/selection_hook.cc",
            "src/windows/lib/string_pool.cc",
            "src/windows/lib/utils.cc"
          ],
          "libraries": [ 
            "uiautomationcore.lib",
            "user32.lib"  # Required for mouse hooks
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": "1"  # Enable C++ exception handling (/EHsc)
            }
          }
        }, {
          "defines": [
            "WINDOWS_ONLY_MODULE"
          ]
        }]
      ]
    }
  ]
} 