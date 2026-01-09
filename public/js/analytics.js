import { db } from "./firebase.js";
import { collection, addDoc, serverTimestamp } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export async function logAnalyticsEvent(section) {
  try {
    await addDoc(collection(db, "analytics"), {
      section,
      timestamp: serverTimestamp()
    });
  } catch {
    // silent fail (public-safe)
  }
}
