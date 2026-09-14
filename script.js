// =====================================================
// URL WEB APP GOOGLE APPS SCRIPT
// =====================================================
// Tempel URL Web App Apps Script di antara tanda kutip.
// URL harus berakhiran /exec.
const URL_APPS_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwPOMEU32Ep5THANBKilZEEd1McDZ_reuRFx1CiKPBCj6XU9YrZOScBAUHUN42RmQLt7w/exec";

// =====================================================
// VARIABEL GLOBAL
// =====================================================
let semuaData = [];

// =====================================================
// SAAT HALAMAN SELESAI DIMUAT
// =====================================================
document.addEventListener("DOMContentLoaded", function () {
  const tanggalHari = document.getElementById("tanggalHari");
  const jamMasuk = document.getElementById("jamMasuk");
  const formAbsen = document.getElementById("formAbsen");
  const btnSegar = document.getElementById("btnSegar");
  const btnExport = document.getElementById("btnExport");

  if (tanggalHari) {
    tanggalHari.textContent = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  if (jamMasuk) {
    jamMasuk.value = waktuSekarang();
  }

  if (formAbsen) {
    formAbsen.addEventListener("submit", simpanAbsen);
  }

  if (btnSegar) {
    btnSegar.addEventListener("click", muatData);
  }

  if (btnExport) {
    btnExport.addEventListener("click", exportCSV);
  }

  muatData();
});

// =====================================================
// MENGAMBIL JAM SEKARANG
// =====================================================
function waktuSekarang() {
  return new Date().toTimeString().slice(0, 5);
}

// =====================================================
// MENAMPILKAN PESAN
// =====================================================
function tampilkanPesan(teks, tipe = "info") {
  const pesan = document.getElementById("pesan");

  if (!pesan) {
    alert(teks);
    return;
  }

  pesan.textContent = teks;
  pesan.className = tipe;
}

// =====================================================
// SIMPAN ABSEN KE GOOGLE SHEETS
// =====================================================
async function simpanAbsen(e) {
  e.preventDefault();

  const form = e.target;
  const tombol = form.querySelector('button[type="submit"]');

  const data = {
    tanggal: new Date().toLocaleDateString("id-ID"),
    nama: document.getElementById("nama").value.trim(),
    kelas: document.getElementById("kelas").value.trim(),
    jam: document.getElementById("jamMasuk").value,
    status: document.getElementById("status").value,
    keterangan:
      document.getElementById("keterangan").value.trim() || "-"
  };

  if (!data.nama || !data.kelas || !data.status) {
    tampilkanPesan(
      "Nama, kelas, dan status wajib diisi.",
      "error"
    );
    return;
  }

  if (tombol) {
    tombol.disabled = true;
    tombol.textContent = "⏳ Mengirim...";
  }

  try {
    await fetch(URL_APPS_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(data)
    });

    tampilkanPesan(
      "✅ Absen berhasil dikirim ke Google Sheets.",
      "sukses"
    );

    form.reset();

    const jamMasuk = document.getElementById("jamMasuk");

    if (jamMasuk) {
      jamMasuk.value = waktuSekarang();
    }

    await muatData();
  } catch (error) {
    console.error("Gagal mengirim data:", error);

    tampilkanPesan(
      "❌ Gagal mengirim data. Periksa URL Apps Script dan deployment.",
      "error"
    );
  } finally {
    if (tombol) {
      tombol.disabled = false;
      tombol.textContent = "✅ KIRIM ABSEN";
    }
  }
}

// =====================================================
// MEMUAT DATA DARI GOOGLE SHEETS
// =====================================================
async function muatData() {
  const tabel = document.getElementById("tabelIsi");

  if (!tabel) {
    return;
  }

  tabel.innerHTML = `
    <tr>
      <td colspan="6" class="loading">
        ⏳ Memuat data...
      </td>
    </tr>
  `;

  try {
    const response = await fetch(URL_APPS_SCRIPT);

    if (!response.ok) {
      throw new Error("Google Apps Script tidak merespons.");
    }

    semuaData = await response.json();

    if (!Array.isArray(semuaData)) {
      throw new Error("Format data Google Sheets tidak valid.");
    }

    tampilkanData();
    hitungRingkasan();
  } catch (error) {
    console.error("Gagal memuat data:", error);

    tabel.innerHTML = `
      <tr>
        <td colspan="6" class="loading">
          ❌ Gagal memuat data dari Google Sheets.
        </td>
      </tr>
    `;
  }
}

