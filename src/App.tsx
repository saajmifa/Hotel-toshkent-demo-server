import { useState, useEffect } from "react";
import { HotelData } from "./types";
import { getInitialHotelData, fetchHotelDataFromServer, saveHotelDataToServer } from "./utils/storage";
import { Website } from "./components/Website";
import { AdminPanel } from "./components/AdminPanel";

export default function App() {
  const [page, setPage] = useState<"site" | "admin">(() => {
    // Check if URL hash indicates admin or if last visited was admin
    const hash = window.location.hash;
    if (hash === "#admin") return "admin";
    return "site";
  });

  const [hotelData, setHotelData] = useState<HotelData>(() => getInitialHotelData());

  // Interceptor for updating hotel data and sending changes to the server
  const handleUpdateHotelData = (newDataOrUpdater: HotelData | ((prev: HotelData) => HotelData)) => {
    setHotelData((prev) => {
      const resolved = typeof newDataOrUpdater === "function" ? newDataOrUpdater(prev) : newDataOrUpdater;
      saveHotelDataToServer(resolved);
      return resolved;
    });
  };

  // Fetch initial data on mount and set up regular polling
  useEffect(() => {
    fetchHotelDataFromServer().then((data) => {
      setHotelData(data);
    });

    const interval = setInterval(() => {
      fetchHotelDataFromServer().then((data) => {
        setHotelData(data);
      });
    }, 3000); // Poll every 3 seconds to keep multiple devices in sync

    return () => clearInterval(interval);
  }, []);

  // Listen to hash changes for easy address-bar navigation
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === "#admin") {
        setPage("admin");
      } else {
        setPage("site");
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const navigateToAdmin = () => {
    window.location.hash = "admin";
    setPage("admin");
  };

  const navigateToWebsite = () => {
    window.location.hash = "";
    setPage("site");
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#F5F0E8] select-none">
      {page === "site" ? (
        <Website 
          hotelData={hotelData} 
          setHotelData={handleUpdateHotelData as any} 
          navigateToAdmin={navigateToAdmin} 
        />
      ) : (
        <AdminPanel 
          hotelData={hotelData} 
          setHotelData={handleUpdateHotelData as any} 
          navigateToWebsite={navigateToWebsite} 
        />
      )}
    </div>
  );
}
