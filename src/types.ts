export interface RoomType {
  key: string;
  label: string;
  price: number;
  prefix: string;
}

export interface Booking {
  name: string;
  phone: string;
  email?: string;
  checkin: string;
  checkout: string;
  room: string; // The selected room description, e.g. "Deluxe King Room — $180/night"
  guests: string;
  payment: string; // "visa" | "uzcard" | "cash"
  note?: string;
  time: string;
  status: "pending" | "confirmed" | "cancelled";
  amount?: number;
}

export interface HotelData {
  hotel_status: "open" | "busy" | "closed";
  rooms: {
    [key: string]: {
      total: number;
      booked: number;
    };
  };
  roomStatus: { [roomNumber: string]: "available" | "occupied" | "cleaning" | "maintenance" };
  bookings: Booking[];
  revenue: {
    total: number;
    today: number;
    lastDate: string;
  };
  visits: {
    total: number;
    today: number;
    yesterday: number;
    week: number;
    bestDay: string;
    lastDate: string;
  };
}

export const ROOM_TYPES: RoomType[] = [
  { key: "deluxe", label: "Deluxe King Room", price: 180, prefix: "1" },
  { key: "family", label: "Family Comfort Suite", price: 320, prefix: "2" },
  { key: "executive", label: "Executive Luxury Suite", price: 450, prefix: "3" },
  { key: "presidential", label: "Presidential Royal Residence", price: 1200, prefix: "4" },
  { key: "penthouse", label: "Tashkent Golden Penthouse", price: 1300, prefix: "5" },
];

export const STATUS_LABELS: { [key: string]: string } = {
  available: "Bo'sh",
  occupied: "Band",
  cleaning: "Tozalanmoqda",
  maintenance: "Ta'mirda",
};
