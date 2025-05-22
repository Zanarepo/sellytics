




// SalesDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import jsPDF from "jspdf";
import { format, startOfWeek, startOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CURRENCY_SYMBOLS = ["$", "€", "£", "¥", "₦"];
const ITEMS_PER_PAGE = 10;

export default function SalesDashboard() {
  const [visible, setVisible] = useState(false);

  // --- Data state ---
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState("₦");
  const [currentPage, setCurrentPage] = useState(1);
  const [showChart, setShowChart] = useState(false);

  // --- Load raw sales on mount ---
  useEffect(() => {
    const storeId = localStorage.getItem("store_id");
    async function load() {
      const { data, error } = await supabase
        .from("sales")
        .select(
          `product_id, quantity, unit_price, sold_at, products(name)`
        )
        .eq("store_id", storeId)
        .order("sold_at", { ascending: false });
      if (!error) {
        setSalesData(
          data.map((s) => ({
            productName: s.products.name,
            quantity: s.quantity,
            unitPrice: parseFloat(s.unit_price),
            soldAt: new Date(s.sold_at),
          }))
        );
      }
    }
    load();
  }, []);

  // --- Filter by date & search ---
  useEffect(() => {
    let d = salesData;
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      d = d.filter((x) => x.soldAt >= s);
    }
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      d = d.filter((x) => x.soldAt <= e);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      d = d.filter((x) => x.productName.toLowerCase().includes(q));
    }
    setFilteredData(d);
    setCurrentPage(1);
  }, [salesData, startDate, endDate, searchQuery]);

  // --- Summarize per product: sum(unitPrices)*sum(quantities) ---
  const summary = useMemo(() => {
    const m = {};
    filteredData.forEach(({ productName, quantity, unitPrice }) => {
      if (!m[productName]) m[productName] = { productName, totalQty: 0, priceSum: 0 };
      m[productName].totalQty += quantity;
      m[productName].priceSum += unitPrice;
    });
    return Object.values(m).map((item) => ({
      productName: item.productName,
      totalQty: item.totalQty,
      totalRevenue: item.priceSum * item.totalQty,
    }));
  }, [filteredData]);

  // --- Totals & pagination helpers ---
  const rangeTotal = useMemo(
    () => summary.reduce((sum, r) => sum + r.totalRevenue, 0),
    [summary]
  );
  const pageCount = Math.ceil(summary.length / ITEMS_PER_PAGE);
  const pageData = summary.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // --- Exports ---
  const formatCurrency = (v) => `${currency}${v.toFixed(2)}`;
  const downloadCSV = () => {
    const header = ["Product", "Qty Sold", "Total Revenue"];
    const rows = summary.map((r) => [
      r.productName,
      r.totalQty,
      r.totalRevenue.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sales_summary_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
  };
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text("Sales Summary Report", 14, y);
    y += 10;
    doc.setFontSize(10);
    doc.text(`Range: ${startDate || "—"} to ${endDate || "—"}`, 14, y);
    y += 10;
    summary.forEach((r) => {
      doc.text(
        `${r.productName} | Qty: ${r.totalQty} | Revenue: ${formatCurrency(
          r.totalRevenue
        )}`,
        14,
        y
      );
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`sales_summary_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  // --- Preset date ranges ---
  const applyPreset = (type) => {
    const today = new Date();
    let s = null;
    if (type === "today") s = today;
    else if (type === "7days") {
      s = new Date();
      s.setDate(today.getDate() - 6);
    } else if (type === "week") s = startOfWeek(today, { weekStartsOn: 1 });
    else if (type === "month") s = startOfMonth(today);
    setStartDate(format(s, "yyyy-MM-dd"));
    setEndDate(format(today, "yyyy-MM-dd"));
  };

  // --- If hidden, just show the button ---
  if (!visible) {
    return (
      <div className="flex justify-center p-4">
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-3 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Show Sales Summary
        </button>
      </div>
    );
  }

  // --- Full dashboard UI ---
  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 ">
      {/* Close control */}
      <div className="flex justify-end">
        <button
          onClick={() => setVisible(false)}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 dark:bg-gray-800 dark:text-white"
        >
          Close
        </button>
      </div>

      <h1 className="text-2xl font-bold text-center mb-4 dark:bg-gray-900 dark:text-white">Sales Summary</h1>

      {/* Presets & Date Range */}
      <div className="space-y-4 mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2 ">
          {[
            ["Today", "today"],
            ["Last 7 Days", "7days"],
            ["This Week", "week"],
            ["This Month", "month"],
          ].map(([label, key]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm whitespace-nowrap"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 ">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full p-2 border rounded dark:bg-gray-900 dark:text-white"
          />
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="px-4 py-2 bg-gray-200 rounded dark:bg-gray-900 dark:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Range Total */}
      <div className="text-right font-semibold mb-4 dark:bg-gray-900 dark:text-white">
        Total Revenue: {formatCurrency(rangeTotal)}
      </div>

      {/* Search & Currency */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-900 dark:text-white"
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="p-2 border rounded dark:bg-gray-900 dark:text-white"
        >
          {CURRENCY_SYMBOLS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg mb-6 dark:bg-gray-900 dark:text-white">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-200 dark:bg-gray-900 dark:text-indigo-500">
            <tr>
              {["Product", "Qty Sold", "Total Revenue"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-sm font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pageData.length > 0 ? (
              pageData.map((r) => (
                <tr key={r.productName}>
                  <td className="px-4 py-2 text-sm">{r.productName}</td>
                  <td className="px-4 py-2 text-sm">{r.totalQty}</td>
                  <td className="px-4 py-2 text-sm">
                    {formatCurrency(r.totalRevenue)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No sales in this range.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Prev
        </button>
        {[...Array(pageCount)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            {i + 1}
          </button>
        ))}
        <button
          onClick={() =>
            setCurrentPage((p) => Math.min(p + 1, pageCount))
          }
          disabled={currentPage === pageCount}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>

      {/* Exports & Chart Toggle */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          CSV
        </button>
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          PDF
        </button>
        <button
          onClick={() => setShowChart(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Chart
        </button>
      </div>

      {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Sales Summary Chart</h3>
              <button
                onClick={() => setShowChart(false)}
                className="text-gray-700 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={summary}>
                <XAxis dataKey="productName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Legend />
                <Bar dataKey="totalQty" name="Qty Sold" fill="#10B981" />
                <Bar dataKey="totalRevenue" name="Total Revenue" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}





















