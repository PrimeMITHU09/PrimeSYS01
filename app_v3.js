// --- TOAST NOTIFICATION SYSTEM ---
function showToast(message, type = "info") {
  // Remove existing toast if present
  const existing = document.getElementById("primeToast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "primeToast";
  toast.textContent = message;

  const colors = {
    success: { bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.35)", color: "#6ee7b7" },
    danger:  { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  color: "#fca5a5" },
    warning: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", color: "#fde68a" },
    info:    { bg: "rgba(99,102,241,0.12)", border: "rgba(99,102,241,0.35)", color: "#a5b4fc" }
  };
  const c = colors[type] || colors.info;

  Object.assign(toast.style, {
    position: "fixed",
    bottom: "28px",
    left: "50%",
    transform: "translateX(-50%) translateY(20px)",
    background: c.bg,
    border: `1px solid ${c.border}`,
    color: c.color,
    padding: "12px 24px",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: "500",
    zIndex: "9999",
    backdropFilter: "blur(16px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    maxWidth: "380px",
    textAlign: "center",
    lineHeight: "1.4",
    transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease",
    opacity: "0"
  });

  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  });

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// --- LOCAL STORAGE MANAGER ---
const STORAGE_KEY = "primeSysLocalData";

function getLocalData() {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : {
    displayName: "User",
    email: "user@primesys.live",
    notesList: {},
    calcHistory: [],
    profileDetails: {},
    todoList: [],
    bookmarks: [],
    themeSettings: { mode: "dark", accent: "#6366f1" },
    cloudSyncEnabled: false
  };
}

async function updateLocalData(updates) {
  const currentData = getLocalData();
  
  for (const key in updates) {
    if (typeof updates[key] === "object" && updates[key] !== null && !Array.isArray(updates[key])) {
      currentData[key] = { ...currentData[key], ...updates[key] };
    } else {
      currentData[key] = updates[key];
    }
  }

  // Save to LocalStorage immediately for snappy UI
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));

  // Sync to Firestore if enabled
  if (currentData.cloudSyncEnabled && typeof auth !== 'undefined' && auth.currentUser && typeof firestoreDb !== 'undefined') {
    try {
      await firestoreDb.collection("users").doc(auth.currentUser.uid).set(currentData);
    } catch (err) {
      console.error("Firebase Sync Error:", err);
    }
  }

  return currentData;
}

// --- STATE MANAGEMENT ---
let userNotes = {};
let activeNoteId = null;
let calculationHistory = [];

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyDAV8-1h-3dEuqH5CyDku94WnhlWO_jPwk",
  authDomain: "primesys01-243c6.firebaseapp.com",
  projectId: "primesys01-243c6",
  storageBucket: "primesys01-243c6.firebasestorage.app",
  messagingSenderId: "477710195302",
  appId: "1:477710195302:web:4589c5c2e6b5348c2baba7",
  measurementId: "G-4LL56D4LNR"
};

// Initialize Firebase
let auth, firestoreDb;
if (typeof firebase !== 'undefined') {
  firebase.initializeApp(firebaseConfig);
  auth = firebase.auth();
  firestoreDb = firebase.firestore();
}

// --- INITIALIZE APP ---
document.addEventListener("DOMContentLoaded", () => {
  const loginScreen = document.getElementById("firebaseLoginScreen");
  const dashboardMainContainer = document.getElementById("dashboardMainContainer");
  const googleSignInBtn = document.getElementById("googleSignInBtn");
  const emailSignInBtn = document.getElementById("emailSignInBtn");
  const emailSignUpBtn = document.getElementById("emailSignUpBtn");
  const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginStatus = document.getElementById("loginStatus");

  if (auth) {
    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // Logged In
        if (loginScreen) loginScreen.classList.add("hidden");
        
        let name = user.displayName;
        if (!name && user.email) {
          name = user.email.split('@')[0];
        }

        try {
          let dbData = getLocalData();
          
          if (typeof firestoreDb !== 'undefined') {
            try {
              const docRef = await firestoreDb.collection("users").doc(user.uid).get();
              if (docRef.exists) {
                const cloudData = docRef.data();
                if (cloudData.cloudSyncEnabled) {
                   dbData = cloudData;
                   localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData));
                   showToast("☁️ Data synced from Cloud", "info");
                }
              }
            } catch(syncErr) {
              console.error("Sync fetch error:", syncErr);
            }
          }
          
          dbData.displayName = name || "User";
          dbData.email = user.email || "";
          localStorage.setItem(STORAGE_KEY, JSON.stringify(dbData));

          if (dashboardMainContainer) dashboardMainContainer.classList.remove("hidden");
          initDashboardFeatures(dbData);
        } catch(e) {
          console.error("Error fetching cloud data:", e);
          const dbData = getLocalData();
          dbData.displayName = name || "User";
          dbData.email = user.email || "";
          if (dashboardMainContainer) dashboardMainContainer.classList.remove("hidden");
          initDashboardFeatures(dbData);
        }
      } else {
        // Logged Out
        if (loginScreen) loginScreen.classList.remove("hidden");
        if (dashboardMainContainer) dashboardMainContainer.classList.add("hidden");
      }
    });

    // Check for redirect errors (often caused by strict browser privacy settings blocking cross-site cookies)
    auth.getRedirectResult().catch((error) => {
      console.error("Redirect Error:", error);
      if (loginStatus) {
        loginStatus.textContent = "System Error: " + error.message + " (Try allowing cross-site cookies or use Email Login).";
      }
    });

    const googleLoginHelpModal = document.getElementById("googleLoginHelpModal");
    const googleHelpRetryBtn = document.getElementById("googleHelpRetryBtn");
    const googleHelpEmailBtn = document.getElementById("googleHelpEmailBtn");

    if (googleSignInBtn) {
      googleSignInBtn.addEventListener("click", () => {
        // Hide help modal if it was open
        if (googleLoginHelpModal) googleLoginHelpModal.classList.add("hidden");
        if (loginStatus) loginStatus.textContent = "Opening Google Sign-in...";
        
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.signInWithPopup(provider).catch(err => {
          console.error("Firebase Auth Error:", err);
          
          if (err.code === 'auth/popup-blocked') {
            if (loginStatus) loginStatus.textContent = "";
            if (googleLoginHelpModal) googleLoginHelpModal.classList.remove("hidden");
          } else {
            if (loginStatus) loginStatus.textContent = err.message;
          }
        });
      });
    }

    if (googleHelpRetryBtn) {
      googleHelpRetryBtn.addEventListener("click", () => {
        if (googleSignInBtn) googleSignInBtn.click();
      });
    }

    if (googleHelpEmailBtn) {
      googleHelpEmailBtn.addEventListener("click", () => {
        if (googleLoginHelpModal) googleLoginHelpModal.classList.add("hidden");
        if (loginEmail) loginEmail.focus();
      });
    }

    if (emailSignInBtn && emailSignUpBtn) {
      emailSignInBtn.addEventListener("click", () => {
        const email = loginEmail.value.trim();
        const pwd = loginPassword.value;
        if (!email || !pwd) {
          loginStatus.textContent = "Please enter email and password.";
          return;
        }
        loginStatus.textContent = "Signing in...";
        auth.signInWithEmailAndPassword(email, pwd).catch(err => {
          loginStatus.textContent = err.message;
        });
      });

      emailSignUpBtn.addEventListener("click", () => {
        const email = loginEmail.value.trim();
        const pwd = loginPassword.value;
        if (!email || !pwd) {
          loginStatus.textContent = "Please enter email and password to sign up.";
          return;
        }
        loginStatus.textContent = "Creating account...";
        auth.createUserWithEmailAndPassword(email, pwd).catch(err => {
          loginStatus.textContent = err.message;
        });
      });
    }
    
    if (forgotPasswordBtn) {
      forgotPasswordBtn.addEventListener("click", () => {
        const email = loginEmail.value.trim();
        if (!email) {
          loginStatus.textContent = "Enter your email address first, then click Forgot Password.";
          return;
        }
        loginStatus.textContent = "Sending reset link...";
        auth.sendPasswordResetEmail(email)
          .then(() => {
            loginStatus.style.color = "var(--primary-color)";
            loginStatus.textContent = "Password reset email sent! Check your inbox.";
            setTimeout(() => { loginStatus.style.color = "var(--danger-color)"; loginStatus.textContent = ""; }, 5000);
          })
          .catch(err => {
            loginStatus.textContent = err.message;
          });
      });
    }
  } else {
    // Fallback if Firebase not loaded
    if (loginScreen) loginScreen.classList.add("hidden");
    if (dashboardMainContainer) dashboardMainContainer.classList.remove("hidden");
    const dbData = getLocalData();
    initDashboardFeatures(dbData);
  }
});

// --- DASHBOARD CONTROLLER ---
async function initDashboardFeatures(userData) {
  // Make Logo Clickable to Refresh Page
  const dashboardLogo = document.getElementById("dashboardLogo");
  if (dashboardLogo) {
    dashboardLogo.addEventListener("click", () => {
      // Soft reset to Notepad tab instead of full page reload
      const notepadBtn = document.querySelector('.nav-item[data-tab="notepadTab"]');
      if (notepadBtn) {
        notepadBtn.click();
      }
      
      // Scroll to top to simulate a fresh page
      const contentPanel = document.querySelector('.content-panel');
      if (contentPanel) {
        contentPanel.scrollTo(0, 0);
      }
    });
  }

  const navItems = document.querySelectorAll(".nav-item");
  const tabContents = document.querySelectorAll(".tab-content");

  // Nav tab switching
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      navItems.forEach(n => n.classList.remove("active"));
      item.classList.add("active");

      tabContents.forEach(tab => tab.classList.add("hidden"));
      const targetTabId = item.getAttribute("data-tab");
      document.getElementById(targetTabId).classList.remove("hidden");
    });
  });

  // NEW: Root Sub-tab switching for Categories
  const rootSubTabBtns = document.querySelectorAll(".root-sub-tab-btn");
  rootSubTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const container = btn.parentElement;
      container.querySelectorAll(".root-sub-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      const parentContent = container.closest(".tab-content");
      if (parentContent) {
        parentContent.querySelectorAll(".root-sub-tab-pane").forEach(pane => pane.classList.add("hidden"));
      }
      
      const targetTabId = btn.getAttribute("data-subtab");
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) targetPane.classList.remove("hidden");
    });
  });

  // 1. PrimeON NOTEPAD MODULE
  initNotepadModule(userData);

  // 2. MULTI-MODE CALCULATOR MODULE
  initCalculatorHub(userData);

  // 3. DEVICE SYSTEM INFO MODULE
  initDeviceInfo();

  // 4. PROFILE SETTINGS MODULE
  initProfileSettings(userData);

  // 5. INIT NEW MODULES (NON-BLOCKING)
  initTimerModule();
  initConverterModule();
  initExpenseModule();
  initMusicModule();

  // New modules
  initThemeManager(userData);
  initTodoModule(userData);
  initBookmarkModule(userData);
  initAmbientSounds();
  initExportFunctions(userData);

  // 6. SILENT IP TRACKER & WEATHER
  fetchNetworkStatus().then(locData => {
    initWeatherModule(locData);
  });
}

