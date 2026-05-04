"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const ADMIN_PASSWORD = "admin2026";

function money(value: number) {
  return Number(value || 0).toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });
}

function percent(value: number) {
  return `${value.toFixed(1)}%`;
}

function monthLabel(value: string) {
  if (!value) return "All months";
  const [year, month] = value.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleString("en-CA", { month: "long", year: "numeric" });
}

function expenseAmount(invoice: any, key: string) {
  return Number(invoice?.raw_data?.form?.[key]?.amount || 0);
}

export default function DashboardPage() {
  const [adminInput, setAdminInput] = useState("");
  const [adminAuthorized, setAdminAuthorized] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedCourt, setSelectedCourt] = useState("");
  const [selectedMode, setSelectedMode] = useState("");
  const [sortBy, setSortBy] = useState("spend");

  useEffect(() => {
    const saved = sessionStorage.getItem("dashboard_access");
    if (saved === "true") setAdminAuthorized(true);
  }, []);

  useEffect(() => {
    if (adminAuthorized) fetchData();
  }, [adminAuthorized]);

  function handleAdminLogin() {
    if (adminInput === ADMIN_PASSWORD) {
      sessionStorage.setItem("dashboard_access", "true");
      setAdminAuthorized(true);
    } else {
      alert("Incorrect dashboard password");
    }
  }

  async function fetchData() {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) console.error(error);
    else setData(data || []);

    setLoading(false);
  }

  const availableMonths = useMemo(() => {
    return Array.from(
      new Set(
        data
          .map((invoice) => invoice.date_of_service?.slice(0, 7))
          .filter(Boolean)
      )
    ).sort((a: any, b: any) => b.localeCompare(a));
  }, [data]);

  const availableLanguages = useMemo(() => {
    return Array.from(new Set(data.map((i) => i.language).filter(Boolean))).sort();
  }, [data]);

  const availableCourts = useMemo(() => {
    return Array.from(new Set(data.map((i) => i.court_location).filter(Boolean))).sort();
  }, [data]);

  const availableModes = useMemo(() => {
    return Array.from(new Set(data.map((i) => i.mode).filter(Boolean))).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((invoice) => {
      const monthMatch = selectedMonth
        ? invoice.date_of_service?.startsWith(selectedMonth)
        : true;
      const languageMatch = selectedLanguage
        ? invoice.language === selectedLanguage
        : true;
      const courtMatch = selectedCourt
        ? invoice.court_location === selectedCourt
        : true;
      const modeMatch = selectedMode ? invoice.mode === selectedMode : true;

      return monthMatch && languageMatch && courtMatch && modeMatch;
    });
  }, [data, selectedMonth, selectedLanguage, selectedCourt, selectedMode]);

  const totalSpend = filteredData.reduce(
    (sum, invoice) => sum + Number(invoice.grand_total || 0),
    0
  );

  const totalInvoices = filteredData.length;

  const totalBillableHours = filteredData.reduce(
    (sum, invoice) => sum + Number(invoice.total_billable_hours || 0),
    0
  );

  const totalTravelTime = filteredData.reduce(
    (sum, invoice) => sum + Number(invoice.travel_time_hours || 0),
    0
  );

  const totalMileageKm = filteredData.reduce(
    (sum, invoice) => sum + Number(invoice.mileage_km || 0),
    0
  );

  const serviceFees = filteredData.reduce(
    (sum, invoice) => sum + Number(invoice.attendance_fee || 0),
    0
  );

  const travelTimeFees = filteredData.reduce(
    (sum, invoice) => sum + Number(invoice.travel_time_fee || 0),
    0
  );

  const mileageFees = filteredData.reduce(
    (sum, invoice) => sum + Number(invoice.mileage_fee || 0),
    0
  );

  const hstTotal = filteredData.reduce(
    (sum, invoice) => sum + Number(invoice.hst_amount || 0),
    0
  );

  const parkingTotal = filteredData.reduce(
    (sum, invoice) => sum + expenseAmount(invoice, "parking"),
    0
  );

  const transitTotal = filteredData.reduce(
    (sum, invoice) => sum + expenseAmount(invoice, "transit"),
    0
  );

  const breakfastTotal = filteredData.reduce(
    (sum, invoice) => sum + expenseAmount(invoice, "breakfast"),
    0
  );

  const lunchTotal = filteredData.reduce(
    (sum, invoice) => sum + expenseAmount(invoice, "lunch"),
    0
  );

  const dinnerTotal = filteredData.reduce(
    (sum, invoice) => sum + expenseAmount(invoice, "dinner"),
    0
  );

  const otherExpenseTotal = filteredData.reduce(
    (sum, invoice) => sum + expenseAmount(invoice, "otherExpense"),
    0
  );

  const mealTotal = breakfastTotal + lunchTotal + dinnerTotal;
  const receiptedExpenseTotal =
    parkingTotal + transitTotal + mealTotal + otherExpenseTotal;

  function groupBy(field: string) {
    const grouped = Object.values(
      filteredData.reduce((acc: any, item) => {
        const key = item[field] || "Unknown";
        acc[key] = acc[key] || { label: key, total: 0, count: 0 };
        acc[key].total += Number(item.grand_total || 0);
        acc[key].count += 1;
        return acc;
      }, {})
    );

    return grouped.sort((a: any, b: any) => {
      if (sortBy === "count") return b.count - a.count;
      if (sortBy === "name") return a.label.localeCompare(b.label);
      return b.total - a.total;
    });
  }

  const spendByLanguage = groupBy("language");
  const spendByCourt = groupBy("court_location");
  const spendByMode = groupBy("mode");

  const monthlyTrend = Object.values(
    data.reduce((acc: any, item) => {
      const month = item.date_of_service?.slice(0, 7);
      if (!month) return acc;

      acc[month] = acc[month] || { label: month, total: 0, count: 0 };
      acc[month].total += Number(item.grand_total || 0);
      acc[month].count += 1;

      return acc;
    }, {})
  ).sort((a: any, b: any) => b.label.localeCompare(a.label));

  const costBreakdown = [
    { label: "Interpreter service fees", total: serviceFees, count: totalInvoices },
    { label: "Travel time fees", total: travelTimeFees, count: totalInvoices },
    { label: "Mileage fees", total: mileageFees, count: totalInvoices },
    { label: "HST", total: hstTotal, count: totalInvoices },
    { label: "Meals", total: mealTotal, count: totalInvoices },
    { label: "Parking", total: parkingTotal, count: totalInvoices },
    { label: "Transit / TTC / GO / Presto", total: transitTotal, count: totalInvoices },
    { label: "Other approved expenses", total: otherExpenseTotal, count: totalInvoices },
  ].filter((item) => item.total > 0);

  const topLanguage: any = spendByLanguage[0];
  const topCourt: any = spendByCourt[0];
  const topMode: any = spendByMode[0];

  const travelShare = totalSpend > 0 ? (travelTimeFees / totalSpend) * 100 : 0;
  const expenseShare =
    totalSpend > 0 ? (receiptedExpenseTotal / totalSpend) * 100 : 0;
  const serviceShare = totalSpend > 0 ? (serviceFees / totalSpend) * 100 : 0;

  const insights = [
    topLanguage
      ? `${topLanguage.label} is the highest-spend language at ${money(
          topLanguage.total
        )}, representing ${percent((topLanguage.total / totalSpend) * 100)} of filtered spend.`
      : "No language data available.",
    topCourt
      ? `${topCourt.label} is the highest-spend courthouse at ${money(
          topCourt.total
        )}, representing ${percent((topCourt.total / totalSpend) * 100)} of filtered spend.`
      : "No courthouse data available.",
    `Interpreter service fees represent ${percent(serviceShare)} of filtered spend.`,
    `Travel time fees represent ${percent(travelShare)} of filtered spend.`,
    `Receipted expenses represent ${percent(expenseShare)} of filtered spend.`,
    topMode
      ? `${topMode.label} assignments account for ${money(
          topMode.total
        )} in filtered spend.`
      : "No mode data available.",
  ];

  function clearFilters() {
    setSelectedMonth("");
    setSelectedLanguage("");
    setSelectedCourt("");
    setSelectedMode("");
    setSortBy("spend");
  }

  function exportCSV() {
    const headers = [
      "Invoice Number",
      "Service Date",
      "Invoice Date",
      "Interpreter",
      "Language",
      "Court",
      "Mode",
      "Total Billable Hours",
      "Service Fees",
      "Travel Time Hours",
      "Travel Time Fees",
      "Mileage KM",
      "Mileage Fees",
      "Parking",
      "Transit",
      "Breakfast",
      "Lunch",
      "Dinner",
      "Other Expense",
      "HST",
      "Grand Total",
      "Notes",
    ];

    const rows = filteredData.map((invoice) => [
      invoice.invoice_number,
      invoice.date_of_service,
      invoice.invoice_date,
      invoice.interpreter_name,
      invoice.language,
      invoice.court_location,
      invoice.mode,
      invoice.total_billable_hours,
      invoice.attendance_fee,
      invoice.travel_time_hours,
      invoice.travel_time_fee,
      invoice.mileage_km,
      invoice.mileage_fee,
      expenseAmount(invoice, "parking"),
      expenseAmount(invoice, "transit"),
      expenseAmount(invoice, "breakfast"),
      expenseAmount(invoice, "lunch"),
      expenseAmount(invoice, "dinner"),
      expenseAmount(invoice, "otherExpense"),
      invoice.hst_amount,
      invoice.grand_total,
      invoice.special_notes,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const fileMonth = selectedMonth || "all-months";
    link.href = url;
    link.download = `interpreter-invoice-dashboard-${fileMonth}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  }

  if (!adminAuthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-blue-400">
            Interpreter Invoice
          </p>
          <h1 className="mt-2 text-2xl font-bold">Admin Dashboard Access</h1>
          <p className="mt-2 text-sm text-slate-400">
            Enter dashboard password to view reporting and analytics.
          </p>

          <input
            type="password"
            value={adminInput}
            onChange={(e) => setAdminInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdminLogin();
            }}
            placeholder="Dashboard password"
            className="mt-6 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
          />

          <button
            onClick={handleAdminLogin}
            className="mt-4 w-full rounded-2xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Enter Dashboard
          </button>

          <p className="mt-6 text-xs text-slate-500">
            Built by Bora Gurcay • Interpreter Invoice
          </p>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        Loading dashboard...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          main {
            background: white !important;
            color: black !important;
          }
          section,
          header,
          div {
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-sm print:border-black print:bg-white">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm font-semibold text-blue-400 print:text-black">
                Interpreter Invoice
              </p>
              <h1 className="mt-2 text-3xl font-bold">
                Interpreter Spend Report
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-400 print:text-black">
                Reporting period:{" "}
                <strong>
                  {selectedMonth ? monthLabel(selectedMonth) : "All available data"}
                </strong>
              </p>
              <p className="mt-1 max-w-2xl text-sm text-slate-400 print:text-black">
                Admin-only reporting for interpreter spend, language demand,
                courthouse activity, travel time, mileage, meals, expenses, and exports.
              </p>

              <div className="mt-4 flex flex-wrap gap-3 no-print">
                <button
                  onClick={exportCSV}
                  className="rounded-2xl bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800"
                >
                  Export Filtered CSV
                </button>

                <button
                  onClick={() => window.print()}
                  className="rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  Download / Print Monthly Report PDF
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:w-[520px] no-print">
              <SelectFilter label="Month" value={selectedMonth} onChange={setSelectedMonth} options={availableMonths} formatLabel={monthLabel} emptyLabel="All months" />
              <SelectFilter label="Language" value={selectedLanguage} onChange={setSelectedLanguage} options={availableLanguages} emptyLabel="All languages" />
              <SelectFilter label="Court" value={selectedCourt} onChange={setSelectedCourt} options={availableCourts} emptyLabel="All courts" />
              <SelectFilter label="Mode" value={selectedMode} onChange={setSelectedMode} options={availableModes} emptyLabel="All modes" />
              <SelectFilter
                label="Sort breakdowns by"
                value={sortBy}
                onChange={setSortBy}
                options={["spend", "count", "name"]}
                formatLabel={(v: string) =>
                  v === "spend"
                    ? "Highest spend"
                    : v === "count"
                    ? "Most invoices"
                    : "Alphabetical"
                }
                emptyLabel="Highest spend"
              />

              <button
                onClick={clearFilters}
                className="mt-6 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
              >
                Clear all filters
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total Spend" value={money(totalSpend)} />
          <MetricCard label="Invoices Saved" value={String(totalInvoices)} />
          <MetricCard label="Total Billable Hours" value={String(totalBillableHours)} />
          <MetricCard label="Travel Time Hours" value={String(totalTravelTime)} />
          <MetricCard label="Mileage Claimed" value={`${totalMileageKm} km`} />
          <MetricCard label="Receipted Expenses" value={money(receiptedExpenseTotal)} />
        </section>

        <TopInsights insights={insights} />

        <section className="grid gap-6 lg:grid-cols-2">
          <BreakdownCard title="Cost Category Breakdown" items={costBreakdown} />
          <BreakdownCard title="Monthly Trend" items={monthlyTrend} labelMode="month" />
          <BreakdownCard title="Spend by Language" items={spendByLanguage} />
          <BreakdownCard title="Spend by Court" items={spendByCourt} />
          <BreakdownCard title="Spend by Mode" items={spendByMode} />
          <RecentInvoices invoices={filteredData.slice(0, 10)} />
        </section>

        <footer className="pb-6 text-center text-xs text-slate-500 print:text-black">
          Built by Bora Gurcay • Interpreter Invoice
        </footer>
      </div>
    </main>
  );
}

function TopInsights({ insights }: any) {
  return (
    <section className="rounded-3xl border border-blue-900 bg-blue-950/30 p-5 shadow-sm print:border-black print:bg-white">
      <h2 className="mb-4 text-xl font-bold">Top Insights</h2>
      <ul className="space-y-2 text-sm text-blue-100 print:text-black">
        {insights.map((insight: string, index: number) => (
          <li key={index}>• {insight}</li>
        ))}
      </ul>
    </section>
  );
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
  emptyLabel,
  formatLabel,
}: any) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option: string) => (
          <option key={option} value={option}>
            {formatLabel ? formatLabel(option) : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function MetricCard({ label, value }: any) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-sm print:border-black print:bg-white">
      <p className="text-sm text-slate-400 print:text-black">{label}</p>
      <p className="mt-2 text-2xl font-bold print:text-black">{value}</p>
    </div>
  );
}

function BreakdownCard({ title, items, labelMode }: any) {
  const max = Math.max(...items.map((item: any) => item.total), 1);

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-sm print:border-black print:bg-white">
      <h2 className="mb-4 text-xl font-bold print:text-black">{title}</h2>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 print:text-black">No data yet.</p>
      ) : (
        <div className="space-y-4">
          {items.map((item: any) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm print:text-black">
                <span className="font-medium">
                  {labelMode === "month" ? monthLabel(item.label) : item.label}
                </span>
                <span>{money(item.total)} · {item.count} invoice{item.count === 1 ? "" : "s"}</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800 print:bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 print:bg-gray-700"
                  style={{
                    width: `${Math.max(5, (item.total / max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentInvoices({ invoices }: any) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-sm print:border-black print:bg-white">
      <h2 className="mb-4 text-xl font-bold print:text-black">Recent Invoices</h2>

      {invoices.length === 0 ? (
        <p className="text-sm text-slate-400 print:text-black">No invoices match filters.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm print:text-black">
            <thead>
              <tr>
                <th className="border-b border-slate-800 pb-2">Invoice</th>
                <th className="border-b border-slate-800 pb-2">Date</th>
                <th className="border-b border-slate-800 pb-2">Language</th>
                <th className="border-b border-slate-800 pb-2">Court</th>
                <th className="border-b border-slate-800 pb-2">Mode</th>
                <th className="border-b border-slate-800 pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice: any) => (
                <tr key={invoice.id}>
                  <td className="border-b border-slate-800 py-3">{invoice.invoice_number}</td>
                  <td className="border-b border-slate-800 py-3">{invoice.date_of_service}</td>
                  <td className="border-b border-slate-800 py-3">{invoice.language}</td>
                  <td className="border-b border-slate-800 py-3">{invoice.court_location}</td>
                  <td className="border-b border-slate-800 py-3">{invoice.mode}</td>
                  <td className="border-b border-slate-800 py-3 text-right font-semibold">
                    {money(Number(invoice.grand_total || 0))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}