// ==============================================
const URL_APPS_SCRIPT ='https://script.google.com/macros/s/AKfycbyKf5oXgBv3lj-SbXLzFdN3RqtmKeieUKx1vlpRvq8Nxtho0bS54tfvKXhKhONrEwWoBg/exec';
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/1UlbqKEqawFnwDfI42er8N7SpOVY7EL8oDaYvibhk-4w/edit?usp=sharing";
// ==============================================

let semuaData = [];

document.addEventListener("DOMContentLoaded", function() {
  // Tampilkan tanggal hari ini
  const hariIni = new Date().toLocaleDateString("id-ID", {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  document.getElementById("tanggalHari").textContent = hariIni;
  
  // Set jam sekarang otomatis
  document.getElementById("jamMasuk").value = new Date().toTimeString().slice(0,5);
  
  muatData();
  document.getElementById("formAbsen").addEventListener("submit", simpanAbsen);
  document.getElementById("btnSegar").addEventListener("click", muatData);
  document.getElementById("btnExport").addEventListener("click", exportCSV);
});

// Simpan Absen ke Google Sheet
async function simpanAbsen(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = "⏳ Mengirim...";
  btn.disabled = true;

  const data = {
    tanggal: new Date().toLocaleDateString("id-ID"),
    nama: document.getElementById("nama").value.trim(),
    kelas: document.getElementById("kelas").value,
    jam: document.getElementById("jamMasuk").value,
    status: document.getElementById("status").value,
    keterangan: document.getElementById("keterangan").value.trim() || "-"
  };

  try {
    await fetch(GOOGLE_SHEET_URL, {
      method: "POST",
      mode: "no-cors",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    });
    alert("✅ Absen berhasil dikirim! Terima kasih.");
    e.target.reset();
    document.getElementById("jamMasuk").value = new Date().toTimeString().slice(0,5);
    muatData();
  } catch (err) {
    alert("❌ Gagal mengirim: " + err.message);
  } finally {
    btn.textContent = "✅ KIRIM ABSEN";
    btn.disabled = false;
  }
}

// Muat Data dari Google Sheet
async function muatData() {
  const tabel = document.getElementById("tabelIsi");
  tabel.innerHTML = `<tr><td colspan="6" class="loading">⏳ Memuat data...</td></tr>`;
  
  try {
    const res = await fetch(GOOGLE_SHEET_URL);
    semuaData = await res.json();
    tampilkanData();
    hitungRingkasan();
  } catch (err) {
    tabel.innerHTML = `<tr><td colspan="6" class="loading">❌ Gagal memuat data</td></tr>`;
  }
}

// Tampilkan Data ke Tabel
function tampilkanData() {
  const tabel = document.getElementById("tabelIsi");
  tabel.innerHTML = "";
  if (semuaData.length <= 1) {
    tabel.innerHTML = `<tr><td colspan="6" class="loading">Belum ada data absen</td></tr>`;
    return;
  }
  // Tampilkan terbaru di atas
  const terbalik = semuaData.slice(1).reverse();
  terbalik.forEach(baris => {
    const status = baris[4] || "-";
    const statusKelas = `status-${status.toLowerCase()}`;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${baris[0] || "-"}</td>
      <td>${baris[1] || "-"}</td>
      <td>${baris[2] || "-"}</td>
      <td>${baris[3] || "-"}</td>
      <td><span class="${statusKelas}">${status}</span></td>
      <td>${baris[5] || "-"}</td>
    `;
    tabel.appendChild(tr);
  });
}

// Hitung Ringkasan Kehadiran
function hitungRingkasan() {
  let hadir=0, terlambat=0, sakit=0, izin=0, alfa=0;
  semuaData.slice(1).forEach(b => {
    const s = b[4];
    if (s === "Hadir") hadir++;
    else if (s === "Terlambat") terlambat++;
    else if (s === "Sakit") sakit++;
    else if (s === "Izin") izin++;
    else if (s === "Alfa") alfa++;
  });
  document.getElementById("jmlHadir").textContent = hadir;
  document.getElementById("jmlTerlambat").textContent = terlambat;
  document.getElementById("jmlSakit").textContent = sakit;
  document.getElementById("jmlIzin").textContent = izin;
  document.getElementById("jmlAlfa").textContent = alfa;
}

// Export ke CSV / Excel
function exportCSV() {
  if (semuaData.length < 2) return alert("Belum ada data untuk diekspor!");
  let csv = semuaData.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
  const blob = new Blob([csv], {type: "text/csv;charset=utf-8;"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AbsenPagi_${new Date().toLocaleDateString("id-ID")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