async function fetchNetworkStatus() {
  let finalData = null;
  try {
    const res = await fetch("https://ipinfo.io/json");
    if (!res.ok) throw new Error("API Limit or Blocked");
    const data = await res.json();
    finalData = data;
    
    if (data && data.ip) {
      document.getElementById("networkIpText").textContent = data.ip;
      if (data.country) {
        const flag = data.country.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
        document.getElementById("networkFlag").textContent = flag;
      }
    }
  } catch (err) {
    console.log("Silent IP fetch blocked or failed:", err);
    try {
      const fbRes = await fetch("https://api.country.is");
      const fbData = await fbRes.json();
      finalData = fbData;
      if (fbData && fbData.ip) {
        document.getElementById("networkIpText").textContent = fbData.ip;
        if (fbData.country) {
          const flag = fbData.country.toUpperCase().replace(/./g, char => String.fromCodePoint(char.charCodeAt(0) + 127397));
          document.getElementById("networkFlag").textContent = flag;
        }
      }
    } catch (fbErr) {
      document.getElementById("networkIpText").textContent = "Local / Blocked";
    }
  }
  return finalData;
}

// --- TERMINATE SESSION LOGIC ---
const logoutBtn = document.getElementById("logoutBtn");
const terminateModal = document.getElementById("terminateModal");
const cancelBtn = document.getElementById("cancelTerminateBtn");
const confirmBtn = document.getElementById("confirmTerminateBtn");

if (logoutBtn && terminateModal) {
  logoutBtn.addEventListener("click", () => {
    terminateModal.classList.remove("hidden");
  });

  cancelBtn.addEventListener("click", () => {
    terminateModal.classList.add("hidden");
  });

  confirmBtn.addEventListener("click", () => {
    // Terminate Session: Keep pinned notes and calc history intact, wipe unsaved notes and profile data.
    const db = getLocalData();
    const keptNotes = {};
    if (db.notesList) {
      for (const id in db.notesList) {
        if (db.notesList[id].pinned) {
          keptNotes[id] = db.notesList[id];
        }
      }
    }
    
    db.notesList = keptNotes;
    // Reset Profile but leave Calculator History intact
    db.displayName = "User";
    db.email = "user@primesys.live";
    db.profileDetails = {};
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    
    if (typeof auth !== 'undefined' && auth.currentUser) {
      auth.signOut().then(() => window.location.reload());
    } else {
      window.location.reload();
    }
  });
}

// PrimeON NOTEPAD MODULE
function initNotepadModule(userData) {
  const notesListSelector = document.getElementById("notesListSelector");
  const newNoteTitleInput = document.getElementById("newNoteTitleInput");
  const addNoteBtn = document.getElementById("addNoteBtn");
  
  const activeNoteTitle = document.getElementById("activeNoteTitle");
  const deleteNoteBtn = document.getElementById("deleteNoteBtn");
  const notepadArea = document.getElementById("notepadArea");
  const notepadSyncStatus = document.getElementById("notepadSyncStatus");
  const clearNotepadBtn = document.getElementById("clearNotepadBtn");

  userNotes = userData.notesList || {};
  activeNoteId = null;

  const details = userData.profileDetails || {};
  const currentDisplayName = details.fullName || userData.displayName || "User";

  renderAttentionCommentCard(userData);

  const renderNotesList = () => {
    notesListSelector.innerHTML = "";
    const noteIds = Object.keys(userNotes);

    if (noteIds.length === 0) {
      notesListSelector.innerHTML = `<p class="section-subtext" style="text-align: center; padding: 12px; opacity: 0.6;">No notes saved.</p>`;
      selectNote(null);
      return;
    }

    noteIds.sort((a, b) => {
      const dateA = new Date(userNotes[a].lastUpdated || 0);
      const dateB = new Date(userNotes[b].lastUpdated || 0);
      return dateB - dateA;
    });

    noteIds.forEach(id => {
      const note = userNotes[id];
      const btn = document.createElement("button");
      btn.className = `note-item ${activeNoteId === id ? "active" : ""}`;
      btn.textContent = note.title || "Untitled Note";
      btn.addEventListener("click", () => {
        selectNote(id);
      });
      notesListSelector.appendChild(btn);
    });
  };

  const selectNote = (id) => {
    activeNoteId = id;
    const items = notesListSelector.querySelectorAll(".note-item");
    items.forEach(el => el.classList.remove("active"));
    
    if (id && userNotes[id]) {
      const activeBtn = Array.from(items).find(el => el.textContent === userNotes[id].title);
      if (activeBtn) activeBtn.classList.add("active");

      const note = userNotes[id];
      activeNoteTitle.textContent = note.title;
      notepadArea.value = note.content || "";
      notepadArea.disabled = false;
      clearNotepadBtn.disabled = false;
      deleteNoteBtn.classList.remove("hidden");
      document.getElementById("saveToListBtn")?.classList.remove("hidden");
      document.getElementById("explicitSaveBtn")?.classList.remove("hidden");
      updateSyncStatus(notepadSyncStatus, "💾 Saved Locally", "success");
    } else {
      activeNoteTitle.textContent = "No note selected";
      notepadArea.value = "";
      notepadArea.disabled = true;
      clearNotepadBtn.disabled = true;
      deleteNoteBtn.classList.add("hidden");
      document.getElementById("saveToListBtn")?.classList.add("hidden");
      document.getElementById("explicitSaveBtn")?.classList.add("hidden");
      updateSyncStatus(notepadSyncStatus, "Select or create a note to start drafting", "");
    }
  };

  document.getElementById("addNoteBtn").addEventListener("click", async () => {
    const titleVal = newNoteTitleInput.value.trim();
    const finalTitle = titleVal || `Note Sheet ${Object.keys(userNotes).length + 1}`;
    
    const noteId = "note_" + Math.random().toString(36).substr(2, 9);
    const newNote = {
      id: noteId,
      title: finalTitle,
      content: "",
      lastUpdated: new Date().toISOString()
    };

    userNotes[noteId] = newNote;
    newNoteTitleInput.value = "";

    const userCommentCard = document.getElementById("userCommentCard");
    if (userCommentCard) userCommentCard.classList.add("hidden");

    updateSyncStatus(notepadSyncStatus, "Creating note...", "updating");
    try {
      await updateLocalData({ notesList: userNotes });
      renderNotesList();
      selectNote(noteId);
      updateSyncStatus(notepadSyncStatus, "💾 Note created", "success");
    } catch (err) {
      console.error("Note creation error:", err);
      updateSyncStatus(notepadSyncStatus, "❌ Save failed", "danger");
    }
  });

  let autosaveDebounce;
  notepadArea.addEventListener("input", () => {
    if (!activeNoteId || !userNotes[activeNoteId]) return;

    updateSyncStatus(notepadSyncStatus, "Typing & saving...", "updating");
    clearTimeout(autosaveDebounce);

    const textValue = notepadArea.value;
    userNotes[activeNoteId].content = textValue;
    userNotes[activeNoteId].lastUpdated = new Date().toISOString();

    autosaveDebounce = setTimeout(async () => {
      try {
        await updateLocalData({ notesList: userNotes });
        updateSyncStatus(notepadSyncStatus, "💾 Draft autosaved", "success");
      } catch (err) {
        console.error("Autosave note error:", err);
        updateSyncStatus(notepadSyncStatus, "❌ Save failed", "danger");
      }
    }, 400);
  });

  clearNotepadBtn.addEventListener("click", async () => {
    if (!activeNoteId || !userNotes[activeNoteId]) return;
    
    if (confirm("Clear notes draft content?")) {
      notepadArea.value = "";
      userNotes[activeNoteId].content = "";
      userNotes[activeNoteId].lastUpdated = new Date().toISOString();

      updateSyncStatus(notepadSyncStatus, "Clearing draft...", "updating");
      try {
        await updateLocalData({ notesList: userNotes });
        updateSyncStatus(notepadSyncStatus, "💾 Draft cleared", "success");
      } catch (err) {
        console.error("Clear note error:", err);
        updateSyncStatus(notepadSyncStatus, "❌ Failed to clear", "danger");
      }
    }
  });

  deleteNoteBtn.addEventListener("click", async () => {
    if (!activeNoteId || !userNotes[activeNoteId]) return;

    if (confirm(`Delete note "${userNotes[activeNoteId].title}"?`)) {
      const targetId = activeNoteId;
      updateSyncStatus(notepadSyncStatus, "Deleting note...", "updating");
      
      try {
        delete userNotes[targetId];
        await updateLocalData({ notesList: userNotes }); // This won't delete the key if deep merging improperly.
        
        // Ensure proper deletion from local storage
        const currentData = getLocalData();
        delete currentData.notesList[targetId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));

        activeNoteId = null;
        renderNotesList();
        selectNote(null);
        updateSyncStatus(notepadSyncStatus, "💾 Note deleted", "success");
      } catch (err) {
        console.error("Delete note error:", err);
        updateSyncStatus(notepadSyncStatus, "❌ Delete failed", "danger");
      }
    }
  });

  renderNotesList();

  newNoteTitleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("addNoteBtn").click();
  });

  const explicitSaveBtn = document.getElementById("explicitSaveBtn");
  if (explicitSaveBtn) {
    explicitSaveBtn.addEventListener("click", async () => {
      if (!activeNoteId || !userNotes[activeNoteId]) return;
      const currentContent = document.getElementById("notepadArea").value;
      userNotes[activeNoteId].content = currentContent;
      userNotes[activeNoteId].lastUpdated = new Date().toISOString();

      updateSyncStatus(notepadSyncStatus, "Saving...", "updating");
      try {
        await updateLocalData({ notesList: userNotes });
        showToast("💾 Note Saved Successfully!", "success");
        updateSyncStatus(notepadSyncStatus, "💾 Saved Locally", "success");
      } catch (err) {
        console.error("Save error:", err);
        showToast("❌ Save failed", "danger");
      }
    });
  }

  const saveToListBtn = document.getElementById("saveToListBtn");
  if (saveToListBtn) {
    saveToListBtn.addEventListener("click", async () => {
      if (!activeNoteId || !userNotes[activeNoteId]) return;
      const currentContent = document.getElementById("notepadArea").value;
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const newTitle = `📌 ${userNotes[activeNoteId].title} — ${dateStr} ${timeStr}`;

      const noteId = "note_" + Math.random().toString(36).substr(2, 9);
      const savedNote = {
        id: noteId,
        title: newTitle,
        content: currentContent,
        lastUpdated: new Date().toISOString(),
        pinned: true
      };
      userNotes[noteId] = savedNote;

      updateSyncStatus(notepadSyncStatus, "Saving to list...", "updating");
      try {
        await updateLocalData({ notesList: userNotes });
        renderNotesList();
        showToast("📌 Note Pinned Permanently!", "success");
        updateSyncStatus(notepadSyncStatus, "💾 Saved to list", "success");
      } catch (err) {
        console.error("Save to list error:", err);
        showToast("❌ Failed to save to list", "danger");
        updateSyncStatus(notepadSyncStatus, "❌ Save failed", "danger");
      }
    });
  }

  const autoSelectIds = Object.keys(userNotes).sort((a, b) =>
    new Date(userNotes[b].lastUpdated || 0) - new Date(userNotes[a].lastUpdated || 0)
  );
  if (autoSelectIds.length > 0) {
    selectNote(autoSelectIds[0]);
  }
}

