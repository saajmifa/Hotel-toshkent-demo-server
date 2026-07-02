import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarCheck2, 
  Landmark, 
  BarChart3, 
  Settings, 
  LogOut, 
  ArrowLeft, 
  PlusCircle, 
  Check, 
  X, 
  DollarSign, 
  Users, 
  Sparkles,
  RefreshCw,
  Trash2,
  Lock,
  Calendar,
  Layers,
  Award,
  HelpCircle,
  Cloud
} from "lucide-react";
import { HotelData, ROOM_TYPES, Booking, STATUS_LABELS } from "../types";
import { syncAndSaveHotelData, getAdminPass, saveAdminPassToServer, buildDefaultRoomStatus } from "../utils/storage";

interface AdminPanelProps {
  hotelData: HotelData;
  setHotelData: React.Dispatch<React.SetStateAction<HotelData>>;
  navigateToWebsite: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ hotelData, setHotelData, navigateToWebsite }) => {
  // Session Login State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return sessionStorage.getItem("adminLoggedIn") === "1";
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  // Navigation Sidebar tab
  const [activeTab, setActiveTab] = useState<"dashboard" | "rooms" | "bookings" | "finance" | "reports" | "settings">("dashboard");

  // Manual Booking form state
  const [mForm, setMForm] = useState({
    guestName: "",
    guestEmail: "",
    checkin: "",
    checkout: "",
    roomType: "",
    roomNum: "",
    roomStatus: "occupied"
  });

  // Filtered room numbers for manual booking selection
  const [availableRoomNumbers, setAvailableRoomNumbers] = useState<string[]>([]);

  // Settings tab form states
  const [settingsForm, setSettingsForm] = useState({
    curPass: "",
    newPass: ""
  });

  // Feedback Toast state
  const [toast, setToast] = useState<{ show: boolean; msg: string; icon: string }>({
    show: false,
    msg: "",
    icon: "✅"
  });

  // Live clock state
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString("uz-UZ", { hour12: false }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // JSONBin Sync states
  const [jsonbinStatus, setJsonbinStatus] = useState<{
    apiKey: string;
    binId: string;
    active: boolean;
    error: string | null;
  }>({
    apiKey: "",
    binId: "",
    active: false,
    error: null,
  });
  const [binInputKey, setBinInputKey] = useState("");
  const [binInputId, setBinInputId] = useState("");
  const [binLoading, setBinLoading] = useState(false);

  const fetchJsonBinStatus = () => {
    fetch("/api/jsonbin-status")
      .then(res => res.json())
      .then(data => {
        setJsonbinStatus(data);
        if (data.binId) setBinInputId(data.binId);
      })
      .catch(err => console.error("Error fetching status:", err));
  };

  useEffect(() => {
    if (activeTab === "settings") {
      fetchJsonBinStatus();
    }
  }, [activeTab]);

  const handleSaveJsonBin = async () => {
    if (!binInputKey) {
      triggerToast("API Key (Master Key) kiritilishi shart!", "⚠️");
      return;
    }
    setBinLoading(true);
    try {
      const res = await fetch("/api/jsonbin-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: binInputKey, binId: binInputId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Xato yuz berdi");
      }
      triggerToast(binInputId ? "Ma'lumotlar muvaffaqiyatli bog'landi!" : "Yangi xotira yaratildi va bog'landi!", "☁️");
      setBinInputKey(""); // clear for safety
      fetchJsonBinStatus();
    } catch (err: any) {
      triggerToast(`Xato: ${err.message}`, "❌");
    } finally {
      setBinLoading(false);
    }
  };

  const handleDisconnectJsonBin = async () => {
    if (!confirm("Haqiqatan ham serverdan uzmoqchimisiz? Ma'lumotlar faqat local saqlanadi.")) return;
    setBinLoading(true);
    try {
      await fetch("/api/jsonbin-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: "", binId: "" }),
      });
      triggerToast("Serverdan uzildi! Endi ma'lumotlar faqat local saqlanadi.", "🔌");
      setBinInputKey("");
      setBinInputId("");
      fetchJsonBinStatus();
    } catch (err: any) {
      triggerToast(`Xato: ${err.message}`, "❌");
    } finally {
      setBinLoading(false);
    }
  };

  const triggerToast = (msg: string, icon = "✅") => {
    setToast({ show: true, msg, icon });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 2800);
  };

  // Login handler
  const handleLogin = () => {
    if (passwordInput === getAdminPass()) {
      sessionStorage.setItem("adminLoggedIn", "1");
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("❌ Noto'g'ri parol");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminLoggedIn");
    setIsLoggedIn(false);
  };

  // Handle hotel status changes
  const handleHotelStatusChange = (status: "open" | "busy" | "closed") => {
    const updated = {
      ...hotelData,
      hotel_status: status
    };
    setHotelData(syncAndSaveHotelData(updated));
    triggerToast("Mehmonxona holati o'zgartirildi", "🏨");
  };

  // Room status change handler inside Rooms tab
  const handleRoomStatusChange = (roomNum: string, status: "available" | "occupied" | "cleaning" | "maintenance") => {
    const updatedStatus = { ...hotelData.roomStatus };
    const oldStatus = updatedStatus[roomNum] || "available";
    updatedStatus[roomNum] = status;

    let updatedData = {
      ...hotelData,
      roomStatus: updatedStatus
    };

    // If room is updated to Occupied manually, we add its price to the revenue metrics
    if (status === "occupied" && oldStatus !== "occupied") {
      const prefix = roomNum.charAt(0);
      const matchedType = ROOM_TYPES.find(t => t.prefix === prefix);
      if (matchedType) {
        const price = matchedType.price;
        const todayStr = new Date().toDateString();

        if (!updatedData.revenue) {
          updatedData.revenue = { total: 0, today: 0, lastDate: "" };
        }

        if (updatedData.revenue.lastDate !== todayStr) {
          updatedData.revenue.today = 0;
          updatedData.revenue.lastDate = todayStr;
        }

        updatedData.revenue.today += price;
        updatedData.revenue.total += price;

        triggerToast(`${roomNum}-xona band qilindi. Narxi ($${price}) daromadga qo'shildi.`, "💰");
      }
    } else {
      triggerToast(`${roomNum}-xona holati o'zgartirildi: ${STATUS_LABELS[status]}`, "🛏️");
    }

    setHotelData(syncAndSaveHotelData(updatedData));
  };

  // Booking accept/confirm handler
  const handleConfirmBooking = (bookingIndex: number) => {
    const updatedBookings = [...hotelData.bookings];
    const b = updatedBookings[bookingIndex];
    if (!b) return;

    b.status = "confirmed";
    
    // Calculate nights & amount
    const foundType = ROOM_TYPES.find(t => b.room.includes(t.label));
    const price = foundType ? foundType.price : 180;
    const nights = Math.max(1, Math.ceil((new Date(b.checkout).getTime() - new Date(b.checkin).getTime()) / 86400000) || 1);
    const amount = price * nights;
    b.amount = amount;

    // Add to revenue
    const todayStr = new Date().toDateString();
    const updatedRevenue = { ...hotelData.revenue };
    
    if (updatedRevenue.lastDate !== todayStr) {
      updatedRevenue.today = 0;
      updatedRevenue.lastDate = todayStr;
    }
    updatedRevenue.today += amount;
    updatedRevenue.total += amount;

    // Automatically occupy one room of that type if available
    const updatedRoomStatus = { ...hotelData.roomStatus };
    if (foundType) {
      // Find the first available room for this prefix
      const firstAvailableRoom = Object.keys(updatedRoomStatus).find(
        num => num.startsWith(foundType.prefix) && updatedRoomStatus[num] === "available"
      );
      if (firstAvailableRoom) {
        updatedRoomStatus[firstAvailableRoom] = "occupied";
      }
    }

    const updatedData = {
      ...hotelData,
      bookings: updatedBookings,
      revenue: updatedRevenue,
      roomStatus: updatedRoomStatus
    };

    setHotelData(syncAndSaveHotelData(updatedData));
    triggerToast(`${b.name} — bron tasdiqlandi ($${amount})`, "✅");
  };

  const handleCancelBooking = (bookingIndex: number) => {
    const updatedBookings = [...hotelData.bookings];
    const b = updatedBookings[bookingIndex];
    if (!b) return;

    b.status = "cancelled";

    const updatedData = {
      ...hotelData,
      bookings: updatedBookings
    };

    setHotelData(syncAndSaveHotelData(updatedData));
    triggerToast(`${b.name} — bron bekor qilindi`, "❌");
  };

  // Update room numbers selector when selecting room type in manual booking form
  const handleManualRoomTypeChange = (key: string) => {
    const foundType = ROOM_TYPES.find(t => t.key === key);
    if (!foundType) {
      setAvailableRoomNumbers([]);
      setMForm(prev => ({ ...prev, roomType: "", roomNum: "" }));
      return;
    }

    const roomNums: string[] = [];
    for (let i = 1; i <= 10; i++) {
      roomNums.push(`${foundType.prefix}${i < 10 ? "0" + i : i}`);
    }

    setAvailableRoomNumbers(roomNums);
    setMForm(prev => ({ ...prev, roomType: key, roomNum: roomNums[0] || "" }));
  };

  // Add Manual Booking handler
  const handleAddManualBooking = () => {
    const { guestName, guestEmail, checkin, checkout, roomType, roomNum, roomStatus } = mForm;

    if (!guestName.trim() || !checkin || !checkout || !roomType || !roomNum) {
      triggerToast("Iltimos, barcha majburiy maydonlarni to'ldiring!", "⚠️");
      return;
    }

    const foundType = ROOM_TYPES.find(t => t.key === roomType);
    if (!foundType) return;

    const price = foundType.price;
    const nights = Math.max(1, Math.ceil((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000) || 1);
    const amount = price * nights;

    // Update Room status
    const updatedRoomStatus = { ...hotelData.roomStatus };
    updatedRoomStatus[roomNum] = roomStatus as any;

    // Update Revenue
    const todayStr = new Date().toDateString();
    const updatedRevenue = { ...hotelData.revenue };
    if (updatedRevenue.lastDate !== todayStr) {
      updatedRevenue.today = 0;
      updatedRevenue.lastDate = todayStr;
    }
    updatedRevenue.today += amount;
    updatedRevenue.total += amount;

    // Add manual booking to table
    const updatedBookings = [...hotelData.bookings];
    updatedBookings.push({
      name: guestName,
      email: guestEmail,
      phone: "+9989...",
      checkin,
      checkout,
      room: `${foundType.label} (Xona ${roomNum})`,
      guests: "2 guests",
      note: "Admin tomonidan qo'shilgan",
      time: new Date().toLocaleString(),
      status: "confirmed",
      payment: "cash",
      amount
    });

    const updatedData = {
      ...hotelData,
      bookings: updatedBookings,
      revenue: updatedRevenue,
      roomStatus: updatedRoomStatus
    };

    setHotelData(syncAndSaveHotelData(updatedData));
    
    // Reset manual form
    setMForm({
      guestName: "",
      guestEmail: "",
      checkin: "",
      checkout: "",
      roomType: "",
      roomNum: "",
      roomStatus: "occupied"
    });
    setAvailableRoomNumbers([]);

    triggerToast(`Bron qo'shildi! Xona ${roomNum}: ${STATUS_LABELS[roomStatus]} holatiga o'tkazildi.`, "✅");
  };

  // Edit Daily Revenue with boss password prompt confirmation
  const handleEditDailyRevenue = () => {
    const inputAmount = prompt("Bugungi kunlik daromadning yangi summasini kiriting ($):");
    if (inputAmount === null) return;
    const amountNum = parseFloat(inputAmount);
    
    if (isNaN(amountNum) || amountNum < 0) {
      triggerToast("Noto'g'ri summa kiritildi!", "❌");
      return;
    }

    const inputPass = prompt("Ushbu o'zgarishni tasdiqlash uchun joriy admin parolni kiriting:");
    if (inputPass !== getAdminPass()) {
      triggerToast("Xato parol! O'zgartirish rad etildi.", "❌");
      return;
    }

    const todayStr = new Date().toDateString();
    const updatedRevenue = { ...hotelData.revenue };

    if (updatedRevenue.lastDate !== todayStr) {
      updatedRevenue.today = 0;
      updatedRevenue.lastDate = todayStr;
    }

    const difference = amountNum - updatedRevenue.today;
    updatedRevenue.today = amountNum;
    updatedRevenue.total += difference;

    const updatedData = {
      ...hotelData,
      revenue: updatedRevenue
    };

    setHotelData(syncAndSaveHotelData(updatedData));
    triggerToast("Bugungi kunlik daromad muvaffaqiyatli o'zgartirildi!", "💰");
  };

  // Change Admin Password handler
  const handleChangePassword = () => {
    const { curPass, newPass } = settingsForm;
    if (curPass !== getAdminPass()) {
      triggerToast("Joriy parol noto'g'ri!", "❌");
      return;
    }
    if (!newPass || newPass.length < 4) {
      triggerToast("Yangi parol kamida 4 belgidan iborat bo'lishi kerak!", "⚠️");
      return;
    }

    saveAdminPassToServer(newPass);
    setSettingsForm({ curPass: "", newPass: "" });
    triggerToast("Parol muvaffaqiyatli o'zgartirildi!", "🔒");
  };

  // Reset Metrics Statistics to 0
  const handleResetStats = () => {
    if (!confirm("Barcha bronlar, daromad va tashrif statistikasi 0 ga qaytariladi. Davom etasizmi?")) return;
    
    const updatedData: HotelData = {
      ...hotelData,
      bookings: [],
      revenue: { total: 0, today: 0, lastDate: "" },
      visits: { total: 0, today: 0, yesterday: 0, week: 0, bestDay: "—", lastDate: "" }
    };

    setHotelData(syncAndSaveHotelData(updatedData));
    triggerToast("Statistika 0 ga qaytarildi", "✅");
  };

  // Reset all room statuses to Available
  const handleResetRooms = () => {
    if (!confirm("Barcha 50 xonani \"Bo'sh\" holatiga qaytarishni xohlaysizmi?")) return;

    const updatedData: HotelData = {
      ...hotelData,
      roomStatus: buildDefaultRoomStatus()
    };

    setHotelData(syncAndSaveHotelData(updatedData));
    triggerToast("Barcha xonalar tozalandi", "✅");
  };

  // Room categories counters
  const roomCounters: { [key: string]: number } = { available: 0, occupied: 0, cleaning: 0, maintenance: 0 };
  Object.values(hotelData.roomStatus).forEach(s => {
    const statusStr = s as string;
    if (roomCounters[statusStr] !== undefined) {
      roomCounters[statusStr]++;
    }
  });

  const todayStr = new Date().toDateString();
  const currentTodayRevenue = hotelData.revenue.lastDate === todayStr ? hotelData.revenue.today : 0;
  const pendingRequestsCount = hotelData.bookings.filter(b => b.status === "pending").length;

  if (!isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-[#0D0D0D] flex items-center justify-center z-50 px-4">
        <div className="bg-[#16140F] border border-[#2c271f] rounded-xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="font-serif text-2xl tracking-[0.15em] text-[#C9A96E] mb-2">HOTEL TASHKENT</div>
          <div className="text-xs uppercase tracking-widest text-[#8A8278] mb-8">Admin Panel</div>
          <div className="space-y-4">
            <input 
              type="password" 
              placeholder="Parolni kiriting" 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              className="w-full bg-[#1f1c16] border border-[#2c271f] text-[#F5F0E8] p-3 text-sm rounded outline-none focus:border-[#C9A96E] transition-all"
            />
            <button 
              onClick={handleLogin}
              className="w-full bg-[#C9A96E] hover:bg-[#E8D5B0] text-[#0D0D0D] font-bold p-3 text-xs uppercase tracking-widest rounded transition-colors"
            >
              Kirish
            </button>
          </div>
          {loginError && <p className="text-rose-500 text-xs mt-3">{loginError}</p>}
          <div className="text-[10px] text-[#8A8278] leading-relaxed mt-6 border-t border-[#2c271f]/60 pt-4">
            Standart parol: <strong className="text-[#C9A96E]">hotel2025</strong><br />
            Sozlamalar bo'limidan parolni o'zgartirishingiz mumkin.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8] flex font-sans select-none pb-0">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-[240px] bg-[#16140F] border-r border-[#2c271f] flex flex-col fixed inset-y-0 left-0 z-40">
        <div className="p-6 border-b border-[#2c271f] flex items-center justify-between">
          <div>
            <div className="font-serif text-base tracking-[0.08em] text-[#C9A96E]">HOTEL TASHKENT</div>
            <div className="text-[9px] uppercase tracking-widest text-[#8A8278] mt-1">Admin Portal</div>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto space-y-1">
          <div className="px-6 py-2 text-[9px] uppercase tracking-widest text-[#8A8278] font-bold">Asosiy</div>
          
          <button 
            onClick={() => setActiveTab("dashboard")}
            className={`w-full flex items-center gap-3 px-6 py-3 text-xs tracking-wide transition-all border-l-2 ${activeTab === "dashboard" ? "bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]" : "border-transparent text-[#b8aea0] hover:bg-[#1f1c16] hover:text-[#F5F0E8]"}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button 
            onClick={() => setActiveTab("rooms")}
            className={`w-full flex items-center gap-3 px-6 py-3 text-xs tracking-wide transition-all border-l-2 ${activeTab === "rooms" ? "bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]" : "border-transparent text-[#b8aea0] hover:bg-[#1f1c16] hover:text-[#F5F0E8]"}`}
          >
            <BedDouble className="w-4 h-4" />
            <span>Xonalar holati</span>
          </button>

          <button 
            onClick={() => setActiveTab("bookings")}
            className={`w-full flex items-center gap-3 px-6 py-3 text-xs tracking-wide transition-all border-l-2 ${activeTab === "bookings" ? "bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]" : "border-transparent text-[#b8aea0] hover:bg-[#1f1c16] hover:text-[#F5F0E8]"}`}
          >
            <CalendarCheck2 className="w-4 h-4" />
            <span>Bronlar boshqaruvi</span>
            {pendingRequestsCount > 0 && (
              <span className="ml-auto bg-[#C9A96E] text-[#0D0D0D] text-[9px] font-bold px-1.5 py-0.5 rounded-full">{pendingRequestsCount}</span>
            )}
          </button>

          <div className="px-6 py-2 pt-4 text-[9px] uppercase tracking-widest text-[#8A8278] font-bold">Moliya</div>

          <button 
            onClick={() => setActiveTab("finance")}
            className={`w-full flex items-center gap-3 px-6 py-3 text-xs tracking-wide transition-all border-l-2 ${activeTab === "finance" ? "bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]" : "border-transparent text-[#b8aea0] hover:bg-[#1f1c16] hover:text-[#F5F0E8]"}`}
          >
            <Landmark className="w-4 h-4" />
            <span>Kassa & Moliya</span>
          </button>

          <button 
            onClick={() => setActiveTab("reports")}
            className={`w-full flex items-center gap-3 px-6 py-3 text-xs tracking-wide transition-all border-l-2 ${activeTab === "reports" ? "bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]" : "border-transparent text-[#b8aea0] hover:bg-[#1f1c16] hover:text-[#F5F0E8]"}`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistika & Hisobot</span>
          </button>

          <div className="px-6 py-2 pt-4 text-[9px] uppercase tracking-widest text-[#8A8278] font-bold">Tizim</div>

          <button 
            onClick={() => setActiveTab("settings")}
            className={`w-full flex items-center gap-3 px-6 py-3 text-xs tracking-wide transition-all border-l-2 ${activeTab === "settings" ? "bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]" : "border-transparent text-[#b8aea0] hover:bg-[#1f1c16] hover:text-[#F5F0E8]"}`}
          >
            <Settings className="w-4 h-4" />
            <span>Xavfsizlik sozlamalari</span>
          </button>
        </nav>

        <div className="p-4 border-t border-[#2c271f] space-y-2">
          <button 
            onClick={navigateToWebsite} 
            className="w-full flex items-center justify-center gap-2 text-xs text-[#8A8278] hover:text-[#C9A96E] transition-colors py-1.5 border border-[#2c271f] rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Mijoz saytiga o'tish</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 text-xs text-[#8A8278] hover:text-rose-400 transition-colors py-1.5 border border-[#2c271f] rounded"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Tizimdan chiqish</span>
          </button>
        </div>
      </aside>

      {/* MAIN ADMIN AREA */}
      <main className="flex-1 ml-[240px] flex flex-col min-h-screen">
        
        {/* TOP STATUS BAR */}
        <header className="h-[60px] bg-[#16140F] border-b border-[#2c271f] px-8 flex items-center justify-between sticky top-0 z-30">
          <h2 className="font-serif text-lg text-white font-light uppercase tracking-wide">
            {activeTab === "dashboard" && "Dashboard"}
            {activeTab === "rooms" && "Xonalar boshqaruvi"}
            {activeTab === "bookings" && "Bron so'rovlari"}
            {activeTab === "finance" && "Moliya & Kassa"}
            {activeTab === "reports" && "Hisobotlar & Analitika"}
            {activeTab === "settings" && "Tizim sozlamalari"}
          </h2>

          <div className="flex items-center gap-6">
            <div className="flex bg-[#1f1c16] border border-[#2c271f] rounded-lg overflow-hidden text-[10px]">
              <button 
                onClick={() => handleHotelStatusChange("open")}
                className={`px-3 py-1.5 font-semibold transition-all ${hotelData.hotel_status === "open" ? "bg-emerald-500/15 text-emerald-400" : "text-[#8A8278] hover:text-white"}`}
              >
                🟢 Ochiq
              </button>
              <button 
                onClick={() => handleHotelStatusChange("busy")}
                className={`px-3 py-1.5 font-semibold transition-all ${hotelData.hotel_status === "busy" ? "bg-amber-500/15 text-amber-400" : "text-[#8A8278] hover:text-white"}`}
              >
                🟡 Band
              </button>
              <button 
                onClick={() => handleHotelStatusChange("closed")}
                className={`px-3 py-1.5 font-semibold transition-all ${hotelData.hotel_status === "closed" ? "bg-rose-500/15 text-rose-400" : "text-[#8A8278] hover:text-white"}`}
              >
                🔴 Yopiq
              </button>
            </div>
            <div className="text-xs tracking-widest font-mono text-[#8A8278] border-l border-[#2c271f] pl-6 hidden sm:block">
              {timeStr || "--:--:--"}
            </div>
          </div>
        </header>

        {/* CONTAINER VIEWPORTS */}
        <div className="p-8 flex-1">
          
          {/* VIEWPORT: DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#16140F] border-l-4 border-emerald-500 border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Bo'sh xonalar</div>
                  <div className="text-3xl font-serif text-emerald-400 mt-2 font-medium">{roomCounters.available}</div>
                  <div className="text-[10px] text-[#8A8278] mt-2">Jami 50 ta xonadan</div>
                </div>
                <div className="bg-[#16140F] border-l-4 border-rose-500 border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Band xonalar</div>
                  <div className="text-3xl font-serif text-rose-400 mt-2 font-medium">{roomCounters.occupied}</div>
                  <div className="text-[10px] text-[#8A8278] mt-2">{Math.round(roomCounters.occupied / 50 * 100)}% To'lganlik darajasi</div>
                </div>
                <div className="bg-[#16140F] border-l-4 border-amber-500 border border-[#2c271f] p-5 rounded relative">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Bugungi daromad</div>
                  <div className="text-3xl font-serif text-[#C9A96E] mt-2 font-medium">${currentTodayRevenue.toLocaleString()}</div>
                  <div className="text-[10px] text-[#8A8278] mt-2">Real vaqtdagi kassa</div>
                  <button onClick={handleEditDailyRevenue} className="absolute bottom-4 right-4 bg-[#2c271f] border border-[#2c271f] hover:border-[#C9A96E] text-[#C9A96E] px-2 py-1 text-[9px] rounded font-bold uppercase tracking-wider transition-all">
                    ✍️ Tahrirlash
                  </button>
                </div>
                <div className="bg-[#16140F] border-l-4 border-blue-500 border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Kutilayotgan bronlar</div>
                  <div className="text-3xl font-serif text-blue-400 mt-2 font-medium">{pendingRequestsCount}</div>
                  <div className="text-[10px] text-[#8A8278] mt-2">Tasdiqlash kutilmoqda</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rooms general state status donut mock */}
                <div className="bg-[#16140F] border border-[#2c271f] rounded">
                  <div className="px-6 py-4 border-b border-[#2c271f] flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">🛏️ Mehmonxona xonalari hisoboti</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#2c271f]/50 pb-2">
                      <span className="flex items-center gap-2 text-xs text-[#b8aea0]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Bo'sh (Toza xona)</span>
                      </span>
                      <strong className="text-sm font-semibold">{roomCounters.available} ta xona</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#2c271f]/50 pb-2">
                      <span className="flex items-center gap-2 text-xs text-[#b8aea0]">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Band (Occupied)</span>
                      </span>
                      <strong className="text-sm font-semibold">{roomCounters.occupied} ta xona</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#2c271f]/50 pb-2">
                      <span className="flex items-center gap-2 text-xs text-[#b8aea0]">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span>Tozalanmoqda (Cleaning)</span>
                      </span>
                      <strong className="text-sm font-semibold">{roomCounters.cleaning} ta xona</strong>
                    </div>
                    <div className="flex items-center justify-between border-b border-[#2c271f]/50 pb-2">
                      <span className="flex items-center gap-2 text-xs text-[#b8aea0]">
                        <span className="w-2 h-2 rounded-full bg-orange-700" />
                        <span>Ta'mirda (Maintenance)</span>
                      </span>
                      <strong className="text-sm font-semibold">{roomCounters.maintenance} ta xona</strong>
                    </div>
                  </div>
                </div>

                {/* Recent Bookings requests */}
                <div className="bg-[#16140F] border border-[#2c271f] rounded">
                  <div className="px-6 py-4 border-b border-[#2c271f] flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">📋 So'nggi 5 ta bron so'rovlari</h3>
                  </div>
                  <div className="p-6 space-y-4 divide-y divide-[#2c271f]/50">
                    {hotelData.bookings.length === 0 ? (
                      <div className="text-center text-xs text-[#8A8278] py-8 font-serif">Hozircha bron so'rovlari mavjud emas.</div>
                    ) : (
                      hotelData.bookings.slice(-5).reverse().map((b, i) => (
                        <div key={i} className="flex items-center justify-between pt-3 first:pt-0">
                          <div>
                            <div className="text-xs font-bold text-white">{b.name}</div>
                            <div className="text-[10px] text-[#8A8278] mt-0.5">{b.room}</div>
                          </div>
                          <span className={`text-[9px] uppercase tracking-wider font-semibold px-2 py-1 rounded ${b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : b.status === "cancelled" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                            {b.status === "confirmed" ? "Tasdiqlangan" : b.status === "cancelled" ? "Bekor qilingan" : "Kutilmoqda"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT: ROOMS MANAGING */}
          {activeTab === "rooms" && (
            <div className="space-y-6">
              <div className="bg-[#16140F] border border-[#2c271f] rounded p-6">
                <div className="flex gap-4 flex-wrap text-xs font-medium text-[#b8aea0]">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" /> Bo'sh (Available)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full" /> Band (Occupied)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full" /> Tozalanmoqda (Cleaning)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-700 rounded-full" /> Ta'mirda (Maintenance)</span>
                </div>
              </div>

              <div className="space-y-8">
                {ROOM_TYPES.map(t => {
                  const roomsOfType = [];
                  let countAvail = 0, countOcc = 0, countClean = 0, countMaint = 0;

                  for (let i = 1; i <= 10; i++) {
                    const roomNum = `${t.prefix}${i < 10 ? "0" + i : i}`;
                    const currentStatus = hotelData.roomStatus[roomNum] || "available";

                    if (currentStatus === "available") countAvail++;
                    else if (currentStatus === "occupied") countOcc++;
                    else if (currentStatus === "cleaning") countClean++;
                    else countMaint++;

                    roomsOfType.push(
                      <div 
                        key={roomNum} 
                        className={`border p-3 rounded-lg text-center transition-all ${
                          currentStatus === "available" ? "bg-emerald-950/20 border-emerald-500/30" :
                          currentStatus === "occupied" ? "bg-rose-950/20 border-rose-500/30" :
                          currentStatus === "cleaning" ? "bg-amber-950/20 border-amber-500/30" :
                          "bg-orange-950/20 border-orange-500/30"
                        }`}
                      >
                        <div className="text-sm font-bold text-white">{roomNum}</div>
                        <div className={`text-[9px] uppercase font-bold mt-1 tracking-wider ${
                          currentStatus === "available" ? "text-emerald-400" :
                          currentStatus === "occupied" ? "text-rose-400" :
                          currentStatus === "cleaning" ? "text-amber-400" :
                          "text-orange-400"
                        }`}>
                          {STATUS_LABELS[currentStatus]}
                        </div>
                        <select 
                          value={currentStatus} 
                          onChange={(e) => handleRoomStatusChange(roomNum, e.target.value as any)}
                          className="w-full bg-[#0D0D0D] border border-[#2c271f] text-[#b8aea0] text-[10px] mt-2 p-1.5 rounded outline-none cursor-pointer focus:border-[#C9A96E]"
                        >
                          <option value="available">Bo'sh</option>
                          <option value="occupied">Band</option>
                          <option value="cleaning">Tozalanmoqda</option>
                          <option value="maintenance">Ta'mirda</option>
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={t.key} className="bg-[#16140F] border border-[#2c271f] rounded p-6">
                      <div className="flex justify-between items-center border-b border-[#2c271f] pb-3 mb-4">
                        <div>
                          <span className="font-serif text-base text-white">{t.label}</span>
                          <span className="text-xs text-[#C9A96E] ml-3">${t.price} / tun</span>
                        </div>
                        <div className="text-[10px] text-[#8A8278] tracking-wider uppercase font-bold">
                          🟢 {countAvail} bo'sh · 🔴 {countOcc} band · 🟡 {countClean} toza · 🟠 {countMaint} ta'mir
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
                        {roomsOfType}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEWPORT: BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="space-y-6">
              
              {/* Manual add reservation and occupy room */}
              <div className="bg-[#16140F] border border-[#2c271f] rounded p-6">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-[#2c271f] pb-3">
                  <PlusCircle className="w-4 h-4 text-[#C9A96E]" />
                  <span>Yangi bron qo'shish va xonani band qilish</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Mehmon ismi va familiyasi</label>
                    <input 
                      type="text" 
                      placeholder="Ali Valiyev"
                      value={mForm.guestName}
                      onChange={(e) => setMForm(p => ({ ...p, guestName: e.target.value }))}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Aloqa (Email yoki Telefon)</label>
                    <input 
                      type="text" 
                      placeholder="ali@gmail.com yoki +9989..."
                      value={mForm.guestEmail}
                      onChange={(e) => setMForm(p => ({ ...p, guestEmail: e.target.value }))}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Kirish sanasi</label>
                    <input 
                      type="date" 
                      value={mForm.checkin}
                      onChange={(e) => setMForm(p => ({ ...p, checkin: e.target.value }))}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Chiqish sanasi</label>
                    <input 
                      type="date" 
                      value={mForm.checkout}
                      onChange={(e) => setMForm(p => ({ ...p, checkout: e.target.value }))}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Xona turi</label>
                    <select 
                      value={mForm.roomType}
                      onChange={(e) => handleManualRoomTypeChange(e.target.value)}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none cursor-pointer focus:border-[#C9A96E]"
                    >
                      <option value="">Xona turini tanlang</option>
                      {ROOM_TYPES.map(r => (
                        <option key={r.key} value={r.key}>{r.label} — ${r.price}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Xona raqami</label>
                    <select 
                      value={mForm.roomNum}
                      onChange={(e) => setMForm(p => ({ ...p, roomNum: e.target.value }))}
                      disabled={availableRoomNumbers.length === 0}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none cursor-pointer focus:border-[#C9A96E]"
                    >
                      {availableRoomNumbers.length === 0 ? (
                        <option value="">Avval xona turini tanlang</option>
                      ) : (
                        availableRoomNumbers.map(num => {
                          const state = hotelData.roomStatus[num] || "available";
                          return (
                            <option key={num} value={num}>{num} ({STATUS_LABELS[state]})</option>
                          );
                        })
                      )}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Xona yangi holati</label>
                    <select 
                      value={mForm.roomStatus}
                      onChange={(e) => setMForm(p => ({ ...p, roomStatus: e.target.value }))}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none cursor-pointer focus:border-[#C9A96E]"
                    >
                      <option value="occupied">Band (Occupied)</option>
                      <option value="cleaning">Tozalanmoqda (Cleaning)</option>
                      <option value="maintenance">Ta'mirda (Maintenance)</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleAddManualBooking}
                  className="bg-[#C9A96E] hover:bg-[#E8D5B0] text-[#0D0D0D] px-6 py-3 text-xs font-bold uppercase tracking-wider rounded transition-colors"
                >
                  Bron yaratish va Xonani band qilish
                </button>
              </div>

              {/* Booking Request Logs table */}
              <div className="bg-[#16140F] border border-[#2c271f] rounded overflow-hidden">
                <div className="px-6 py-4 border-b border-[#2c271f]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">📋 Barcha bronlar ro'yxati</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-[#1f1c16]/50 text-[#8A8278] border-b border-[#2c271f]">
                        <th className="p-4 font-bold uppercase tracking-wider">#</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Mehmon</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Xona</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Kelish</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Ketish</th>
                        <th className="p-4 font-bold uppercase tracking-wider">To'lov</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Holat</th>
                        <th className="p-4 font-bold uppercase tracking-wider text-right">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2c271f]/50">
                      {hotelData.bookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-10 text-center text-[#8A8278] font-serif italic">Hozircha hech qanday bron mavjud emas.</td>
                        </tr>
                      ) : (
                        hotelData.bookings.slice().reverse().map((b, idx) => {
                          const realIdx = hotelData.bookings.length - 1 - idx;
                          return (
                            <tr key={idx} className="hover:bg-[#1f1c16]/20 transition-colors">
                              <td className="p-4 font-medium text-[#8A8278]">{hotelData.bookings.length - idx}</td>
                              <td className="p-4">
                                <div className="font-bold text-white">{b.name}</div>
                                <div className="text-[10px] text-[#8A8278] mt-0.5">{b.email || b.phone || "—"}</div>
                              </td>
                              <td className="p-4 text-[#b8aea0]">{b.room}</td>
                              <td className="p-4 text-[#b8aea0]">{b.checkin}</td>
                              <td className="p-4 text-[#b8aea0]">{b.checkout}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.payment === "visa" ? "bg-blue-500/10 text-blue-400" : b.payment === "uzcard" ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                                  {b.payment === "visa" ? "Visa" : b.payment === "uzcard" ? "Uzcard" : "Naqd / Bank"}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : b.status === "cancelled" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                                  {b.status === "confirmed" ? "Tasdiqlangan" : b.status === "cancelled" ? "Bekor qilingan" : "Kutilmoqda"}
                                </span>
                              </td>
                              <td className="p-4 text-right">
                                {b.status === "pending" && (
                                  <div className="flex gap-2 justify-end">
                                    <button 
                                      onClick={() => handleConfirmBooking(realIdx)}
                                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 text-[10px] rounded font-semibold flex items-center gap-1 transition-colors"
                                    >
                                      <Check className="w-3 h-3" />
                                      <span>Tasdiqlash</span>
                                    </button>
                                    <button 
                                      onClick={() => handleCancelBooking(realIdx)}
                                      className="bg-rose-600 hover:bg-rose-500 text-white px-2 py-1 text-[10px] rounded font-semibold flex items-center gap-1 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                      <span>Rad etish</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* VIEWPORT: FINANCE */}
          {activeTab === "finance" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#16140F] border border-[#2c271f] p-5 rounded relative">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Bugungi kassa</div>
                  <div className="text-3xl font-serif text-[#C9A96E] mt-2 font-medium">${currentTodayRevenue.toLocaleString()}</div>
                  <button onClick={handleEditDailyRevenue} className="absolute bottom-4 right-4 bg-[#2c271f] hover:border-[#C9A96E] border border-transparent text-[#C9A96E] px-2 py-1 text-[9px] rounded font-bold uppercase transition-all">
                    ✍️ O'zgartirish
                  </button>
                </div>
                <div className="bg-[#16140F] border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Jami umumiy daromad</div>
                  <div className="text-3xl font-serif text-emerald-400 mt-2 font-medium">${(hotelData.revenue.total || 0).toLocaleString()}</div>
                </div>
                <div className="bg-[#16140F] border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Tasdiqlangan bronlar soni</div>
                  <div className="text-3xl font-serif text-blue-400 mt-2 font-medium">
                    {hotelData.bookings.filter(b => b.status === "confirmed").length} ta
                  </div>
                </div>
                <div className="bg-[#16140F] border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Kutilayotgan kelgusi summa</div>
                  <div className="text-3xl font-serif text-amber-500 mt-2 font-medium">
                    ${hotelData.bookings.filter(b => b.status === "pending").reduce((sum, b) => {
                      const matched = ROOM_TYPES.find(t => b.room.includes(t.label));
                      const price = matched ? matched.price : 180;
                      const nights = Math.max(1, Math.ceil((new Date(b.checkout).getTime() - new Date(b.checkin).getTime()) / 86400000) || 1);
                      return sum + (price * nights);
                    }, 0).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Transactions Logs table */}
              <div className="bg-[#16140F] border border-[#2c271f] rounded overflow-hidden">
                <div className="px-6 py-4 border-b border-[#2c271f]">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">💳 To'lov tarixi logs</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="bg-[#1f1c16]/50 text-[#8A8278] border-b border-[#2c271f]">
                        <th className="p-4 font-bold uppercase tracking-wider">#</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Mehmon</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Xona turi</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Summa</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Uslub</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Holat</th>
                        <th className="p-4 font-bold uppercase tracking-wider">Sana / Vaqt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2c271f]/50">
                      {hotelData.bookings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-10 text-center text-[#8A8278] font-serif italic">To'lovlar tarixi mavjud emas.</td>
                        </tr>
                      ) : (
                        hotelData.bookings.slice().reverse().map((b, idx) => {
                          const matched = ROOM_TYPES.find(t => b.room.includes(t.label));
                          const price = matched ? matched.price : 180;
                          const nights = Math.max(1, Math.ceil((new Date(b.checkout).getTime() - new Date(b.checkin).getTime()) / 86400000) || 1);
                          const amount = b.amount || (price * nights);

                          return (
                            <tr key={idx} className="hover:bg-[#1f1c16]/20 transition-colors">
                              <td className="p-4 text-[#8A8278]">{hotelData.bookings.length - idx}</td>
                              <td className="p-4 font-bold text-white">{b.name}</td>
                              <td className="p-4 text-[#b8aea0]">{b.room}</td>
                              <td className="p-4 font-bold text-[#C9A96E]">${amount}</td>
                              <td className="p-4 uppercase text-[10px] font-bold text-[#8A8278]">{b.payment}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${b.status === "confirmed" ? "bg-emerald-500/10 text-emerald-400" : b.status === "cancelled" ? "bg-rose-500/10 text-rose-400" : "bg-amber-500/10 text-amber-400"}`}>
                                  {b.status === "confirmed" ? "To'langan" : b.status === "cancelled" ? "Bekor" : "Kutilmoqda"}
                                </span>
                              </td>
                              <td className="p-4 text-[#8A8278]">{b.time}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT: REPORTS */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#16140F] border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Jami tashriflar</div>
                  <div className="text-3xl font-serif text-blue-400 mt-2 font-medium">{hotelData.visits?.total || 1}</div>
                </div>
                <div className="bg-[#16140F] border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Bugungi tashriflar</div>
                  <div className="text-3xl font-serif text-[#C9A96E] mt-2 font-medium">
                    {hotelData.visits?.lastDate === todayStr ? hotelData.visits.today : 0}
                  </div>
                </div>
                <div className="bg-[#16140F] border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Jami bronlar soni</div>
                  <div className="text-3xl font-serif text-emerald-400 mt-2 font-medium">{hotelData.bookings.length}</div>
                </div>
                <div className="bg-[#16140F] border border-[#2c271f] p-5 rounded">
                  <div className="text-[10px] tracking-wider text-[#8A8278] uppercase font-bold">Konversiya darajasi</div>
                  <div className="text-3xl font-serif text-amber-400 mt-2 font-medium">
                    {hotelData.visits?.total ? Math.round((hotelData.bookings.length / hotelData.visits.total) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Room popularity distribution metrics */}
              <div className="bg-[#16140F] border border-[#2c271f] rounded p-6">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white mb-6 border-b border-[#2c271f] pb-3">🏨 Xona turlari bo'yicha talab tahlili</h3>
                
                <div className="space-y-6 max-w-2xl">
                  {ROOM_TYPES.map(t => {
                    const count = hotelData.bookings.filter(b => b.room.includes(t.label)).length;
                    const maxCount = Math.max(1, ...ROOM_TYPES.map(rt => hotelData.bookings.filter(b => b.room.includes(rt.label)).length));
                    const percentage = Math.round((count / maxCount) * 100);

                    return (
                      <div key={t.key}>
                        <div className="flex justify-between items-center text-xs mb-1.5">
                          <span className="font-bold text-white">{t.label}</span>
                          <span className="text-[#C9A96E] font-bold">{count} marta bron qilingan</span>
                        </div>
                        <div className="h-2 bg-[#0D0D0D] border border-[#2c271f] rounded overflow-hidden">
                          <div 
                            style={{ width: `${percentage}%` }}
                            className="h-full bg-[#C9A96E] rounded-r transition-all duration-500" 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* VIEWPORT: SETTINGS */}
          {activeTab === "settings" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Cloud Sync panel */}
              <div className="bg-[#16140F] border border-[#2c271f] rounded p-6 md:col-span-2">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center justify-between border-b border-[#2c271f] pb-3">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-[#C9A96E]" />
                    <span>Bulutli xotira sinxronizatsiyasi (Serverga ulash)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${jsonbinStatus.active ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`}></span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#8A8278]">
                      {jsonbinStatus.active ? "Ulandi (Bulutda faol)" : "Ulanmagan (Faqat local)"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <p className="text-xs text-[#8A8278] leading-relaxed">
                      Mehmonxona ma'lumotlarini <strong>JSONBin.io</strong> serveri bilan sinxronlashtiring. Bu orqali barcha o'zgarishlar barcha telefon va qurilmalarda real vaqtda bir xil va doimiy (persistent) ko'rinadi.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase text-[#8A8278] flex items-center gap-1">
                          API Key (Master Key)
                          <span className="text-rose-400">*</span>
                        </label>
                        <input 
                          type="password" 
                          placeholder={jsonbinStatus.apiKey ? "Saqlangan (Yangi kiritish uchun yozing)" : "Master Keyni kiriting..."}
                          value={binInputKey}
                          onChange={(e) => setBinInputKey(e.target.value)}
                          className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none focus:border-[#C9A96E]"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase text-[#8A8278] flex items-center justify-between">
                          <span>Bin ID (Ixtiyoriy)</span>
                          {!jsonbinStatus.binId && <span className="text-emerald-400 font-bold lowercase text-[9px]">Avto-yaratish faol</span>}
                        </label>
                        <input 
                          type="text" 
                          placeholder={jsonbinStatus.binId || "Bo'sh qolsa, yangi yaratiladi"}
                          value={binInputId}
                          onChange={(e) => setBinInputId(e.target.value)}
                          className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none focus:border-[#C9A96E]"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button 
                        onClick={handleSaveJsonBin}
                        disabled={binLoading}
                        className="bg-[#C9A96E] hover:bg-[#E8D5B0] disabled:bg-[#2c271f] disabled:text-[#8A8278] text-[#0D0D0D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all flex items-center gap-2"
                      >
                        {binLoading ? "Ulanmoqda..." : "Serverga ulash"}
                      </button>

                      {jsonbinStatus.active && (
                        <button 
                          onClick={handleDisconnectJsonBin}
                          disabled={binLoading}
                          className="border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-500/5 text-rose-400 px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all"
                        >
                          Ulanishni o'chirish
                        </button>
                      )}
                    </div>

                    {jsonbinStatus.error && (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded mt-3">
                        ⚠️ <strong>Xatolik:</strong> {jsonbinStatus.error}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 bg-[#0D0D0D] border border-[#2c271f] rounded p-4 space-y-3.5 text-xs">
                    <h4 className="font-bold text-white uppercase tracking-wider text-[10px] border-b border-[#2c271f] pb-2">💡 Qanday ulanadi?</h4>
                    <ol className="list-decimal list-inside space-y-2 text-[#8A8278] leading-relaxed">
                      <li>
                        <a href="https://jsonbin.io/app/api-keys" target="_blank" rel="noopener noreferrer" className="text-[#C9A96E] underline hover:text-[#E8D5B0]">
                          jsonbin.io
                        </a> saytiga kiring (o'z profilingizga).
                      </li>
                      <li>
                        <strong>"API Keys"</strong> bo'limidan <strong>Master Key</strong>-ni nusxalab oling va chap tarafdagi "API Key" maydoniga qo'ying.
                      </li>
                      <li>
                        <strong>"Bin ID"</strong> maydonini bo'sh qoldiring, <strong>"Serverga ulash"</strong> tugmasini bosing. Tizim yangi bulut xotirasini avtomatik yaratib, sizga bog'lab beradi!
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Password panel */}
              <div className="bg-[#16140F] border border-[#2c271f] rounded p-6">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[#2c271f] pb-3">
                  <Lock className="w-4 h-4 text-[#C9A96E]" />
                  <span>Admin kirish paroli sozlamalari</span>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Joriy parol</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={settingsForm.curPass}
                      onChange={(e) => setSettingsForm(p => ({ ...p, curPass: e.target.value }))}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase text-[#8A8278]">Yangi parol</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={settingsForm.newPass}
                      onChange={(e) => setSettingsForm(p => ({ ...p, newPass: e.target.value }))}
                      className="bg-[#0D0D0D] border border-[#2c271f] text-[#F5F0E8] p-2.5 text-xs rounded outline-none focus:border-[#C9A96E]"
                    />
                  </div>
                  <button 
                    onClick={handleChangePassword}
                    className="bg-[#C9A96E] hover:bg-[#E8D5B0] text-[#0D0D0D] px-6 py-2.5 text-xs font-bold uppercase tracking-wider rounded transition-all mt-2"
                  >
                    Parolni yangilash
                  </button>
                </div>
              </div>

              {/* Reset stats data panel */}
              <div className="bg-[#16140F] border border-[#2c271f] rounded p-6">
                <div className="text-xs font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2 border-b border-[#2c271f] pb-3">
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>Ma'lumotlar bazasini boshqarish</span>
                </div>
                <div className="space-y-6">
                  <div>
                    <p className="text-xs text-[#8A8278] leading-relaxed mb-3">
                      Barcha bronlar tarixini, kassa daromadlarini va tashrif analitikasini 0 ga qaytarish.
                    </p>
                    <button 
                      onClick={handleResetStats}
                      className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-all"
                    >
                      Tizim statistikasini tozalash (0 ga qaytarish)
                    </button>
                  </div>
                  <div className="border-t border-[#2c271f] pt-6">
                    <p className="text-xs text-[#8A8278] leading-relaxed mb-3">
                      Barcha 50 ta xonalarni Bo'sh (Available) holatiga o'tkazish.
                    </p>
                    <button 
                      onClick={handleResetRooms}
                      className="bg-[#2c271f] hover:border-[#C9A96E] border border-transparent text-[#C9A96E] px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded transition-all"
                    >
                      Barcha xonalarni bo'shatish
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      {/* FEEDBACK FLOATING TOAST */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1f1c16] border border-[#2c271f] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-base">{toast.icon}</span>
          <span className="text-xs font-medium text-[#F5F0E8]">{toast.msg}</span>
        </div>
      )}

    </div>
  );
};
