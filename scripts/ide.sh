#!/bin/bash

# 🎯 Saler IDE Configuration Setup Script
# ========================================
# سكريبت إعداد وتكوين بيئات التطوير المتكاملة

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
print_header() {
    echo -e "\n${PURPLE}=======================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}=======================================${NC}\n"
}

print_step() {
    echo -e "${BLUE}🔹 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

# Setup VS Code configuration
setup_vscode() {
    print_header "إعداد VS Code Configuration"
    
    mkdir -p .vscode
    
    # Main settings
    print_step "إنشاء VS Code settings.json..."
    cat > .vscode/settings.json << 'EOF'
{
  // Editor Settings
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true,
    "source.fixAll": true
  },
  "editor.rulers": [88, 120],
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "editor.detectIndentation": false,
  "editor.wordWrap": "on",
  "editor.lineNumbers": "on",
  "editor.minimap.enabled": true,
  "editor.scrollBeyondLastLine": false,
  "editor.suggestSelection": "first",
  "editor.acceptSuggestionOnCommit": "on",
  "editor.acceptSuggestionOnEnter": "on",
  "editor.showFoldingControls": "always",
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": true,
  "editor.guides.indentation": true,
  "editor.unicodeHighlight.ambiguousCharacters": false,
  "editor.unicodeHighlight.invisibleCharacters": false,
  
  // Python Specific Settings
  "python.defaultInterpreterPath": "./backend/venv/bin/python",
  "python.terminal.activateEnvironment": true,
  "python.terminal.activateEnvInCurrentTerminal": true,
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.linting.flake8Enabled": true,
  "python.linting.mypyEnabled": true,
  "python.linting.banditEnabled": true,
  "python.linting.pylintArgs": ["--disable=C0111,C0103"],
  "python.linting.flake8Args": ["--max-line-length=88", "--ignore=E203,W503"],
  "python.linting.mypyArgs": ["--ignore-missing-imports"],
  "python.formatting.provider": "black",
  "python.formatting.blackArgs": ["--line-length=88"],
  "python.sortImports.args": ["--profile", "black"],
  "python.testing.pytestEnabled": true,
  "python.testing.unittestEnabled": false,
  "python.testing.pytestArgs": ["tests"],
  "python.analysis.typeCheckingMode": "basic",
  "python.analysis.autoImportCompletions": true,
  "python.analysis.autoSearchPaths": true,
  "python.analysis.completeFunctionParens": true,
  "python.analysis.diagnosticMode": "workspace",
  "python.analysis.stubPath": "./backend/venv/lib/python3.11/site-packages",
  
  // TypeScript/JavaScript Settings
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "typescript.inlayHints.parameterNames.enabled": "all",
  "typescript.inlayHints.parameterTypes.enabled": true,
  "typescript.inlayHints.variableTypes.enabled": true,
  "typescript.inlayHints.propertyDeclarationTypes.enabled": true,
  "typescript.inlayHints.functionLikeReturnTypes.enabled": true,
  "javascript.format.enable": true,
  "javascript.format.indent": 2,
  "javascript.inlayHints.parameterNames.enabled": "all",
  "javascript.inlayHints.parameterTypes.enabled": true,
  "javascript.inlayHints.variableTypes.enabled": true,
  "javascript.inlayHints.propertyDeclarationTypes.enabled": true,
  "javascript.inlayHints.functionLikeReturnTypes.enabled": true,
  "js/ts.implicitProjectConfig.checkJs": true,
  "js/ts.implicitProjectConfig.strictNullChecks": true,
  "js/ts.implicitProjectConfig.strictFunctionTypes": true,
  
  // React/Next.js Settings
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html",
    "javascript": "html",
    "javascriptreact": "html"
  },
  "emmet.triggerExpansionOnTab": true,
  
  // JSON Settings
  "json.schemas": [
    {
      "fileMatch": ["package.json"],
      "url": "https://json.schemastore.org/package.json"
    },
    {
      "fileMatch": ["docker-compose.yml", "docker-compose.yaml"],
      "url": "https://json.schemastore.org/dockercompose.json"
    },
    {
      "fileMatch": [".vscode/settings.json"],
      "url": "https://json.schemastore.org/vscode.settings.json"
    }
  ],
  "json.format.enable": true,
  
  // YAML Settings
  "yaml.schemas": {
    "https://json.schemastore.org/github-workflow.json": "file:///home/%user%/.vscode/extensions/redhat.vscode-yaml-*/schemas/github-workflow.json"
  },
  "yaml.format.enable": true,
  "yaml.format.tabWidth": 2,
  
  // Markdown Settings
  "markdown.preview.breaks": true,
  "markdown.preview.linkify": true,
  "markdown.preview.typographer": true,
  "markdown.preview.fontSize": 14,
  "markdown.extension.toc.unorderedList.marker": "-",
  "markdown.extension.toc.levels": "slugify",
  
  // Git Settings
  "git.ignoreLimitWarning": true,
  "git.autofetch": true,
  "gitlens.blame.compact": false,
  "gitlens.blame.heatmap.enabled": false,
  "gitlens.codeLens.enabled": true,
  "gitlens.codeLens.recentChange.enabled": true,
  "gitlens.currentLine.enabled": true,
  "gitlens.hovers.enabled": true,
  "gitlens.statusBar.enabled": true,
  
  // Docker Settings
  "docker.defaultRegistryPath": "",
  "docker.linter.enabled": true,
  "docker.showDanglingImages": true,
  "docker.showLabelHintOnImages": true,
  
  // Database Settings
  "sqltools.connections": [
    {
      "name": "Saler Database",
      "driver": "PostgreSQL",
      "server": "localhost",
      "port": 5432,
      "database": "saler_dev",
      "username": "saler_user",
      "password": "saler_password",
      "askForPassword": false,
      "emptyPasswordInput": false,
      "savePassword": true,
      "profileSaving": true,
      "connectionTimeout": 30
    }
  ],
  "sqltools.useNodeRuntime": true,
  
  // Files and Search Settings
  "files.encoding": "utf8",
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "files.trimFinalNewlines": true,
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/node_modules/*/**": true,
    "**/venv/**": true,
    "**/logs/**": true,
    "**/.next/**": true,
    "**/dev-data/**": true,
    "**/*.log": true,
    "**/coverage/**": true,
    "**/__pycache__/**": true,
    "**/*.pyc": true
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/*.pyc": true,
    "**/node_modules": true,
    "**/.next": true,
    "**/venv": true,
    "**/.env.local": true,
    "**/logs": true,
    "**/dev-data": true,
    "**/build": true,
    "**/dist": true,
    "**/.coverage": true,
    "**/coverage": true,
    "**/.pytest_cache": true,
    "**/target": true
  },
  
  // Search Settings
  "search.exclude": {
    "**/node_modules": true,
    "**/venv": true,
    "**/logs": true,
    "**/dev-data": true,
    "**/.next": true,
    "**/*.log": true,
    "**/.git": true,
    "**/build": true,
    "**/dist": true,
    "**/target": true,
    "**/coverage": true
  },
  
  // Terminal Settings
  "terminal.integrated.copyOnSelection": true,
  "terminal.integrated.cursorBlinking": true,
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.env.linux": {
    "PYTHONPATH": "${workspaceFolder}/backend",
    "NODE_ENV": "development"
  },
  "terminal.integrated.env.osx": {
    "PYTHONPATH": "${workspaceFolder}/backend",
    "NODE_ENV": "development"
  },
  "terminal.integrated.env.windows": {
    "PYTHONPATH": "${workspaceFolder}\\backend",
    "NODE_ENV": "development"
  },
  
  // Workbench Settings
  "workbench.startupEditor": "welcomePage",
  "workbench.editor.enablePreview": false,
  "workbench.editor.showTabs": true,
  "workbench.editor.tabCloseButton": "right",
  "workbench.tree.indent": 20,
  "workbench.tree.renderIndentGuides": "always",
  "workbench.colorCustomizations": {
    "activityBar.background": "#1a1a1a",
    "sideBar.background": "#252526",
    "statusBar.background": "#007acc"
  },
  
  // Code Quality Settings
  "eslint.enable": true,
  "eslint.format.enable": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact",
    "vue"
  ],
  "eslint.codeAction.showDocumentation": {
    "enable": true
  },
  
  // Prettier Settings
  "prettier.singleQuote": true,
  "prettier.trailingComma": "es5",
  "prettier.tabWidth": 2,
  "prettier.semi": true,
  "prettier.printWidth": 88,
  "prettier.bracketSpacing": true,
  "prettier.arrowParens": "avoid",
  "prettier.endOfLine": "lf",
  
  // File Associations
  "files.associations": {
    "*.css": "tailwindcss",
    "*.py": "python",
    "*.js": "javascript",
    "*.ts": "typescript",
    "*.jsx": "javascriptreact",
    "*.tsx": "typescriptreact",
    "*.json": "jsonc",
    "*.yml": "yaml",
    "*.yaml": "yaml",
    "*.md": "markdown",
    "*.sh": "shellscript",
    "*.sql": "sql"
  },
  
  // Extensions Auto Update
  "extensions.autoUpdate": true,
  "extensions.autoCheckUpdates": true,
  
  // Debug Settings
  "debug.allowBreakpointsEverywhere": true,
  "debug.showBreakpointsInOverviewRuler": true,
  "debug.showInStatusBar": "always",
  
  // Performance Settings
  "editor.foldingStrategy": "indentation",
  "editor.gotoLocation.multipleReferences": "goto",
  "editor.gotoLocation.multipleDefinitions": "goto",
  "editor.gotoLocation.multipleDeclarations": "goto",
  "editor.gotoLocation.multipleImplementations": "goto",
  "editor.gotoLocation.multipleTypeDefinitions": "goto",
  "editor.gotoLocation.multipleCitations": "goto"
}
EOF

    # Extensions recommendations
    print_step "إنشاء VS Code extensions.json..."
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    // Python Development
    "ms-python.python",
    "ms-python.vscode-pylance",
    "ms-python.black-formatter",
    "ms-python.flake8",
    "ms-python.mypy-type-checker",
    "ms-python.isort",
    "ms-python.autopep8",
    "njpwerner.autodocstring",
    
    // JavaScript/TypeScript/React
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-react-native",
    "ms-vscode.vscode-eslint",
    
    // Database Tools
    "mtxr.sqltools",
    "mtxr.sqltools-driver-pg",
    "ms-ossdata.vscode-postgresql",
    "alexcvzz.vscode-sqlite",
    "ms-rainbow发文.sqlite-viewer",
    
    // Development Tools
    "ms-vscode.vscode-yaml",
    "redhat.vscode-xml",
    "dotjoshjohnson.xml",
    "ms-vscode.vscode-markdown",
    "yzhang.markdown-all-in-one",
    "davidanson.vscode-markdownlint",
    "ms-vscode.vscode-github-actions",
    
    // Git and Collaboration
    "eamodio.gitlens",
    "github.vscode-pull-request-github",
    "github.vscode-github-actions",
    "ms-vscode.vscode-github-issue-notebooks",
    
    // Docker and Containers
    "ms-vscode-remote.remote-containers",
    "ms-azuretools.vscode-docker",
    "p1c2u.docker-compose",
    
    // API and Testing
    "humao.rest-client",
    "ms-vscode.vscode-testing-explorer",
    "hbenl.vscode-test-explorer",
    "ms-vscode.vscode-jest",
    
    // Code Quality and Security
    "ms-vscode.vscode-eslint",
    "streetsidesoftware.code-spell-checker",
    "ms-vscode.vscode-security",
    "ms-vscode.vscode-secured-code",
    
    // Productivity Tools
    "ms-vscode.vscode-json",
    "yzhang.markdown-all-in-one",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "ms-vscode.vscode-color-info",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-intellicode",
    "visualstudioexptteam.vscodeintellicode",
    
    // Utilities
    "ms-vscode.vscode-hexeditor",
    "formulahendry.code-calculator",
    "formulahendry.code-runner",
    "mechatroner.rainbow-csv",
    "ms-vscode.vscode-office",
    "gruntfuggly.todo-tree",
    "oderwat.indent-rainbow",
    "pkief.material-icon-theme",
    "zhuangtongfa.material-theme",
    
    // Language Support
    "ms-vscode.cpptools",
    "ms-python.debugpy",
    "rust-lang.rust-analyzer",
    "golang.go",
    "ms-vscode.vscode-json"
  ],
  
  "unwantedRecommendations": [
    "ms-vscode.vscode-css-peek",
    "ms-python.python-protobuf"
  ]
}
EOF

    # Debug configurations
    print_step "إنشاء VS Code launch.json..."
    cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python: FastAPI Debug",
      "type": "python",
      "request": "launch",
      "program": "${workspaceFolder}/backend/venv/bin/uvicorn",
      "args": [
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload"
      ],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend",
        "DEBUG": "true",
        "LOG_LEVEL": "DEBUG"
      },
      "justMyCode": false,
      "stopOnEntry": false,
      "subProcess": true
    },
    {
      "name": "Python: FastAPI Attach",
      "type": "python",
      "request": "attach",
      "port": 5678,
      "host": "localhost",
      "pathMappings": [
        {
          "localRoot": "${workspaceFolder}/backend",
          "remoteRoot": "/app"
        }
      ],
      "justMyCode": false
    },
    {
      "name": "Python: Run Tests",
      "type": "python",
      "request": "launch",
      "module": "pytest",
      "args": [
        "${workspaceFolder}/backend/tests",
        "-v",
        "--tb=short"
      ],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    },
    {
      "name": "Python: Debug Tests",
      "type": "python",
      "request": "launch",
      "module": "pytest",
      "args": [
        "${workspaceFolder}/backend/tests",
        "-v",
        "--tb=short",
        "-s"
      ],
      "cwd": "${workspaceFolder}/backend",
      "console": "integratedTerminal",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/backend"
      }
    },
    {
      "name": "Node.js: Next.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/next",
      "args": [
        "dev"
      ],
      "cwd": "${workspaceFolder}/frontend",
      "env": {
        "NODE_ENV": "development",
        "NEXT_PUBLIC_API_URL": "http://localhost:8000",
        "NEXT_PUBLIC_WS_URL": "ws://localhost:8000"
      },
      "console": "integratedTerminal",
      "runtimeArgs": [
        "--require",
        "source-map-support/register"
      ],
      "sourceMaps": true,
      "restart": true,
      "protocol": "inspector"
    },
    {
      "name": "Node.js: Attach",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}/frontend",
      "remoteRoot": "/app"
    },
    {
      "name": "Node.js: Debug Tests",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/frontend/node_modules/.bin/jest",
      "args": [
        "--runInBand",
        "--watchAll=false"
      ],
      "cwd": "${workspaceFolder}/frontend",
      "env": {
        "NODE_ENV": "test"
      },
      "console": "integratedTerminal",
      "sourceMaps": true,
      "restart": true
    },
    {
      "name": "Docker: Python Backend",
      "type": "python",
      "request": "attach",
      "connect": {
        "host": "localhost",
        "port": 5678
      },
      "pathMappings": [
        {
          "localRoot": "${workspaceFolder}/backend",
          "remoteRoot": "/app"
        }
      ],
      "justMyCode": false
    },
    {
      "name": "Docker: Node.js Frontend",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "localRoot": "${workspaceFolder}/frontend",
      "remoteRoot": "/app"
    },
    {
      "name": "Docker: Full Stack",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "docker",
      "runtimeArgs": [
        "compose",
        "up",
        "backend"
      ],
      "cwd": "${workspaceFolder}",
      "env": {
        "DEBUG": "true"
      }
    }
  ]
}
EOF

    # Task definitions
    print_step "إنشاء VS Code tasks.json..."
    cat > .vscode/tasks.json << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Setup Development Environment",
      "type": "shell",
      "command": "./scripts/setup.sh",
      "group": {
        "kind": "build",
        "isDefault": false
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared",
        "showReuseMessage": true,
        "clear": false
      },
      "problemMatcher": []
    },
    {
      "label": "Start Development Services",
      "type": "shell",
      "command": "./scripts/dev.sh",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared",
        "showReuseMessage": true,
        "clear": false
      },
      "problemMatcher": []
    },
    {
      "label": "Start with GUI Tools",
      "type": "shell",
      "command": "./scripts/dev.sh",
      "args": ["start", "--with-gui"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Stop Development Services",
      "type": "shell",
      "command": "./scripts/dev.sh",
      "args": ["stop"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Restart Development Services",
      "type": "shell",
      "command": "./scripts/dev.sh",
      "args": ["restart"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Run Python Tests",
      "type": "shell",
      "command": "cd backend && python -m pytest tests/ -v --tb=short",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": [
        {
          "owner": "python",
          "fileLocation": ["relative", "${workspaceFolder}/backend"],
          "pattern": {
            "regexp": "^(.*):(\\d+):\\s+(.*)\\s+(E\\d+|FAILED)\\s+(.*)$",
            "file": 1,
            "line": 2,
            "message": 3,
            "severity": 4,
            "code": 5
          }
        }
      ]
    },
    {
      "label": "Run Node.js Tests",
      "type": "shell",
      "command": "cd frontend && npm test",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": [
        {
          "owner": "javascript",
          "fileLocation": ["relative", "${workspaceFolder}/frontend"],
          "pattern": {
            "regexp": "^(.*):(\\d+):(\\d+):\\s+(.*)$",
            "file": 1,
            "line": 2,
            "column": 3,
            "message": 4
          }
        }
      ]
    },
    {
      "label": "Lint Python Code",
      "type": "shell",
      "command": "cd backend && python -m flake8 . && python -m black --check . && python -m isort --check-only .",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": [
        {
          "owner": "python",
          "fileLocation": ["relative", "${workspaceFolder}/backend"],
          "pattern": [
            {
              "regexp": "^(.*):(\\d+):(\\d+):\\s+(E\\d+|W\\d+|F\\d+|C\\d+|N\\d+)\\s+(.*)$",
              "file": 1,
              "line": 2,
              "column": 3,
              "message": 4,
              "code": 5
            }
          ]
        }
      ]
    },
    {
      "label": "Lint JavaScript Code",
      "type": "shell",
      "command": "cd frontend && npm run lint",
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": [
        {
          "owner": "javascript",
          "fileLocation": ["relative", "${workspaceFolder}/frontend"],
          "pattern": [
            {
              "regexp": "^(.*):(\\d+):(\\d+):\\s+(.*)$",
              "file": 1,
              "line": 2,
              "column": 3,
              "message": 4
            }
          ]
        }
      ]
    },
    {
      "label": "Format Python Code",
      "type": "shell",
      "command": "cd backend && python -m black . && python -m isort .",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Format JavaScript Code",
      "type": "shell",
      "command": "cd frontend && npx prettier --write src/",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Clean Development Environment",
      "type": "shell",
      "command": "./scripts/reset.sh",
      "args": ["clean"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Full Environment Reset",
      "type": "shell",
      "command": "./scripts/reset.sh",
      "args": ["full"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Database Backup",
      "type": "shell",
      "command": "./scripts/dev.sh",
      "args": ["db", "backup"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Database Reset",
      "type": "shell",
      "command": "./scripts/dev.sh",
      "args": ["db", "reset"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    }
  ]
}
EOF

    # Snippets for common code patterns
    print_step "إنشاء VS Code snippets..."
    mkdir -p .vscode/snippets
    
    cat > .vscode/snippets/python.json << 'EOF'
{
  "Python FastAPI Route": {
    "prefix": "fastapi_route",
    "body": [
      "@app.${1:get}",
      "async def ${2:function_name}(${3:params}):",
      "    \"\"\"${4:Description of the function}\"\"\"",
      "    ${5:pass}"
    ],
    "description": "Create a FastAPI route"
  },
  
  "Python Pydantic Model": {
    "prefix": "pydantic_model",
    "body": [
      "from pydantic import BaseModel",
      "",
      "class ${1:ModelName}(BaseModel):",
      "    ${2:field_name}: ${3:str} = Field(${4:description})"
    ],
    "description": "Create a Pydantic model"
  },
  
  "Python SQLAlchemy Model": {
    "prefix": "sqlalchemy_model",
    "body": [
      "from sqlalchemy import Column, Integer, String, DateTime, Boolean",
      "from sqlalchemy.ext.declarative import declarative_base",
      "",
      "Base = declarative_base()",
      "",
      "class ${1:ModelName}(Base):",
      "    __tablename__ = \"${2:table_name}\"",
      "    ",
      "    id = Column(Integer, primary_key=True, index=True)",
      "    created_at = Column(DateTime, default=func.now())",
      "    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())"
    ],
    "description": "Create a SQLAlchemy model"
  },
  
  "Python Test Function": {
    "prefix": "pytest_test",
    "body": [
      "def test_${1:function_name}():",
      "    \"\"\"Test ${2:function description}\"\"\"",
      "    ${3:# Arrange}",
      "    ${4:pass}",
      "    ",
      "    ${5:# Act}",
      "    ${6:pass}",
      "    ",
      "    ${7:# Assert}",
      "    ${8:pass}"
    ],
    "description": "Create a pytest test function"
  },
  
  "Python Async Function": {
    "prefix": "async_func",
    "body": [
      "async def ${1:function_name}(${2:params}):",
      "    \"\"\"${3:Description}\"\"\"",
      "    ${4:pass}"
    ],
    "description": "Create an async function"
  }
}
EOF

    cat > .vscode/snippets/typescript.json << 'EOF'
{
  "React Functional Component": {
    "prefix": "react_component",
    "body": [
      "import React from 'react';",
      "",
      "interface ${1:ComponentName}Props {",
      "  ${2:prop}: ${3:string};",
      "}",
      "",
      "export const ${1:ComponentName}: React.FC<${1:ComponentName}Props> = ({ ${2:prop} }) => {",
      "  return (",
      "    <div>",
      "      ${4:/* Component JSX */}",
      "    </div>",
      "  );",
      "};"
    ],
    "description": "Create a React functional component"
  },
  
  "React Hook": {
    "prefix": "react_hook",
    "body": [
      "import { useState, useEffect } from 'react';",
      "",
      "export const use${1:HookName} = (${2:params}) => {",
      "  const [${3:state}, set${3:State}] = useState(${4:initialValue});",
      "  ",
      "  useEffect(() => {",
      "    ${5:// Effect logic}",
      "  }, [${6:dependencies}]);",
      "  ",
      "  return { ${3:state}, set${3:State} };",
      "};"
    ],
    "description": "Create a custom React hook"
  },
  
  "TypeScript Interface": {
    "prefix": "ts_interface",
    "body": [
      "interface ${1:InterfaceName} {",
      "  ${2:property}: ${3:string};",
      "  ${4:optional}?: ${5:number};",
      "}"
    ],
    "description": "Create a TypeScript interface"
  },
  
  "Next.js API Route": {
    "prefix": "next_api",
    "body": [
      "import type { NextApiRequest, NextApiResponse } from 'next';",
      "",
      "export default function handler(",
      "  req: NextApiRequest,",
      "  res: NextApiResponse",
      ") {",
      "  if (req.method === '${1:GET}') {",
      "    ${2:// Handle GET request}",
      "    res.status(200).json({ ${3:message}: 'success' });",
      "  } else {",
      "    res.status(405).json({ message: 'Method not allowed' });",
      "  }",
      "}"
    ],
    "description": "Create a Next.js API route"
  }
}
EOF

    print_success "تم إعداد VS Code configuration"
}

# Setup JetBrains IDE configuration
setup_jetbrains() {
    print_header "إعداد JetBrains IDE Configuration"
    
    mkdir -p .idea
    
    # Main project file
    print_step "إنشاء JetBrains project file..."
    cat > .idea/saler.iml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<module type="PYTHON_MODULE" version="4">
  <component name="NewModuleRootManager">
    <content url="file://$MODULE_DIR$">
      <sourceFolder url="file://$MODULE_DIR$/backend" isTestSource="false" />
      <sourceFolder url="file://$MODULE_DIR$/frontend/src" isTestSource="false" />
      <sourceFolder url="file://$MODULE_DIR$/frontend" isTestSource="false" />
      <excludeFolder url="file://$MODULE_DIR$/venv" />
      <excludeFolder url="file://$MODULE_DIR$/node_modules" />
      <excludeFolder url="file://$MODULE_DIR$/logs" />
      <excludeFolder url="file://$MODULE_DIR$/dev-data" />
      <excludeFolder url="file://$MODULE_DIR$/.next" />
      <excludeFolder url="file://$MODULE_DIR$/build" />
      <excludeFolder url="file://$MODULE_DIR$/dist" />
      <excludeFolder url="file://$MODULE_DIR$/.idea" />
    </content>
    <orderEntry type="inheritedJdk" />
    <orderEntry type="sourceFolder" forTests="false" />
  </component>
  <component name="PyDocumentationSettings">
    <option name="format" value="GOOGLE" />
    <option name="myDocStringFormat" value="Google" />
  </component>
  <component name="TestRunnerService">
    <option name="PROJECT_TEST_RUNNER" value="pytest" />
  </component>
  <component name="Black">
    <option name="SDK_NAME" value="Python 3.11" />
  </component>
</module>
EOF

    # Code style settings
    mkdir -p .idea/codeStyles
    cat > .idea/codeStyles/Project.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<component name="ProjectCodeStyleConfiguration">
  <code_scheme name="Project" version="173">
    <option name="OTHER_INDENT_OPTIONS">
      <value>
        <option name="INDENT_SIZE" value="4" />
        <option name="TAB_SIZE" value="4" />
        <option name="USE_TAB_CHARACTER" value="false" />
        <option name="SMART_TABS" value="false" />
        <option name="LABEL_INDENT_SIZE" value="0" />
        <option name="LABEL_INDENT_ABSOLUTE" value="false" />
        <option name="USE_RELATIVE_INDENTS" value="false" />
      </value>
    </option>
    <option name="RIGHT_MARGIN" value="88" />
    <option name="FORMATTER_TAGS_ENABLED" value="true" />
    <XML>
      <option name="INDENT_SIZE" value="2" />
      <option name="TAB_SIZE" value="2" />
      <option name="USE_TAB_CHARACTER" value="false" />
      <option name="SMART_TABS" value="false" />
      <option name="LABEL_INDENT_SIZE" value="0" />
      <option name="LABEL_INDENT_ABSOLUTE" value="false" />
      <option name="USE_RELATIVE_INDENTS" value="false" />
    </XML>
    <codeStyleSettings language="Python">
      <option name="RIGHT_MARGIN" value="88" />
      <option name="ALIGN_MULTILINE_PARAMETERS_IN_CALLS" value="true" />
      <option name="PARENT_SETTINGS_INSTALLED" value="true" />
    </codeStyleSettings>
  </code_scheme>
</component>
EOF

    # Code inspection profiles
    mkdir -p .idea/inspectionProfiles
    cat > .idea/inspectionProfiles/Project_Default.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<component name="InspectionProjectProfileManager">
  <profile version="1.0">
    <option name="myName" value="Project Default" />
    <inspection_tool class="PyPep8Inspection" enabled="true" level="WEAK WARNING" enabled_by_default="true">
      <option name="ignoredErrors">
        <list>
          <option value="E501" />
        </list>
      </option>
    </inspection_tool>
    <inspection_tool class="PyUnresolvedReferencesInspection" enabled="true" level="WARNING" enabled_by_default="true">
      <option name="ignoredIdentifiers">
        <list>
          <option value="*" />
        </list>
      </option>
    </inspection_tool>
    <inspection_tool class="SpellCheckingInspection" enabled="false" level="TYPO" enabled_by_default="false">
      <option name="processCode" value="true" />
      <option name="processLiterals" value="true" />
      <option name="processComments" value="true" />
    </inspection_tool>
  </profile>
</component>
EOF

    # Database tools configuration
    mkdir -p .idea/dataSources
    cat > .idea/dataSources/local.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<component name="DataSourceManagerImpl" format="xml" multifile-model="true">
  <data-source source="LOCAL" name="Saler Database" uuid="local-saler-db">
    <database-info product="PostgreSQL" version="15" jdbc-version="4.2" driver-name="PostgreSQL JDBC Driver" driver-class="org.postgresql.Driver">
      <intro />
      <identifier-quote-string>"</identifier-quote-string>
    </database-info>
    <case-sensitivity plain-identifiers="lower" quoted-identifiers="lower" />
    <secret-storage>master_key</secret-storage>
    <auth-required>false</auth-required>
    <resolve-scope>
      <item val="postgresql-15" />
    </resolve-scope>
    <jdbc-driver>org.postgresql.Driver</jdbc-driver>
    <jdbc-url>jdbc:postgresql://localhost:5432/saler_dev</jdbc-url>
    <connection-url>jdbc:postgresql://localhost:5432/saler_dev</connection-url>
    <connection-type>basic</connection-type>
    <access-type>GET</access-type>
  </data-source>
</component>
EOF

    # Workspace settings
    mkdir -p .idea/workspace
    cat > .idea/workspace.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ChangeListManager">
    <list default="true" id="changelist_default" name="Changes" comment="" />
    <option name="SHOW_DIALOG" value="false" />
    <option name="HIGHLIGHT_CONFLICTS" value="true" />
    <option name="HIGHLIGHT_NON_ACTIVE_CHANGELIST" value="false" />
    <option name="LAST_RESOLUTION" value="IGNORE" />
  </component>
  <component name="Git.Settings">
    <option name="RECENT_GIT_ROOT_PATH" value="$PROJECT_DIR$" />
  </component>
  <component name="MarkdownSettingsMigration">
    <option name="stateVersion" value="1" />
  </component>
  <component name="ProjectId" id="saler-project-id" />
  <component name="ProjectViewState">
    <option name="hideEmptyMiddlePackages" value="true" />
    <option name="showLibraryContents" value="true" />
  </component>
  <component name="PropertiesComponent">{
  &quot;keyToString&quot;: {
    &quot;RunOnceActivity.OpenProjectViewOnStart&quot;: &quot;true&quot;,
    &quot;RunOnceActivity.ShowReadmeOnStart&quot;: &quot;true&quot;,
    &quot;last_opened_file_path&quot;: &quot;$PROJECT_DIR$&quot;,
    &quot;settings.editor.selected.configurable&quot;: &quot;com.jetbrains.python.configuration.PyActiveSdkModuleConfigurable&quot;
  }
}</component>
  <component name="RunManager">
    <configuration default="true" type="tests" factoryName="py.test">
      <module name="saler" />
      <option name="INTERPRETER_OPTIONS" value="" />
      <option name="PARENT_ENVS" value="true" />
      <envs />
      <option name="SDK_HOME" value="" />
      <option name="WORKING_DIRECTORY" value="$PROJECT_DIR$/backend" />
      <option name="IS_MODULE_SDK" value="true" />
      <option name="ADD_CONTENT_ROOTS" value="true" />
      <option name="ADD_SOURCE_ROOTS" value="true" />
      <option name="_new_keywords" value="&quot;&quot;" />
      <option name="_new_parameters" value="&quot;&quot;" />
      <option name="_new_additionalArguments" value="&quot;-v&quot;" />
      <option name="_new_target" value="&quot;$PROJECT_DIR$/backend/tests&quot;" />
      <option name="_new_targetType" value="&quot;PATH&quot;" />
      <method v="2" />
    </configuration>
  </component>
</project>
EOF

    print_success "تم إعداد JetBrains IDE configuration"
}

# Setup Vim/Neovim configuration
setup_vim() {
    print_header "إعداد Vim/Neovim Configuration"
    
    # Create .vimrc
    cat > .vimrc << 'EOF'
" Saler Development .vimrc
" ========================

" Basic Settings
set nocompatible
filetype plugin indent on
syntax on

" Line numbers
set number
set relativenumber

" Indentation
set tabstop=4
set shiftwidth=4
set expandtab
set smarttab
set autoindent
set smartindent

" Search
set incsearch
set hlsearch
set ignorecase
set smartcase
set gdefault

" Files
set autoread
set hidden
set wildmenu
set wildmode=longest:full,full

" UI
set ruler
set showcmd
set laststatus=2
set statusline=%f\ %h%w%m%r\ %=%(%l,%c%V\ %=\ %P%)

" Colors
set background=dark
colorscheme gruvbox

" Python specific
let g:python3_host_prog = '/usr/bin/python3'

"NERDTree
let g:NERDTreeWinPos = "right"
let g:NERDTreeWinSize = 30

"GitGutter
set updatetime=100

"Coc.nvim configuration
" Use <cr> to confirm completion
inoremap <expr> <cr> pumvisible() ? "\<C-y>" : "\<CR>"

" ALE (Asynchronous Lint Engine) settings
let g:ale_linters = {
\   'python': ['pylint', 'flake8', 'mypy'],
\   'javascript': ['eslint'],
\   'typescript': ['eslint']
\}
let g:ale_fixers = {
\   'python': ['black', 'isort'],
\   'javascript': ['prettier'],
\   'typescript': ['prettier']
\}
let g:ale_fix_on_save = 1

" Buffer settings
set bufhidden=hide
set buftype=
set list
set listchars=trail:·,nbsp:·,tab:··,eol:¶

" Backup and undo
set backupdir=~/.vim/backup
set directory=~/.vim/swap
set undodir=~/.vim/undo
set undofile

" Macros
" Save and quit
nnoremap <leader>wq :wq<CR>
" Split window
nnoremap <leader>sp :split<CR>
" Vertical split
nnoremap <leader>vs :vsplit<CR>
" Toggle NERDTree
nnoremap <leader>n :NERDTreeToggle<CR>
" Clear search
nnoremap <leader>cs :nohlsearch<CR>
" Git status
nnoremap <leader>gs :Git<CR>
" Run tests
nnoremap <leader>rt :!cd backend && python -m pytest %<CR>

" Plugin settings
" EasyMotion
let g:EasyMotion_smartcase = 1

" Airline
let g:airline_powerline_fonts = 1
let g:airline_theme = 'gruvbox'

" FZF
set rtp+=~/.fzf

" Quickfix shortcuts
nnoremap <leader>co :copen<CR>
nnoremap <leader>cc :cclose<CR>
nnoremap <leader>cn :cnext<CR>
nnoremap <leader>cp :cprev<CR>
EOF

    # Create .nvimrc for Neovim
    cat > .nvimrc << 'EOF'
" Saler Development .nvimrc
" ========================

-- Basic settings
vim.opt.nocompatible = true
vim.opt.filetype = "plugin indent on"
vim.opt.syntax = "on"

-- Line numbers
vim.opt.number = true
vim.opt.relativenumber = true

-- Indentation
vim.opt.tabstop = 4
vim.opt.shiftwidth = 4
vim.opt.expandtab = true
vim.opt.smarttab = true
vim.opt.autoindent = true
vim.opt.smartindent = true

-- Search
vim.opt.incsearch = true
vim.opt.hlsearch = true
vim.opt.ignorecase = true
vim.opt.smartcase = true
vim.opt.gdefault = true

-- Files
vim.opt.autoread = true
vim.opt.hidden = true
vim.opt.wildmenu = true
vim.opt.wildmode = "longest:full,full"

-- UI
vim.opt.ruler = true
vim.opt.showcmd = true
vim.opt.laststatus = 2

-- Python specific
vim.g.python3_host_prog = '/usr/bin/python3'

-- Colors
vim.opt.background = "dark"
vim.cmd("colorscheme gruvbox")

-- Key mappings
vim.api.nvim_set_keymap('n', '<leader>wq', ':wq<CR>', { noremap = true, silent = true })
vim.api.nvim_set_keymap('n', '<leader>sp', ':split<CR>', { noremap = true, silent = true })
vim.api.nvim_set_keymap('n', '<leader>vs', ':vsplit<CR>', { noremap = true, silent = true })
vim.api.nvim_set_keymap('n', '<leader>cs', ':nohlsearch<CR>', { noremap = true, silent = true })
EOF

    # Create .ideavimrc for IntelliJ IDEA
    cat > .ideavimrc << 'EOF'
" Saler Development .ideavimrc
" ============================

" Basic settings
set nocompatible
filetype plugin indent on
syntax on

" Line numbers
set number
set relativenumber

" Indentation
set tabstop=4
set shiftwidth=4
set expandtab
set smarttab
set autoindent
set smartindent

" Search
set incsearch
set hlsearch
set ignorecase
set smartcase

" Mapping
" Save and quit
nnoremap <leader>wq :action SaveAll<CR>:action CloseProject<CR>
" Split window
nnoremap <leader>sp :action SplitHorizontally<CR>
" Vertical split
nnoremap <leader>vs :action SplitVertically<CR>
" Find in files
nnoremap <leader>ff :action FindInPath<CR>
" Run tests
nnoremap <leader>rt :action RunTestsInFile<CR>
" Format code
nnoremap <leader>cf :action ReformatCode<CR>
" Toggle line numbers
nnoremap <leader>tl :action ToggleLineNumbers<CR>
" Toggle recent files
nnoremap <leader>rf :action RecentFiles<CR>
" Toggle project view
nnoremap <leader>pv :action ProjectView<CR>

" Quickfix shortcuts
nnoremap <leader>co :action ActivateMessagesToolWindow<CR>
nnoremap <leader>cn :action NextOccurrence<CR>
nnoremap <leader>cp :action PreviousOccurrence<CR>
EOF

    print_success "تم إعداد Vim/Neovim configuration"
}

# Setup debug configurations
setup_debug_configs() {
    print_header "إعداد Debug Configurations"
    
    # Create debug scripts
    mkdir -p scripts/debug
    
    # Python debug script
    cat > scripts/debug/python-debug.py << 'EOF'
#!/usr/bin/env python3
"""
Python Debug Helper Script
===========================
Helper script for debugging Python applications
"""

import sys
import pdb
import traceback
import os
from datetime import datetime

def debug_trace():
    """Start debug trace"""
    print("🐛 Starting Python debug trace...")
    print(f"📍 File: {__file__}")
    print(f"📍 Python version: {sys.version}")
    print(f"📍 Working directory: {os.getcwd()}")
    print(f"📍 Python path: {sys.path[:3]}...")
    
    # Set up post-mortem debugging
    def debug_hook(type, value, tb):
        if hasattr(sys, 'ps1') or not sys.stderr.isatty():
            sys.__excepthook__(type, value, tb)
        else:
            traceback.print_exception(type, value, tb)
            print("\n🐛 Debug mode activated!")
            pdb.post_mortem(tb)
    
    sys.excepthook = debug_hook
    print("✅ Debug hook installed!")

def memory_usage():
    """Show memory usage"""
    try:
        import psutil
        process = psutil.Process()
        memory_info = process.memory_info()
        print(f"💾 Memory usage: {memory_info.rss / 1024 / 1024:.2f} MB")
    except ImportError:
        print("💾 psutil not available for memory monitoring")

def performance_profile():
    """Profile performance"""
    import cProfile
    import pstats
    import io
    
    def profile_function(func):
        def wrapper(*args, **kwargs):
            pr = cProfile.Profile()
            pr.enable()
            result = func(*args, **kwargs)
            pr.disable()
            
            s = io.StringIO()
            ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
            ps.print_stats(10)
            print("⏱️ Performance Profile:")
            print(s.getvalue())
            return result
        return wrapper
    
    return profile_function

if __name__ == "__main__":
    debug_trace()
    
    print("🎯 Python Debug Tools Ready!")
    print("📝 Available functions:")
    print("   - debug_trace()     : Enable post-mortem debugging")
    print("   - memory_usage()    : Show current memory usage")
    print("   - performance_profile(): Decorator for profiling functions")
EOF
    
    chmod +x scripts/debug/python-debug.py
    
    # Node.js debug script
    cat > scripts/debug/node-debug.js << 'EOF'
#!/usr/bin/env node
/**
 * Node.js Debug Helper Script
 * ============================
 * Helper script for debugging Node.js applications
 */

const util = require('util');
const fs = require('fs');

function debugTrace() {
    console.log('🐛 Starting Node.js debug trace...');
    console.log(`📍 File: ${__filename}`);
    console.log(`📍 Node.js version: ${process.version}`);
    console.log(`📍 Working directory: ${process.cwd()}`);
    console.log(`📍 Platform: ${process.platform}`);
    console.log(`📍 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Enable verbose logging
    process.env.DEBUG = '*';
    console.log('✅ Debug mode activated!');
}

function performanceProfile() {
    const { PerformanceObserver, performance } = require('perf_hooks');
    
    const obs = new PerformanceObserver((list) => {
        console.log('⏱️ Performance metrics:');
        list.getEntries().forEach((entry) => {
            console.log(`  ${entry.name}: ${entry.duration.toFixed(2)}ms`);
        });
    });
    
    obs.observe({ entryTypes: ['measure'] });
    return obs;
}

function memorySnapshot() {
    const v8 = require('v8');
    const heapStats = v8.getHeapStatistics();
    
    console.log('💾 Memory Snapshot:');
    console.log(`  Heap size limit: ${Math.round(heapStats.heap_size_limit / 1024 / 1024)} MB`);
    console.log(`  Total heap size: ${Math.round(v8.getHeapStatistics().total_heap_size / 1024 / 1024)} MB`);
    console.log(`  Used heap size: ${Math.round(v8.getHeapStatistics().used_heap_size / 1024 / 1024)} MB`);
}

function testRunner() {
    console.log('🧪 Test Runner Ready');
    console.log('Available test commands:');
    console.log('  npm test                    - Run unit tests');
    console.log('  npm run test:watch          - Run tests in watch mode');
    console.log('  npm run test:coverage       - Run tests with coverage');
    console.log('  npm run test:integration    - Run integration tests');
}

if (require.main === module) {
    debugTrace();
    
    console.log('🎯 Node.js Debug Tools Ready!');
    console.log('📝 Available functions:');
    console.log('   - debugTrace()      : Enable debug trace');
    console.log('   - performanceProfile() : Create performance observer');
    console.log('   - memorySnapshot()  : Show memory snapshot');
    console.log('   - testRunner()      : Show test commands');
}

// Export for use in other modules
module.exports = {
    debugTrace,
    performanceProfile,
    memorySnapshot,
    testRunner
};
EOF
    
    chmod +x scripts/debug/node-debug.js
    
    # Create debug configuration template
    cat > scripts/debug/debug-config-template.json << 'EOF'
{
  "name": "Saler Debug Configuration",
  "description": "Template debug configuration for Saler project",
  "python": {
    "debug_script": "scripts/debug/python-debug.py",
    "pdb_settings": {
      "auto_continue": false,
      "interactive_mode": true
    },
    "memory_profiling": {
      "enabled": true,
      "interval": 1000
    },
    "performance_profiling": {
      "enabled": true,
      "detailed": true
    }
  },
  "nodejs": {
    "debug_script": "scripts/debug/node-debug.js",
    "inspect_port": 9229,
    "memory_monitoring": {
      "enabled": true,
      "threshold_mb": 100
    },
    "performance_monitoring": {
      "enabled": true,
      "metrics_interval": 5000
    }
  },
  "docker": {
    "debug_containers": ["backend", "frontend"],
    "log_level": "DEBUG",
    "enable_profiling": true
  }
}
EOF
    
    print_success "تم إعداد Debug configurations"
}

# Setup linting and formatting configs
setup_linting_formatting() {
    print_header "إعداد Linting و Formatting Configurations"
    
    # Python linting and formatting
    if [ -d "backend" ]; then
        print_step "إنشاء Python linting configuration..."
        
        # .flake8
        cat > backend/.flake8 << 'EOF'
[flake8]
max-line-length = 88
extend-ignore = E203, W503, E501
exclude = 
    .git,
    __pycache__,
    .venv,
    venv,
    .tox,
    .eggs,
    *.egg,
    build,
    dist,
    docs,
    migrations
max-complexity = 10
import-order-style = google
application-import-names = app
EOF

        # pyproject.toml for Black and isort
        cat > backend/pyproject.toml << 'EOF'
[tool.black]
line-length = 88
target-version = ['py311']
include = '\.pyi?$'
extend-exclude = '''
/(
  # directories
  \.eggs
  | \.git
  | \.hg
  | \.mypy_cache
  | \.tox
  | \.venv
  | build
  | dist
  | migrations
)/
'''

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88
known_first_party = ["app"]
sections = ["FUTURE", "STDLIB", "THIRDPARTY", "FIRSTPARTY", "LOCALFOLDER"]

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
disallow_incomplete_defs = true
check_untyped_defs = true
disallow_untyped_decorators = true
no_implicit_optional = true
warn_redundant_casts = true
warn_unused_ignores = true
warn_no_return = true
warn_unreachable = true
strict_equality = true
ignore_missing_imports = true

[[tool.mypy.overrides]]
module = "tests.*"
ignore_errors = true

[tool.pytest.ini_options]
minversion = "6.0"
addopts = "-ra -q --strict-markers --strict-config"
testpaths = ["tests"]
python_files = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
markers = [
    "slow: marks tests as slow (deselect with '-m \"not slow\"')",
    "integration: marks tests as integration tests",
    "unit: marks tests as unit tests",
]
filterwarnings = [
    "error",
    "ignore::UserWarning",
    "ignore::DeprecationWarning",
]

[tool.coverage.run]
source = ["app"]
omit = [
    "*/tests/*",
    "*/venv/*",
    "*/__pycache__/*",
    "*/migrations/*",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "def __repr__",
    "if self.debug:",
    "if settings.DEBUG",
    "raise AssertionError",
    "raise NotImplementedError",
    "if 0:",
    "if __name__ == .__main__.:",
    "class .*\\bProtocol\\):",
    "@(abc\\.)?abstractmethod",
]

[tool.bandit]
exclude_dirs = ["tests", "venv", ".venv"]
skips = ["B101", "B601"]

[tool.bandit.assert_used]
skips = ["*_test.py", "*/test_*.py"]
EOF

        # .pylintrc
        cat > backend/.pylintrc << 'EOF'
[MASTER]
init-hook='import sys; sys.path.append(".")'

[MESSAGES CONTROL]
disable=missing-docstring,line-too-long,too-few-public-methods,too-many-arguments,too-many-instance-attributes,too-many-locals,too-many-branches,too-many-statements,invalid-name

[FORMAT]
max-line-length=88
max-module-lines=1000
indent-string='    '

[BASIC]
good-names=i,j,k,ex,Run,_
bad-names=foo,bar,baz,toto,tutu,tata
include-naming-hint=no
argument-naming-style=snake_case
attr-naming-style=snake_case
function-naming-style=snake_case
method-naming-style=snake_case
module-naming-style=snake_case
class-naming-style=PascalCase

[DESIGN]
max-args=7
max-locals=15
max-returns=6
max-branches=12
max-statements=50
max-parents=7
max-attributes=7
min-public-methods=2
max-public-methods=20
max-bool-expr=5

[SIMILARITIES]
ignore-comments=yes
ignore-docstrings=yes
ignore-imports=no
min-similarity-lines=4
EOF
    fi
    
    # JavaScript/TypeScript linting and formatting
    if [ -d "frontend" ]; then
        print_step "إنشاء JavaScript/TypeScript configuration..."
        
        # .eslintrc.json
        cat > frontend/.eslintrc.json << 'EOF'
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-non-null-assertion": "warn",
    "prefer-const": "error",
    "no-var": "error",
    "no-console": "warn",
    "no-debugger": "error",
    "eqeqeq": "error",
    "curly": "error",
    "no-duplicate-imports": "error"
  },
  "env": {
    "browser": true,
    "es6": true,
    "node": true
  }
}
EOF

        # .prettierrc
        cat > frontend/.prettierrc << 'EOF'
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 88,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "bracketSameLine": false,
  "proseWrap": "preserve"
}
EOF

        # .prettierignore
        cat > frontend/.prettierignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production builds
/build
/dist

# Next.js
.next/

# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Cache directories
.npm
.eslintcache

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
EOF
    fi
    
    # Docker linting
    cat > .dockerignore << 'EOF'
# Git
.git
.gitignore

# Documentation
README.md
*.md
docs/

# CI/CD
.github/
.gitlab-ci.yml
Jenkinsfile

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/

# Node.js
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm
.eslintcache

# Development data
dev-data/
*.backup
*.dump
EOF

    print_success "تم إعداد Linting و Formatting configurations"
}

# Setup code templates
setup_code_templates() {
    print_header "إعداد Code Templates"
    
    mkdir -p templates/{python,typescript,react,nextjs}
    
    # Python templates
    cat > templates/python/fastapi_route.py << 'EOF'
from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1", tags=["example"])

class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None

class ItemCreate(ItemBase):
    pass

class Item(ItemBase):
    id: int
    is_active: bool = True

@router.get("/items", response_model=List[Item])
async def get_items(skip: int = 0, limit: int = 100):
    """Get all items"""
    # Implementation here
    pass

@router.post("/items", response_model=Item, status_code=201)
async def create_item(item: ItemCreate):
    """Create a new item"""
    # Implementation here
    pass

@router.get("/items/{item_id}", response_model=Item)
async def get_item(item_id: int):
    """Get item by ID"""
    # Implementation here
    pass
EOF

    cat > templates/python/sqlalchemy_model.py << 'EOF'
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class BaseModel(Base):
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class ExampleModel(BaseModel):
    __tablename__ = "examples"
    
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    metadata = Column(Text, nullable=True)  # JSON as string
    
    # Relationships
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    user = relationship("User", back_populates="examples")
EOF

    # TypeScript/React templates
    cat > templates/typescript/react_component.tsx << 'EOF'
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface ComponentProps {
  title: string;
  onSubmit?: (data: any) => void;
  initialData?: any;
}

export const ComponentName: React.FC<ComponentProps> = ({
  title,
  onSubmit,
  initialData
}) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Component initialization
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // API call here
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.(data);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Form fields */}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </div>
  );
};
EOF

    cat > templates/typescript/custom_hook.ts << 'EOF'
import { useState, useEffect, useCallback } from 'react';

interface UseApiOptions<T> {
  initialData?: T;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export const useApi = <T>(
  url: string,
  options: UseApiOptions<T> = {}
) => {
  const [data, setData] = useState<T | null>(options.initialData ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      options.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};
EOF

    # Next.js templates
    cat > templates/nextjs/api_route.ts << 'EOF'
import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

// Request validation schema
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  message: z.string().optional()
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        return handleGet(req, res);
      case 'POST':
        return handlePost(req, res);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ 
          message: `Method ${req.method} Not Allowed` 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      message: 'Internal Server Error' 
    });
  }
}

async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Implementation for GET request
  const data = await fetchData();
  return res.status(200).json(data);
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Validate request body
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ 
      message: 'Validation Error',
      errors: result.error.errors 
    });
  }

  // Implementation for POST request
  const createdData = await createData(result.data);
  return res.status(201).json(createdData);
}

async function fetchData() {
  // Implementation here
  return { message: 'Data fetched successfully' };
}

async function createData(data: any) {
  // Implementation here
  return { message: 'Data created successfully', data };
}
EOF

    cat > templates/nextjs/page.tsx << 'EOF'
import React from 'react';
import { GetStaticProps, GetStaticPaths } from 'next';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { Card } from '@/components/ui/card';

interface PageProps {
  data: any;
  fallback?: boolean;
}

const PageName: React.FC<PageProps> = ({ data, fallback = false }) => {
  return (
    <>
      <Head>
        <title>Page Title</title>
        <meta name="description" content="Page description" />
      </Head>
      
      <Layout>
        <div className="container mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Page Title</h1>
          
          {fallback && (
            <Card className="p-4 mb-6">
              <p className="text-gray-600">
                This page uses fallback data for static generation.
              </p>
            </Card>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Content grid */}
            {data?.items?.map((item: any) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    </>
  );
};

export default PageName;

export const getStaticProps: GetStaticProps = async (context) => {
  try {
    // Fetch data for static generation
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/data`);
    const data = await response.json();
    
    return {
      props: {
        data,
        fallback: false
      },
      revalidate: 3600 // Revalidate every hour
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    
    return {
      props: {
        data: null,
        fallback: true
      }
    };
  }
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/items`);
    const items = await response.json();
    
    const paths = items.map((item: any) => ({
      params: { id: item.id.toString() }
    }));
    
    return {
      paths,
      fallback: 'blocking' // or 'false' if you know all routes at build time
    };
  } catch (error) {
    console.error('Error generating paths:', error);
    
    return {
      paths: [],
      fallback: false
    };
  }
};
EOF

    print_success "تم إعداد Code Templates"
}

# Show IDE setup summary
show_ide_summary() {
    print_header "ملخص إعداد IDE Configuration"
    
    echo -e "${GREEN}🎉 تم إعداد جميع IDE configurations بنجاح!${NC}\n"
    
    echo -e "${BLUE}IDE Configurations المُعدة:${NC}"
    echo -e "  • VS Code (.vscode/)"
    echo -e "  • JetBrains IDEs (.idea/)"
    echo -e "  • Vim/Neovim (.vimrc, .nvimrc)"
    echo -e "  • IntelliJ IDEA (.ideavimrc)"
    
    echo -e "\n${BLUE}Debug Configurations:${NC}"
    echo -e "  • Python Debug Scripts"
    echo -e "  • Node.js Debug Scripts"
    echo -e "  • Docker Debugging"
    
    echo -e "\n${BLUE}Code Quality Configurations:${NC}"
    echo -e "  • Python: Black, isort, flake8, mypy, pytest"
    echo -e "  • JavaScript: ESLint, Prettier"
    echo -e "  • TypeScript: Strict typing rules"
    
    echo -e "\n${BLUE}Code Templates:${NC}"
    echo -e "  • FastAPI routes and models"
    echo -e "  • React components and hooks"
    echo -e "  • Next.js pages and API routes"
    
    echo -e "\n${PURPLE}💡 نصائح:${NC}"
    echo -e "  • افتح VS Code في المجلد الجذر للمشروع"
    echo -e "  • ثبت الإضافات المُوصى بها تلقائياً"
    echo -e "  • استخدم F5 لتشغيل debug configurations"
    echo -e "  • استخدم Ctrl+Shift+P لفتح Command Palette"
    echo -e "  • راجع snippets للـ templates السريعة"
}

# Main function
main() {
    print_header "بدء إعداد IDE Configuration"
    
    echo "سيتم إعداد جميع بيئات التطوير المطلوبة:"
    echo "  • VS Code Configuration"
    echo "  • JetBrains IDE Configuration"
    echo "  • Vim/Neovim Configuration"
    echo "  • Debug Configurations"
    echo "  • Linting & Formatting"
    echo "  • Code Templates"
    
    echo ""
    
    # Setup all IDE configurations
    setup_vscode
    setup_jetbrains
    setup_vim
    setup_debug_configs
    setup_linting_formatting
    setup_code_templates
    
    # Show summary
    show_ide_summary
}

# Help function
show_help() {
    echo -e "${PURPLE}Saler IDE Configuration Setup${NC}\n"
    echo "الاستخدام:"
    echo "  $0 [command]\n"
    echo "الأوامر:"
    echo "  setup            - إعداد جميع IDE configurations (افتراضي)"
    echo "  vscode           - إعداد VS Code فقط"
    echo "  jetbrains        - إعداد JetBrains IDEs فقط"
    echo "  vim              - إعداد Vim/Neovim فقط"
    echo "  debug            - إعداد Debug configurations فقط"
    echo "  linting          - إعداد Linting و Formatting فقط"
    echo "  templates        - إعداد Code Templates فقط"
    echo "  help             - عرض هذه المساعدة\n"
}

# Main script logic
case "${1:-setup}" in
    "setup")
        main
        ;;
    "vscode")
        setup_vscode
        ;;
    "jetbrains")
        setup_jetbrains
        ;;
    "vim")
        setup_vim
        ;;
    "debug")
        setup_debug_configs
        ;;
    "linting")
        setup_linting_formatting
        ;;
    "templates")
        setup_code_templates
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo -e "${RED}أمر غير معروف: $1${NC}"
        echo "استخدم '$0 help' للمساعدة"
        exit 1
        ;;
esac