function renderAttentionCommentCard(userData) {
  const commentAvatarImg = document.getElementById("commentAvatarImg");
  const commentAuthorName = document.getElementById("commentAuthorName");
  const commentAuthorEmail = document.getElementById("commentAuthorEmail");
  const commentAttentionText = document.getElementById("commentAttentionText");

  const details = userData.profileDetails || {};
  const currentDisplayName = details.fullName || userData.displayName || "User";
  
  commentAuthorName.textContent = currentDisplayName;
  commentAuthorEmail.textContent = userData.email || "user@primesys.live";

  const userCommentCard = document.getElementById("userCommentCard");
  if (Object.keys(userData.notesList || {}).length > 0) {
    if (userCommentCard) userCommentCard.classList.add("hidden");
    return;
  }
  
  const lockedProfilePic = "https://upload.wikimedia.org/wikipedia/commons/e/e3/Amazon_Prime_Logo.svg";
  
  if (details.profilePic && details.profilePic !== lockedProfilePic) {
    details.profilePic = lockedProfilePic;
    updateLocalData({ profileDetails: details });
  }

  commentAvatarImg.src = lockedProfilePic;

  commentAttentionText.textContent = `Hey ${currentDisplayName.split(" ")[0]}! PrimeON v1.1.0 core calculations and multi-list systems are online. Your files are saved safely on your device.`;
}

// MULTI-MODE CALCULATOR MAIN HUB
function initCalculatorHub(userData) {
  const modePills = document.querySelectorAll("#calcTab .mode-pill");
  const basicPanel = document.getElementById("calcBasicPanel");
  const standardPanel = document.getElementById("calcStandardPanel");
  const businessPanel = document.getElementById("calcBusinessPanel");

  const calcFormula = document.getElementById("calcFormula");
  const calcScreen = document.getElementById("calcScreen");
  const historyLogList = document.getElementById("historyLogList");

  calculationHistory = userData.calcHistory || [];
  
  const renderHistory = () => {
    historyLogList.innerHTML = "";
    if (calculationHistory.length === 0) {
      historyLogList.innerHTML = `<p class="section-subtext" style="text-align: center; padding: 16px; opacity: 0.5;">No history recorded.</p>`;
      return;
    }

    calculationHistory.forEach(item => {
      const div = document.createElement("div");
      if (item.includes("Biz Margin")) {
        div.className = "history-item biz-item";
        div.innerHTML = `<div class="expr">📈 Business metrics calculated</div><div class="res">${item}</div>`;
      } else {
        div.className = "history-item";
        const parts = item.split(" = ");
        div.innerHTML = `<div class="expr">${parts[0]} =</div><div class="res">${parts[1]}</div>`;
      }
      historyLogList.appendChild(div);
    });

    historyLogList.scrollTop = historyLogList.scrollHeight;
  };

  const addHistoryItem = async (recordString) => {
    calculationHistory.push(recordString);
    if (calculationHistory.length > 100) {
      calculationHistory.shift(); 
    }
    renderHistory();
    try {
      await updateLocalData({ calcHistory: calculationHistory });
    } catch (err) {
      console.error("Save calc history failed:", err);
    }
  };

  modePills.forEach(pill => {
    pill.addEventListener("click", () => {
      modePills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");

      const mode = pill.getAttribute("data-mode");
      
      basicPanel.classList.add("hidden");
      standardPanel.classList.add("hidden");
      businessPanel.classList.add("hidden");
      
      calcFormula.textContent = "";
      calcScreen.textContent = "0";

      if (mode === "basic") {
        basicPanel.classList.remove("hidden");
      } else if (mode === "standard") {
        standardPanel.classList.remove("hidden");
      } else {
        businessPanel.classList.remove("hidden");
      }
    });
  });

  let expression = "";
  const allCalcButtons = document.querySelectorAll(".calc-btn");
  
  allCalcButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const parentPanel = btn.closest(".calc-keypad-panel");
      if (parentPanel && parentPanel.classList.contains("hidden")) return;

      const val = btn.getAttribute("data-val");

      if (val === "C") {
        expression = "";
        calcFormula.textContent = "";
        calcScreen.textContent = "0";
      } else if (val === "back") {
        if (expression.endsWith("Math.sqrt(")) {
          expression = expression.slice(0, -10);
        } else {
          expression = expression.slice(0, -1);
        }
        let displayExpr = expression
          .replace(/\*/g, " × ")
          .replace(/\//g, " ÷ ")
          .replace(/\+/g, " + ")
          .replace(/-/g, " - ")
          .replace(/\*\*/g, " ^ ")
          .replace(/Math\.sqrt\(/g, "√(");
        calcScreen.textContent = displayExpr || "0";
      } else if (val === "=") {
        if (!expression) return;
        try {
          const rawExpr = expression.replace(/×/g, "*").replace(/÷/g, "/");
          const res = Function(`"use strict"; return (${rawExpr})`)();
          const finalResult = Number.isInteger(res) ? res : parseFloat(res.toFixed(6));

          calcFormula.textContent = expression + " =";
          calcScreen.textContent = finalResult;

          addHistoryItem(`${expression} = ${finalResult}`);
          expression = finalResult.toString();
        } catch (err) {
          calcScreen.textContent = "Error";
          expression = "";
        }
      } else {
        const operators = ["+", "-", "*", "/", "%", "**", "(", ")", "Math.sqrt("];
        
        let displayVal = val;
        if (val === "*") displayVal = " × ";
        else if (val === "/") displayVal = " ÷ ";
        else if (val === "+") displayVal = " + ";
        else if (val === "-") displayVal = " - ";
        else if (val === "**") displayVal = " ^ ";
        else if (val === "Math.sqrt(") displayVal = "√(";

        if (calcScreen.textContent === "0" && !operators.includes(val)) {
          expression = val;
          calcScreen.textContent = displayVal;
        } else {
          expression += val;
          calcScreen.textContent = calcScreen.textContent === "0" ? displayVal : calcScreen.textContent + displayVal;
        }
      }
    });
  });

  const costInput = document.getElementById("bizCost");
  const revInput = document.getElementById("bizRevenue");
  const taxInput = document.getElementById("bizTax");
  const discInput = document.getElementById("bizDiscount");
  const calcBizBtn = document.getElementById("calculateBizBtn");
  const resultsCard = document.getElementById("bizResults");

  const profitDisplay = document.getElementById("resProfit");
  const marginDisplay = document.getElementById("resMargin");
  const finalPriceDisplay = document.getElementById("resFinal");

  calcBizBtn.addEventListener("click", () => {
    const cost = parseFloat(costInput.value) || 0;
    const revenue = parseFloat(revInput.value) || 0;
    const tax = parseFloat(taxInput.value) || 0;
    const discount = parseFloat(discInput.value) || 0;

    if (revenue <= 0) {
      showToast("Selling Price must be greater than 0", "warning");
      return;
    }

    const profit = revenue - cost;
    const margin = (profit / revenue) * 100;
    const discountedPrice = revenue - (revenue * (discount / 100));
    const finalPrice = discountedPrice + (discountedPrice * (tax / 100));

    profitDisplay.textContent = `$${profit.toFixed(2)}`;
    marginDisplay.textContent = `${margin.toFixed(2)}%`;
    finalPriceDisplay.textContent = `$${finalPrice.toFixed(2)}`;

    marginDisplay.style.color = margin >= 0 ? "var(--success-color)" : "var(--danger-color)";
    profitDisplay.style.color = profit >= 0 ? "var(--success-color)" : "var(--danger-color)";

    resultsCard.classList.remove("hidden");

    addHistoryItem(`Biz Margin: Cost $${cost} / Rev $${revenue} (Disc: ${discount}%, Tax: ${tax}%) -> $${profit.toFixed(2)} Profit (${margin.toFixed(1)}% Margin, final price $${finalPrice.toFixed(2)})`);
  });

  renderHistory();
}

