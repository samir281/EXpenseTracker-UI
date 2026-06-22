// Export helpers — CSV / Excel / PDF. Amounts are exported as plain numbers
// (no ₹) so spreadsheets keep them numeric and PDF fonts render cleanly.
//
// xlsx and jspdf are heavy, so they're loaded on demand (dynamic import) only
// when the user actually picks Excel/PDF — keeping the initial bundle small.
// CSV needs no library and stays instant.

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function exportCSV(filename, headers, rows) {
  const esc = v => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers, ...rows].map(r => r.map(esc).join(",")).join("\n");
  downloadBlob(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), filename + ".csv");
}

async function exportExcel(filename, headers, rows) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filename + ".xlsx");
}

async function exportPDF(filename, title, headers, rows) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF();
  if (title) { doc.setFontSize(13); doc.text(title, 14, 16); }
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 22 : 14,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [200, 169, 81] },
  });
  doc.save(filename + ".pdf");
}

// format: "csv" | "excel" | "pdf". Returns a promise (excel/pdf load lazily).
export async function exportTable(format, { filename, title, headers, rows }) {
  if (format === "csv") return exportCSV(filename, headers, rows);
  if (format === "excel") return exportExcel(filename, headers, rows);
  if (format === "pdf") return exportPDF(filename, title, headers, rows);
}
