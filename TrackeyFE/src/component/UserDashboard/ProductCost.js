import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../supabaseClient";
import jsPDF from "jspdf";
import { format, startOfDay, startOfWeek, startOfMonth } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const TIMEFRAMES = {
  daily: (d) => startOfDay(d),
  weekly: (d) => startOfWeek(d, { weekStartsOn: 1 }),
  monthly: (d) => startOfMonth(d),
};

const CURRENCY_OPTIONS = [
  { code: "NGN", symbol: "₦" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
];

export default function ProductCostsDashboard() {
  // ─── State Hooks ─────────────────────────────────────────────────────────────
  const [productData, setProductData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeframe, setTimeframe] = useState("daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [currency, setCurrency] = useState(
    localStorage.getItem("currency") || "NGN"
  );
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // ─── 1) Fetch all products once ────────────────────────────────────────────────
  useEffect(() => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) return;

    (async () => {
      const { data, error } = await supabase
        .from("dynamic_product")
        .select("name, purchase_price, created_at")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
        return;
      }
      setProductData(
        data.map((p) => ({
          name: p.name,
          price: parseFloat(p.purchase_price),
          date: p.created_at,
        }))
      );
    })();
  }, []);

  // ─── 2) Filter / Search / Date logic ────────────────────────────────────────────
  useEffect(() => {
    const lower = searchQuery.trim().toLowerCase();
    const manual = startDate !== "" || endDate !== "";
    const sd = startDate ? new Date(startDate) : null;
    let ed = endDate ? new Date(endDate) : null;
    if (ed) {
      // expand to end of that day
      ed.setHours(23, 59, 59, 999);
    }
    const tfStart = TIMEFRAMES[timeframe](new Date());

    const out = productData.filter((item) => {
      // name filter
      if (!item.name.toLowerCase().includes(lower)) return false;
      const d = new Date(item.date);
      // date filter
      if (manual) {
        if (sd && d < sd) return false;
        if (ed && d > ed) return false;
      } else {
        if (d < tfStart) return false;
      }
      return true;
    });

    setFilteredData(out);
    setCurrentPage(1);
  }, [productData, searchQuery, timeframe, startDate, endDate]);

  // ─── 3) Totals & Pagination ──────────────────────────────────────────────────
  const grandTotal = useMemo(
    () => filteredData.reduce((sum, x) => sum + x.price, 0),
    [filteredData]
  );
  const pageCount = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const from = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(from, from + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const currencySymbol =
    CURRENCY_OPTIONS.find((c) => c.code === currency)?.symbol || "";

  // ─── 4) Export Handlers ──────────────────────────────────────────────────────
  const downloadCSV = () => {
    const header = ["Product", `Price (${currencySymbol})`, "Date"];
    const rows = filteredData.map((d) => [
      d.name,
      d.price.toFixed(2),
      format(new Date(d.date), "yyyy-MM-dd"),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `product_costs_${timeframe}_${currency}_${format(
      new Date(),
      "yyyyMMdd"
    )}.csv`;
    link.click();
  };

  const downloadPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFontSize(18);
    doc.text(`Product Costs (${timeframe.toUpperCase()})`, 40, 60);
    doc.setFontSize(12);
    let y = 100;
    ["Product", `Price (${currencySymbol})`, "Date"].forEach((h, i) => {
      doc.text(h, 50 + 150 * i, y);
    });
    y += 20;
    filteredData.forEach((r) => {
      doc.text(r.name, 50, y);
      doc.text(r.price.toFixed(2), 200, y);
      doc.text(format(new Date(r.date), "yyyy-MM-dd"), 350, y);
      y += 20;
      if (y > 700) {
        doc.addPage();
        y = 60;
      }
    });
    doc.save(`product_costs_${timeframe}_${currency}_${format(
      new Date(),
      "yyyyMMdd"
    )}.pdf`);
  };

  // ─── 5) Date‐preset Helper ───────────────────────────────────────────────────
  const applyPreset = (key) => {
    const today = new Date();
    let s;
    if (key === "today") s = today;
    else if (key === "7days") {
      s = new Date();
      s.setDate(today.getDate() - 6);
    } else if (key === "week") s = startOfWeek(today, { weekStartsOn: 1 });
    else if (key === "month") s = startOfMonth(today);

    setStartDate(format(s, "yyyy-MM-dd"));
    setEndDate(format(today, "yyyy-MM-dd"));
  };

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto p-4 mt-8 bg-white dark:bg-gray-900 rounded-lg shadow ">
      {/* Header & Total */}
      <div className="flex flex-col md:flex-row md:justify-between mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
      
        </p>
        <div className="bg-indigo-50 text-indigo-800 px-4 py-2 rounded-lg font-semibold dark:bg-gray-800 dark:text-white">
          Total: {currencySymbol}
          {grandTotal.toFixed(2)}
        </div>
      </div>

      {/* Sales Summary Title */}
      <h1 className="text-2xl font-bold mb-4 dark:text-white">
        Products Purchase Cost Summary
      </h1>

      {/* Presets & Manual Range */}
      <div className="space-y-4 mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {[
            ["Today", "today"],
            ["Last 7 Days", "7days"],
            ["This Week", "week"],
            ["This Month", "month"],
          ].map(([lbl, k]) => (
            <button
              key={k}
              onClick={() => applyPreset(k)}
              className="flex-shrink-0 px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm whitespace-nowrap"
            >
              {lbl}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 ">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded p-2 dark:bg-gray-800 dark:text-white"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded p-2 dark:bg-gray-800 dark:text-white "
          />
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="px-4 py-2 bg-gray-200 rounded dark:bg-gray-700 dark:text-white dark:bg-gray-800 dark:text-white"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Controls (Timeframe, Search, Currency) */}
      <div className="flex flex-wrap gap-2 mb-4 dark:bg-gray-800 dark:text-gray-900">
        {Object.keys(TIMEFRAMES).map((tf) => (
          <button
            key={tf}
            onClick={() => {
              setTimeframe(tf);
              setStartDate("");
              setEndDate("");
            }}
            className={`px-4 py-2 rounded-lg font-medium ${
              tf === timeframe
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 hover:bg-indigo-100"
            }`}
          >
            {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search product..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border rounded px-4 py-2 dark:bg-gray-800 dark:text-white"
        />
        <select
          value={currency}
          onChange={(e) => {
            setCurrency(e.target.value);
            localStorage.setItem("currency", e.target.value);
          }}
          className="border rounded px-4 py-2 dark:bg-gray-800 dark:text-white"
        >
          {CURRENCY_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </select>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadowdark:bg-gray-800 dark:text-white">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-200 dark:bg-gray-700 dark:bg-gray-800 dark:text-indigo-500">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold uppercase">
                Product
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold uppercase">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
            {paginated.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 ">
                <td className="px-6 py-4 dark:text-white">{row.name}</td>
                <td className="px-6 py-4 text-right dark:text-gray-300">
                  {currencySymbol}
                  {row.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right dark:text-gray-300">
                  {format(new Date(row.date), "yyyy-MM-dd")}
                </td>
              </tr>
            ))}
          </tbody>
         
        </table>
      </div>


      <tfoot className="bg-white dark:bg-gray-700">
            <tr>
              <td
                colSpan={2}
                className="px-6 py-3 text-right font-medium dark:text-white"
              >
                Page {currentPage} of {pageCount}
              </td>
              <td className="px-6 py-3 text-right space-x-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 dark:text-gray-300"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(pageCount, p + 1))
                  }
                  disabled={currentPage === pageCount}
                  className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 dark:text-gray-300"
                >
                  Next
                </button>
              </td>
            </tr>
          </tfoot>

      {/* Actions */}
      <div className="flex flex-wrap gap-4 mt-6">
        <button
          onClick={downloadCSV}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          Export CSV
        </button>
        <button
          onClick={downloadPDF}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Export PDF
        </button>
        <button
          onClick={() => setShowChart(true)}
          className="px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
        >
          View Chart
        </button>
      </div>

      {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold dark:text-white">
                Purchase Costs by Product
              </h3>
              <button
                onClick={() => setShowChart(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300"
              >
                Close
              </button>
            </div>
            <div className="h-64 md:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={filteredData}
                  margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                >
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(val) => `${currencySymbol}${val.toFixed(2)}`}
                  />
                  <Bar dataKey="price" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