// --- DEVICE SYSTEM INFO MODULE ---
function initDeviceInfo() {
  const logoBox = document.getElementById("deviceLogoBox");
  const nameDisplay = document.getElementById("deviceNameDisplay");
  const metaDisplay = document.getElementById("deviceMetaDisplay");

  if(!logoBox) return; // safety check

  const ua = navigator.userAgent.toLowerCase();
  
  let os = "Unknown";
  let icon = "";
  
  const androidSvg = `<svg viewBox="0 0 24 24"><path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.81.24L16.5 8.96C15.11 8.35 13.59 8 12 8c-1.59 0-3.11.35-4.5.96L5.63 5.69c-.16-.3-.52-.39-.81-.24-.3.16-.42.54-.26.85l1.84 3.18C3.44 11.23 1.55 13.92 1 17h22c-.55-3.08-2.44-5.77-5.4-7.52zM7 14.5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm10 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg>`;
  
  const appleSvg = `<svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91 1.63.16 3.1 1.05 3.96 2.37-3.16 1.83-2.61 6.27.52 7.55-.7 1.83-1.51 3.51-2.69 5.24zM15.13 4.28c.72-.9.18-2.6-.08-3.28-1.06.07-2.67.75-3.41 1.66-.66.8-.26 2.54.02 3.2 1.09-.07 2.62-.64 3.47-1.58z"/></svg>`;
  
  const windowsSvg = `<svg viewBox="0 0 24 24"><path d="M2 3.38L2 11.5 10.5 11.5 10.5 2.15 2 3.38zM11.5 1.95L11.5 11.5 21 11.5 21 .5 11.5 1.95zM2 12.5L2 20.62 10.5 21.85 10.5 12.5 2 12.5zM11.5 12.5L11.5 22.05 21 23.5 21 12.5 11.5 12.5z"/></svg>`;

  if (ua.includes("android")) {
    os = "Android User";
    icon = androidSvg;
    metaDisplay.textContent = "Mobile Environment detected. Optimized for touch inputs.";
  } else if (ua.includes("iphone") || ua.includes("ipad")) {
    os = "Apple iPhone / iPad";
    icon = appleSvg;
    metaDisplay.textContent = "iOS Environment detected. Smooth scrolling enabled.";
  } else if (ua.includes("mac os") || ua.includes("macintosh")) {
    os = "Apple Mac User";
    icon = appleSvg;
    metaDisplay.textContent = "Mac Desktop detected. High-performance rendering active.";
  } else if (ua.includes("windows")) {
    os = "Windows PC User";
    icon = windowsSvg;
    metaDisplay.textContent = "Windows Desktop detected. Keyboard shortcuts enabled.";
  } else {
    os = "Desktop User";
    icon = `<svg viewBox="0 0 24 24"><path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/></svg>`;
    metaDisplay.textContent = "Standard browser environment.";
  }

  nameDisplay.textContent = os;
  logoBox.innerHTML = icon;
}

// PROFILE SETTINGS FORM INITIALIZER
function initProfileSettings(userData) {
  // Nested Sub-tab logic for Profile vs Device Info
  const subTabBtns = document.querySelectorAll(".sub-tab-btn");
  const subTabPanes = document.querySelectorAll(".sub-tab-pane");

  subTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      subTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      subTabPanes.forEach(pane => pane.classList.add("hidden"));
      const targetId = btn.getAttribute("data-subtab");
      document.getElementById(targetId)?.classList.remove("hidden");
    });
  });

  const profileEditForm = document.getElementById("profileEditForm");
  const nameInput = document.getElementById("profileNameInput");
  const picInput = document.getElementById("profilePicInput");
  const coverInput = document.getElementById("coverPicInput");
  
  const fbInput = document.getElementById("fbInput");
  const cellInput = document.getElementById("cellNumberInput");
  const instaInput = document.getElementById("instaInput");
  const linkedinInput = document.getElementById("linkedinInput");
  const whatsappInput = document.getElementById("whatsappInput");

  // Profile Preview Displays
  const nameDisplay = document.getElementById("profileNameDisplay");
  const emailDisplay = document.getElementById("profileEmailDisplay");
  const phoneDisplay = document.getElementById("profilePhoneDisplay");
  const avatarPreview = document.getElementById("avatarPreviewImg");
  const coverPreview = document.getElementById("coverPreview");

  // Social Row Icons
  const socialFb = document.getElementById("socialFb");
  const socialInsta = document.getElementById("socialInsta");
  const socialLinkedin = document.getElementById("socialLinkedin");
  const socialWhatsapp = document.getElementById("socialWhatsapp");

  const syncStatusLabel = document.getElementById("profileSyncStatus");
  const profileForm = document.getElementById("profileEditForm");
  const profileUpdatePasswordBtn = document.getElementById("profileUpdatePasswordBtn");
  const profileNewPassword = document.getElementById("profileNewPassword");
  const passwordUpdateStatus = document.getElementById("passwordUpdateStatus");
  const profileLogoutBtn = document.getElementById("profileLogoutBtn");

  const details = userData.profileDetails || {};
  cellInput.value = details.cellNumber || "";
  nameInput.value = details.fullName || userData.displayName || "";
  picInput.value = details.profilePic || "";
  coverInput.value = details.coverPic || "";

  const social = details.socialLinks || {};
  fbInput.value = social.fb || "";
  instaInput.value = social.insta || "";
  linkedinInput.value = social.linkedin || "";
  whatsappInput.value = social.whatsapp || "";

  const refreshPreview = () => {
    const newName = nameInput.value || userData.displayName || "User";
    nameDisplay.textContent = newName;
    emailDisplay.textContent = userData.email || "user@primesys.live";
    phoneDisplay.textContent = cellInput.value ? `📞 ${cellInput.value}` : "";

    const lockedProfilePic = "icon.svg";
    picInput.value = lockedProfilePic;
    avatarPreview.src = lockedProfilePic;

    if (coverInput.value) {
      let finalCoverUrl = coverInput.value;
      
      // Auto-convert Google Drive links to direct image links
      const gDriveMatch = finalCoverUrl.match(/drive\.google\.com\/file\/d\/([^\/]+)/);
      if (gDriveMatch && gDriveMatch[1]) {
        finalCoverUrl = `https://drive.google.com/uc?export=view&id=${gDriveMatch[1]}`;
      }
      
      // Auto-convert Imgur page links (e.g. imgur.com/XYZ or imgur.com/a/XYZ) to direct image links
      const imgurMatch = finalCoverUrl.match(/^https?:\/\/(?:www\.)?imgur\.com\/(?:a\/|gallery\/)?([a-zA-Z0-9]+)/);
      if (imgurMatch && imgurMatch[1]) {
        finalCoverUrl = `https://i.imgur.com/${imgurMatch[1]}.jpg`;
      }
      
      coverPreview.style.backgroundImage = `url('${finalCoverUrl}')`;
    } else {
      coverPreview.style.backgroundImage = "none";
    }

    toggleSocialBadge(socialFb, fbInput.value);
    toggleSocialBadge(socialInsta, instaInput.value);
    toggleSocialBadge(socialLinkedin, linkedinInput.value);
    
    if (whatsappInput.value) {
      const waNumber = whatsappInput.value.replace(/\D/g, "");
      toggleSocialBadge(socialWhatsapp, `https://wa.me/${waNumber}`);
    } else {
      toggleSocialBadge(socialWhatsapp, "");
    }

    const welcomeEl = document.getElementById("specialWelcomeMsg");
    if (welcomeEl) {
      welcomeEl.textContent = `Welcome, ${newName}! Let's organize your day.`;
    }

    const commentAuthorEl = document.getElementById("commentAuthorName");
    if (commentAuthorEl) {
      commentAuthorEl.textContent = newName;
    }

    const commentAvatarEl = document.getElementById("commentAvatarImg");
    if (commentAvatarEl) {
      commentAvatarEl.src = lockedProfilePic;
    }

    const commentTextEl = document.getElementById("commentAttentionText");
    if (commentTextEl) {
      commentTextEl.textContent = `Hey ${newName.split(" ")[0]}! PrimeON v1.1.0 core calculations and multi-list systems are online. Your files are saved safely on your device.`;
    }
  };

  const toggleSocialBadge = (badgeEl, value) => {
    if (value) {
      badgeEl.href = value;
      badgeEl.classList.remove("hidden");
    } else {
      badgeEl.classList.add("hidden");
      badgeEl.href = "#";
    }
  };

  nameInput.addEventListener("input", refreshPreview);
  cellInput.addEventListener("input", refreshPreview);
  picInput.addEventListener("input", refreshPreview);
  coverInput.addEventListener("input", refreshPreview);
  fbInput.addEventListener("input", refreshPreview);
  instaInput.addEventListener("input", refreshPreview);
  linkedinInput.addEventListener("input", refreshPreview);
  whatsappInput.addEventListener("input", refreshPreview);

  refreshPreview();
  updateSyncStatus(syncStatusLabel, "💾 Synced locally", "success");

  // Edit Mode Toggle Logic
  const toggleEditBtn = document.getElementById("toggleEditProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  
  if (toggleEditBtn) {
    toggleEditBtn.addEventListener("click", () => {
      const isReadonly = profileForm.classList.contains("readonly-mode");
      if (isReadonly) {
        // Enable editing
        profileForm.classList.remove("readonly-mode");
        const inputs = profileForm.querySelectorAll("input");
        inputs.forEach(inp => {
          if (inp.id !== "profilePicInput") inp.removeAttribute("readonly");
        });
        saveBtn.classList.remove("hidden");
        toggleEditBtn.innerHTML = "❌ Cancel Edit";
        toggleEditBtn.style.background = "rgba(255,107,107,0.2)";
        toggleEditBtn.style.color = "#ff6b6b";
      } else {
        // Cancel editing
        profileForm.classList.add("readonly-mode");
        const inputs = profileForm.querySelectorAll("input");
        inputs.forEach(inp => {
          inp.setAttribute("readonly", "true");
        });
        saveBtn.classList.add("hidden");
        toggleEditBtn.innerHTML = "✏️ Edit Profile";
        toggleEditBtn.style.background = "rgba(255,255,255,0.1)";
        toggleEditBtn.style.color = "#fff";
        // Reset values to saved state
        cellInput.value = details.cellNumber || "";
        nameInput.value = details.fullName || userData.displayName || "";
        coverInput.value = details.coverPic || "";
        fbInput.value = social.fb || "";
        instaInput.value = social.insta || "";
        linkedinInput.value = social.linkedin || "";
        whatsappInput.value = social.whatsapp || "";
        refreshPreview();
      }
    });
  }

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    updateSyncStatus(syncStatusLabel, "Saving profile locally...", "updating");
    
    const saveBtn = document.getElementById("saveProfileBtn");
    saveBtn.disabled = true;

    const updatedProfile = {
      displayName: nameInput.value.trim(),
      profileDetails: {
        cellNumber: cellInput.value.trim(),
        fullName: nameInput.value.trim(),
        profilePic: picInput.value.trim(),
        coverPic: coverInput.value.trim(),
        socialLinks: {
          fb: fbInput.value.trim(),
          insta: instaInput.value.trim(),
          linkedin: linkedinInput.value.trim(),
          whatsapp: whatsappInput.value.trim()
        }
      }
    };

    try {
      await updateLocalData(updatedProfile);
      
      updateSyncStatus(syncStatusLabel, "💾 Saved Locally", "success");
      refreshPreview();

      // Return to readonly mode
      profileForm.classList.add("readonly-mode");
      const inputs = profileForm.querySelectorAll("input");
      inputs.forEach(inp => inp.setAttribute("readonly", "true"));
      saveBtn.classList.add("hidden");
      toggleEditBtn.innerHTML = "✏️ Edit Profile";
      toggleEditBtn.style.background = "rgba(255,255,255,0.1)";
      toggleEditBtn.style.color = "#fff";
      showToast("Profile Updated Successfully!", "success");

    } catch (err) {
      console.error("Profile save failed:", err);
      updateSyncStatus(syncStatusLabel, "❌ Save failed", "danger");
    } finally {
      saveBtn.disabled = false;
    }
  });

  // Handle Log Out Button
  if (profileLogoutBtn) {
    profileLogoutBtn.addEventListener("click", () => {
      if (typeof auth !== 'undefined') {
        auth.signOut().then(() => {
          // Firebase will trigger onAuthStateChanged and hide the dashboard
        }).catch(err => {
          console.error("Logout error", err);
        });
      }
    });
  }

  // Handle Set Password Button
  if (profileUpdatePasswordBtn) {
    profileUpdatePasswordBtn.addEventListener("click", () => {
      const pwd = profileNewPassword.value;
      if (!pwd || pwd.length < 6) {
        passwordUpdateStatus.style.color = "var(--danger-color)";
        passwordUpdateStatus.textContent = "Password must be at least 6 characters.";
        return;
      }
      
      const user = auth.currentUser;
      if (user) {
        passwordUpdateStatus.style.color = "var(--text-secondary)";
        passwordUpdateStatus.textContent = "Updating...";
        user.updatePassword(pwd).then(() => {
          passwordUpdateStatus.style.color = "var(--primary-color)";
          passwordUpdateStatus.textContent = "Password updated successfully!";
          profileNewPassword.value = "";
          setTimeout(() => { passwordUpdateStatus.textContent = ""; }, 4000);
        }).catch(error => {
          passwordUpdateStatus.style.color = "var(--danger-color)";
          passwordUpdateStatus.textContent = error.message;
        });
      } else {
        passwordUpdateStatus.style.color = "var(--danger-color)";
        passwordUpdateStatus.textContent = "You must be logged in to set a password.";
      }
    });
  }
}

