import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatIDR, formatDate } from "@/lib/utils";
import { parseISO, format } from "date-fns";
import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const dynamic = "force-dynamic";

async function loadData(from: Date, to: Date) {
  const [paid, expenses] = await Promise.all([
    prisma.order.findMany({
      where: { statusBayar: "LUNAS", paidAt: { gte: from, lte: to } },
      select: {
        noOrder: true,
        total: true,
        paidAt: true,
        customer: { select: { nama: true, noHp: true } },
      },
      orderBy: { paidAt: "asc" },
    }),
    prisma.expense.findMany({
      where: { tanggal: { gte: from, lte: to } },
      select: {
        kategori: true,
        jumlah: true,
        keterangan: true,
        tanggal: true,
        createdBy: { select: { nama: true } },
      },
      orderBy: { tanggal: "asc" },
    }),
  ]);
  const income = paid.reduce((a, o) => a + o.total, 0);
  const expenseSum = expenses.reduce((a, e) => a + e.jumlah, 0);
  return { paid, expenses, income, expenseSum, laba: income - expenseSum };
}

type ReportData = Awaited<ReturnType<typeof loadData>>;

async function buildExcel(data: ReportData, from: Date, to: Date) {
  const wb = new ExcelJS.Workbook();

  const summary = wb.addWorksheet("Ringkasan");
  summary.columns = [{ width: 32 }, { width: 24 }];
  const header = summary.addRow(["LAPORAN KEUANGAN LAUNDRYKU"]);
  header.getCell(1).font = { bold: true, size: 14 };
  summary.addRow([
    "Periode",
    `${format(from, "yyyy-MM-dd")} hingga ${format(to, "yyyy-MM-dd")}`,
  ]);
  const incRow = summary.addRow(["Pemasukan", data.income]);
  const expRow = summary.addRow(["Pengeluaran", data.expenseSum]);
  const labaRow = summary.addRow(["Laba Bersih", data.laba]);
  [incRow, expRow, labaRow].forEach((r) => {
    r.getCell(1).font = { bold: true };
    r.getCell(2).numFmt = "#,##0";
  });

  const inc = wb.addWorksheet("Pemasukan");
  inc.columns = [
    { header: "No. Order", key: "no", width: 18 },
    { header: "Pelanggan", key: "cust", width: 25 },
    { header: "No. HP", key: "hp", width: 18 },
    { header: "Tanggal Bayar", key: "date", width: 14 },
    { header: "Jumlah", key: "total", width: 16 },
  ];
  for (const o of data.paid) {
    inc.addRow({
      no: o.noOrder,
      cust: o.customer.nama,
      hp: o.customer.noHp,
      date: o.paidAt ? formatDate(o.paidAt) : "-",
      total: o.total,
    });
  }
  inc.getColumn("total").alignment = { horizontal: "right" };
  const incTotal = inc.addRow({ no: "", cust: "", hp: "", date: "TOTAL", total: data.income });
  incTotal.font = { bold: true };

  const ex = wb.addWorksheet("Pengeluaran");
  ex.columns = [
    { header: "Tanggal", key: "date", width: 14 },
    { header: "Kategori", key: "cat", width: 22 },
    { header: "Keterangan", key: "desc", width: 35 },
    { header: "Oleh", key: "by", width: 20 },
    { header: "Jumlah", key: "total", width: 16 },
  ];
  for (const e of data.expenses) {
    ex.addRow({
      date: formatDate(e.tanggal),
      cat: e.kategori,
      desc: e.keterangan ?? "-",
      by: e.createdBy.nama,
      total: e.jumlah,
    });
  }
  ex.getColumn("total").alignment = { horizontal: "right" };
  const exTotal = ex.addRow({ date: "", cat: "", desc: "", by: "TOTAL", total: data.expenseSum });
  exTotal.font = { bold: true };

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

async function buildPdf(data: ReportData, from: Date, to: Date) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([595, 842]);
  let y = 800;

  const write = (
    text: string,
    size = 11,
    f = font,
    color = rgb(0, 0, 0),
    x = 50
  ) => {
    page.drawText(text, { x, y, size, font: f, color });
    y -= size + 7;
  };
  const newline = (h = 10) => {
    y -= h;
  };
  const checkPage = () => {
    if (y < 80) {
      page = doc.addPage([595, 842]);
      y = 800;
    }
  };

  write("LAPORAN KEUANGAN LAUNDRYKU", 18, bold);
  write(
    `Periode: ${format(from, "d MMMM yyyy")} - ${format(to, "d MMMM yyyy")}`,
    11,
    font,
    rgb(0.35, 0.35, 0.35)
  );
  newline();
  write(`Pemasukan     : ${formatIDR(data.income)}`, 12, bold, rgb(0.05, 0.5, 0.4));
  write(`Pengeluaran   : ${formatIDR(data.expenseSum)}`, 12, bold, rgb(0.8, 0.2, 0.3));
  write(
    `Laba Bersih   : ${formatIDR(data.laba)}`,
    12,
    bold,
    data.laba >= 0 ? rgb(0.05, 0.5, 0.4) : rgb(0.8, 0.2, 0.3)
  );
  newline(14);

  write("RINCIAN PEMASUKAN", 13, bold);
  for (const o of data.paid) {
    checkPage();
    write(
      `${o.noOrder}  ${o.customer.nama}  -  ${o.paidAt ? formatDate(o.paidAt) : "-"}  -  ${formatIDR(o.total)}`
    );
  }
  newline(8);
  write("RINCIAN PENGELUARAN", 13, bold);
  for (const e of data.expenses) {
    checkPage();
    write(
      `${formatDate(e.tanggal)}  ${e.kategori}  -  ${e.keterangan ?? ""}  -  ${formatIDR(e.jumlah)}`
    );
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") === "pdf" ? "pdf" : "xlsx";
  const toParam = searchParams.get("to");
  const to = toParam && parseISO(toParam).toString() !== "Invalid Date" ? parseISO(toParam) : new Date();
  const from =
    searchParams.get("from") &&
      parseISO(searchParams.get("from")!.toString()).toString() !== "Invalid Date"
      ? parseISO(searchParams.get("from")!.toString())
      : new Date(to.getFullYear(), to.getMonth(), 1);
  to.setHours(23, 59, 59, 999);
  from.setHours(0, 0, 0, 0);

  const data = await loadData(from, to);
  const fileName = `laporan-keuangan-${format(from, "yyyyMMdd")}-${format(to, "yyyyMMdd")}`;

  if (type === "pdf") {
    const buf = await buildPdf(data, from, to);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}.pdf"`,
      },
    });
  }

  const buf = await buildExcel(data, from, to);
  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
    },
  });
}