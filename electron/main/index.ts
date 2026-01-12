import { app, BrowserWindow, shell, ipcMain } from "electron"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import path from "node:path"
import os from "node:os"
import { WebSocket } from "ws"
import Store from "electron-store"
import { exec } from "child_process"
import https from "https"
import {
  ChampSelectSessionEvent,
  LCUEventMessage,
  LCUEvents,
} from "./interface.js"
import { Champion, Summoner } from "../src/types/lol.js"
import { RawChallenge } from "../src/types/lcu.js"

interface LcuCredentials {
  port: string
  token: string
}

interface LcuData {
  summoner: Summoner
  champions: Champion[]
  challenges: Record<string, RawChallenge>
}

const IpcChannels = {
  GET_LCU_DATA: "get-lcu-data",
  STORE_GET: "store-get",
  STORE_SET: "store-set",
  PROCESS_CLOSE: "process:close",
  GAME_START: "game-start",
  END_OF_GAME: "end-of-game",
  PICK: "pick",
}

function getLCUCredentials(): Promise<LcuCredentials | null> {
  return new Promise((resolve) => {
    if (process.platform !== "win32") {
      return resolve(null)
    }

    const command = `powershell -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -like 'LeagueClientUx.exe' } | Select-Object -ExpandProperty CommandLine"`
    exec(command, (error, stdout) => {
      if (error) {
        return resolve(null)
      }

      const port = stdout.match(/--app-port=(\d+)/)?.[1]
      const token = stdout.match(/--remoting-auth-token=([\w-]+)/)?.[1]

      if (!port || !token) {
        return resolve(null)
      }
      resolve({ port, token })
    })
  })
}

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

function lcuRequest<T>(
  port: string,
  token: string,
  endpoint: string
): Promise<T> {
  const auth = Buffer.from(`riot:${token}`).toString("base64")
  const options = {
    hostname: "127.0.0.1",
    port: port,
    path: endpoint,
    method: "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
    agent: httpsAgent,
  }

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = ""
      res.on("data", (chunk) => (data += chunk))
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 400) {
          return reject(
            new Error(`LCU API Error for ${endpoint}: ${res.statusCode}`)
          )
        }
        try {
          resolve(JSON.parse(data))
        } catch (e) {
          reject(new Error(`Failed to parse LCU API response: ${e.message}`))
        }
      })
    })
    req.on("error", (e) => reject(e))
    req.end()
  })
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
    width: VITE_DEV_SERVER_URL ? 1440 + 760 : 1440,
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

async function connectWebsocket(win: BrowserWindow, creds: LcuCredentials) {
  const url = `wss://127.0.0.1:${creds.port}/`
  const ws = new WebSocket(url, "wamp", {
    headers: {
      Authorization: `Basic ${Buffer.from(`riot:${creds.token}`).toString(
        "base64"
      )}`,
    },
    rejectUnauthorized: false,
  })

  ws.on("message", (e) => {
    try {
      const event: LCUEventMessage = parseEventMessage(e.toString())
      switch (event.type) {
        case LCUEvents.EndOfGameStats:
          win.webContents.send(IpcChannels.END_OF_GAME)
          break
        case LCUEvents.ChampSelectSession:
          const champId = parseSessionEvent(event.data)
          win.webContents.send(IpcChannels.PICK, champId ?? null)
          break
        case LCUEvents.GameSession:
          if (event.data.phase === "InProgress") {
            win.webContents.send(
              IpcChannels.GAME_START,
              event.data.gameData.playerChampionSelections
            )
          }
          break
      }
    } catch (error) {
      console.error("Failed to parse WebSocket message:", error)
    }
  })

  // https://github.com/dysolix/hasagi-types/blob/main/dist/lcu-events.d.ts
  ws.on("open", () => {
    console.log("🔌 WebSocket connected")
    // 5 Means Subscribe
    ws.send(`[5, "${LCUEvents.EndOfGameStats}"]`)
    ws.send(`[5, "${LCUEvents.ChampSelectSession}"]`)
    ws.send(`[5, "${LCUEvents.GameSession}"]`)
  })

  ws.on("close", () => {
    console.log("🔌 WebSocket disconnected")
  })
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

const store = new Store()

async function main() {
  await app.whenReady()
  const win = await createWindow()

  ipcMain.handle(IpcChannels.GET_LCU_DATA, async (): Promise<LcuData | null> => {
    console.log("🎮 Searching for League Client...")
    const creds = await getLCUCredentials()
    if (!creds) {
      console.error("❌ League Client not found.")
      return null
    }
    console.log(`✅ Connected on Port ${creds.port}`)

    try {
      console.log("📥 Downloading data from Client...")
      const summoner = await lcuRequest<Summoner>(
        creds.port,
        creds.token,
        "/lol-summoner/v1/current-summoner"
      )

      const [champions, challenges] = await Promise.all([
        lcuRequest<Champion[]>(
          creds.port,
          creds.token,
          `/lol-champions/v1/inventories/${summoner.summonerId}/champions-minimal`
        ),
        lcuRequest<Record<string, RawChallenge>>(
          creds.port,
          creds.token,
          "/lol-challenges/v1/challenges/local-player"
        ),
      ])
      console.log("✅ Data successfully loaded.")

      connectWebsocket(win, creds)
      return { summoner, champions, challenges }
    } catch (err) {
      console.error("❌ ERROR fetching LCU data:", err)
      return null
    }
  })

  ipcMain.on(IpcChannels.STORE_SET, (_, key: string, value: any) => {
    store.set(key, value)
  })

  ipcMain.handle(IpcChannels.STORE_GET, (_e, arg: string) => {
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

  ipcMain.on(IpcChannels.PROCESS_CLOSE, () => {
    process.exit(0)
  })
}

app.commandLine.appendSwitch("ignore-certificate-errors")

main()
