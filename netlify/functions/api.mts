import type { Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// Keep this list identical to src/types.ts ROOM_TYPES prefixes
const ROOM_TYPES = [
  { key: "deluxe", prefix: "1" },
  { key: "family", prefix: "2" },
  { key: "executive", prefix: "3" },
  { key: "presidential", prefix: "4" },
  { key: "penthouse", prefix: "5" },
];

const DB_KEY = "hotel-data";

function buildDefaultRoomStatus() {
  const status: Record<string, string> = {};
  ROOM_TYPES.forEach((t) => {
    for (let i = 1; i <= 10; i++) {
      const roomNum = `${t.prefix}${i < 10 ? "0" + i : i}`;
      status[roomNum] = "available";
    }
  });
  return status;
}

function getDefaultData(): any {
  const data: any = {
    hotel_status: "open",
    rooms: {},
    roomStatus: buildDefaultRoomStatus(),
    bookings: [],
    revenue: { total: 0, today: 0, lastDate: "" },
    visits: { total: 0, today: 0, yesterday: 0, week: 0, bestDay: "—", lastDate: "" },
    adminPass: "hotel2025",
  };
  ROOM_TYPES.forEach((t) => (data.rooms[t.key] = { total: 10, booked: 0 }));
  return data;
}

async function getDb(store: ReturnType<typeof getStore>): Promise<any> {
  const existing = await store.get(DB_KEY, { type: "json" });
  if (existing) {
    // Backfill any missing fields (e.g. after a schema change)
    const data = existing as any;
    if (!data.roomStatus) data.roomStatus = buildDefaultRoomStatus();
    if (!data.bookings) data.bookings = [];
    if (!data.revenue) data.revenue = { total: 0, today: 0, lastDate: "" };
    if (!data.visits) data.visits = { total: 0, today: 0, yesterday: 0, week: 0, bestDay: "—", lastDate: "" };
    if (!data.adminPass) data.adminPass = "hotel2025";
    if (!data.hotel_status) data.hotel_status = "open";
    if (!data.rooms) data.rooms = {};
    ROOM_TYPES.forEach((t) => {
      if (!data.rooms[t.key]) data.rooms[t.key] = { total: 10, booked: 0 };
    });
    return data;
  }
  const def = getDefaultData();
  await store.setJSON(DB_KEY, def);
  return def;
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async (req: Request) => {
  const store = getStore(DB_KEY);
  const { pathname } = new URL(req.url);
  const method = req.method;

  try {
    // 1. GET /api/hotel-data
    if (pathname === "/api/hotel-data" && method === "GET") {
      const db = await getDb(store);
      return json({
        hotel_status: db.hotel_status,
        rooms: db.rooms,
        roomStatus: db.roomStatus,
        bookings: db.bookings,
        revenue: db.revenue,
        visits: db.visits,
      });
    }

    // 2. POST /api/hotel-data
    if (pathname === "/api/hotel-data" && method === "POST") {
      const db = await getDb(store);
      const updated = await req.json();
      if (updated.hotel_status !== undefined) db.hotel_status = updated.hotel_status;
      if (updated.rooms !== undefined) db.rooms = updated.rooms;
      if (updated.roomStatus !== undefined) db.roomStatus = updated.roomStatus;
      if (updated.bookings !== undefined) db.bookings = updated.bookings;
      if (updated.revenue !== undefined) db.revenue = updated.revenue;
      if (updated.visits !== undefined) db.visits = updated.visits;
      await store.setJSON(DB_KEY, db);
      return json({ status: "success" });
    }

    // 3. GET /api/admin-pass
    if (pathname === "/api/admin-pass" && method === "GET") {
      const db = await getDb(store);
      return json({ password: db.adminPass || "hotel2025" });
    }

    // 4. POST /api/admin-pass
    if (pathname === "/api/admin-pass" && method === "POST") {
      const db = await getDb(store);
      const body = await req.json();
      if (body.password) {
        db.adminPass = body.password;
        await store.setJSON(DB_KEY, db);
        return json({ status: "success" });
      }
      return json({ error: "Password is required" }, 400);
    }

    // 5 & 6. jsonbin-status: data already syncs via Netlify Blobs (this function's
    // own storage), so these are kept as harmless no-ops purely so the existing
    // Admin Panel "Cloud Sync" card doesn't error out. Real sync does not depend on them.
    if (pathname === "/api/jsonbin-status" && method === "GET") {
      return json({ apiKey: "", binId: "", active: false, error: null });
    }
    if (pathname === "/api/jsonbin-status" && method === "POST") {
      return json({ status: "success" });
    }

    return json({ error: "Not Found" }, 404);
  } catch (err: any) {
    return json({ error: err.message || "Internal Server Error" }, 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
