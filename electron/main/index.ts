import { app, BrowserWindow, shell, ipcMain } from "electron"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import path from "node:path"
import os from "node:os"
import LCUConnector from "lcu-connector"
import { WebSocket } from "ws"
import Store from "electron-store"
import {
  ChampSelectSessionEvent,
  LCUEventMessage,
  LCUEvents,
} from "./interface.js"

interface LCUCredentials {
  address: string
  port: number
  username: string
  password: string
  protocol: string
}

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, "../..")

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron")
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist")
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

const preload = path.join(__dirname, "../preload/index.mjs")
const indexHtml = path.join(RENDERER_DIST, "index.html")

async function createWindow() {
  const win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    autoHideMenuBar: true,
    height: 920,
    width: 1340,
    webPreferences: {
      preload,
      nodeIntegration: true,
      allowRunningInsecureContent: true,
      webSecurity: false,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url)
    return { action: "deny" }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344

  return win
}

function sendCredentials(win: BrowserWindow, credentials: LCUCredentials) {
  console.log(`Received credentials : ${JSON.stringify(credentials)}`)
  win.webContents.send("credentials", credentials)
}

function parseSessionEvent(event: ChampSelectSessionEvent) {
  return event.actions
    .flat()
    .find(
      (a) =>
        a.isAllyAction === true &&
        a.type === "pick" &&
        a.actorCellId === event.localPlayerCellId
    )?.championId
}

function parseEventMessage(message: string) {
  const [_, type, payload] = JSON.parse(message) as [number, LCUEvents, any]
  return { type, data: payload.data }
}

async function connectWebsocket(
  win: BrowserWindow,
  credentials: LCUCredentials
) {
  const { address, port, username, password } = credentials
  const url = `wss://${address}:${port}/`

  const ws = new WebSocket(url, "wamp", {
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString(
        "base64"
      )}`,
    },
    rejectUnauthorized: false,
  })

  ws.on("message", (e) => {
    const event: LCUEventMessage = parseEventMessage(e.toString())
    switch (event.type) {
      case LCUEvents.EndOfGameStats:
        win.webContents.send("end-of-game")
        break
      case LCUEvents.ChampSelectSession:
        console.log(JSON.stringify(event.data, null, 4))
        if (event.data.localPlayerCellId === -1)
          win.webContents.send("pick", null)
        const champId = parseSessionEvent(event.data)
        if (champId) {
          win.webContents.send("pick", champId)
        }
        break
    }
  })

  // https://github.com/dysolix/hasagi-types/blob/main/dist/lcu-events.d.ts
  ws.on("open", () => {
    // 5 Means Subscribe
    ws.send(`[5, "${LCUEvents.EndOfGameStats}"]`)
    ws.send(`[5, "${LCUEvents.ChampSelectSession}"]`)
  })
}

function connectToLcu(win: BrowserWindow) {
  const connector = new LCUConnector()
  let wsTimeout: NodeJS.Timeout
  connector.on("connect", (credentials) => {
    sendCredentials(win, credentials)
    // LCU refuses websocket connections too early
    wsTimeout = setTimeout(() => connectWebsocket(win, credentials), 10000)
  })
  connector.on("disconnect", () => {
    clearTimeout(wsTimeout)
    return sendCredentials(win, null)
  })
  connector.start()
}

const store = new Store()

async function main() {
  await app.whenReady()
  const win = await createWindow()

  ipcMain.on("app-ready", () => connectToLcu(win))
  ipcMain.on("connect-to-lcu", () => connectToLcu(win))

  ipcMain.on("store-set", (_, key, value) => {
    store.set(key, value)
  })

  ipcMain.handle("store-get", (_e, arg: string) => {
    return store.get(arg)
  })

  app.on(
    "certificate-error",
    (event, _webContents, _url, _error, certificate, callback) => {
      if (
        certificate.fingerprint ===
        "sha256/TQ1pFVrt3Msu+IVgubjrrixp75XCuDFovDbcTcqTJjw="
      ) {
        event.preventDefault()
        callback(true)
      } else {
        callback(false)
      }
    }
  )

  app.on("window-all-closed", () => {
    app.quit()
  })

  ipcMain.on("process:close", () => {
    process.exit(0)
  })
}

app.commandLine.appendSwitch("ignore-certificate-errors")

main()
