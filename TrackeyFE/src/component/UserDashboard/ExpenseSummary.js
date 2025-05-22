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

export default function ExpenseTrackerDashboard() {
  // State
  const [expenses, setExpenses] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [timeframe, setTimeframe] = useState("daily");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch once
  useEffect(() => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) return;
    (async () => {
      const { data, error } = await supabase
        .from("expense_tracker")
        .select("expense_date, expense_type, amount, description")
        .eq("store_id", storeId)
        .order("expense_date", { ascending: false });
      if (error) console.error(error);
      else
        setExpenses(
          data.map((x) => ({
            ...x,
            expense_date: x.expense_date, // ISO date string
          }))
        );
    })();
  }, []);

  // Filter / search / date logic
  useEffect(() => {
    const lower = search.trim().toLowerCase();
    const manual = startDate !== "" || endDate !== "";
    const sd = startDate ? new Date(startDate) : null;
    let ed = endDate ? new Date(endDate) : null;
    if (ed) ed.setHours(23, 59, 59, 999);
    const tfStart = TIMEFRAMES[timeframe](new Date());

    const out = expenses.filter((e) => {
      // search
      if (
        !e.expense_type.toLowerCase().includes(lower) &&
        !e.description?.toLowerCase().includes(lower)
      )
        return false;
      // date
      const d = new Date(e.expense_date);
      if (manual) {
        if (sd && d < sd) return false;
        if (ed && d > ed) return false;
      } else {
        if (d < tfStart) return false;
      }
      return true;
    });

    setFiltered(out);
    setPage(1);
  }, [expenses, search, timeframe, startDate, endDate]);

  // total & pagination
  const total = useMemo(
    () => filtered.reduce((sum, e) => sum + parseFloat(e.amount), 0),
    [filtered]
  );
  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const pageData = useMemo(() => {
    const from = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(from, from + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // CSV export
  const downloadCSV = () => {
    const header = ["Date", "Type", "Amount", "Description"];
    const rows = filtered.map((e) => [
      format(new Date(e.expense_date), "yyyy-MM-dd"),
      e.expense_type,
      e.amount,
      `"${e.description || ""}"`,
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `expenses_${timeframe}_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
  };

  // PDF export
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Expense Tracker", 40, 40);
    doc.setFontSize(12);
    let y = 60;
    ["Date", "Type", "Amount", "Description"].forEach((h, i) =>
      doc.text(h, 20 + 40 * i, y)
    );
    y += 10;
    filtered.forEach((e) => {
      doc.text(format(new Date(e.expense_date), "yyyy-MM-dd"), 20, y);
      doc.text(e.expense_type, 60, y);
      doc.text(e.amount.toString(), 100, y);
      doc.text(e.description || "-", 140, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });
    doc.save(`expenses_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  // date presets
  const applyPreset = (k) => {
    const t = new Date();
    let s;
    if (k === "today") s = t;
    else if (k === "7days") {
      s = new Date();
      s.setDate(t.getDate() - 6);
    } else if (k === "week") s = startOfWeek(t, { weekStartsOn: 1 });
    else if (k === "month") s = startOfMonth(t);
    setStartDate(format(s, "yyyy-MM-dd"));
    setEndDate(format(t, "yyyy-MM-dd"));
  };

  return (
    <div className=" bg-white rounded shadow max-w-5xl mx-auto dark:bg-gray-900 ">
      {/* Header */}
      <div className="flex justify-between mb-4 dark:bg-gray-900 dark: text-white ">
        <h2 className="text-xl font-semibold">Expense Tracker</h2>
        <div className="text-lg font-bold">Total: ₦{total.toFixed(2)}</div>
      </div>

      {/* Presets & manual range */}
      <div className="mb-4 space-y-4">
  {/* Preset buttons: wrap on small devices */}
  <div className="flex flex-wrap gap-2 mb-2">
    {[
      ["Today", "today"],
      ["Last 7 Days", "7days"],
      ["This Week", "week"],
      ["This Month", "month"],
    ].map(([lbl, k]) => (
      <button
        key={k}
        onClick={() => applyPreset(k)}
        className="px-3 py-1 bg-indigo-600 text-white rounded flex-1 sm:flex-none text-center"
      >
        {lbl}
      </button>
    ))}
  </div>

  {/* Date inputs + Clear: column on xs, row on sm+ */}
  <div className="flex flex-col sm:flex-row gap-2 items-stretch">
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className="border p-2 rounded dark:bg-gray-900 dark:text-white flex-1"
    />
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      className="border p-2 rounded dark:bg-gray-900 dark:text-white flex-1"
    />
    <button
      onClick={() => {
        setStartDate("");
        setEndDate("");
      }}
      className="px-4 py-2 bg-gray-300 rounded dark:bg-gray-800 dark:text-white whitespace-nowrap"
    >
      Clear
    </button>
  </div>
</div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4 items-center ">
        {Object.keys(TIMEFRAMES).map((tf) => (
          <button
            key={tf}
            onClick={() => {
              setTimeframe(tf);
              setStartDate("");
              setEndDate("");
            }}
            className={`px-3 py-1 rounded  ${
              tf === timeframe ? "bg-indigo-600 text-white " : "bg-gray-200  dark:bg-gray-900 dark:text-white"
            }`}
          >
            {tf.charAt(0).toUpperCase() + tf.slice(1)}
          </button>
        ))}
        <input
          type="text"
          placeholder="Search type/description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-1 rounded flex-grow dark:bg-gray-900 dark:text-white"
        />
        <button
          onClick={downloadCSV}
          className="px-3 py-1 bg-green-600 text-white rounded"
        >
          CSV
        </button>
        <button
          onClick={downloadPDF}
          className="px-3 py-1 bg-red-600 text-white rounded"
        >
          PDF
        </button>
        <button
          onClick={() => setShowChart(true)}
          className="px-3 py-1 bg-indigo-600 text-white rounded"
        >
          Chart
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto  dark:bg-gray-900 dark:text-white">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100  dark:bg-gray-900 dark:text-indigo-600">
              {["Date", "Type", "Amount", "Description"].map((h) => (
                <th key={h} className="px-3 py-1 text-left border">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.map((e, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-1 border">
                  {format(new Date(e.expense_date), "yyyy-MM-dd")}
                </td>
                <td className="px-3 py-1 border">{e.expense_type}</td>
                <td className="px-3 py-1 border">₦{e.amount}</td>
                <td className="px-3 py-1 border">{e.description || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-2  dark:bg-gray-900 dark:text-white">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50  dark:bg-gray-800 dark:text-white"
        >
          Prev
        </button>
        <span>
          Page {page} of {pageCount}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
          disabled={page === pageCount}
          className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50  dark:bg-gray-800 dark:text-white"
        >
          Next
        </button>
      </div>

      {/* Chart Modal */}
      {showChart && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4">
          <div className="bg-white rounded shadow p-4 w-full max-w-md dark:bg-gray-900 dark:text-white">
            <div className="flex justify-between mb-2">
              <h3 className="font-semibold">Expense by Type</h3>
              <button onClick={() => setShowChart(false)}>Close</button>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={Object.entries(
                    filtered.reduce((acc, e) => {
                      acc[e.expense_type] = (acc[e.expense_type] || 0) + parseFloat(e.amount);
                      return acc;
                    }, {})
                  ).map(([type, amt]) => ({ type, amt }))}
                >
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip formatter={(v) => `₦${v}`} />
                  <Bar dataKey="amt" fill="#3182CE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
