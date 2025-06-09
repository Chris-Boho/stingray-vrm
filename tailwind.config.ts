/** @type {import('tailwindcss').Config} */
export default {
    important: true,
    content: [
      "./src/webview/**/*.{js,ts,jsx,tsx}",
      "./src/webview/index.html",
    ],
    theme: {
      extend: {
        colors: {
          // VS Code theme integration
          'vscode': {
            'background': 'var(--vscode-editor-background)',
            'foreground': 'var(--vscode-foreground)',
            'secondary': 'var(--vscode-descriptionForeground)',
            'border': 'var(--vscode-panel-border)',
            'input-bg': 'var(--vscode-input-background)',
            'input-border': 'var(--vscode-input-border)',
            'button-bg': 'var(--vscode-button-background)',
            'button-hover': 'var(--vscode-button-hoverBackground)',
            'selection': 'var(--vscode-editor-selectionBackground)',
            'focus': 'var(--vscode-focusBorder)',
          }
        },
        fontFamily: {
          'vscode': ['var(--vscode-font-family)', 'monospace'],
        },
        fontSize: {
          'vscode': 'var(--vscode-font-size, 13px)',
        },
        spacing: {
          // Grid system for VRM components (32x26px grid)
          'grid-x': '32px',
          'grid-y': '26px',
        }
      },
    },
    plugins: [],
  }