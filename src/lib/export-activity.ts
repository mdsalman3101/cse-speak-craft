import type { RoomActivityRow } from "@/lib/community";

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "room"
  );
}

function whenText(iso: string) {
  return new Date(iso).toLocaleString();
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function exportActivityCsv(
  rows: RoomActivityRow[],
  labelFor: (row: RoomActivityRow) => string,
  roomTitle: string
) {
  const header = ["When", "Category", "Event", "Details", "By"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [whenText(r.created_at), r.category, labelFor(r), r.summary, r.actor_name]
        .map((v) => csvCell(String(v ?? "")))
        .join(",")
    ),
  ];
  download(
    new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }),
    `room-activity-${slugify(roomTitle)}.csv`
  );
}

export async function exportActivityPdf(
  rows: RoomActivityRow[],
  labelFor: (row: RoomActivityRow) => string,
  roomTitle: string
) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const marginX = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  let y = 56;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Room activity timeline", marginX, y);
  y += 20;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(roomTitle, marginX, y);
  y += 16;
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Exported ${new Date().toLocaleString()} · ${rows.length} events`, marginX, y);
  y += 22;
  doc.setTextColor(0);

  const nextPageIfNeeded = (needed: number) => {
    if (y + needed > pageHeight - 48) {
      doc.addPage();
      y = 56;
    }
  };

  for (const r of rows) {
    nextPageIfNeeded(52);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(labelFor(r), marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(whenText(r.created_at), marginX + maxWidth, y, { align: "right" });
    doc.setTextColor(0);
    y += 14;
    doc.setFontSize(10);
    const summary = doc.splitTextToSize(r.summary ?? "", maxWidth) as string[];
    for (const line of summary) {
      nextPageIfNeeded(16);
      doc.text(line, marginX, y);
      y += 13;
    }
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(`By ${r.actor_name}`, marginX, y);
    doc.setTextColor(0);
    y += 20;
  }

  doc.save(`room-activity-${slugify(roomTitle)}.pdf`);
}
