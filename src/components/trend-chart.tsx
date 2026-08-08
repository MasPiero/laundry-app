"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { formatIDR } from "@/lib/utils";

export type TrendPoint = {
  label: string;
  Masuk: number;
  Keluar: number;
};

function formatCompact(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}jt`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}rb`;
  return String(n);
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} />
        <YAxis tickFormatter={formatCompact} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} width={45} />
        <Tooltip
          formatter={(value, name) => [formatIDR(Number(value ?? 0)), String(name)]}
          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 13 }}
          cursor={{ fill: "#f1f5f9" }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Bar dataKey="Masuk" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={10} name="Pemasukan" />
        <Bar dataKey="Keluar" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={10} name="Pengeluaran" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}