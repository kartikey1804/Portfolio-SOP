// public/js/auth.js
import { auth } from './firebase.js';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

const ADMIN_EMAIL = 'kartikeypandey1804@gmail.com';

const loginForm = document.getElementById('login-form');
const authSection = document.getElementById('auth');
const dashboard = document.getElementById('dashboard');
const logoutBtn = document.getElementById('logout-btn');

onAuthStateChanged(auth, user => {
  if (user && user.email === ADMIN_EMAIL) {
    authSection?.style.setProperty('display', 'none');
    dashboard?.style.setProperty('display', 'block');
  } else {
    authSection?.style.setProperty('display', 'block');
    dashboard?.style.setProperty('display', 'none');
    if (user) signOut(auth);
  }
});

loginForm?.addEventListener('submit', async e => {
  e.preventDefault();
  const email = loginForm.email.value.trim();
  const password = loginForm.password.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    loginForm.reset();
  } catch (err) {
    alert('Invalid credentials or not authorized');
  }
});

logoutBtn?.addEventListener('click', async () => {
  await signOut(auth);
});

export async function isAdminLoggedIn() {
  return new Promise(resolve => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      resolve(!!(user && user.email === ADMIN_EMAIL));
    });
  });
}
