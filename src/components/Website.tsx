import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Settings, 
  Loader2
} from "lucide-react";
import { HotelData, ROOM_TYPES } from "../types";
import { syncAndSaveHotelData } from "../utils/storage";

// i18n Dictionary
const i18n = {
  en: {
    nav_rooms: "Rooms", nav_amenities: "Amenities", nav_gallery: "Gallery", nav_contact: "Contact", nav_book: "Book Now",
    hero_eyebrow: "5-Star Luxury in the Heart of Tashkent",
    hero_title: "Heritage of Refined Elegance",
    hero_italic: "Refined",
    hero_sub: "Experience unmatched hospitality, absolute elegance and impeccable 5-star service at the most prestigious address in Tashkent.",
    hero_btn1: "Select a Room", hero_btn2: "Our Story", scroll: "Scroll down",
    stat1: "Premium Rooms", stat2: "Personal Service", stat3: "Guest Rating", stat4: "Established",
    rooms_eyebrow: "Our Offerings", rooms_title: "Exquisite Rooms & Suites",
    room1_name: "Presidential Royal Residence", room1_price: "From $1,200 / night",
    room2_name: "Tashkent Golden Penthouse", room2_price: "From $1,300 / night",
    room3_name: "Executive Luxury Suite", room3_price: "From $450 / night",
    room4_name: "Deluxe King Room", room4_price: "From $180 / night",
    room5_name: "Family Comfort Suite", room5_price: "From $320 / night",
    room_avail: "Available", room_full: "Fully Booked", tag1: "Elite Selection", tag2: "Exclusive", tag3: "Best Seller", tag4: "Spacious",
    amen_eyebrow: "World-Class Service", amen_title: "At Your Service",
    a1_name: "Spa & Wellness Haven", a1_desc: "Exceptional treatments, professional massages, and therapeutic care.",
    a2_name: "Panoramic Sky Pool", a2_desc: "Heated rooftop pool with stunning endless vistas of the city skyline.",
    a3_name: "Fine Dining 'Chorsu Gold'", a3_desc: "Symphony of traditional flavors transformed by elite world chefs.",
    a4_name: "Elite Concierge 24/7", a4_desc: "Personalized experiences, VIP transit, and premium request handling.",
    gal_eyebrow: "Visual Journey", gal_title: "Glimpses of Luxury",
    test_eyebrow: "Guest Stories", test_title: "Stories of Excellence",
    t1: '"A marvelous sanctuary! The quality of attention is second to none. The cuisine at Chorsu Gold was outstanding."',
    t2: '"The finest luxury residence in Tashkent. Everything feels quiet, private, and exceptionally elegant."',
    t3: '"The Presidential Royal Suite was phenomenal. Exceptional personal butler and top-grade spa."',
    loc_eyebrow: "Heart of Tashkent", loc_title: "Prime Location", loc_addr_label: "Address", loc_phone_label: "Phone", loc_email_label: "Email",
    cont_eyebrow: "Get in Touch", cont_title: "How Can We Help You?",
    tg_desc: "Quick inquiries? Message us on Telegram for an answer within 5 minutes. Available 24/7.", tg_btn: "Open Chat",
    wa_desc: "Our professional lines are open 24 hours to support your requests and bookings.", wa_btn: "Open WhatsApp",
    book_eyebrow: "Plan Your Stay", book_title: "Guaranteed Reservation",
    f_name: "Full Name *", f_phone: "Phone *", f_email: "Email (Optional)", f_checkin: "Check-in *", f_checkout: "Check-out *",
    f_room: "Room Type *", f_guests: "Guests *", f_payment: "Payment Method *", f_req: "Special Requests",
    f_submit: "Confirm Reservation", f_submitting: "Processing...",
    footer_tag: "Harmonious balance of historic Tashkent heritage and modern high-end luxury.",
    footer_explore: "Explore", footer_legal: "Legal",
    footer_copy: "© 2026 All rights reserved. Hotel Tashkent.",
    msg_success: "✅ Your room has been registered successfully! Our concierge will contact you shortly.",
    msg_error: "❌ Error. Please contact us via WhatsApp or Telegram.",
    msg_fill: "⚠️ Please fill in all required fields correctly."
  },
  uz: {
    nav_rooms: "Xonalar", nav_amenities: "Qulayliklar", nav_gallery: "Galereya", nav_contact: "Aloqa", nav_book: "Hoziroq band qilish",
    hero_eyebrow: "Toshkent markazidagi 5 yulduzli hashamat",
    hero_title: "Nozik hashamatning merosiy jozibasi",
    hero_italic: "merosiy",
    hero_sub: "Toshkentning eng nufuzli manzilida joylashgan o'ziga xos mehmondo'stlik, beqiyos qulaylik va oliy darajadagi xizmatdan bahramand bo'ling.",
    hero_btn1: "Xonani tanlash", hero_btn2: "Sayohatimiz", scroll: "Pastga aylantiring",
    stat1: "Premium xonalar", stat2: "Shaxsiy xizmat", stat3: "Mehmonlar reytingi", stat4: "Tashkil etilgan yil",
    rooms_eyebrow: "Bizning takliflar", rooms_title: "Ajoyib xonalar va lyukslar",
    room1_name: "Prezidentlik shohona rezidensiyasi", room1_price: "Narx boshlanadi: $1,200 tun uchun",
    room2_name: "Toshkent Oltin Penthouse", room2_price: "Narx boshlanadi: $1,300 tun uchun",
    room3_name: "Executive lyuks xonasi", room3_price: "Narx boshlanadi: $450 tun uchun",
    room4_name: "Deluxe King xonasi", room4_price: "Narx boshlanadi: $180 tun uchun",
    room5_name: "Oila a'zolari uchun qulay xona", room5_price: "Narx boshlanadi: $320 tun uchun",
    room_avail: "Bo'sh", room_full: "To'lgan", tag1: "Elita tanlovi", tag2: "Eksklyuziv", tag3: "Eng ko'p tanlangan", tag4: "Keng maydon",
    amen_eyebrow: "Oliy darajadagi qulaylik", amen_title: "Sizning xizmatda",
    a1_name: "Spa & Wellness markazi", a1_desc: "An'anaviy va zamonaviy massaj va tana parvarishi xizmatlari.",
    a2_name: "Panoramik osmon havzasi", a2_desc: "Toshkent shahrining hayratlanarli manzarasi bilan isitiladigan basseyn.",
    a3_name: "Fine Dining 'Chorsu Gold'", a3_desc: "Milliy va jahon taomlari san'ati yetuk oshpazlarimiz talqinida.",
    a4_name: "Shaxsiy konsyerj xizmati", a4_desc: "Sayohatlar, bronlar va barcha istaklaringizni 24/7 amalga oshirish.",
    gal_eyebrow: "Vizual sayohat", gal_title: "Mehmonxonamiz ko'rinishlari",
    test_eyebrow: "Mehmonlar fikri", test_title: "Unutilmas lahzalar",
    t1: '"Mehmonxona shunchaki ajoyib! Xizmat ko\'rsatish darajasi juda yuqori. Chorsu Gold restorani taomlari bizga juda yoqdi."',
    t2: '"Toshkent markazidagi eng hashamatli va tinch maskan. Har bir detalga alohida e\'tibor berilgan."',
    t3: '"Prezident rezidensiyasida turdik, haqiqiy shohona xizmat. Shaxsiy batler xizmati tengsiz."',
    loc_eyebrow: "Toshkent yuragi", loc_title: "Ajoyib joylashuv", loc_addr_label: "Manzilimiz", loc_phone_label: "Telefon", loc_email_label: "Elektron pochta",
    cont_eyebrow: "Aloqada bo'ling", cont_title: "Sizga yordam berishdan mamnunmiz",
    tg_desc: "Tezkor savollar uchun Telegram orqali yozing — 5 daqiqada javob oling. 24/7 faolmiz.", tg_btn: "Chatni ochish",
    wa_desc: "Bizning telefon liniyalarimiz so'rovlaringizni qo'llab-quvvatlash uchun 24 soat ochiq.", wa_btn: "WhatsApp ochish",
    book_eyebrow: "Sayohatni rejalashtirish", book_title: "Xonani band qilish",
    f_name: "To'liq ism *", f_phone: "Telefon *", f_email: "Elektron pochta (ixtiyoriy)", f_checkin: "Kirish sanasi *", f_checkout: "Chiqish sanasi *",
    f_room: "Xona turi *", f_guests: "Mehmonlar *", f_payment: "To'lov usuli *", f_req: "Maxsus so'rovlar",
    f_submit: "Bronni tasdiqlash", f_submitting: "Jarayonda...",
    footer_tag: "Toshkentning tarixiy merosi va zamonaviy hashamatning uyg'un uyg'unligi.",
    footer_explore: "O'rganing", footer_legal: "Huquqiy hujjatlar",
    footer_copy: "© 2026 Barcha huquqlar himoyalangan. Hotel Tashkent.",
    msg_success: "✅ Xonangiz muvaffaqiyatli ro'yxatdan o'tkazildi! Konsyerjimiz tez orada siz bilan bog'lanadi.",
    msg_error: "❌ Xatolik. Iltimos WhatsApp yoki Telegram orqali murojaat qiling.",
    msg_fill: "⚠️ Iltimos, barcha majburiy maydonlarni to'g'ri to'ldiring."
  },
  ru: {
    nav_rooms: "Номера", nav_amenities: "Удобства", nav_gallery: "Галерея", nav_contact: "Контакты", nav_book: "Забронировать",
    hero_eyebrow: "5-звёздочный люкс в самом сердце Ташкента",
    hero_title: "Наследие утончённой роскоши",
    hero_italic: "утончённой",
    hero_sub: "Оцените непревзойдённое гостеприимство, абсолютную элегантность и безупречный 5-звёздочный сервис по самому престижному адресу в Ташкенте.",
    hero_btn1: "Выбрать номер", hero_btn2: "О нашей истории", scroll: "Листайте вниз",
    stat1: "Роскошных номеров", stat2: "Личные дворецкие", stat3: "Оценка гостей", stat4: "Год основания",
    rooms_eyebrow: "Наши предложения", rooms_title: "Изысканные номера и люксы",
    room1_name: "Президентская резиденция", room1_price: "Стоимость от: $1,200 за ночь",
    room2_name: "Золотой пентхаус Ташкента", room2_price: "Стоимость от: $1,300 за ночь",
    room3_name: "Представительский люкс", room3_price: "Стоимость от: $450 за ночь",
    room4_name: "Номер Deluxe King", room4_price: "Стоимость от: $180 за ночь",
    room5_name: "Семейный комфорт-люкс", room5_price: "Стоимость от: $320 за ночь",
    room_avail: "Свободен", room_full: "Занят", tag1: "Элитный выбор", tag2: "Эксклюзив", tag3: "Популярный выбор", tag4: "Просторная планировка",
    amen_eyebrow: "Сервис мирового уровня", amen_title: "К вашим услугам",
    a1_name: "Спа & Велнес центр", a1_desc: "Великолепные процедуры, профессиональный массаж и терапевтический уход.",
    a2_name: "Панорамный Sky бассейн", a2_desc: "Роскошный бассейн на крыше с бесконечным видом на панораму города.",
    a3_name: "Fine Dining 'Chorsu Gold'", a3_desc: "Симфония национальных и европейских вкусов в исполнении шеф-поваров.",
    a4_name: "Элитный консьерж 24/7", a4_desc: "Индивидуальный подход, VIP-трансфер и выполнение любых пожеланий.",
    gal_eyebrow: "Визуальная история", gal_title: "Проблески роскоши",
    test_eyebrow: "Отзывы гостей", test_title: "Истории совершенства",
    t1: '"Замечательный отель! Уровень заботы персонала превзошёл все ожидания. Блюда в Chorsu Gold — настоящее искусство."',
    t2: '"Лучшая роскошная резиденция в Ташкенте. Всё очень тихо, приватно и исключительно элегантно."',
    t3: '"Президентский люкс был феноменальным. Личный дворецкий и спа — выше всяких похвал."',
    loc_eyebrow: "Сердце Ташкента", loc_title: "Престижное расположение", loc_addr_label: "Наш адрес", loc_phone_label: "Телефон", loc_email_label: "Электронная почта",
    cont_eyebrow: "Свяжитесь с нами", cont_title: "Чем мы можем помочь вам?",
    tg_desc: "Быстрые вопросы? Напишите нашему менеджеру в Telegram, ответ в течение 5 минут.", tg_btn: "Открыть чат",
    wa_desc: "Наши телефонные линии доступны круглосуточно для поддержки ваших запросов.", wa_btn: "Открыть WhatsApp",
    book_eyebrow: "Планируйте ваш отдых", book_title: "Гарантированное бронирование",
    f_name: "Полное имя *", f_phone: "Телефон *", f_email: "Эл. почта (необязательно)", f_checkin: "Дата заезда *", f_checkout: "Дата выезда *",
    f_room: "Тип номера *", f_guests: "Гости *", f_payment: "Способ оплаты *", f_req: "Особые пожелания",
    f_submit: "Подтвердить бронирование", f_submitting: "Оформление...",
    footer_tag: "Гармоничное слияние исторического наследия Ташкента и современной первоклассной роскоши.",
    footer_explore: "Исследовать", footer_legal: "Юридическая информация",
    footer_copy: "© 2026 Все права защищены. Отель Ташкент.",
    msg_success: "✅ Ваш номер успешно зарегистрирован! Наш консьерж свяжется с вами в ближайшее время.",
    msg_error: "❌ Ошибка. Напишите нам в WhatsApp или Telegram.",
    msg_fill: "⚠️ Пожалуйста, корректно заполните все обязательные поля."
  }
};