function updateSyncStatus(element, text, statusType) {
  if (!element) return;
  element.textContent = text;
  element.className = "sync-status";
  
  if (statusType === "updating") {
    element.classList.add("updating");
  } else if (statusType === "success") {
    element.classList.add("success");
  } else if (statusType === "danger") {
    element.style.color = "var(--danger-color)";
  }
}

// =========================================================================
// NEW MODULES: WEATHER, TIMER, CONVERTER, EXPENSE TRACKER
// =========================================================================

// --- 1. WEATHER & CLOCK ---
function initWeatherModule(locData) {
  const clockEl = document.getElementById("clockDisplay");
  const dateEl = document.getElementById("dateDisplay");
  const clockFormatToggle = document.getElementById("clockFormatToggle");
  
  if(!clockEl) return;
  
  // Load saved preference
  if (clockFormatToggle) {
    const savedFormat = localStorage.getItem("use24HourFormat");
    clockFormatToggle.checked = savedFormat === "true";
    clockFormatToggle.addEventListener("change", (e) => {
      localStorage.setItem("use24HourFormat", e.target.checked);
    });
  }
  
  setInterval(() => {
    const now = new Date();
    const use24h = clockFormatToggle ? clockFormatToggle.checked : false;
    clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: !use24h });
    dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }, 1000);

  let lat = "23.8103";
  let lon = "90.4125";
  let city = "Dhaka";

  if (locData && locData.loc) {
    const coords = locData.loc.split(",");
    lat = coords[0];
    lon = coords[1];
    city = locData.city || "your location";
  }

  fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`)
    .then(r => r.json())
    .then(data => {
      if(data.current) {
        const temp = Math.round(data.current.temperature_2m);
        const wind = Math.round(data.current.wind_speed_10m);
        const hum = Math.round(data.current.relative_humidity_2m);
        
        document.getElementById("weatherTemp").textContent = `${temp}°C`;
        document.getElementById("weatherWind").textContent = `${wind} km/h`;
        document.getElementById("weatherHum").textContent = `${hum}%`;
        document.getElementById("weatherDesc").textContent = `Local weather for ${city}.`;
      }
    })
    .catch(e => {
      console.log("Weather API failed", e);
      document.getElementById("weatherDesc").textContent = `Weather API unreachable.`;
    });
}

// --- 2. FOCUS TIMER ---
function initTimerModule() {
  const circle = document.getElementById("timerProgress");
  const text = document.getElementById("timerText");
  const btnStart = document.getElementById("timerStartBtn");
  const btnPause = document.getElementById("timerPauseBtn");
  const btnReset = document.getElementById("timerResetBtn");
  
  if(!circle) return;

  const btnWork = document.getElementById("btnWorkMode");
  const btnBreak = document.getElementById("btnBreakMode");
  const btnCustom = document.getElementById("btnCustomMode");
  const customInput = document.getElementById("customTimeInput");

  let duration = 25 * 60;
  let remaining = duration;
  let timerInterval = null;
  const circumference = 565.48;

  function updateDisplay() {
    const m = Math.floor(remaining / 60).toString().padStart(2, "0");
    const s = (remaining % 60).toString().padStart(2, "0");
    text.textContent = `${m}:${s}`;
    
    const offset = circumference - (remaining / duration) * circumference;
    circle.style.strokeDashoffset = offset;
  }

  function setMode(mins, isWork, activeBtn = null) {
    clearInterval(timerInterval);
    timerInterval = null;
    duration = mins * 60;
    remaining = duration;
    updateDisplay();
    
    btnWork.classList.remove("active");
    btnBreak.classList.remove("active");
    if(btnCustom) btnCustom.classList.remove("active");
    
    if(activeBtn) {
      activeBtn.classList.add("active");
    }
    
    circle.style.stroke = isWork ? "var(--primary-accent)" : "#34d399";
  }

  btnWork.addEventListener("click", () => setMode(25, true, btnWork));
  btnBreak.addEventListener("click", () => setMode(5, false, btnBreak));
  
  if (btnCustom && customInput) {
    btnCustom.addEventListener("click", () => {
      const mins = parseFloat(customInput.value);
      if(isNaN(mins) || mins <= 0) return showToast("Enter a valid time in minutes", "warning");
      setMode(mins, true, btnCustom);
    });
  }

  btnStart.addEventListener("click", () => {
    if(timerInterval) return;
    timerInterval = setInterval(() => {
      if(remaining > 0) {
        remaining--;
        updateDisplay();
      } else {
        clearInterval(timerInterval);
        timerInterval = null;
        showToast("⏰ Timer Finished!", "success");
      }
    }, 1000);
  });

  btnPause.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
  });

  btnReset.addEventListener("click", () => {
    clearInterval(timerInterval);
    timerInterval = null;
    remaining = duration;
    updateDisplay();
  });
  
  updateDisplay();
}

// --- 2.5 MUSIC LOUNGE ---
function initMusicModule() {
  const db = getLocalData();
  if(!db.musicHistory) db.musicHistory = [];

  // Sub-tab logic
  const subTabBtns = document.querySelectorAll(".music-sub-tab-btn");
  const subTabPanes = document.querySelectorAll(".music-sub-pane");
  subTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      subTabBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      subTabPanes.forEach(pane => pane.classList.add("hidden"));
      const targetId = btn.getAttribute("data-subtab");
      document.getElementById(targetId)?.classList.remove("hidden");
    });
  });

  const ytSearchInput = document.getElementById("ytSearchInput");
  const searchYtBtn = document.getElementById("searchYtBtn");
  const ytSearchResults = document.getElementById("ytSearchResults");
  const ytPlayerControls = document.getElementById("ytPlayerControls");
  const pipBtn = document.getElementById("pipBtn");
  const downloadCurrentYtBtn = document.getElementById("downloadCurrentYtBtn");
  
  let currentPlayingVideoId = null;
  const historyList = document.getElementById("musicHistoryList");
  
  let ytPlayer = null;
  let currentPlayingIndex = -1;

  // Load YouTube IFrame API dynamically
  if (!window.YT) {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('ytPlayerDiv', {
      height: '100%',
      width: '100%',
      playerVars: {
        'autoplay': 0,
        'playsinline': 1,
        'enablejsapi': 1
      },
      events: {
        'onStateChange': onPlayerStateChange,
        'onReady': onPlayerReady
      }
    });
  };

  if (window.YT && window.YT.Player && !ytPlayer) {
    window.onYouTubeIframeAPIReady();
  }

  function onPlayerReady(event) {
    // Add absolute positioning dynamically to the created iframe
    event.target.getIframe().style.position = "absolute";
    event.target.getIframe().style.top = "0";
    event.target.getIframe().style.left = "0";
  }

  function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
      if (db.musicHistory.length > 0 && currentPlayingIndex >= 0) {
        // Auto-play the NEXT track in history (index + 1)
        let nextIndex = currentPlayingIndex + 1;
        if (nextIndex >= db.musicHistory.length) {
          nextIndex = 0; // Loop back to the first track
        }
        playFromHistory(nextIndex);
      }
    }
  }

  function renderHistory() {
    if(!historyList) return;
    historyList.innerHTML = "";
    if(db.musicHistory.length === 0) {
      historyList.innerHTML = `<p style="opacity:0.5; font-size:0.9rem; text-align:center;">No recent tracks</p>`;
      return;
    }
    
    db.musicHistory.forEach((track, i) => {
      const div = document.createElement("div");
      div.className = "music-history-item";
      
      const isPlaying = (i === currentPlayingIndex);
      const bg = isPlaying ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)";
      const border = isPlaying ? "1px solid var(--primary-accent)" : "1px solid transparent";
      
      div.style.cssText = `display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px; background:${bg}; border:${border}; border-radius:10px; cursor:pointer; transition:background 0.3s;`;
      
      const infoDiv = document.createElement("div");
      infoDiv.style.cssText = "display:flex; align-items:center; gap:10px; flex:1; overflow:hidden;";
      infoDiv.innerHTML = `
        <div style="font-size:1.2rem;">${isPlaying ? '🎶' : '🎧'}</div>
        <div style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.95rem; color:#fff;">${track.title}</div>
      `;
      infoDiv.onclick = () => {
        playFromHistory(i);
      };

      const removeBtn = document.createElement("button");
      removeBtn.innerHTML = "🗑";
      removeBtn.style.cssText = "background:transparent; border:none; color:var(--text-secondary); cursor:pointer; font-size:1.1rem; transition:color 0.3s;";
      removeBtn.onmouseenter = () => removeBtn.style.color = "var(--danger-color)";
      removeBtn.onmouseleave = () => removeBtn.style.color = "var(--text-secondary)";
      removeBtn.onclick = (e) => {
        e.stopPropagation();
        db.musicHistory.splice(i, 1);
        
        // Adjust playing index on deletion
        if (currentPlayingIndex === i) {
          currentPlayingIndex = -1;
        } else if (currentPlayingIndex > i) {
          currentPlayingIndex--;
        }

        updateLocalData({ musicHistory: db.musicHistory });
        renderHistory();
      };

      div.appendChild(infoDiv);
      div.appendChild(removeBtn);

      div.onmouseenter = () => div.style.background = isPlaying ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.1)";
      div.onmouseleave = () => div.style.background = bg;
      
      historyList.appendChild(div);
    });
  }

  function playFromHistory(index) {
    if (index < 0 || index >= db.musicHistory.length) return;
    currentPlayingIndex = index;
    const track = db.musicHistory[index];
    
    if (ytPlayer && ytPlayer.loadVideoById) {
      if (track.type === "vid") {
        ytPlayer.loadVideoById(track.query);
      } else {
        ytPlayer.loadPlaylist({list: track.query, listType: "search"});
      }
    }
    renderHistory();
  }

  function addHistory(title, query, type) {
    const existingIdx = db.musicHistory.findIndex(t => t.query === query);
    if(existingIdx !== -1) {
      db.musicHistory.splice(existingIdx, 1);
      if (currentPlayingIndex === existingIdx) {
        currentPlayingIndex = 0;
      } else if (currentPlayingIndex > existingIdx) {
        currentPlayingIndex--;
      }
    }
    
    db.musicHistory.unshift({ title, query, type });
    
    if (currentPlayingIndex !== -1 && existingIdx !== currentPlayingIndex) {
      currentPlayingIndex++;
    } else if (existingIdx === -1) {
      currentPlayingIndex = 0;
    }
    
    // Warning at 100 tracks (no hard limit removal pop)
    if(db.musicHistory.length === 100) {
      showToast("Warning: You have reached 100 saved tracks! Consider cleaning up your library.", "warning");
    }
    
    updateLocalData({ musicHistory: db.musicHistory });
    renderHistory();
  }

  function setVideo(videoId) {
    if (ytPlayer && ytPlayer.loadVideoById) {
      const ph = document.getElementById("ytPlaceholder");
      const pdiv = document.getElementById("ytPlayerDiv");
      if(ph) ph.style.display = "none";
      if(pdiv) pdiv.style.display = "block";
      ytPlayer.loadVideoById(videoId);
    }
  }

  if (searchYtBtn && ytSearchInput) {
    searchYtBtn.addEventListener("click", async () => {
      const query = ytSearchInput.value.trim();
      if (!query) return;

      let videoId = "";
      if (query.includes("v=")) {
        videoId = query.split("v=")[1].split("&")[0];
      } else if (query.includes("youtu.be/")) {
        videoId = query.split("youtu.be/")[1].split("?")[0];
      }
      
      if (videoId) {
        if(ytSearchResults) ytSearchResults.style.display = "none";
        playSelectedVideo(videoId, "Video Link");
        return;
      }

      // Otherwise do a search
      searchYtBtn.innerHTML = "⏳ Searching...";
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const videos = await res.json();
        
        if (ytSearchResults) {
          ytSearchResults.innerHTML = "";
          ytSearchResults.style.display = "flex";
          
          if (videos.length === 0) {
            ytSearchResults.innerHTML = "<p style='text-align:center;color:#fff;'>No results found.</p>";
          } else {
            videos.forEach(v => {
              const item = document.createElement("div");
              item.style.cssText = "display:flex; gap:15px; padding:10px; border-radius:10px; background:rgba(255,255,255,0.05); cursor:pointer; align-items:center; transition:background 0.3s;";
              item.onmouseenter = () => item.style.background = "rgba(255,255,255,0.1)";
              item.onmouseleave = () => item.style.background = "rgba(255,255,255,0.05)";
              item.innerHTML = `
                <img src="${v.image || v.thumbnail}" style="width:120px; border-radius:8px; aspect-ratio:16/9; object-fit:cover;">
                <div style="flex:1;">
                  <h4 style="font-size:1rem; margin-bottom:5px; color:#fff; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${v.title}</h4>
                  <span style="font-size:0.8rem; color:var(--text-secondary);">${v.author?.name || v.author} • ${v.ago || ''}</span>
                </div>
              `;
              item.onclick = () => {
                ytSearchResults.style.display = "none";
                playSelectedVideo(v.videoId, v.title);
              };
              ytSearchResults.appendChild(item);
            });
          }
        }
      } catch (err) {
        if (typeof showToast === 'function') showToast("Search failed. Try pasting a direct link instead.", "error");
      }
      searchYtBtn.innerHTML = "🔍 Search / Play";
    });
  }

  function playSelectedVideo(videoId, title) {
    currentPlayingVideoId = videoId;
    setVideo(videoId);
    if(ytPlayerControls) ytPlayerControls.style.display = "flex";
    if (typeof addHistory === 'function') {
      addHistory(title || `Video: ${videoId}`, videoId, "vid");
    }
  }


  if (downloadCurrentYtBtn) {
    downloadCurrentYtBtn.addEventListener("click", () => {
      if(!currentPlayingVideoId) return;
      const downloadUrl = `https://ssyoutube.com/en18/?url=https://www.youtube.com/watch?v=${currentPlayingVideoId}`;
      window.open(downloadUrl, '_blank');
      if (typeof showToast === 'function') showToast("Opening secure downloader...", "success");
    });
  }
  
  renderHistory();

  // Initialize other modules
  if (typeof initConverterModule === 'function') initConverterModule();
  if (typeof initExpenseModule === 'function') initExpenseModule();
}

