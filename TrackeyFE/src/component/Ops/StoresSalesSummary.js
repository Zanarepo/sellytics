// SalesDashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import jsPDF from "jspdf";
import { format, startOfWeek, startOfMonth } from "date-fns";
import SalesSummary from "./SalesSummary";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CURRENCY_SYMBOLS = ["$", "€", "£", "¥", "₦"];
const ITEMS_PER_PAGE = 10;

export default function SalesDashboard() {
  // --- State ---
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState("₦");
  const [currentPage, setCurrentPage] = useState(1);
  const [showChart, setShowChart] = useState(false);

  // --- Fetch sales once on mount ---
  useEffect(() => {
    const storeId = localStorage.getItem("store_id");
    async function load() {
      const { data, error } = await supabase
        .from("dynamic_sales")
        .select(`dynamic_product_id, quantity, unit_price, sold_at, dynamic_product(name)`)
        .eq("store_id", storeId)
        .order("sold_at", { ascending: false });
      if (!error) {
        setSalesData(
          data.map((s) => ({
            productName: s.dynamic_product.name,
            quantity: s.quantity,
            unitPrice: parseFloat(s.unit_price),
            totalSales: s.quantity * parseFloat(s.unit_price),
            soldAt: new Date(s.sold_at),
          }))
        );
      }
    }
    load();
  }, []);

  // --- Filter whenever date range or search changes ---
  useEffect(() => {
    let d = salesData;

    // filter by startDate
    if (startDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      d = d.filter((sld) => sld.soldAt >= s);
    }
    // filter by endDate
    if (endDate) {
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      d = d.filter((sld) => sld.soldAt <= e);
    }
    // filter by search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      d = d.filter((s) =>
        s.productName.toLowerCase().includes(q)
      );
    }

    setFilteredData(d);
    setCurrentPage(1);
  }, [salesData, startDate, endDate, searchQuery]);

  // --- Compute sum for current filtered range ---
  const rangeTotal = useMemo(
    () =>
      filteredData.reduce((sum, s) => sum + s.totalSales, 0),
    [filteredData]
  );

  // --- Pagination ---
  const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  // --- Helpers ---
  const formatCurrency = (v) => `${currency}${v.toFixed(2)}`;

  // --- Preset handlers ---
  const applyPreset = (type) => {
    const today = new Date();
    let s = null;
    if (type === "today") {
      s = today;
    } else if (type === "7days") {
      s = new Date();
      s.setDate(today.getDate() - 6);
    } else if (type === "week") {
      s = startOfWeek(today, { weekStartsOn: 1 });
    } else if (type === "month") {
      s = startOfMonth(today);
    }
    setStartDate(format(s, "yyyy-MM-dd"));
    setEndDate(format(today, "yyyy-MM-dd"));
  };

  // --- Exports ---
  const downloadCSV = () => {
    const header = ["Date","Product","Unit Price","Qty","Total"];
    const rows = filteredData.map((s) => [
      format(s.soldAt, "yyyy-MM-dd"),
      s.productName,
      s.unitPrice.toFixed(2),
      s.quantity,
      s.totalSales.toFixed(2),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `sales_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
  };
  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(18);
    doc.text("Sales Report", 14, y);
    y += 10;
    doc.setFontSize(10);
    filteredData.forEach((s) => {
      doc.text(
        `${format(s.soldAt, "yyyy-MM-dd")} | ${s.productName} | ${formatCurrency(
          s.unitPrice
        )} | ${s.quantity} | ${formatCurrency(s.totalSales)}`,
        14,
        y
      );
      y += 6;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`sales_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <div className="max-w-5xl mx-auto p-0 dark:bg-gray-900 dark:text-white">
       <SalesSummary/>
      {/* Heading */}
      <h1 className="text-2xl font-bold text-center mb-4 dark:bg-gray-900 dark:text-white">
        Sales Dashboard
      </h1>

      {/* Presets & Range Picker */}
      <div className="space-y-4 mb-4">
  {/* Presets: horizontal scroll on mobile, wrap on desktop */}
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
        className="flex-shrink-0 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm whitespace-nowrap "
      >
        {label}
      </button>
    ))}
  </div>

  {/* Date inputs + Clear: stack on mobile, row on desktop */}
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 ">
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white"
    />
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white"
    />
    <button
      onClick={() => {
        setStartDate("");
        setEndDate("");
      }}
      className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
    >
      Clear
    </button>
  </div>
</div>


      {/* Total for Range */}
      <div className="text-right font-semibold mb-4 dark:bg-gray-900 dark:text-white">
        Total for range: {formatCurrency(rangeTotal)}
      </div>

      {/* Search & Currency */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <input
          type="text"
          placeholder="Search product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full sm:flex-1 p-2 border rounded dark:bg-gray-800 dark:text-white"
        />
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="w-full sm:w-auto p-2 border rounded dark:bg-gray-800 dark:text-white"
        >
          {CURRENCY_SYMBOLS.map((sym) => (
            <option key={sym} value={sym}>
              {sym}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 ">
          <thead className="bg-gray-200 dark:bg-gray-800 dark:text-indigo-500">
            <tr>
              {["Date", "Product", "Unit Price", "Qty", "Total"].map((h) => (
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
            {pageData.map((s, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:bg-gray-800 dark:text-white">
                <td className="px-4 py-2 text-sm">
                  {format(s.soldAt, "yyyy-MM-dd")}
                </td>
                <td className="px-4 py-2 text-sm">{s.productName}</td>
                <td className="px-4 py-2 text-sm">
                  {formatCurrency(s.unitPrice)}
                </td>
                <td className="px-4 py-2 text-sm">{s.quantity}</td>
                <td className="px-4 py-2 text-sm">
                  {formatCurrency(s.totalSales)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap justify-center gap-2 mt-4 dark:bg-gray-900 dark:text-indigo-500">
        <button
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 "
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

      {/* Exports & Chart */}
      <div className="flex flex-wrap justify-center gap-4 mt-6">
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          CSV
        </button>
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          PDF
        </button>
        <button
          onClick={() => setShowChart(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Chart
        </button>
      </div>

      {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Sales by Product</h3>
              <button
                onClick={() => setShowChart(false)}
                className="text-gray-700 hover:text-gray-900"
              >
                &times;
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filteredData}>
                <XAxis dataKey="productName" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Bar dataKey="totalSales" fill="#6366F1" />
              </BarChart>
            </ResponsiveContainer>
           
          </div>
         
        </div>
      )}
    </div>
  );
}
