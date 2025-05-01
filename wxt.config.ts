import path from "path"
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname),
      },
    },
  }),
  manifest: ({ browser }) => {
    const manifest = {
      name: "Neo Downloader Plus",
      description: "Neo Downloader Plus Browser Integration",
      homepage_url: "https://neodlp.neosubhamoy.com",
      version: "0.1.0",
      permissions: ["tabs", "storage", "contextMenus", "nativeMessaging"],
    }
    if (browser === 'chrome') {
      return {
        ...manifest,
        key: "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAx3XQoL6Qur86lyfRRGYiQ544w9fxJiStWvFJaNqqSlRxkoT0wj8mFVwBjtmUJC6AB31Zb9awELVk1jyo83cPoJjhydHQfk7dpQ3gygp5TdZMjwX5++FpYq5QIV1qyf9BNvGbWG1zHDPqRGC/ZtGaxb9FJyYoFMIUKoiJfuPwup0Iy3dRwJex4mxMobQnFtfoxdMRvjx6XA9v7Fz8QF1t/1lVsx9yOiJPyDDzygrVLR3+r+1Sq7CunK0CWMVPkTRMw243KMZBIDpxrjXaVbasIkZsMwVW0vkqIMXzMZGhUPu1SfflwanAJ5F2Yl0dcO3OxKLYL7szTtLJUD/7PFA2PwIDAQAB",
        commands: {
          _execute_action: {
            suggested_key: {
              default: "Alt+Shift+N",
            }
          },
          "neodlp:quick-download": {
            description: "Quick Download",
            suggested_key: {
              default: "Alt+Shift+Q"
            }
          }
        },
      }
    } else if (browser === 'firefox') {
      return {
        ...manifest,
        browser_specific_settings: {
          gecko: {
            id: "neodlp@neosubhamoy.com"
          }
        },
        commands: {
          _execute_browser_action: {
            suggested_key: {
              default: "Alt+Shift+N",
            }
          },
          "neodlp:quick-download": {
            description: "Quick Download",
            suggested_key: {
              default: "Alt+Shift+Q"
            }
          }
        },
      }
    } else {
      return {
        ...manifest,
        commands: {
          _execute_action: {
            suggested_key: {
              default: "Alt+Shift+N",
            }
          },
          "neodlp:quick-download": {
            description: "Quick Download",
            suggested_key: {
              default: "Alt+Shift+Q"
            }
          }
        },
      }
    }
  }
});