// --- 3. CONVERTER ---
function initConverterModule() {
  const tabs = document.querySelectorAll(".conv-tab");
  const s1 = document.getElementById("convSelect1");
  const s2 = document.getElementById("convSelect2");
  const i1 = document.getElementById("convInput1");
  const i2 = document.getElementById("convInput2");
  
  if(!s1) return;

  let currentRates = {};
  
  const unitData = {
    length: { M: 1, KM: 0.001, CM: 100, INCH: 39.37, MILE: 0.000621371 },
    weight: { KG: 1, GRAM: 1000, POUND: 2.20462, OUNCE: 35.274 },
    data: { MB: 1, KB: 1024, GB: 0.0009765625, TB: 0.00000095367 },
    time: { MINUTE: 1, SEC: 60, HOUR: 0.0166667, DAY: 0.000694444 }
  };

  let currentType = "currency";

  async function loadType(type) {
    currentType = type;
    s1.innerHTML = ""; s2.innerHTML = "";
    
    if (type === "currency") {
      try {
        const res = await fetch("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json");
        const data = await res.json();
        currentRates = data.usd;
        const popular = ["usd", "eur", "gbp", "bdt", "inr", "jpy", "cad", "aud", "sgd", "aed", "sar"];
        const currencyMap = {
          "usd": "🇺🇸 USD (USA)",
          "eur": "🇪🇺 EUR (Europe)",
          "gbp": "🇬🇧 GBP (UK)",
          "bdt": "🇧🇩 BDT (Bangladesh)",
          "inr": "🇮🇳 INR (India)",
          "jpy": "🇯🇵 JPY (Japan)",
          "cad": "🇨🇦 CAD (Canada)",
          "aud": "🇦🇺 AUD (Australia)",
          "sgd": "🇸🇬 SGD (Singapore)",
          "aed": "🇦🇪 AED (UAE)",
          "sar": "🇸🇦 SAR (Saudi)"
        };
        popular.forEach(c => {
          if(currentRates[c]) {
            const label = currencyMap[c] || c.toUpperCase();
            s1.add(new Option(label, c));
            s2.add(new Option(label, c));
          }
        });
        s1.value = "usd"; s2.value = "bdt";
        document.getElementById("convStatus").textContent = "Live exchange rates from API.";
      } catch(e) {
        document.getElementById("convStatus").textContent = "Failed to load exchange rates.";
      }
    } else if (type === "temperature") {
      ["Celsius", "Fahrenheit", "Kelvin"].forEach(k => {
        s1.add(new Option(k, k));
        s2.add(new Option(k, k));
      });
      s1.value = "Celsius"; s2.value = "Fahrenheit";
      document.getElementById("convStatus").textContent = "Standard temperature conversion.";
    } else {
      currentRates = unitData[type];
      Object.keys(currentRates).forEach(k => {
        s1.add(new Option(k, k));
        s2.add(new Option(k, k));
      });
      document.getElementById("convStatus").textContent = "Standard conversion.";
    }
    calc();
  }

  function calc() {
    const v1 = parseFloat(i1.value) || 0;
    
    if (currentType === "temperature") {
      let c = 0;
      if (s1.value === "Celsius") c = v1;
      else if (s1.value === "Fahrenheit") c = (v1 - 32) * 5/9;
      else if (s1.value === "Kelvin") c = v1 - 273.15;

      let res = 0;
      if (s2.value === "Celsius") res = c;
      else if (s2.value === "Fahrenheit") res = (c * 9/5) + 32;
      else if (s2.value === "Kelvin") res = c + 273.15;
      
      i2.value = res.toFixed(2);
      return;
    }

    const r1 = currentRates[s1.value] || 1;
    const r2 = currentRates[s2.value] || 1;
    
    const result = (v1 / r1) * r2;
    i2.value = result.toFixed(2);
  }

  tabs.forEach(t => t.addEventListener("click", () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    loadType(t.dataset.type);
  }));

  i1.addEventListener("input", calc);
  s1.addEventListener("change", calc);
  s2.addEventListener("change", calc);
  
  loadType("currency");
}

