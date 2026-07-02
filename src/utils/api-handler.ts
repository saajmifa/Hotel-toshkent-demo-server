import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), "hotel-data.json");
const CONFIG_FILE = path.join(process.cwd(), "jsonbin-config.json");

const ROOM_TYPES = [
  { key: "deluxe", label: "Deluxe King Room", price: 180, prefix: "1" },
  { key: "family", label: "Family Comfort Suite", price: 320, prefix: "2" },
  { key: "executive", label: "Executive Luxury Suite", price: 450, prefix: "3" },
  { key: "presidential", label: "Presidential Royal Residence", price: 1200, prefix: "4" },
  { key: "penthouse", label: "Tashkent Golden Penthouse", price: 1300, prefix: "5" },
];

function buildDefaultRoomStatus() {
  const status: { [roomNumber: string]: "available" | "occupied" | "cleaning" | "maintenance" } = {};
  ROOM_TYPES.forEach((t) => {
    for (let i = 1; i <= 10; i++) {
      const roomNum = `${t.prefix}${i < 10 ? "0" + i : i}`;
      status[roomNum] = "available";
    }
  });
  return status;
}

function getInitialHotelData() {
  const defaultData = {
    hotel_status: "open",
    rooms: {} as any,
    roomStatus: buildDefaultRoomStatus(),
    bookings: [] as any[],
    revenue: { total: 0, today: 0, lastDate: "" },
    visits: { total: 0, today: 0, yesterday: 0, week: 0, bestDay: "—", lastDate: "" },
    adminPass: "hotel2025"
  };

  ROOM_TYPES.forEach((t) => {
    defaultData.rooms[t.key] = { total: 10, booked: 0 };
  });

  return defaultData;
}

interface JsonBinConfig {
  apiKey: string;
  binId: string;
}

function getJsonBinConfig(): JsonBinConfig {
  let config: JsonBinConfig = {
    apiKey: process.env.JSONBIN_API_KEY || "",
    binId: process.env.JSONBIN_BIN_ID || "",
  };

  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const fileContent = fs.readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(fileContent);
      if (parsed.apiKey) config.apiKey = parsed.apiKey;
      if (parsed.binId) config.binId = parsed.binId;
    } catch (e) {
      console.error("Error reading jsonbin-config.json:", e);
    }
  }

  return config;
}

function saveJsonBinConfig(config: JsonBinConfig) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing jsonbin-config.json:", e);
  }
}

// Global state variables
let currentDb = getInitialHotelData();
let isCloudActive = false;
let cloudError: string | null = null;

function saveHotelDataLocally(data: any) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing local backup data file:", e);
  }
}

async function saveToCloud(data: any): Promise<boolean> {
  const config = getJsonBinConfig();
  if (!config.apiKey || !config.binId) {
    isCloudActive = false;
    return false;
  }

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Master-Key": config.apiKey,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`JSONBin PUT Error (${res.status}): ${errText}`);
    }

    isCloudActive = true;
    cloudError = null;
    return true;
  } catch (err: any) {
    console.error("Failed to save to JSONBin cloud:", err.message);
    cloudError = err.message;
    return false;
  }
}

