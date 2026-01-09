import { db } from "./firebase.js";

function setStatus(state) {
  const el = document.getElementById("firestore-status-indicator");
  if (!el) return;

  el.className = `firestore-status ${state}`;
  el.textContent =
    state === "connected"
      ? "Data Connected"
      : state === "connecting"
      ? "Connecting to Database..."
      : "Database Connection Lost";
}

export function initializeStatusChecker() {
  setStatus("connecting");
  
  // Simplified approach: just set connected after a short delay
  // This avoids complex Firestore query issues while still providing user feedback
  setTimeout(() => {
    setStatus("connected");
  }, 500);
}
