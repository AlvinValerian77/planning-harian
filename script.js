/** * ALVIN PLANNER PRO - FIREBASE EDITION
 * Fokus: Real-time Cloud Storage & UX Performance
 */

// 1. THEME MANAGER (Tetap menggunakan LocalStorage agar Load lebih instan)
let currentTheme = localStorage.getItem('alvin_theme') || 'light-mode';
document.body.className = currentTheme;
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function updateThemeVisuals() {
    themeIcon.className = document.body.classList.contains('dark-mode') ? 'bx bx-sun' : 'bx bx-moon';
}
updateThemeVisuals();

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('alvin_theme', document.body.className);
    updateThemeVisuals();
});

// 2. FIREBASE INTEGRATION
// Deklarasikan variabel di scope luar agar bisa diakses semua fungsi
let db, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc, colRef;

window.addEventListener('firebase-ready', () => {
    // Ambil tools setelah dipastikan siap
    const tools = window.dbTools;
    db = window.db;
    
    collection = tools.collection;
    addDoc = tools.addDoc;
    onSnapshot = tools.onSnapshot;
    deleteDoc = tools.deleteDoc;
    doc = tools.doc;
    updateDoc = tools.updateDoc;

    colRef = collection(db, 'tasks');
    
    console.log("Firebase sukses terhubung!");
    
    // Jalankan listener real-time di sini
    onSnapshot(colRef, (snapshot) => {
        let tasksFirebase = [];
        snapshot.docs.forEach(doc => {
            tasksFirebase.push({ ...doc.data(), id: doc.id });
        });
        render(tasksFirebase);
    });
});

function init() {
    updateClock();
    setInterval(updateClock, 1000);
    
    document.getElementById('taskInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    // onSnapshot sudah dipindah ke dalam listener 'firebase-ready' di atas
}

function updateClock() {
    const now = new Date();
    document.getElementById('liveTime').innerText = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('liveDate').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

// Tambah Tugas ke Firebase
async function addTask() {
    const input = document.getElementById('taskInput');
    const prioritySelect = document.getElementById('priorityInput');
    
    if (!input.value.trim()) return;

    // Pastikan dbTools ada sebelum eksekusi
    if (window.dbTools) {
        try {
            await window.dbTools.addDoc(window.dbTools.collection(window.db, 'tasks'), {
                text: input.value,
                priority: prioritySelect.value,
                completed: false,
                createdAt: Date.now()
            });
            input.value = '';
            prioritySelect.value = 'medium';
        } catch (err) {
            console.error("Gagal menambah data:", err);
        }
    }
}

// Update Status Selesai di Firebase
async function toggleTask(id, currentStatus) {
    const docRef = doc(db, 'tasks', id);
    if (!currentStatus) {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#007aff', '#ff4757', '#ffa502']
        });
    }
    
    try {
        await updateDoc(docRef, { completed: !currentStatus });
    } catch (err) {
        console.error("Gagal update status:", err);
    }
}

// Hapus Tugas dari Firebase
async function deleteTask(id) {
    try {
        const docRef = doc(db, 'tasks', id);
        await deleteDoc(docRef);
    } catch (err) {
        console.error("Gagal menghapus data:", err);
    }
}

// 3. RENDER ENGINE (Sorting Tetap Bekerja)
function render(tasksList) {
    const list = document.getElementById('taskList');
    list.innerHTML = '';
    let done = 0;

    // SORTING: Urgent > Normal > Low, Selesai di bawah
    const sorted = [...tasksList].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        const p = { high: 1, medium: 2, low: 3 };
        return p[a.priority] - p[b.priority];
    });

    sorted.forEach(t => {
        if (t.completed) done++;
        const li = document.createElement('li');
        li.className = `${t.completed ? 'completed' : ''} priority-${t.priority}`;
        li.innerHTML = `
            <div class="check-btn" onclick="toggleTask('${t.id}', ${t.completed})"></div>
            <span style="flex:1">${t.text}</span>
            <button class="btn-delete" onclick="deleteTask('${t.id}')"><i class='bx bx-trash'></i></button>
        `;
        list.appendChild(li);
    });

    // STATS UPDATE (Tetap Terkalkulasi Otomatis)
    const total = tasksList.length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('progressPercent').innerText = pct + '%';
    document.getElementById('progressBar').style.width = pct + '%';
    document.getElementById('taskCount').innerText = `${total} Total`;
    document.getElementById('doneCount').innerText = done;
    document.getElementById('userLevel').innerText = Math.floor(done / 5) + 1;
}

// Jalankan Aplikasi
init();