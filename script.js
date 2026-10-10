/* ==========================================================
   Study Flow — script.js
   Isi: penyimpanan, tema, sapaan, timer, daily goal, to-do
   ========================================================== */


/* ===== Penyimpanan (localStorage) =====
   store.get('kunci', nilaiAwal) -> ambil data yang tersimpan
   store.set('kunci', nilai)     -> simpan data               */
const store = {
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw === null ? fallback : JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn("Data gagal disimpan:", e);
        }
    }
};


/* ===== Tema gelap / terang ===== */
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;

    const btn = document.getElementById("themeToggle");
    if (btn) {
        // tombol menampilkan tema yang akan dipilih berikutnya
        btn.textContent = theme === "dark" ? "☀️" : "🌙";
        btn.title = theme === "dark" ? "Ganti ke mode terang" : "Ganti ke mode gelap";
    }
}

function toggleTheme() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
    store.set("sf_theme", next);
}


/* ===== Sapaan ===== */
function sayHello() {
    alert("Semangat belajar! 🚀");
    document.getElementById("project").scrollIntoView({ behavior: "smooth" });
}


/* ===== Pomodoro Timer ===== */
const WORK_TIME = 25 * 60; // 25 menit dalam detik
let timeLeft = WORK_TIME;
let timerInterval = null;

function updateTimerDisplay() {
    const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
    const seconds = String(timeLeft % 60).padStart(2, "0");
    document.getElementById("timer").textContent = minutes + ":" + seconds;
}

function startTimer() {
    if (timerInterval !== null) return; // cegah timer jalan dobel

    timerInterval = setInterval(function () {
        if (timeLeft > 0) {
            timeLeft--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
            alert("Waktu habis! Saatnya istirahat 🎉");
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = WORK_TIME;
    updateTimerDisplay();
}


/* ===== Daily Goal ===== */
// Tanggal hari ini, contoh: "2026-10-10"
function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" +
        String(d.getMonth() + 1).padStart(2, "0") + "-" +
        String(d.getDate()).padStart(2, "0");
}

function saveGoal() {
    const input = document.getElementById("goalInput");
    const text = input.value.trim();

    if (text === "") {
        alert("Tulis target hari ini dulu ya!");
        return;
    }

    store.set("sf_goal", { text: text, date: todayKey() });
    input.value = "";
    showGoal();
}

function showGoal() {
    const saved = store.get("sf_goal", null);
    const display = document.getElementById("goalDisplay");

    // target hanya ditampilkan kalau dibuat hari ini
    if (saved && saved.text && saved.date === todayKey()) {
        display.textContent = "Target hari ini: " + saved.text;
        display.classList.add("has-goal");
    } else {
        display.textContent = "Belum ada target hari ini.";
        display.classList.remove("has-goal");
    }
}


/* ===== To-Do List ===== */
// Baca tugas yang tersimpan (dibuat aman supaya data lama tidak bikin error)
function loadTasks() {
    const saved = store.get("sf_tasks", []);
    if (!Array.isArray(saved)) return [];

    return saved
        .map(function (t) {
            if (typeof t === "string") return { text: t.trim(), done: false };
            t = t || {};
            return {
                text: String(t.text || t.title || t.name || "").trim(),
                done: Boolean(t.done || t.completed)
            };
        })
        .filter(function (t) { return t.text !== ""; });
}

let tasks = loadTasks();

function addTask() {
    const input = document.getElementById("taskInput");
    const text = input.value.trim();

    if (text === "") {
        alert("Tulis tugasnya dulu ya!");
        return;
    }

    tasks.push({ text: text, done: false });
    input.value = "";
    input.focus();
    renderTasks();
}

function toggleTask(index) {
    tasks[index].done = !tasks[index].done;
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
}

function renderTasks() {
    const list = document.getElementById("taskList");
    list.innerHTML = "";

    if (tasks.length === 0) {
        const empty = document.createElement("li");
        empty.className = "empty";
        empty.textContent = "Belum ada tugas. Tambahkan satu di atas ✨";
        list.appendChild(empty);
    }

    tasks.forEach(function (task, index) {
        const li = document.createElement("li");
        if (task.done) li.classList.add("done");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.addEventListener("change", function () {
            toggleTask(index);
        });

        const span = document.createElement("span");
        span.textContent = task.text;

        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "delete-btn";
        delBtn.textContent = "🗑️";
        delBtn.title = "Hapus tugas";
        delBtn.setAttribute("aria-label", "Hapus tugas");
        delBtn.addEventListener("click", function () {
            deleteTask(index);
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(delBtn);
        list.appendChild(li);
    });

    store.set("sf_tasks", tasks); // simpan setiap ada perubahan
    updateProgress();
}

function updateProgress() {
    const total = tasks.length;
    const done = tasks.filter(function (t) { return t.done; }).length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);

    document.getElementById("progressText").textContent = percent + "%";
    document.getElementById("progressFill").style.width = percent + "%";
}


/* ===== Tombol Enter di kolom input ===== */
document.getElementById("taskInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") addTask();
});

document.getElementById("goalInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") saveGoal();
});


/* ===== Tampilan awal saat halaman dibuka ===== */
applyTheme(store.get("sf_theme", "dark") === "light" ? "light" : "dark");
updateTimerDisplay();
showGoal();
renderTasks();