async function fetchFromCloud(): Promise<any | null> {
  const config = getJsonBinConfig();
  if (!config.apiKey || !config.binId) {
    isCloudActive = false;
    return null;
  }

  try {
    const res = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}/latest`, {
      headers: {
        "X-Master-Key": config.apiKey,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`JSONBin GET Error (${res.status}): ${errText}`);
    }

    const json: any = await res.json();
    isCloudActive = true;
    cloudError = null;
    return json.record;
  } catch (err: any) {
    console.error("Failed to fetch from JSONBin cloud:", err.message);
    cloudError = err.message;
    return null;
  }
}

export async function initializeHotelData() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(content);
      if (!parsed.roomStatus) parsed.roomStatus = buildDefaultRoomStatus();
      if (!parsed.bookings) parsed.bookings = [];
      if (!parsed.revenue) parsed.revenue = { total: 0, today: 0, lastDate: "" };
      if (!parsed.visits) parsed.visits = { total: 0, today: 0, yesterday: 0, week: 0, bestDay: "—", lastDate: "" };
      if (!parsed.adminPass) parsed.adminPass = "hotel2025";
      if (!parsed.hotel_status) parsed.hotel_status = "open";
      if (!parsed.rooms) parsed.rooms = {};
      ROOM_TYPES.forEach((t) => {
        if (!parsed.rooms[t.key]) {
          parsed.rooms[t.key] = { total: 10, booked: 0 };
        }
      });
      currentDb = parsed;
    } catch (e) {
      console.error("Error reading local data file:", e);
      currentDb = getInitialHotelData();
    }
  } else {
    currentDb = getInitialHotelData();
  }

  const config = getJsonBinConfig();
  if (config.apiKey) {
    if (config.binId) {
      console.log(`[API] JSONBin configuration detected. Syncing Bin ID: ${config.binId}...`);
      const cloudData = await fetchFromCloud();
      if (cloudData) {
        console.log("[API] Successfully synced initial data from JSONBin.io!");
        currentDb = cloudData;
        saveHotelDataLocally(currentDb);
      }
    } else {
      console.log("[API] JSONBin API Key present, but no Bin ID. Automatically creating bin...");
      try {
        const res = await fetch("https://api.jsonbin.io/v3/b", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Master-Key": config.apiKey,
            "X-Bin-Private": "true",
            "X-Bin-Name": "hotel-tashkent-database",
          },
          body: JSON.stringify(currentDb),
        });

        if (res.ok) {
          const result: any = await res.json();
          const newBinId = result.metadata.id;
          config.binId = newBinId;
          saveJsonBinConfig(config);
          isCloudActive = true;
          cloudError = null;
        }
      } catch (err: any) {
        console.error("[API] Failed to automatically create JSONBin:", err.message);
        cloudError = err.message;
      }
    }
  }
}

// Immediately bootstrap when this module is loaded
initializeHotelData();

// Helper to get request body in Connect
function getRequestBody(req: any): Promise<any> {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: any) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

// Unified API Handler Middleware for Express and Connect
export async function handleApiRequest(req: any, res: any, next: () => void) {
  const url = req.url || "";
  const method = req.method || "GET";

  // Check if it's an API route
  if (!url.startsWith("/api/")) {
    return next();
  }

  const sendJson = (data: any, status = 200) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(data));
  };

  try {
    // 1. GET /api/hotel-data
    if (url === "/api/hotel-data" && method === "GET") {
      return sendJson({
        hotel_status: currentDb.hotel_status,
        rooms: currentDb.rooms,
        roomStatus: currentDb.roomStatus,
        bookings: currentDb.bookings,
        revenue: currentDb.revenue,
        visits: currentDb.visits,
      });
    }

    // 2. POST /api/hotel-data
    if (url === "/api/hotel-data" && method === "POST") {
      const updated = await getRequestBody(req);
      if (updated) {
        if (updated.hotel_status !== undefined) currentDb.hotel_status = updated.hotel_status;
        if (updated.rooms !== undefined) currentDb.rooms = updated.rooms;
        if (updated.roomStatus !== undefined) currentDb.roomStatus = updated.roomStatus;
        if (updated.bookings !== undefined) currentDb.bookings = updated.bookings;
        if (updated.revenue !== undefined) currentDb.revenue = updated.revenue;
        if (updated.visits !== undefined) currentDb.visits = updated.visits;

        saveHotelDataLocally(currentDb);

        const config = getJsonBinConfig();
        if (config.apiKey && config.binId) {
          saveToCloud(currentDb);
        }
      }
      return sendJson({ status: "success" });
    }

    // 3. GET /api/admin-pass
    if (url === "/api/admin-pass" && method === "GET") {
      return sendJson({ password: currentDb.adminPass || "hotel2025" });
    }

    // 4. POST /api/admin-pass
    if (url === "/api/admin-pass" && method === "POST") {
      const body = await getRequestBody(req);
      const { password } = body;
      if (password) {
        currentDb.adminPass = password;
        saveHotelDataLocally(currentDb);

        const config = getJsonBinConfig();
        if (config.apiKey && config.binId) {
          saveToCloud(currentDb);
        }
        return sendJson({ status: "success" });
      } else {
        return sendJson({ error: "Password is required" }, 400);
      }
    }

    // 5. GET /api/jsonbin-status
    if (url === "/api/jsonbin-status" && method === "GET") {
      const config = getJsonBinConfig();
      return sendJson({
        apiKey: config.apiKey ? `●●●●●●●●${config.apiKey.slice(-4)}` : "",
        binId: config.binId,
        active: isCloudActive && !!config.apiKey && !!config.binId,
        error: cloudError,
      });
    }

    // 6. POST /api/jsonbin-status
    if (url === "/api/jsonbin-status" && method === "POST") {
      const body = await getRequestBody(req);
      const { apiKey, binId } = body;

      if (!apiKey) {
        const config = { apiKey: "", binId: "" };
        saveJsonBinConfig(config);
        isCloudActive = false;
        cloudError = null;
        return sendJson({ status: "disabled" });
      }

      try {
        let resolvedBinId = binId || "";
        if (!resolvedBinId) {
          const createRes = await fetch("https://api.jsonbin.io/v3/b", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Master-Key": apiKey,
              "X-Bin-Private": "true",
              "X-Bin-Name": "hotel-tashkent-database",
            },
            body: JSON.stringify(currentDb),
          });

          if (!createRes.ok) {
            const errText = await createRes.text();
            throw new Error(`Xato (${createRes.status}): ${errText}`);
          }

          const result: any = await createRes.json();
          resolvedBinId = result.metadata.id;
        } else {
          const verifyRes = await fetch(`https://api.jsonbin.io/v3/b/${resolvedBinId}/latest`, {
            headers: {
              "X-Master-Key": apiKey,
            },
          });

          if (!verifyRes.ok) {
            const errText = await verifyRes.text();
            throw new Error(`Bin tekshirilmadi (${verifyRes.status}): ${errText}`);
          }

          const result: any = await verifyRes.json();
          currentDb = result.record;
          saveHotelDataLocally(currentDb);
        }

        const config = { apiKey, binId: resolvedBinId };
        saveJsonBinConfig(config);
        isCloudActive = true;
        cloudError = null;

        return sendJson({ status: "success", binId: resolvedBinId });
      } catch (err: any) {
        console.error("JSONBin manual config test failed:", err.message);
        return sendJson({ error: err.message }, 400);
      }
    }

    // fallback for unknown api
    return sendJson({ error: "Not Found" }, 404);
  } catch (err: any) {
    console.error("API error:", err);
    return sendJson({ error: err.message || "Internal Server Error" }, 500);
  }
}
