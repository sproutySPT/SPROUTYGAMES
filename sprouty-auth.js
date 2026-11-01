/* ═══════════════════════════════════════════════════════════════
   🔐 sprouty-auth.js — 정새싹게임즈 공용 Firebase 모듈
   · index.html 과 모든 게임 페이지가 이 파일 하나를 같이 씁니다. (같은 도메인이라 로그인 상태도 같이 공유됨)
   · 번들러 없이 동작하도록 Firebase SDK 를 gstatic CDN 에서 바로 불러옵니다.

   ── 게임 페이지에서 쓰는 법 ─────────────────────────────────────
   <script type="module" src="sprouty-auth.js"></script>
   <script>
   document.addEventListener('DOMContentLoaded', async () => {
     const user = await SproutyAuth.ready;      // 로그인 안 했으면 null
     // 로그인이 꼭 필요한 게임이면:  const user = await SproutyAuth.requireLogin();
     // user.uid 는 계정마다 고유한 값 → 점수/저장 데이터의 주인 표시에 사용
   });
   </script>

   · SproutyAuth.user                 현재 로그인한 사용자 (없으면 null)
   · SproutyAuth.ready                처음 로그인 상태가 확인되면 완료되는 Promise
   · SproutyAuth.onUser(fn)           로그인/로그아웃 때마다 fn(user) 호출 (해제 함수를 돌려줌)
   · SproutyAuth.requireLogin()       로그인 안 했으면 메인 페이지 로그인 창으로 보냈다가, 로그인 후 이 페이지로 되돌려 줌
   · window 'sprouty-auth' 이벤트      e.detail.user
   ═══════════════════════════════════════════════════════════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-analytics.js";
import {
  getAuth, onAuthStateChanged,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, updateProfile, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCifbe_hRnfFEU7UF09-xeN97rP3onS1dE",
  authDomain: "sprouty-games.firebaseapp.com",
  projectId: "sprouty-games",
  storageBucket: "sprouty-games.firebasestorage.app",
  messagingSenderId: "259145148090",
  appId: "1:259145148090:web:4328ff5b117487c09dc483",
  measurementId: "G-T7Z6MZ5MD6"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 방문자 통계 (지원 안 하는 환경에서는 조용히 건너뜀)
isSupported().then(ok => { if(ok) getAnalytics(app); }).catch(() => {});

// ── 로그인 상태 ──
let current = null;
let known = false;
let resolveReady;
export const ready = new Promise(r => { resolveReady = r; });
const subs = new Set();

function emit(){
  subs.forEach(fn => { try{ fn(current); }catch(e){ console.warn('[sprouty-auth]', e); } });
  try{ window.dispatchEvent(new CustomEvent('sprouty-auth', { detail: { user: current } })); }catch(e){}
}

onAuthStateChanged(auth, u => {
  current = u;
  if(!known){ known = true; resolveReady(u); }
  emit();
});

export function getUser(){ return current; }

export function onUser(fn){
  subs.add(fn);
  if(known){ try{ fn(current); }catch(e){ console.warn('[sprouty-auth]', e); } }
  return () => subs.delete(fn);
}

export function nameOf(u){
  if(!u) return '';
  return u.displayName || (u.email ? u.email.split('@')[0] : 'player');
}

// ── 동작 ──
export async function signUp(email, password, nickname){
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if(nickname){
    try{ await updateProfile(cred.user, { displayName: nickname }); }catch(e){ console.warn('[sprouty-auth] nickname', e); }
  }
  current = auth.currentUser;   // 닉네임 저장은 상태 이벤트를 따로 안 쏘므로 직접 알림
  emit();
  return cred.user;
}
export async function logIn(email, password){
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}
export function logOut(){ return signOut(auth); }
export function resetPassword(email){ return sendPasswordResetEmail(auth, email); }

// 로그인이 필요한 페이지에서 호출: 로그인 상태면 user 를 돌려주고, 아니면 메인 로그인 창으로 보냈다가 돌아오게 함
export async function requireLogin(){
  await ready;
  if(auth.currentUser) return auth.currentUser;
  const next = location.pathname + location.search;
  location.href = '/?login=1&next=' + encodeURIComponent(next);
  return new Promise(() => {});
}

// ── 오류 코드 → 사람이 읽을 문구 ──
const MSG = {
  ko: {
    'auth/invalid-email': '이메일 형식이 올바르지 않아요.',
    'auth/missing-email': '이메일을 입력해 주세요.',
    'auth/missing-password': '비밀번호를 입력해 주세요.',
    'auth/weak-password': '비밀번호는 6자 이상이어야 해요.',
    'auth/email-already-in-use': '이미 가입된 이메일이에요. 로그인해 보세요.',
    'auth/invalid-credential': '이메일 또는 비밀번호가 맞지 않아요.',
    'auth/wrong-password': '이메일 또는 비밀번호가 맞지 않아요.',
    'auth/user-not-found': '이메일 또는 비밀번호가 맞지 않아요.',
    'auth/user-disabled': '사용이 중지된 계정이에요.',
    'auth/too-many-requests': '시도가 너무 많아요. 잠시 뒤에 다시 해 주세요.',
    'auth/network-request-failed': '네트워크 연결을 확인해 주세요.',
    'auth/operation-not-allowed': '이메일/비밀번호 로그인이 Firebase 콘솔에서 꺼져 있어요.',
    'auth/unauthorized-domain': '이 도메인이 Firebase 승인된 도메인에 등록되어 있지 않아요.',
    fallback: c => '문제가 생겼어요. (' + c + ')'
  },
  en: {
    'auth/invalid-email': 'That email address doesn\'t look right.',
    'auth/missing-email': 'Please enter your email.',
    'auth/missing-password': 'Please enter your password.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/email-already-in-use': 'That email is already registered. Try logging in.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'Wrong email or password.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/too-many-requests': 'Too many attempts. Please try again in a bit.',
    'auth/network-request-failed': 'Please check your network connection.',
    'auth/operation-not-allowed': 'Email/password sign-in is turned off in the Firebase console.',
    'auth/unauthorized-domain': 'This domain is not in Firebase\'s authorized domains.',
    fallback: c => 'Something went wrong. (' + c + ')'
  }
};
export function errorMessage(err, lang){
  const L = (lang || document.documentElement.lang) === 'en' ? 'en' : 'ko';
  const code = (err && err.code) || String(err || 'unknown');
  return MSG[L][code] || MSG[L].fallback(code);
}

// 모듈을 쓰지 않는 일반 <script> 에서도 쓸 수 있게 전역에 노출
window.SproutyAuth = {
  auth, ready, onUser, signUp, logIn, logOut, resetPassword, requireLogin, errorMessage, nameOf,
  get user(){ return current; }
};
