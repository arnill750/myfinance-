import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// Firebase Console > Project settings > Your apps > Web app > Config
const firebaseConfig = {
  apiKey: firebaseConfig = {
  apiKey: "AIzaSyA-fir_5x_ZtGd2nUHGSsaZMOzHbeJCHMc",
  authDomain: "my-finance-360a0.firebaseapp.com",
  projectId: "my-finance-360a0",
  storageBucket: "my-finance-360a0.firebasestorage.app",
  messagingSenderId: "931633935421",
  appId: "1:931633935421:web:bdf88de5a5279124cd2654",
  measurementId: "G-QNDBRXHW54"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const $ = id => document.getElementById(id);
let currentUser = null;
let lang = "bn";
const money = n => "৳" + Number(n || 0).toLocaleString("en-BD", {maximumFractionDigits:2});
const userCol = name => collection(db, "users", currentUser.uid, name);
const today = new Date().toISOString().slice(0,10);
$("date").value = today;

$("login-btn").addEventListener("click", async () => {
  $("login-status").textContent = "লগইন হচ্ছে...";
  try { await signInWithPopup(auth, provider); }
  catch(e) {
    if (["auth/popup-blocked","auth/operation-not-supported-in-this-environment"].includes(e.code)) {
      await signInWithRedirect(auth, provider);
    } else $("login-status").textContent = "লগইন হয়নি: " + e.message;
  }
});
getRedirectResult(auth).catch(e => $("login-status").textContent = e.message);
$("logout-btn").addEventListener("click", () => signOut(auth));
onAuthStateChanged(auth, async user => {
  currentUser = user;
  $("login-panel").hidden = !!user;
  $("app-panel").hidden = !user;
  if (user) {
    $("display-name").textContent = user.displayName || user.email || "ব্যবহারকারী";
    $("user-label").textContent = user.email || "";
    await refreshAll();
  }
});

$("transaction-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!currentUser) return;
  const amount = Number($("amount").value);
  if (!(amount > 0)) return;
  try {
    await addDoc(userCol("transactions"), {
      type: $("type").value, category: $("category").value.trim(),
      amount, date: $("date").value, note: $("note").value.trim(),
      createdAt: serverTimestamp()
    });
    $("transaction-form").reset(); $("date").value = today;
    $("form-status").textContent = "সেভ হয়েছে।";
    await refreshAll();
  } catch(e) { $("form-status").textContent = "সেভ হয়নি: " + e.message; }
});

$("saving-form").addEventListener("submit", async e => {
  e.preventDefault();
  try {
    await addDoc(userCol("savingsGoals"), {
      name: $("saving-name").value.trim(), target: Number($("saving-target").value),
      current: Number($("saving-current").value), createdAt: serverTimestamp()
    });
    e.target.reset(); $("saving-current").value = 0; await refreshSavings();
  } catch(e) { alert("সেভ হয়নি: " + e.message); }
});
$("loan-form").addEventListener("submit", async e => {
  e.preventDefault();
  const total=Number($("loan-total").value), paid=Number($("loan-paid").value);
  if (paid > total) return alert("পরিশোধের পরিমাণ মোট ঋণের চেয়ে বেশি হতে পারবে না।");
  try {
    await addDoc(userCol("loans"), {
      name:$("loan-name").value.trim(), total, installment:Number($("loan-installment").value),
      paid, remaining:total-paid, createdAt:serverTimestamp()
    });
    e.target.reset(); $("loan-installment").value=0; $("loan-paid").value=0; await refreshLoans();
  } catch(e) { alert("সেভ হয়নি: " + e.message); }
});

async function readRows(name) {
  const snap = await getDocs(query(userCol(name), orderBy("createdAt","desc")));
  return snap.docs.map(d => ({id:d.id,...d.data()}));
}
async function refreshAll() { await Promise.all([refreshTransactions(),refreshSavings(),refreshLoans()]); }
async function refreshTransactions() {
  const rows=await readRows("transactions");
  const month=today.slice(0,7);
  const inc=rows.filter(x=>x.type==="income" && (x.date||"").startsWith(month)).reduce((s,x)=>s+x.amount,0);
  const exp=rows.filter(x=>x.type!=="income" && (x.date||"").startsWith(month)).reduce((s,x)=>s+x.amount,0);
  $("income-total").textContent=money(inc); $("expense-total").textContent=money(exp); $("balance-total").textContent=money(inc-exp);
  $("history-list").innerHTML = rows.length ? rows.map(x=>`<div class="item"><div><b>${escapeHtml(x.category||"লেনদেন")}</b><small>${escapeHtml(x.date||"")} · ${escapeHtml(x.note||"")}</small></div><span class="amount">${x.type==="income"?"+":"−"}${money(x.amount)}</span></div>`).join("") : '<p class="muted">এখনো কোনো লেনদেন নেই।</p>';
}
async function refreshSavings() {
  const rows=await readRows("savingsGoals");
  $("saving-list").innerHTML=rows.length?rows.map(x=>`<div class="item"><div><b>${escapeHtml(x.name)}</b><small>${money(x.current)} / ${money(x.target)} · ${x.target?Math.min(100,Math.round(x.current/x.target*100)):0}%</small></div></div>`).join(""):'<p class="muted">এখনো কোনো সঞ্চয়ের লক্ষ্য নেই।</p>';
}
async function refreshLoans() {
  const rows=await readRows("loans");
  $("loan-list").innerHTML=rows.length?rows.map(x=>`<div class="item"><div><b>${escapeHtml(x.name)}</b><small>মোট ${money(x.total)} · পরিশোধ ${money(x.paid)}</small></div><span class="amount">বাকি ${money(x.remaining)}</span></div>`).join(""):'<p class="muted">এখনো কোনো লোন যোগ করা হয়নি।</p>';
}
function escapeHtml(s) { return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===btn));
  document.querySelectorAll(".tab-panel").forEach(x=>x.hidden=x.id!=="tab-"+btn.dataset.tab);
}));
$("lang-btn").addEventListener("click",()=>{alert("ইংরেজি ভাষার পূর্ণ অনুবাদ পরের সংস্করণে যোগ করা হবে।");});
