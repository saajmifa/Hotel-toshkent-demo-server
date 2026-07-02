import { HotelData, ROOM_TYPES } from "../types";

export function buildDefaultRoomStatus(): { [roomNumber: string]: "available" | "occupied" | "cleaning" | "maintenance" } {
  const status: { [roomNumber: string]: "available" | "occupied" | "cleaning" | "maintenance" } = {};
  ROOM_TYPES.forEach((t) => {
    for (let i = 1; i <= 10; i++) {
      const roomNum = `${t.prefix}${i < 10 ? "0" + i : i}`;
      status[roomNum] = "available";
    }
  });
  return status;
}

export function getInitialHotelData(): HotelData {
  const stored = localStorage.getItem("hotelData");
  if (stored) {
    try {
      const data = JSON.parse(stored) as HotelData;
      // Ensure all fields are present
      if (!data.roomStatus) {
        data.roomStatus = buildDefaultRoomStatus();
      }
      if (!data.bookings) {
        data.bookings = [];
      }
      if (!data.revenue) {
        data.revenue = { total: 0, today: 0, lastDate: "" };
      }
      if (!data.visits) {
        data.visits = { total: 0, today: 0, yesterday: 0, week: 0, bestDay: "—", lastDate: "" };
      }
      if (!data.rooms) {
        data.rooms = {};
      }
      ROOM_TYPES.forEach((t) => {
        if (!data.rooms[t.key]) {
          data.rooms[t.key] = { total: 10, booked: 0 };
        }
      });
      return data;
    } catch (e) {
      console.error("Failed to parse hotelData, resetting to default:", e);
    }
  }

  // Create default data
  const defaultData: HotelData = {
    hotel_status: "open",
    rooms: {},
    roomStatus: buildDefaultRoomStatus(),
    bookings: [],
    revenue: { total: 0, today: 0, lastDate: "" },
    visits: { total: 0, today: 0, yesterday: 0, week: 0, bestDay: "—", lastDate: "" },
  };

  ROOM_TYPES.forEach((t) => {
    defaultData.rooms[t.key] = { total: 10, booked: 0 };
  });

  return defaultData;
}

export function syncAndSaveHotelData(data: HotelData): HotelData {
  // Sync the rooms count based on roomStatus
  const counts: { [key: string]: number } = {};
  ROOM_TYPES.forEach((t) => {
    counts[t.key] = 0;
  });

  Object.entries(data.roomStatus).forEach(([roomNum, status]) => {
    const prefix = roomNum.charAt(0);
    const foundType = ROOM_TYPES.find((t) => t.prefix === prefix);
    if (foundType && status !== "available") {
      counts[foundType.key]++;
    }
  });

  ROOM_TYPES.forEach((t) => {
    data.rooms[t.key] = {
      total: 10,
      booked: counts[t.key],
    };
  });

  localStorage.setItem("hotelData", JSON.stringify(data));
  return data;
}

// Server-side synchronization APIs
export async function fetchHotelDataFromServer(): Promise<HotelData> {
  try {
    const response = await fetch("/api/hotel-data");
    if (!response.ok) throw new Error("Failed to fetch hotel data");
    const data = await response.json();
    
    // Asynchronously update local adminPass cache so getAdminPass() works synchronously
    fetch("/api/admin-pass")
      .then(res => {
        if (res.ok) return res.json();
      })
      .then(passData => {
        if (passData && passData.password) {
          localStorage.setItem("adminPass", passData.password);
        }
      })
      .catch(err => console.error("Error fetching pass background:", err));

    return data as HotelData;
  } catch (err) {
    console.error("Error fetching from server, falling back to local storage:", err);
    return getInitialHotelData();
  }
}

export async function saveHotelDataToServer(data: HotelData): Promise<void> {
  // First sync state locally and globally
  const syncedData = syncAndSaveHotelData(data);
  try {
    await fetch("/api/hotel-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(syncedData),
    });
  } catch (err) {
    console.error("Error saving to server:", err);
  }
}

export function getAdminPass(): string {
  return localStorage.getItem("adminPass") || "hotel2025";
}

export function setAdminPass(p: string): void {
  localStorage.setItem("adminPass", p);
}

export async function saveAdminPassToServer(p: string): Promise<void> {
  localStorage.setItem("adminPass", p);
  try {
    await fetch("/api/admin-pass", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: p }),
    });
  } catch (err) {
    console.error("Error saving pass to server:", err);
  }
}