// --- 4. EXPENSE TRACKER ---
function initExpenseModule() {
  const db = getLocalData();
  if(!db.expenses) db.expenses = [];
  
  const listEl = document.getElementById("expenseList");
  const tBal = document.getElementById("expTotalBal");
  const tInc = document.getElementById("expTotalInc");
  const tExp = document.getElementById("expTotalExp");
  const btn = document.getElementById("addExpBtn");
  
  if(!listEl) return;

  function render() {
    listEl.innerHTML = "";
    let inc = 0, exp = 0;
    
    db.expenses.forEach((e, i) => {
      const amt = parseFloat(e.amount);
      if(e.type === "income") inc += amt;
      else exp += amt;
      
      const div = document.createElement("div");
      div.className = `exp-item trader-ticker`;
      div.style.display = "flex";
      div.style.justifyContent = "space-between";
      div.style.alignItems = "center";
      div.style.padding = "12px 15px";
      div.style.borderBottom = "1px solid rgba(255,255,255,0.05)";
      div.style.background = "rgba(0,0,0,0.2)";
      div.style.borderRadius = "8px";
      div.innerHTML = `
        <div class="exp-info" style="display:flex; flex-direction:column; gap:4px;">
          <span class="exp-title" style="font-weight:600; font-size:1.05rem; font-family:monospace; color:var(--text-primary); letter-spacing:0.5px;">${e.title.toUpperCase()}</span>
          <span class="exp-date" style="font-size:0.75rem; color:var(--text-secondary);">${new Date(e.date).toLocaleDateString()} ${new Date(e.date).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <div style="display:flex;align-items:center;gap:15px;">
          <div style="text-align:right;">
            <span class="exp-amt" style="font-family:monospace; font-weight:700; font-size:1.1rem; color: ${e.type === "income" ? "var(--success-color)" : "var(--danger-color)"}">
              ${e.type === "income" ? "▲" : "▼"} $${amt.toFixed(2)}
            </span>
          </div>
          <button class="exp-del" onclick="deleteExpense(${i})" style="background:transparent; color:var(--text-secondary); border:none; cursor:pointer; font-size:1.5rem; transition:0.2s; line-height:1;" onmouseover="this.style.color='var(--danger-color)'" onmouseout="this.style.color='var(--text-secondary)'">×</button>
        </div>
      `;
      listEl.appendChild(div);
    });
    
    tInc.textContent = `+$${inc.toFixed(2)}`;
    tExp.textContent = `-$${exp.toFixed(2)}`;
    tBal.textContent = `$${(inc - exp).toFixed(2)}`;
  }
  
  window.deleteExpense = function(i) {
    db.expenses.splice(i, 1);
    updateLocalData({ expenses: db.expenses });
    render();
  };

  btn.addEventListener("click", () => {
    const title = document.getElementById("expTitle").value.trim();
    const amt = parseFloat(document.getElementById("expAmt").value);
    const type = document.getElementById("expType").value;
    if(!title || isNaN(amt) || amt <= 0) return showToast("Invalid expense details", "error");
    
    db.expenses.unshift({ title, amount: amt, type, date: Date.now() });
    updateLocalData({ expenses: db.expenses });
    render();
    
    document.getElementById("expTitle").value = "";
    document.getElementById("expAmt").value = "";
  });
  
  render();
}

// --- 5. MUSIC LOUNGE (BACKGROUND RADIO) ---
// (Original music lounge logic handles the subtabs and iframe, ambient sounds is added below)

// ============================================================================
// NEW ENHANCEMENTS: Themes, To-Do, Bookmarks, Ambient Sounds & Export
// ============================================================================

// --- THEME MANAGER ---
function initThemeManager(userData) {
  const settings = userData.themeSettings || { mode: "dark", accent: "#6366f1", macosGlass: false };
  const root = document.documentElement;
  const body = document.body;
  
  function applyTheme() {
    body.classList.remove("theme-light", "theme-macos");
    if (settings.mode === "light") body.classList.add("theme-light");
    
    if (settings.macosGlass) body.classList.add("theme-macos");
    
    root.style.setProperty("--primary-accent", settings.accent);
    root.style.setProperty("--accent-glow", settings.accent + "33");
  }
  
  applyTheme();

  const themeBtns = document.querySelectorAll(".theme-selector");
  const colorSwatches = document.querySelectorAll(".color-swatch");
  const macosToggle = document.getElementById("macosGlassToggle");
  
  if (macosToggle) {
    macosToggle.checked = !!settings.macosGlass;
    macosToggle.addEventListener("change", (e) => {
      settings.macosGlass = e.target.checked;
      applyTheme();
      userData.themeSettings = settings;
      updateLocalData({ themeSettings: settings });
    });
  }
  
  themeBtns.forEach(btn => {
    if (btn.getAttribute("data-theme") === settings.mode) {
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    }
    btn.addEventListener("click", () => {
      themeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      settings.mode = btn.getAttribute("data-theme");
      applyTheme();
      userData.themeSettings = settings;
      updateLocalData({ themeSettings: settings });
    });
  });

  colorSwatches.forEach(swatch => {
    if (swatch.getAttribute("data-color") === settings.accent) {
      colorSwatches.forEach(s => s.classList.remove("active"));
      swatch.classList.add("active");
    }
    swatch.addEventListener("click", () => {
      colorSwatches.forEach(s => s.classList.remove("active"));
      swatch.classList.add("active");
      settings.accent = swatch.getAttribute("data-color");
      applyTheme();
      userData.themeSettings = settings;
      updateLocalData({ themeSettings: settings });
    });
  });

  const cloudSyncToggle = document.getElementById("cloudSyncToggle");
  if (cloudSyncToggle) {
    cloudSyncToggle.checked = !!userData.cloudSyncEnabled;
    cloudSyncToggle.addEventListener("change", (e) => {
      userData.cloudSyncEnabled = e.target.checked;
      updateLocalData({ cloudSyncEnabled: e.target.checked }).then(() => {
        showToast(e.target.checked ? "☁️ Cloud Sync Enabled" : "📱 Cloud Sync Disabled", "info");
      });
    });
  }
}

// --- TO-DO LIST MODULE ---
function initTodoModule(userData) {
  const todoList = userData.todoList || [];
  const container = document.getElementById("todoListContainer");
  const input = document.getElementById("todoInput");
  const btn = document.getElementById("addTodoBtn");
  
  function render() {
    if (!container) return;
    container.innerHTML = "";
    if (todoList.length === 0) {
      container.innerHTML = `<p style="text-align:center; opacity:0.5; padding:20px;">No tasks yet. Add one above!</p>`;
      return;
    }
    todoList.forEach((task, i) => {
      const div = document.createElement("div");
      div.className = `todo-item ${task.completed ? "completed" : ""}`;
      div.innerHTML = `
        <div style="display:flex; align-items:center;">
          <input type="checkbox" class="todo-item-check" ${task.completed ? "checked" : ""}>
          <span>${task.text}</span>
        </div>
        <button class="del-todo-btn">🗑️</button>
      `;
      div.querySelector(".todo-item-check").addEventListener("change", (e) => {
        task.completed = e.target.checked;
        updateLocalData({ todoList });
        render();
      });
      div.querySelector(".del-todo-btn").addEventListener("click", () => {
        todoList.splice(i, 1);
        updateLocalData({ todoList });
        render();
      });
      container.appendChild(div);
    });
  }
  
  if (btn) {
    btn.addEventListener("click", () => {
      const text = input.value.trim();
      if (!text) return;
      todoList.unshift({ text, completed: false, date: Date.now() });
      updateLocalData({ todoList });
      input.value = "";
      render();
    });
  }
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") btn.click();
    });
  }
  render();
}