// =====================================================
// MENAMPILKAN DATA KE TABEL
// =====================================================
function tampilkanData() {
  const tabel = document.getElementById("tabelIsi");

  if (!tabel) {
    return;
  }

  tabel.innerHTML = "";

  if (!Array.isArray(semuaData) || semuaData.length <= 1) {
    tabel.innerHTML = `
      <tr>
        <td colspan="6" class="loading">
          Belum ada data absen.
        </td>
      </tr>
    `;
    return;
  }

  // Baris pertama dianggap sebagai judul kolom.
  // Data terbaru ditampilkan paling atas.
  const dataTerbaru = semuaData.slice(1).reverse();

  dataTerbaru.forEach(function (baris) {
    const tanggal = baris[0] || "-";
    const nama = baris[1] || "-";
    const kelas = baris[2] || "-";
    const jam = baris[3] || "-";
    const status = baris[4] || "-";
    const keterangan = baris[5] || "-";

    const statusKelas =
      "status-" + String(status)
        .toLowerCase()
        .replace(/\s+/g, "-");

    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${amanHTML(tanggal)}</td>
      <td>${amanHTML(nama)}</td>
      <td>${amanHTML(kelas)}</td>
      <td>${amanHTML(jam)}</td>
      <td>
        <span class="${statusKelas}">
          ${amanHTML(status)}
        </span>
      </td>
      <td>${amanHTML(keterangan)}</td>
    `;

    tabel.appendChild(tr);
  });
}

// =====================================================
// MENCEGAH DATA GOOGLE SHEETS MENJADI HTML
// =====================================================
function amanHTML(nilai) {
  const elemen = document.createElement("div");
  elemen.textContent = nilai === undefined || nilai === null
    ? "-"
    : nilai;

  return elemen.innerHTML;
}

// =====================================================
// MENGHITUNG RINGKASAN KEHADIRAN
// =====================================================
function hitungRingkasan() {
  let hadir = 0;
  let terlambat = 0;
  let sakit = 0;
  let izin = 0;
  let alpa = 0;

  semuaData.slice(1).forEach(function (baris) {
    const status = String(baris[4] || "").toLowerCase();

    if (status === "hadir") {
      hadir++;
    } else if (status === "terlambat") {
      terlambat++;
    } else if (status === "sakit") {
      sakit++;
    } else if (status === "izin") {
      izin++;
    } else if (status === "alpa" || status === "alfa") {
      alpa++;
    }
  });

  const jmlHadir = document.getElementById("jmlHadir");
  const jmlTerlambat = document.getElementById("jmlTerlambat");
  const jmlSakit = document.getElementById("jmlSakit");
  const jmlIzin = document.getElementById("jmlIzin");
  const jmlAlfa = document.getElementById("jmlAlfa");

  if (jmlHadir) jmlHadir.textContent = hadir;
  if (jmlTerlambat) jmlTerlambat.textContent = terlambat;
  if (jmlSakit) jmlSakit.textContent = sakit;
  if (jmlIzin) jmlIzin.textContent = izin;
  if (jmlAlfa) jmlAlfa.textContent = alpa;
}

// =====================================================
// EXPORT DATA KE CSV / EXCEL
// =====================================================
function exportCSV() {
  if (!Array.isArray(semuaData) || semuaData.length < 2) {
    alert("Belum ada data untuk diekspor!");
    return;
  }

  const csv = semuaData
    .map(function (baris) {
      return baris
        .map(function (sel) {
          return '"' + String(sel || "").replace(/"/g, '""') + '"';
        })
        .join(",");
    })
    .join("\n");

  const blob = new Blob(
    ["\ufeff" + csv],
    {
      type: "text/csv;charset=utf-8;"
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    "AbsenPagi_" +
    new Date()
      .toLocaleDateString("id-ID")
      .replace(/\//g, "-") +
    ".csv";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
