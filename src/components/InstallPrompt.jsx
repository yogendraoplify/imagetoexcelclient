import { useState, useEffect } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowBanner(false);
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm bg-white border border-[#D5E8FF] rounded-2xl shadow-xl px-4 py-4 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-[#EEF4FF] flex items-center justify-center shrink-0">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3v13M7 11l5 5 5-5"
            stroke="#4674AB"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 21h14"
            stroke="#4674AB"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800">Install CardScan Pro</p>
        <p className="text-xs text-gray-400 mt-0.5">Add to home screen for quick access</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => setShowBanner(false)}
          className="text-xs text-gray-400 font-medium px-2 py-1 hover:text-gray-600 transition"
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#4674AB] text-white hover:bg-[#3a5e8f] transition"
        >
          Install
        </button>
      </div>
    </div>
  );
}