// --- BOOKMARKS MODULE ---
function initBookmarkModule(userData) {
  const bookmarks = userData.bookmarks || [];
  const container = document.getElementById("bookmarkGrid");
  const titleInput = document.getElementById("bmTitleInput");
  const urlInput = document.getElementById("bmUrlInput");
  const btn = document.getElementById("addBookmarkBtn");
  
  function render() {
    if (!container) return;
    container.innerHTML = "";
    if (bookmarks.length === 0) {
      container.innerHTML = `<p style="text-align:center; opacity:0.5; padding:20px; grid-column:1/-1;">No bookmarks yet.</p>`;
      return;
    }
    bookmarks.forEach((bm, i) => {
      const a = document.createElement("a");
      a.className = "bookmark-card";
      a.href = bm.url;
      a.target = "_blank";
      
      let initial = bm.title ? bm.title.charAt(0).toUpperCase() : "🔗";
      
      a.innerHTML = `
        <div class="bm-icon">${initial}</div>
        <div style="font-weight:600; font-size:0.9rem;">${bm.title}</div>
        <button class="del-bm-btn">×</button>
      `;
      
      a.querySelector(".del-bm-btn").addEventListener("click", (e) => {
        e.preventDefault();
        bookmarks.splice(i, 1);
        updateLocalData({ bookmarks });
        render();
      });
      container.appendChild(a);
    });
  }
  
  if (btn) {
    btn.addEventListener("click", () => {
      const title = titleInput.value.trim();
      let url = urlInput.value.trim();
      if (!title || !url) return showToast("Please enter title and URL", "warning");
      if (!url.startsWith("http")) url = "https://" + url;
      
      bookmarks.push({ title, url });
      updateLocalData({ bookmarks });
      titleInput.value = "";
      urlInput.value = "";
      render();
    });
  }
  render();
}

// --- AMBIENT SOUNDS & EQ ---
function initAmbientSounds() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return; // browser doesn't support Web Audio API
  
  const ctx = new AudioContext();
  const eqLow = ctx.createBiquadFilter();
  const eqMid = ctx.createBiquadFilter();
  const eqHigh = ctx.createBiquadFilter();
  
  eqLow.type = "lowshelf";
  eqLow.frequency.value = 250;
  eqLow.gain.value = 0;
  
  eqMid.type = "peaking";
  eqMid.frequency.value = 1000;
  eqMid.Q.value = 1;
  eqMid.gain.value = 0;
  
  eqHigh.type = "highshelf";
  eqHigh.frequency.value = 4000;
  eqHigh.gain.value = 0;
  
  const panner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
  if (panner) panner.pan.value = 0;
  
  eqLow.connect(eqMid);
  eqMid.connect(eqHigh);
  if (panner) {
    eqHigh.connect(panner);
    panner.connect(ctx.destination);
  } else {
    eqHigh.connect(ctx.destination);
  }
  
  let currentAudio = null;
  let sourceNode = null;
  
  // Default focus sound (CORS friendly)
  const defaultFocusSound = "https://ia600305.us.archive.org/30/items/RainSounds10HoursAndNightThunder/Rain%20Sounds%2010%20Hours%20and%20Night%20Thunder.mp3";
  
  const ambientToggle = document.getElementById("ambientSoundToggle");
  
  function playSound() {
    if (ctx.state === "suspended") ctx.resume();
    if (currentAudio) {
      currentAudio.pause();
      if (sourceNode) {
        sourceNode.disconnect();
        sourceNode = null;
      }
    }
    
    currentAudio = new Audio(defaultFocusSound);
    currentAudio.crossOrigin = "anonymous";
    currentAudio.loop = true;
    currentAudio.volume = 0.8;
    currentAudio.play().catch(e => {
        showToast("Browser blocked autoplay. Please click again.", "warning");
        if(ambientToggle) ambientToggle.checked = false;
    });
    
    sourceNode = ctx.createMediaElementSource(currentAudio);
    sourceNode.connect(eqLow);
  }
  
  if (ambientToggle) {
    ambientToggle.addEventListener("change", (e) => {
      if (e.target.checked) {
        playSound();
      } else {
        if (currentAudio) {
          currentAudio.pause();
        }
      }
    });
  }
  
  // EQ Sliders
  document.getElementById("eqLow")?.addEventListener("input", (e) => { eqLow.gain.value = e.target.value; });
  document.getElementById("eqMid")?.addEventListener("input", (e) => { eqMid.gain.value = e.target.value; });
  document.getElementById("eqHigh")?.addEventListener("input", (e) => { eqHigh.gain.value = e.target.value; });
  
  // Spatial Audio toggle
  let lfo;
  document.getElementById("spatialAudioToggle")?.addEventListener("change", (e) => {
    if (!panner) return;
    if (e.target.checked) {
       lfo = setInterval(() => {
         panner.pan.value = Math.sin(Date.now() / 800) * 0.4;
       }, 50);
    } else {
       clearInterval(lfo);
       panner.pan.value = 0;
    }
  });
}

// --- DATA EXPORT (CSV & PDF) ---
function initExportFunctions(userData) {
  // Notepad PDF Export
  document.getElementById("exportNotePdfBtn")?.addEventListener("click", () => {
    if (!window.jspdf) return showToast("PDF library loading...", "warning");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const title = document.getElementById("activeNoteTitle").textContent || "Note";
    const text = document.getElementById("notepadArea").value || "";
    
    doc.setFontSize(18);
    doc.text(title, 10, 20);
    doc.setFontSize(12);
    
    // Split text into array of strings to fit page width
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 10, 30);
    
    doc.save(title + ".pdf");
    showToast("PDF Exported successfully!", "success");
  });
  
  // Expense Tracker CSV Export
  document.getElementById("exportExpCsvBtn")?.addEventListener("click", () => {
    const expenses = userData.expenses || [];
    if (expenses.length === 0) return showToast("No expenses to export", "warning");
    
    let csv = "Date,Title,Type,Amount\\n";
    expenses.forEach(e => {
      const d = new Date(e.date).toLocaleDateString();
      csv += `${d},"${e.title}",${e.type},${e.amount}\\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "PrimeSYS_Expenses.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    showToast("CSV Exported successfully!", "success");
  });

  // Expense Tracker PDF Export
  document.getElementById("exportExpPdfBtn")?.addEventListener("click", () => {
    if (!window.jspdf) return showToast("PDF library loading...", "warning");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const expenses = userData.expenses || [];
    
    doc.setFontSize(18);
    doc.text("PrimeSYS Expense Tracker Report", 10, 20);
    doc.setFontSize(12);
    
    let y = 30;
    expenses.forEach(e => {
      if(y > 280) { doc.addPage(); y = 20; }
      const sign = e.type === "income" ? "+" : "-";
      const d = new Date(e.date).toLocaleDateString();
      doc.text(`${d} | ${e.title} | ${sign}$${e.amount.toFixed(2)}`, 10, y);
      y += 10;
    });
    
    doc.save("PrimeSYS_Expenses.pdf");
    showToast("PDF Exported successfully!", "success");
  });

  // --- NEW: FINANCE SUB-TABS ---
  const subTabBtns = document.querySelectorAll(".sub-tab-btn");
  const subTabPanes = document.querySelectorAll(".sub-tab-pane");
  
  subTabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      subTabBtns.forEach(b => b.classList.remove("active"));
      subTabPanes.forEach(p => p.classList.add("hidden"));
      
      btn.classList.add("active");
      const target = document.getElementById(btn.getAttribute("data-subtab"));
      if (target) target.classList.remove("hidden");
    });
  });

  // --- NEW: DOWNLOAD VIDEO LOGIC ---
  const downloadLinkInput = document.getElementById("downloadLinkInput");
  const startDownloadBtn = document.getElementById("startDownloadBtn");
  
  const dlModal = document.getElementById("downloadVideoModal");
  const closeDlModalBtn = document.getElementById("closeDlModalBtn");
  const dlMp4Btn = document.getElementById("dlMp4Btn");
  const dlMp3Btn = document.getElementById("dlMp3Btn");
  const dlTitle = document.getElementById("downloadModalTitle");
  const dlThumb = document.getElementById("downloadModalThumb");
  
  let currentDlUrl = "";
  
  if (startDownloadBtn && downloadLinkInput) {
    startDownloadBtn.addEventListener("click", () => {
      const url = downloadLinkInput.value.trim();
      if (!url) {
        showToast("Please enter a valid video link.", "error");
        return;
      }
      
      currentDlUrl = url;
      dlModal.classList.remove("hidden");
      
      // Try to extract YouTube ID for thumbnail
      let videoId = "";
      if (url.includes("v=")) {
        videoId = url.split("v=")[1].split("&")[0];
      } else if (url.includes("youtu.be/")) {
        videoId = url.split("youtu.be/")[1].split("?")[0];
      }
      
      if(videoId) {
        dlThumb.style.backgroundImage = `url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg')`;
        dlTitle.textContent = "Fetching video details...";
        
        fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
          .then(r => r.json())
          .then(d => { dlTitle.textContent = d.title || "Ready to download!"; })
          .catch(e => { dlTitle.textContent = "Ready to download!"; });
      } else {
        dlThumb.style.backgroundImage = "none";
        dlTitle.textContent = "Ready to download media!";
      }
    });
    
    closeDlModalBtn?.addEventListener("click", () => {
      dlModal.classList.add("hidden");
    });
    
    dlMp4Btn?.addEventListener("click", () => {
      if(!currentDlUrl) return;
      // Native auto-download using our Custom Node.js Backend
      const backendUrl = "/api"; // Vercel API
      const downloadUrl = `${backendUrl}/download?url=${encodeURIComponent(currentDlUrl)}&format=mp4`;
      
      window.location.href = downloadUrl; // Triggers "Save As" directly!
      showToast("Download started natively...", "success");
      dlModal.classList.add("hidden");
      downloadLinkInput.value = "";
    });
    
    dlMp3Btn?.addEventListener("click", () => {
      if(!currentDlUrl) return;
      // Native auto-download using our Custom Node.js Backend
      const backendUrl = "/api"; // Vercel API
      const downloadUrl = `${backendUrl}/download?url=${encodeURIComponent(currentDlUrl)}&format=mp3`;
      
      window.location.href = downloadUrl; // Triggers "Save As" directly!
      showToast("Audio download started natively...", "success");
      dlModal.classList.add("hidden");
      downloadLinkInput.value = "";
    });
  }

} // End initDashboardFeatures