interface WebsiteProps {
  hotelData: HotelData;
  setHotelData: React.Dispatch<React.SetStateAction<HotelData>>;
  navigateToAdmin: () => void;
}

// Birds Animation component using ResizeObserver
const BirdsCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    const resize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth;
        canvasRef.current.height = containerRef.current.clientHeight;
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      resize();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    resize();

    const GROUPS = [
      { color: "#E8D5B0", count: 8 },
      { color: "#C9A96E", count: 8 },
      { color: "#ffffff", count: 8 },
      { color: "#a8c4e0", count: 6 }
    ];

    class Bird {
      color: string;
      x!: number;
      y!: number;
      speed!: number;
      scale!: number;
      wingPhase!: number;
      wingSpeed!: number;
      wobble!: number;
      wobbleAmp!: number;
      wobbleSpd!: number;
      opacity!: number;

      constructor(color: string) {
        this.color = color;
        this.reset(true);
      }

      reset(init: boolean) {
        const width = canvas ? canvas.width : 1000;
        this.x = init ? Math.random() * (width + 200) : -60;
        this.y = init ? Math.random() * 400 + 50 : Math.random() * 400 + 50;
        this.speed = 0.5 + Math.random() * 1.0;
        this.scale = 0.35 + Math.random() * 0.45;
        this.wingPhase = Math.random() * Math.PI * 2;
        this.wingSpeed = 0.05 + Math.random() * 0.05;
        this.wobble = Math.random() * Math.PI * 2;
        this.wobbleAmp = 0.2 + Math.random() * 0.4;
        this.wobbleSpd = 0.01 + Math.random() * 0.01;
        this.opacity = 0.35 + Math.random() * 0.4;
      }

      update() {
        const width = canvas ? canvas.width : 1000;
        this.x += this.speed;
        this.wobble += this.wobbleSpd;
        this.y += Math.sin(this.wobble) * this.wobbleAmp;
        this.wingPhase += this.wingSpeed;
        if (this.x > width + 80) {
          this.reset(false);
        }
      }

      draw(c: CanvasRenderingContext2D) {
        const s = this.scale;
        const flap = Math.sin(this.wingPhase) * 10 * s;
        c.save();
        c.translate(this.x, this.y);
        c.globalAlpha = this.opacity;
        c.strokeStyle = this.color;
        c.lineWidth = 1.2 * s;
        c.lineCap = "round";
        
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(-14 * s, flap - 2 * s, -28 * s, flap + 3 * s);
        c.stroke();
        
        c.beginPath();
        c.moveTo(0, 0);
        c.quadraticCurveTo(14 * s, flap - 2 * s, 28 * s, flap + 3 * s);
        c.stroke();
        
        c.beginPath();
        c.arc(0, 0, 1.5 * s, 0, Math.PI * 2);
        c.fillStyle = this.color;
        c.fill();
        c.restore();
      }
    }

    const birds = GROUPS.flatMap(g => Array.from({ length: g.count }, () => new Bird(g.color)));

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      birds.forEach(b => {
        b.update();
        b.draw(ctx);
      });
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full pointer-events-none z-10">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export const Website: React.FC<WebsiteProps> = ({ hotelData, setHotelData, navigateToAdmin }) => {
  const [lang, setLang] = useState<"en" | "uz" | "ru">("en");
  const t = i18n[lang];

  // Booking Form State
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    guests: "2 guests",
    roomType: "",
    payment: "Visa International Card",
    checkin: "",
    checkout: "",
    note: ""
  });

  const [formStatus, setFormStatus] = useState<{ type: "success" | "error" | ""; message: string }>({
    type: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status Banner state from admin
  const isClosed = hotelData.hotel_status === "closed";
  const isFullyBooked = hotelData.hotel_status === "busy";

  // Check availability for a specific prefix (room type)
  const isRoomTypeAvailable = (prefix: string) => {
    if (isClosed) return false;
    const freeCount = Object.entries(hotelData.roomStatus).filter(
      ([k, v]) => k.startsWith(prefix) && v === "available"
    ).length;
    return freeCount > 0;
  };

  // Quick reservation handler from room cards
  const handleSelectRoom = (roomLabel: string) => {
    setFormData(prev => ({
      ...prev,
      roomType: roomLabel
    }));
    document.getElementById("booking")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const sendBooking = async () => {
    const { name, phone, email, checkin, checkout, roomType, guests, payment, note } = formData;

    if (!name.trim() || !phone.trim() || !checkin || !checkout || !roomType) {
      setFormStatus({
        type: "error",
        message: t.msg_fill
      });
      return;
    }

    setIsSubmitting(true);
    setFormStatus({ type: "", message: "" });

    // Format message to send to Telegram (NexWeb team default in original html)
    const TG_TOKEN = "8887157796:AAFzNDoL_Bgv39SnwCG0UEMxOHH7QucXd8I";
    const TG_CHAT = "5908184363";
    const messageText = `🏨 NEW BOOKING REQUEST\n\n👤 Name: ${name}\n📞 Phone: ${phone}\n📧 Email: ${email || "—"}\n📅 Check-in: ${checkin}\n📅 Check-out: ${checkout}\n🛏 Room: ${roomType}\n👥 Guests: ${guests}\n💳 Payment: ${payment}${note ? "\n💬 Note: " + note : ""}\n🌐 Lang: ${lang.toUpperCase()}\n⏰ ${new Date().toLocaleString()}`;

    try {
      const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TG_CHAT, text: messageText })
      });
      const data = await res.json();
      
      // Update our local shared hotelData state as well (Even if Telegram fails, we keep a copy!)
      const updatedBookings = [...hotelData.bookings];
      updatedBookings.push({
        name,
        email,
        phone,
        checkin,
        checkout,
        room: roomType,
        guests,
        payment: payment.toLowerCase().includes("visa") ? "visa" : payment.toLowerCase().includes("uzcard") ? "uzcard" : "cash",
        note,
        time: new Date().toLocaleString(),
        status: "pending"
      });

      const updatedData = {
        ...hotelData,
        bookings: updatedBookings
      };

      setHotelData(syncAndSaveHotelData(updatedData));

      setFormStatus({
        type: "success",
        message: t.msg_success
      });

      // Clear Form
      setFormData({
        name: "",
        phone: "",
        email: "",
        guests: "2 guests",
        roomType: "",
        payment: "Visa International Card",
        checkin: "",
        checkout: "",
        note: ""
      });

    } catch (e) {
      setFormStatus({
        type: "error",
        message: t.msg_error
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Record a visit when landing on the page
  useEffect(() => {
    const d = { ...hotelData };
    const todayStr = new Date().toDateString();
    
    if (!d.visits) {
      d.visits = { total: 0, today: 0, yesterday: 0, week: 0, bestDay: "—", lastDate: "" };
    }
    
    if (d.visits.lastDate !== todayStr) {
      d.visits.yesterday = d.visits.today || 0;
      d.visits.today = 0;
      d.visits.lastDate = todayStr;
    }
    
    d.visits.total = (d.visits.total || 0) + 1;
    d.visits.today = (d.visits.today || 0) + 1;
    d.visits.week = (d.visits.week || 0) + 1;
    
    setHotelData(syncAndSaveHotelData(d));
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-[#F5F0E8] overflow-x-hidden font-sans select-none pb-0">
      
      {/* LANG BAR & ADMIN ACCESS */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 md:px-16 py-2 bg-[#0D0D0D]/95 border-b border-[#C9A96E]/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <button 
            onClick={navigateToAdmin} 
            className="flex items-center gap-1.5 px-3 py-1 text-xs uppercase tracking-widest text-[#C9A96E] border border-[#C9A96E]/20 hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-all rounded"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Panel</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setLang("en")} 
            className={`px-3 py-1 text-xs uppercase tracking-wider rounded font-medium border border-transparent transition-all ${lang === "en" ? "text-[#C9A96E] border-[#C9A96E]" : "text-[#8A8278] hover:text-[#F5F0E8] hover:border-[#C9A96E]/30"}`}
          >
            EN
          </button>
          <button 
            onClick={() => setLang("uz")} 
            className={`px-3 py-1 text-xs uppercase tracking-wider rounded font-medium border border-transparent transition-all ${lang === "uz" ? "text-[#C9A96E] border-[#C9A96E]" : "text-[#8A8278] hover:text-[#F5F0E8] hover:border-[#C9A96E]/30"}`}
          >
            UZ
          </button>
          <button 
            onClick={() => setLang("ru")} 
            className={`px-3 py-1 text-xs uppercase tracking-wider rounded font-medium border border-transparent transition-all ${lang === "ru" ? "text-[#C9A96E] border-[#C9A96E]" : "text-[#8A8278] hover:text-[#F5F0E8] hover:border-[#C9A96E]/30"}`}
          >
            RU
          </button>
        </div>
      </div>

      {/* HEADER STATUS BANNER */}
      {isClosed && (
        <div className="fixed top-[45px] left-1/2 -translate-x-1/2 z-40 bg-[#e53935] text-white px-8 py-2.5 text-xs font-semibold tracking-widest uppercase rounded shadow-2xl">
          Hotel is temporarily closed
        </div>
      )}
      {!isClosed && isFullyBooked && (
        <div className="fixed top-[45px] left-1/2 -translate-x-1/2 z-40 bg-amber-600 text-white px-8 py-2.5 text-xs font-semibold tracking-widest uppercase rounded shadow-2xl">
          All rooms are fully booked
        </div>
      )}

      {/* NAVIGATION BAR */}
      <nav className="fixed top-[42px] left-0 right-0 z-30 flex items-center justify-between px-4 md:px-16 py-4 bg-[#0D0D0D]/90 border-b border-[#C9A96E]/10 backdrop-blur-md">
        <a href="#" className="font-serif text-lg md:text-xl tracking-[0.18em] text-[#C9A96E] hover:text-[#E8D5B0] transition-colors">
          HOTEL TASHKENT
        </a>
        <ul className="hidden md:flex items-center gap-10">
          <li><a href="#rooms" className="text-xs uppercase tracking-widest text-[#F5F0E8]/75 hover:text-white transition-opacity font-medium">{t.nav_rooms}</a></li>
          <li><a href="#amenities" className="text-xs uppercase tracking-widest text-[#F5F0E8]/75 hover:text-white transition-opacity font-medium">{t.nav_amenities}</a></li>
          <li><a href="#gallery" className="text-xs uppercase tracking-widest text-[#F5F0E8]/75 hover:text-white transition-opacity font-medium">{t.nav_gallery}</a></li>
          <li><a href="#contact" className="text-xs uppercase tracking-widest text-[#F5F0E8]/75 hover:text-white transition-opacity font-medium">{t.nav_contact}</a></li>
        </ul>
        <a href="#booking" className="px-5 py-2 border border-[#C9A96E] text-[#C9A96E] text-xs font-medium uppercase tracking-widest hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-all rounded-sm">
          {t.nav_book}
        </a>
      </nav>

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background image & gradient overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 z-0"
          style={{ 
            backgroundImage: `linear-gradient(to bottom, rgba(13,13,13,0.65) 0%, rgba(13,13,13,0.5) 40%, rgba(13,13,13,0.85) 100%), url('https://images.unsplash.com/photo-1596386461350-326ccb383e9f?w=1800&q=85')` 
          }}
        />

        {/* Animated birds flight component */}
        <BirdsCanvas />

        <div className="relative z-20 text-center max-w-4xl px-6">
          <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-6 font-medium drop-shadow">
            {t.hero_eyebrow}
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light leading-none text-white mb-6 tracking-wide drop-shadow-xl">
            {lang === "en" ? (
              <>
                Heritage of<br />
                <span className="italic text-[#E8D5B0] font-normal">Refined</span><br />
                Elegance
              </>
            ) : lang === "uz" ? (
              <>
                Nozik hashamatning<br />
                <span className="italic text-[#E8D5B0] font-normal">merosiy</span><br />
                jozibasi
              </>
            ) : (
              <>
                Наследие<br />
                <span className="italic text-[#E8D5B0] font-normal">утончённой</span><br />
                роскоши
              </>
            )}
          </h1>
          <p className="text-sm md:text-base leading-relaxed text-[#F5F0E8]/90 max-w-lg mx-auto mb-10 drop-shadow">
            {t.hero_sub}
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="#rooms" className="px-8 py-3.5 bg-[#C9A96E] hover:bg-[#E8D5B0] text-[#0D0D0D] text-xs uppercase tracking-widest font-semibold transition-all rounded shadow-lg">
              {t.hero_btn1}
            </a>
            <a href="#amenities" className="px-8 py-3.5 bg-transparent border border-white/35 hover:border-[#C9A96E] hover:text-[#C9A96E] text-white text-xs uppercase tracking-widest font-semibold transition-all rounded">
              {t.hero_btn2}
            </a>
          </div>
        </div>

        {/* Scroll hint indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 text-[10px] tracking-[0.18em] uppercase z-20">
          <span>{t.scroll}</span>
          <div className="w-[1px] h-10 bg-white/40 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-white animate-pulse" style={{ animationDuration: "2s" }} />
          </div>
        </div>
      </section>

      {/* RECEPTION STATISTICS BAR */}
      <div className="bg-[#1A1814] py-10 px-6 md:px-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-y border-[#C9A96E]/20">
        <div className="border-r-0 md:border-r border-[#C9A96E]/15 last:border-0 py-2">
          <div className="font-serif text-3xl md:text-4xl text-[#C9A96E] font-light">15</div>
          <div className="text-[10px] tracking-widest uppercase text-[#8A8278] mt-1">{t.stat1}</div>
        </div>
        <div className="border-r-0 md:border-r border-[#C9A96E]/15 last:border-0 py-2">
          <div className="font-serif text-3xl md:text-4xl text-[#C9A96E] font-light">100%</div>
          <div className="text-[10px] tracking-widest uppercase text-[#8A8278] mt-1">{t.stat2}</div>
        </div>
        <div className="border-r-0 md:border-r border-[#C9A96E]/15 last:border-0 py-2">
          <div className="font-serif text-3xl md:text-4xl text-[#C9A96E] font-light">4.9 ★</div>
          <div className="text-[10px] tracking-widest uppercase text-[#8A8278] mt-1">{t.stat3}</div>
        </div>
        <div className="py-2">
          <div className="font-serif text-3xl md:text-4xl text-[#C9A96E] font-light">2012</div>
          <div className="text-[10px] tracking-widest uppercase text-[#8A8278] mt-1">{t.stat4}</div>
        </div>
      </div>

      {/* LUXURY ROOMS SECTION */}
      <section id="rooms" className="py-20 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-3">{t.rooms_eyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-white">{t.rooms_title}</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Presidential Royal Residence */}
          <div 
            onClick={() => handleSelectRoom("Presidential Royal Residence — $1200/night")}
            className="group relative h-[380px] md:h-[580px] md:row-span-2 overflow-hidden rounded cursor-pointer transition-all shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80" 
              alt="Presidential Suite"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.82] group-hover:brightness-[0.65] group-hover:scale-105 transition-all duration-500"
            />
            {/* Real-time availability indicator linked to Admin state */}
            <div className={`absolute top-4 left-4 text-[9px] uppercase tracking-widest px-3 py-1.5 rounded font-semibold text-white drop-shadow ${isRoomTypeAvailable("4") ? "bg-emerald-600/90" : "bg-rose-600/90"}`}>
              {isRoomTypeAvailable("4") ? t.room_avail : t.room_full}
            </div>
            <div className="absolute top-4 right-4 bg-[#C9A96E] text-[#0D0D0D] text-[9px] uppercase tracking-widest px-3 py-1.5 font-bold rounded shadow">
              {t.tag1}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#0D0D0D]/95 via-[#0D0D0D]/40 to-transparent">
              <h3 className="font-serif text-xl sm:text-2xl text-white group-hover:text-[#E8D5B0] transition-colors">{t.room1_name}</h3>
              <p className="text-xs text-[#C9A96E] mt-1.5">{t.room1_price}</p>
            </div>
          </div>

          {/* Tashkent Golden Penthouse */}
          <div 
            onClick={() => handleSelectRoom("Tashkent Golden Penthouse — $1300/night")}
            className="group relative h-[280px] overflow-hidden rounded cursor-pointer transition-all shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&q=80" 
              alt="Penthouse"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.82] group-hover:brightness-[0.65] group-hover:scale-105 transition-all duration-500"
            />
            <div className={`absolute top-4 left-4 text-[9px] uppercase tracking-widest px-3 py-1.5 rounded font-semibold text-white drop-shadow ${isRoomTypeAvailable("5") ? "bg-emerald-600/90" : "bg-rose-600/90"}`}>
              {isRoomTypeAvailable("5") ? t.room_avail : t.room_full}
            </div>
            <div className="absolute top-4 right-4 bg-[#C9A96E] text-[#0D0D0D] text-[9px] uppercase tracking-widest px-3 py-1.5 font-bold rounded shadow">
              {t.tag2}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#0D0D0D]/95 via-[#0D0D0D]/40 to-transparent">
              <h3 className="font-serif text-lg text-white group-hover:text-[#E8D5B0] transition-colors">{t.room2_name}</h3>
              <p className="text-xs text-[#C9A96E] mt-1">{t.room2_price}</p>
            </div>
          </div>

          {/* Executive Luxury Suite */}
          <div 
            onClick={() => handleSelectRoom("Executive Luxury Suite — $450/night")}
            className="group relative h-[280px] overflow-hidden rounded cursor-pointer transition-all shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80" 
              alt="Executive Suite"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.82] group-hover:brightness-[0.65] group-hover:scale-105 transition-all duration-500"
            />
            <div className={`absolute top-4 left-4 text-[9px] uppercase tracking-widest px-3 py-1.5 rounded font-semibold text-white drop-shadow ${isRoomTypeAvailable("3") ? "bg-emerald-600/90" : "bg-rose-600/90"}`}>
              {isRoomTypeAvailable("3") ? t.room_avail : t.room_full}
            </div>
            <div className="absolute top-4 right-4 bg-[#C9A96E] text-[#0D0D0D] text-[9px] uppercase tracking-widest px-3 py-1.5 font-bold rounded shadow">
              {t.tag3}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#0D0D0D]/95 via-[#0D0D0D]/40 to-transparent">
              <h3 className="font-serif text-lg text-white group-hover:text-[#E8D5B0] transition-colors">{t.room3_name}</h3>
              <p className="text-xs text-[#C9A96E] mt-1">{t.room3_price}</p>
            </div>
          </div>

          {/* Deluxe King Room */}
          <div 
            onClick={() => handleSelectRoom("Deluxe King Room — $180/night")}
            className="group relative h-[280px] overflow-hidden rounded cursor-pointer transition-all shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80" 
              alt="Deluxe Room"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.82] group-hover:brightness-[0.65] group-hover:scale-105 transition-all duration-500"
            />
            <div className={`absolute top-4 left-4 text-[9px] uppercase tracking-widest px-3 py-1.5 rounded font-semibold text-white drop-shadow ${isRoomTypeAvailable("1") ? "bg-emerald-600/90" : "bg-rose-600/90"}`}>
              {isRoomTypeAvailable("1") ? t.room_avail : t.room_full}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#0D0D0D]/95 via-[#0D0D0D]/40 to-transparent">
              <h3 className="font-serif text-lg text-white group-hover:text-[#E8D5B0] transition-colors">{t.room4_name}</h3>
              <p className="text-xs text-[#C9A96E] mt-1">{t.room4_price}</p>
            </div>
          </div>

          {/* Family Comfort Suite */}
          <div 
            onClick={() => handleSelectRoom("Family Comfort Suite — $320/night")}
            className="group relative h-[280px] overflow-hidden rounded cursor-pointer transition-all shadow-2xl"
          >
            <img 
              src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80" 
              alt="Family Suite"
              className="absolute inset-0 w-full h-full object-cover brightness-[0.82] group-hover:brightness-[0.65] group-hover:scale-105 transition-all duration-500"
            />
            <div className={`absolute top-4 left-4 text-[9px] uppercase tracking-widest px-3 py-1.5 rounded font-semibold text-white drop-shadow ${isRoomTypeAvailable("2") ? "bg-emerald-600/90" : "bg-rose-600/90"}`}>
              {isRoomTypeAvailable("2") ? t.room_avail : t.room_full}
            </div>
            <div className="absolute top-4 right-4 bg-[#C9A96E] text-[#0D0D0D] text-[9px] uppercase tracking-widest px-3 py-1.5 font-bold rounded shadow">
              {t.tag4}
            </div>
            <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-[#0D0D0D]/95 via-[#0D0D0D]/40 to-transparent">
              <h3 className="font-serif text-lg text-white group-hover:text-[#E8D5B0] transition-colors">{t.room5_name}</h3>
              <p className="text-xs text-[#C9A96E] mt-1">{t.room5_price}</p>
            </div>
          </div>
        </div>
      </section>

      {/* AMENITIES SECTION */}
      <section id="amenities" className="bg-[#1A1814] py-20 px-6 md:px-16 border-t border-b border-[#C9A96E]/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-3">{t.amen_eyebrow}</p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-white">{t.amen_title}</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-8 border border-[#C9A96E]/15 hover:border-[#C9A96E]/50 rounded-sm bg-[#0D0D0D]/40 transition-all">
              <div className="text-3xl mb-4">🌊</div>
              <h3 className="font-serif text-lg text-white mb-2">{t.a1_name}</h3>
              <p className="text-xs text-[#8A8278] leading-relaxed">{t.a1_desc}</p>
            </div>
            <div className="text-center p-8 border border-[#C9A96E]/15 hover:border-[#C9A96E]/50 rounded-sm bg-[#0D0D0D]/40 transition-all">
              <div className="text-3xl mb-4">✨</div>
              <h3 className="font-serif text-lg text-white mb-2">{t.a2_name}</h3>
              <p className="text-xs text-[#8A8278] leading-relaxed">{t.a2_desc}</p>
            </div>
            <div className="text-center p-8 border border-[#C9A96E]/15 hover:border-[#C9A96E]/50 rounded-sm bg-[#0D0D0D]/40 transition-all">
              <div className="text-3xl mb-4">🍽️</div>
              <h3 className="font-serif text-lg text-white mb-2">{t.a3_name}</h3>
              <p className="text-xs text-[#8A8278] leading-relaxed">{t.a3_desc}</p>
            </div>
            <div className="text-center p-8 border border-[#C9A96E]/15 hover:border-[#C9A96E]/50 rounded-sm bg-[#0D0D0D]/40 transition-all">
              <div className="text-3xl mb-4">🎩</div>
              <h3 className="font-serif text-lg text-white mb-2">{t.a4_name}</h3>
              <p className="text-xs text-[#8A8278] leading-relaxed">{t.a4_desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section id="gallery" className="py-20 px-6 md:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-3">{t.gal_eyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-white">{t.gal_title}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="overflow-hidden rounded h-[250px] lg:h-[350px] lg:col-span-2 shadow-lg">
            <img src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80" alt="Lobby" className="w-full h-full object-cover brightness-75 hover:brightness-100 hover:scale-[1.03] transition-all duration-700" />
          </div>
          <div className="overflow-hidden rounded h-[250px] shadow-lg">
            <img src="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80" alt="Pool" className="w-full h-full object-cover brightness-75 hover:brightness-100 hover:scale-[1.03] transition-all duration-700" />
          </div>
          <div className="overflow-hidden rounded h-[250px] shadow-lg">
            <img src="https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&q=80" alt="Spa" className="w-full h-full object-cover brightness-75 hover:brightness-100 hover:scale-[1.03] transition-all duration-700" />
          </div>
          <div className="overflow-hidden rounded h-[250px] shadow-lg">
            <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80" alt="Restaurant" className="w-full h-full object-cover brightness-75 hover:brightness-100 hover:scale-[1.03] transition-all duration-700" />
          </div>
          <div className="overflow-hidden rounded h-[250px] shadow-lg">
            <img src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80" alt="Lounge" className="w-full h-full object-cover brightness-75 hover:brightness-100 hover:scale-[1.03] transition-all duration-700" />
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="bg-[#1A1814] py-20 px-6 md:px-16 border-t border-b border-[#C9A96E]/10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-3">{t.test_eyebrow}</p>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light text-white">{t.test_title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 border border-[#C9A96E]/10 bg-[#0D0D0D]/30 rounded">
              <div className="text-amber-500 text-sm mb-4">★★★★★</div>
              <p className="font-serif text-base italic text-[#F5F0E8] leading-relaxed mb-6">{t.t1}</p>
              <div className="text-[10px] uppercase tracking-widest text-[#8A8278] font-semibold">— Jasur B. (Uzbekistan)</div>
            </div>
            <div className="p-8 border border-[#C9A96E]/10 bg-[#0D0D0D]/30 rounded">
              <div className="text-amber-500 text-sm mb-4">★★★★★</div>
              <p className="font-serif text-base italic text-[#F5F0E8] leading-relaxed mb-6">{t.t2}</p>
              <div className="text-[10px] uppercase tracking-widest text-[#8A8278] font-semibold">— Dr. Richard S. (United Kingdom)</div>
            </div>
            <div className="p-8 border border-[#C9A96E]/10 bg-[#0D0D0D]/30 rounded">
              <div className="text-amber-500 text-sm mb-4">★★★★★</div>
              <p className="font-serif text-base italic text-[#F5F0E8] leading-relaxed mb-6">{t.t3}</p>
              <div className="text-[10px] uppercase tracking-widest text-[#8A8278] font-semibold">— Olga V. (Kazakhstan)</div>
            </div>
          </div>
        </div>
      </section>

      {/* GEOLOCATION / PRIME LOCATION SECTION */}
      <section id="location" className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        <div className="bg-[#1F1C16] p-10 md:p-20 flex flex-col justify-center">
          <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-3">{t.loc_eyebrow}</p>
          <h2 className="font-serif text-3xl md:text-4xl font-light text-white mb-10">{t.loc_title}</h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <MapPin className="text-[#C9A96E] w-5 h-5 flex-shrink-0 mt-1" />
              <div>
                <div className="text-[10px] tracking-widest uppercase text-[#8A8278] mb-1">{t.loc_addr_label}</div>
                <div className="text-sm text-[#F5F0E8]/85 font-medium">16 Sharaf Rashidov Street, Tashkent, Uzbekistan</div>
              </div>
            </div>
            <div className="flex gap-4">
              <Phone className="text-[#C9A96E] w-5 h-5 flex-shrink-0 mt-1" />
              <div>
                <div className="text-[10px] tracking-widest uppercase text-[#8A8278] mb-1">{t.loc_phone_label}</div>
                <div className="text-sm text-[#F5F0E8]/85 font-medium">+998 97 925 75 72</div>
              </div>
            </div>
            <div className="flex gap-4">
              <Mail className="text-[#C9A96E] w-5 h-5 flex-shrink-0 mt-1" />
              <div>
                <div className="text-[10px] tracking-widest uppercase text-[#8A8278] mb-1">{t.loc_email_label}</div>
                <div className="text-sm text-[#F5F0E8]/85 font-medium">info@hoteltashkent.uz</div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative min-h-[300px] lg:min-h-full bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80')" }}>
          <div className="absolute inset-0 bg-[#0D0D0D]/30 flex items-center justify-center">
            <div className="bg-[#C9A96E] text-[#0D0D0D] px-6 py-3 text-xs uppercase tracking-widest font-semibold rounded shadow-xl">
              HOTEL TASHKENT ★★★★★
            </div>
          </div>
        </div>
      </section>

      {/* CHANNELS CONTACT SECTION */}
      <section id="contact" className="bg-[#1A1814] py-20 px-6 md:px-16 border-t border-b border-[#C9A96E]/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-3">{t.cont_eyebrow}</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-light text-white">{t.cont_title}</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <a href="https://t.me/nexweb_uz" target="_blank" rel="noreferrer" className="flex flex-col items-center text-center p-8 border border-[#C9A96E]/15 hover:border-[#C9A96E] bg-[#0D0D0D]/45 rounded transition-all group">
              <div className="text-4xl mb-4">✈️</div>
              <h3 className="font-serif text-lg text-white mb-2">Telegram Concierge</h3>
              <p className="text-[#C9A96E] text-xs font-medium mb-3">@nexweb_uz</p>
              <p className="text-xs text-[#8A8278] leading-relaxed mb-6 max-w-xs">{t.tg_desc}</p>
              <span className="px-5 py-2 border border-[#C9A96E] text-[#C9A96E] text-[10px] font-bold uppercase tracking-widest rounded group-hover:bg-[#C9A96E] group-hover:text-[#0D0D0D] transition-all">
                {t.tg_btn}
              </span>
            </a>
            <a href="https://wa.me/998979257572" target="_blank" rel="noreferrer" className="flex flex-col items-center text-center p-8 border border-[#C9A96E]/15 hover:border-[#25D366] bg-[#0D0D0D]/45 rounded transition-all group">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="font-serif text-lg text-white mb-2">WhatsApp Support</h3>
              <p className="text-emerald-500 text-xs font-medium mb-3">+998 97 925 75 72</p>
              <p className="text-xs text-[#8A8278] leading-relaxed mb-6 max-w-xs">{t.wa_desc}</p>
              <span className="px-5 py-2 border border-emerald-500 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded group-hover:bg-[#25D366] group-hover:text-[#0D0D0D] transition-all">
                {t.wa_btn}
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* BOOKING RESERVATION FORM */}
      <section id="booking" className="py-20 px-6 md:px-16 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs tracking-[0.28em] uppercase text-[#C9A96E] mb-3">{t.book_eyebrow}</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-white">{t.book_title}</h2>
        </div>

        <div className="bg-[#1A1814] border border-[#C9A96E]/20 rounded p-6 sm:p-10 shadow-2xl">
          {formStatus.message && (
            <div className={`mb-6 p-4 text-xs tracking-wide rounded border text-center ${formStatus.type === "success" ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30" : "bg-rose-950/40 text-rose-400 border-rose-500/30"}`}>
              {formStatus.message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="name">{t.f_name}</label>
              <input id="name" type="text" value={formData.name} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded" placeholder="John Doe" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="phone">{t.f_phone}</label>
              <input id="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded" placeholder="+998 90 123 45 67" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="email">{t.f_email}</label>
              <input id="email" type="email" value={formData.email} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded" placeholder="john@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="guests">{t.f_guests}</label>
              <select id="guests" value={formData.guests} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded cursor-pointer">
                <option value="1 guest">1 Person</option>
                <option value="2 guests">2 Persons</option>
                <option value="3 guests">3 Persons</option>
                <option value="4 guests">4 Persons</option>
                <option value="5+ guests">Suite Exclusive (5+)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="roomType">{t.f_room}</label>
              <select id="roomType" value={formData.roomType} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded cursor-pointer">
                <option value="">Select room type</option>
                {ROOM_TYPES.map(r => (
                  <option key={r.key} value={`${r.label} — $${r.price}/night`}>
                    {r.label} — ${r.price}/night
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="payment">{t.f_payment}</label>
              <select id="payment" value={formData.payment} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded cursor-pointer">
                <option value="Visa International Card">Visa International Card</option>
                <option value="Uzcard / Humo">Uzcard / Humo Direct</option>
                <option value="Cash on arrival">Cash on arrival / Local Bank Transfer</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mb-6 flex-wrap">
            <span className="flex items-center gap-1 bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3 py-1 text-[10px] text-[#8A8278] rounded-sm">
              💳 Visa **** **** **** 1234
            </span>
            <span className="flex items-center gap-1 bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3 py-1 text-[10px] text-[#8A8278] rounded-sm">
              🏦 Uzcard / Humo
            </span>
            <span className="flex items-center gap-1 bg-[#C9A96E]/10 border border-[#C9A96E]/20 px-3 py-1 text-[10px] text-[#8A8278] rounded-sm">
              💵 Cash
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="checkin">{t.f_checkin}</label>
              <input id="checkin" type="date" value={formData.checkin} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="checkout">{t.f_checkout}</label>
              <input id="checkout" type="date" value={formData.checkout} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 mb-6">
            <label className="text-[10px] tracking-widest uppercase text-[#8A8278]" htmlFor="note">{t.f_req}</label>
            <textarea id="note" value={formData.note} onChange={handleInputChange} className="bg-[#0D0D0D] border border-[#C9A96E]/20 text-[#F5F0E8] p-3 text-xs outline-none focus:border-[#C9A96E] transition-all rounded min-h-[100px] resize-y" placeholder="Example: Airport transfer, extra bed, vegan dining options." />
          </div>

          <button 
            onClick={sendBooking}
            disabled={isSubmitting || isClosed}
            className="w-full bg-[#C9A96E] hover:bg-[#E8D5B0] disabled:bg-[#8A8278]/40 disabled:cursor-not-allowed text-[#0D0D0D] text-xs font-semibold uppercase tracking-widest py-4 rounded shadow-xl transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.f_submitting}</span>
              </>
            ) : (
              <span>{t.f_submit}</span>
            )}
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#090909] py-16 px-6 md:px-16 border-t border-[#C9A96E]/15">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <span className="font-serif text-[#C9A96E] text-lg tracking-[0.18em] block mb-4">HOTEL TASHKENT</span>
            <p className="text-xs text-[#8A8278] leading-relaxed max-w-xs">{t.footer_tag}</p>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.22em] text-[#C9A96E] mb-5">{t.footer_explore}</h4>
            <ul className="space-y-3">
              <li><a href="#rooms" className="text-xs text-[#8A8278] hover:text-[#F5F0E8] transition-colors">{t.nav_rooms}</a></li>
              <li><a href="#amenities" className="text-xs text-[#8A8278] hover:text-[#F5F0E8] transition-colors">{t.nav_amenities}</a></li>
              <li><a href="#gallery" className="text-xs text-[#8A8278] hover:text-[#F5F0E8] transition-colors">{t.nav_gallery}</a></li>
              <li><a href="#contact" className="text-xs text-[#8A8278] hover:text-[#F5F0E8] transition-colors">{t.nav_contact}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.22em] text-[#C9A96E] mb-5">{t.footer_legal}</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-xs text-[#8A8278] hover:text-[#F5F0E8] transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-xs text-[#8A8278] hover:text-[#F5F0E8] transition-colors">Terms of Service</a></li>
              <li><a href="#" className="text-xs text-[#8A8278] hover:text-[#F5F0E8] transition-colors">Registration Info</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[10px] uppercase tracking-[0.22em] text-[#C9A96E] mb-5">System Access</h4>
            <button 
              onClick={navigateToAdmin}
              className="flex items-center gap-1 px-4 py-2 text-[10px] tracking-widest uppercase border border-[#C9A96E]/20 text-[#C9A96E] hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-all rounded-sm"
            >
              🔒 Admin Dashboard
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#8A8278]">
          <div>{t.footer_copy}</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#F5F0E8] transition-colors">Instagram</a>
            <a href="#" className="hover:text-[#F5F0E8] transition-colors">Facebook</a>
            <a href="https://t.me/nexweb_uz" className="hover:text-[#F5F0E8] transition-colors">Telegram</a>
          </div>
        </div>
      </footer>

      {/* FLOAT SHORTCUT CONTACT BUTTONS */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <a href="https://t.me/nexweb_uz" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#229ED9] text-white flex items-center justify-center text-xl shadow-2xl hover:scale-110 transition-transform">
          ✈️
        </a>
        <a href="https://wa.me/998979257572" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center text-xl shadow-2xl hover:scale-110 transition-transform">
          💬
        </a>
      </div>
    </div>
  );
};
