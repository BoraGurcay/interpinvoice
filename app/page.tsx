"use client";

import { useMemo, useState } from "react";

const COURTS = [
  { label: "10 Armoury Street, Toronto OCJ", code: "4810" },
  { label: "1911 Eglinton Avenue East, Toronto", code: "4813" },
  { label: "1000 Finch Avenue West, Toronto", code: "4814" },
  { label: "2201 Finch Avenue West, Toronto", code: "4815" },
  { label: "Old City Hall, Toronto", code: "4811" },
  { label: "College Park (444 Yonge St), Toronto", code: "4817" },
  { label: "361/393/330 University Ave & 130 Queen St (Court of Appeal)", code: "4899" },
  { label: "311 Jarvis Street, Toronto", code: "4821" },
  { label: "47 Sheppard Avenue East, Toronto", code: "4831" },
  { label: "Other / Manual entry", code: "OTHR" },
];

const LANGUAGES = [
  "Turkish",
  "Arabic",
  "French",
  "Spanish",
  "Portuguese",
  "Mandarin",
  "Tamil",
  "Punjabi",
  "Tagalog",
  "Somali",
  "Urdu",
  "Farsi",
  "Vietnamese",
  "Polish",
  "Other",
];

const RATES = {
  inPersonHourly: 70,
  remoteHourly: 60,
  halfDayMinimumHours: 3,
  fullDayMinimumHours: 6,
  mileageRegularRate: 0.40,
  mileageReducedRate: 0.29,
  mileageAnnualThresholdKm: 5000,
  hstRate: 0.13,
};

const emptyReceipt = {
  selected: false,
  amount: "",
  fileName: "",
};

function toMinutes(value: string) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function money(value: number | string) {
  const number = Number(value || 0);
  return number.toLocaleString("en-CA", {
    style: "currency",
    currency: "CAD",
  });
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  const first = parts[0]?.[0]?.toUpperCase() || "X";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() : "X";
  return `${first}${last}`;
}

function dateCode(dateValue: string) {
  if (!dateValue) return "DDMMYY";
  const [year, month, day] = dateValue.split("-");
  return `${day}${month}${year.slice(-2)}`;
}

function getCourtCode(courtLabel: string) {
  return COURTS.find((court) => court.label === courtLabel)?.code || "OTHR";
}

function generateInvoiceNumber(name: string, courtLocation: string, dateOfService: string) {
  return `${getInitials(name)}${getCourtCode(courtLocation)}${dateCode(dateOfService)}`;
}

function displayDate(dateValue: string) {
  if (!dateValue) return "—";
  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year}`;
}

export default function InterpInvoicePage(): any {
  const [form, setForm] = useState<any>({
    interpreterName: "Bora Gurcay",
    interpreterEmail: "bora.gurcay@example.com",
    interpreterAddress: "123 Sample Street, Toronto, ON M5G 1X5",
    supplierNumber: "SUP-123456",
    testRecipientEmail: "your.personal.email@example.com",
    claimsHst: true,
    hstRegistrationNumber: "12345 6789 RT0001",
    dateOfService: "2026-05-11",
    invoiceDate: "2026-05-13",
    courtLocation: "10 Armoury Street, Toronto OCJ",
    matterName: "R v. Sample",
    courtFileNumber: "4810-0000-00",
    courtroom: "1205",
    language: "Turkish",
    assignmentType: "full-day",
    mode: "in-person",
    accreditation: "fully-accredited",
    startTime: "09:30",
    recessStart: "13:00",
    recessEnd: "14:00",
    endTime: "16:30",
    hasSecondAssignment: false,
    secondMatterName: "R v. Second Sample",
    secondCourtFileNumber: "4810-0001-00",
    secondCourtroom: "1206",
    secondStartTime: "14:00",
    secondRecessStart: "",
    secondRecessEnd: "",
    secondEndTime: "16:30",
    noLunchTaken: false,
    travelTimeHours: "4",
    annualMileageUsedKm: "4900",
    mileageKm: "200",
    parking: { selected: true, amount: "25", fileName: "parking-receipt.jpg" },
    transit: { ...emptyReceipt },
    breakfast: { selected: false, amount: "", fileName: "" },
    lunch: { selected: true, amount: "12.50", fileName: "lunch-receipt.jpg" },
    dinner: { ...emptyReceipt },
    otherExpense: { selected: false, amount: "", fileName: "" },
    specialNotes:
      "Replacement assignment. Longer commute due to traffic. Mileage crosses annual threshold, so reduced rate applies after quota.",
  });

  function update(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  }

  function updateExpense(key: string, field: string, value: any) {
    setForm((prev: any) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  }

  const invoiceNumber = useMemo(() => {
    return generateInvoiceNumber(form.interpreterName, form.courtLocation, form.dateOfService);
  }, [form.interpreterName, form.courtLocation, form.dateOfService]);

  const result = useMemo(() => {
    const start = toMinutes(form.startTime);
    const end = toMinutes(form.endTime);
    const recessStart = toMinutes(form.recessStart);
    const recessEnd = toMinutes(form.recessEnd);

    let courtMinutes = 0;
    let lunchDeductedMinutes = 0;

    if (start !== null && end !== null && end > start) {
      courtMinutes = end - start;
      if (!form.noLunchTaken && recessStart !== null && recessEnd !== null && recessEnd > recessStart && recessStart >= start && recessEnd <= end) {
        lunchDeductedMinutes = Math.min(recessEnd - recessStart, 60);
        courtMinutes -= lunchDeductedMinutes;
      }
    }

    let secondCourtMinutes = 0;
    let secondLunchDeductedMinutes = 0;

    if (form.hasSecondAssignment) {
      const s2 = toMinutes(form.secondStartTime);
      const e2 = toMinutes(form.secondEndTime);
      const rs2 = toMinutes(form.secondRecessStart);
      const re2 = toMinutes(form.secondRecessEnd);

      if (s2 !== null && e2 !== null && e2 > s2) {
        secondCourtMinutes = e2 - s2;
        if (rs2 !== null && re2 !== null && re2 > rs2 && rs2 >= s2 && re2 <= e2) {
          secondLunchDeductedMinutes = Math.min(re2 - rs2, 60);
          secondCourtMinutes -= secondLunchDeductedMinutes;
        }
      }
    }

    const actualCourtHours = courtMinutes / 60;
    const secondActualCourtHours = secondCourtMinutes / 60;
    const totalActualCourtHours = actualCourtHours + secondActualCourtHours;
    const minimumHours = form.assignmentType === "half-day" ? RATES.halfDayMinimumHours : RATES.fullDayMinimumHours;
    const billableAttendanceHours = Math.max(minimumHours, Math.ceil(totalActualCourtHours));
    const attendanceHourlyRate = form.mode === "remote" ? RATES.remoteHourly : RATES.inPersonHourly;
    const attendanceFee = billableAttendanceHours * attendanceHourlyRate;

    const travelTimeHours = Math.ceil(Number(form.travelTimeHours || 0));
    const travelTimeFee = travelTimeHours * attendanceHourlyRate;

    const annualUsed = Number(form.annualMileageUsedKm || 0);
    const currentKm = Number(form.mileageKm || 0);
    const remainingRegularKm = Math.max(0, RATES.mileageAnnualThresholdKm - annualUsed);
    const regularKm = Math.min(currentKm, remainingRegularKm);
    const reducedKm = Math.max(0, currentKm - regularKm);
    const mileageFee = regularKm * RATES.mileageRegularRate + reducedKm * RATES.mileageReducedRate;

    const expenseKeys = ["parking", "transit", "breakfast", "lunch", "dinner", "otherExpense"];
    const expenseTotal = expenseKeys.reduce((sum, key) => {
      if (!form[key].selected) return sum;
      return sum + Number(form[key].amount || 0);
    }, 0);

    const taxableServiceSubtotal = attendanceFee + travelTimeFee;
    const hst = form.claimsHst ? taxableServiceSubtotal * RATES.hstRate : 0;
    const nonTaxableExpenseSubtotal = mileageFee + expenseTotal;
    const grandTotal = taxableServiceSubtotal + hst + nonTaxableExpenseSubtotal;

    return {
      actualCourtHours,
      lunchDeductedMinutes,
      secondLunchDeductedMinutes,
      secondActualCourtHours,
      totalActualCourtHours,
      minimumHours,
      billableAttendanceHours,
      attendanceHourlyRate,
      attendanceFee,
      travelTimeHours,
      travelTimeFee,
      totalBillableHours: billableAttendanceHours + travelTimeHours,
      annualUsed,
      currentKm,
      regularKm,
      reducedKm,
      mileageFee,
      expenseTotal,
      taxableServiceSubtotal,
      hst,
      nonTaxableExpenseSubtotal,
      grandTotal,
    };
  }, [form]);

  const validation = useMemo(() => {
    const problems: string[] = [];
    const start = toMinutes(form.startTime);
    const end = toMinutes(form.endTime);

    if (!form.interpreterName.trim()) problems.push("Interpreter name is missing.");
    if (!form.interpreterAddress.trim()) problems.push("Interpreter address is missing.");
    if (!form.supplierNumber.trim()) problems.push("Supplier number is missing.");
    if (form.claimsHst && !form.hstRegistrationNumber.trim()) problems.push("HST registration number is required when HST is claimed.");
    if (!form.dateOfService) problems.push("Date of service is missing.");
    if (!form.invoiceDate) problems.push("Invoice date is missing.");
    if (!form.matterName.trim()) problems.push("Matter name is missing.");
    if (!form.courtFileNumber.trim()) problems.push("Court file number is missing.");
    if (!form.accreditation) problems.push("Accreditation level is required.");
    if (!form.startTime || !form.endTime) problems.push("Start and end time are required.");
    if (start !== null && end !== null && end <= start) problems.push("End time must be after start time.");

    if (form.hasSecondAssignment) {
      const s2 = toMinutes(form.secondStartTime);
      const e2 = toMinutes(form.secondEndTime);
      if (!form.secondMatterName.trim()) problems.push("Second assignment matter name is missing.");
      if (!form.secondCourtFileNumber.trim()) problems.push("Second assignment court file number is missing.");
      if (!form.secondCourtroom.trim()) problems.push("Second assignment courtroom is missing.");
      if (!form.secondStartTime || !form.secondEndTime) problems.push("Second assignment start and end time are required.");
      if (s2 !== null && e2 !== null && e2 <= s2) problems.push("Second assignment end time must be after start time.");
    }

    ["parking", "transit", "breakfast", "lunch", "dinner", "otherExpense"].forEach((key) => {
      const item = form[key];
      const label = key === "otherExpense" ? "Other expense" : key.charAt(0).toUpperCase() + key.slice(1);
      if (item.selected && !item.amount) problems.push(`${label} is selected but amount is missing.`);
      if (item.selected && Number(item.amount || 0) <= 0) problems.push(`${label} amount must be greater than $0.`);
      if (item.selected && !item.fileName) problems.push(`${label} receipt should be attached or photographed.`);
    });

    if (form.mode === "remote" && Number(form.travelTimeHours || 0) > 0) {
      problems.push("Remote assignment has travel time entered. Confirm this is correct.");
    }

    if (Number(form.travelTimeHours || 0) >= 4) {
      problems.push("Travel time is 4 hours or more. Staff review recommended.");
    }

    if (result.reducedKm > 0) {
      problems.push("Mileage crosses annual quota threshold. Reduced mileage rate applied after threshold.");
    }

    if (form.noLunchTaken && form.assignmentType === "full-day") {
      problems.push("No lunch deducted for full-day assignment. Add note/approval reason.");
    }

    return problems;
  }, [form, result.reducedKm]);

  const ready = validation.length === 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900">
      <style jsx global>{`
        .print-only { display: none; }
        @media print {
          body { background: white !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          @page { size: letter landscape; margin: 0.35in; }
        }
      `}</style>
      <div className="no-print mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
          <p className="text-sm font-semibold text-blue-700">Prototype / Demo only</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">InterpInvoice</h1>
          <p className="mt-2 max-w-3xl text-slate-600">
            A guided interpreter invoice builder with invoice-number generation, service-only HST,
            minimum hours, rounding, mileage threshold logic, and receipt validation.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <Card title="1. Interpreter Information">
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Interpreter name" value={form.interpreterName} onChange={(v: any) => update("interpreterName", v)} />
                <TextInput label="Interpreter email" value={form.interpreterEmail} onChange={(v: any) => update("interpreterEmail", v)} />
                <TextInput label="Full address" value={form.interpreterAddress} onChange={(v: any) => update("interpreterAddress", v)} />
                <TextInput label="Supplier number" value={form.supplierNumber} onChange={(v: any) => update("supplierNumber", v)} />
                <TextInput label="Testing recipient email" value={form.testRecipientEmail} onChange={(v: any) => update("testRecipientEmail", v)} />
                <ReadOnlyInput label="Auto invoice number" value={invoiceNumber} />
                <p className="text-xs text-slate-500 md:col-span-2 -mt-2">
                  Invoice number is based on interpreter initials, court code, and Date of Service — not invoice date.
                </p>
                <TextInput label="Invoice date" type="date" value={form.invoiceDate} onChange={(v: any) => update("invoiceDate", v)} />
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <CheckboxInput label="Interpreter is claiming HST" checked={form.claimsHst} onChange={(v: any) => update("claimsHst", v)} />
                {form.claimsHst && (
                  <TextInput label="HST registration number" value={form.hstRegistrationNumber} onChange={(v: any) => update("hstRegistrationNumber", v)} />
                )}
              </div>
            </Card>

            <Card title="2. Assignment Details">
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput label="Date of service" type="date" value={form.dateOfService} onChange={(v: any) => update("dateOfService", v)} />
                <SelectInput label="Court location" value={form.courtLocation} options={COURTS.map((c) => c.label)} onChange={(v: any) => update("courtLocation", v)} />
                <SelectInput label="Language" value={form.language} options={LANGUAGES} onChange={(v: any) => update("language", v)} />
                <TextInput label="Matter name" value={form.matterName} onChange={(v: any) => update("matterName", v)} />
                <TextInput label="Court file number" value={form.courtFileNumber} onChange={(v: any) => update("courtFileNumber", v)} />
                <TextInput label="Courtroom" value={form.courtroom} onChange={(v: any) => update("courtroom", v)} />
                <SelectInput label="Assignment type" value={form.assignmentType} options={["half-day", "full-day"]} onChange={(v: any) => update("assignmentType", v)} />
                <SelectInput label="Mode" value={form.mode} options={["in-person", "remote"]} onChange={(v: any) => update("mode", v)} />
                <SelectInput
                  label="Accreditation level"
                  value={form.accreditation}
                  options={["fully-accredited", "conditionally-accredited", "not-accredited"]}
                  onChange={(v: any) => update("accreditation", v)}
                />
              </div>
            </Card>

            <Card title="3. Time Entry">
              <div className="grid gap-4 md:grid-cols-4">
                <TextInput label="Start time" type="time" value={form.startTime} onChange={(v: any) => update("startTime", v)} />
                <TextInput label="Lunch/recess start" type="time" value={form.recessStart} onChange={(v: any) => update("recessStart", v)} />
                <TextInput label="Lunch/recess end" type="time" value={form.recessEnd} onChange={(v: any) => update("recessEnd", v)} />
                <TextInput label="End / adjournment time" type="time" value={form.endTime} onChange={(v: any) => update("endTime", v)} />
              </div>
              <div className="mt-4">
                <CheckboxInput label="No lunch deducted / worked through lunch" checked={form.noLunchTaken} onChange={(v: any) => update("noLunchTaken", v)} />
              </div>
              <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                Assignment 1 court time: <strong>{result.actualCourtHours.toFixed(2)} hours</strong>
                {result.lunchDeductedMinutes > 0 ? ` after ${result.lunchDeductedMinutes} minutes lunch deduction` : ""}
                {form.hasSecondAssignment && (
                  <>
                    <br />
                    Assignment 2 court time: <strong>{result.secondActualCourtHours.toFixed(2)} hours</strong>
                    {result.secondLunchDeductedMinutes > 0 ? ` after ${result.secondLunchDeductedMinutes} minutes lunch deduction` : ""}
                  </>
                )}
                <br />
                Total same-day court time: <strong>{result.totalActualCourtHours.toFixed(2)} hours</strong>
                <br />
                Billable attendance: <strong>{result.billableAttendanceHours} hours</strong>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <CheckboxInput
                  label="Add second same-day assignment"
                  checked={form.hasSecondAssignment}
                  onChange={(v: any) => update("hasSecondAssignment", v)}
                />

                {form.hasSecondAssignment && (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <TextInput label="Second matter name" value={form.secondMatterName} onChange={(v: any) => update("secondMatterName", v)} />
                    <TextInput label="Second court file number" value={form.secondCourtFileNumber} onChange={(v: any) => update("secondCourtFileNumber", v)} />
                    <TextInput label="Second courtroom" value={form.secondCourtroom} onChange={(v: any) => update("secondCourtroom", v)} />
                    <TextInput label="Second start time" type="time" value={form.secondStartTime} onChange={(v: any) => update("secondStartTime", v)} />
                    <TextInput label="Second lunch/recess start" type="time" value={form.secondRecessStart} onChange={(v: any) => update("secondRecessStart", v)} />
                    <TextInput label="Second lunch/recess end" type="time" value={form.secondRecessEnd} onChange={(v: any) => update("secondRecessEnd", v)} />
                    <TextInput label="Second end / adjournment time" type="time" value={form.secondEndTime} onChange={(v: any) => update("secondEndTime", v)} />
                  </div>
                )}
              </div>
            </Card>

            <Card title="4. Travel and Expenses">
              <div className="grid gap-4 md:grid-cols-3">
                <TextInput label="Travel time claimed (hours)" type="number" value={form.travelTimeHours} onChange={(v: any) => update("travelTimeHours", v)} />
                <TextInput label="Annual mileage used so far (km)" type="number" value={form.annualMileageUsedKm} onChange={(v: any) => update("annualMileageUsedKm", v)} />
                <TextInput label="Mileage for this invoice (km)" type="number" value={form.mileageKm} onChange={(v: any) => update("mileageKm", v)} />
              </div>

              <div className="mt-4 rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                Mileage: <strong>{result.regularKm} km</strong> at {money(RATES.mileageRegularRate)} + <strong>{result.reducedKm} km</strong> at {money(RATES.mileageReducedRate)}
              </div>

              <div className="mt-5 space-y-3">
                <ExpenseRow label="Parking" item={form.parking} onChange={(field: any, value: any) => updateExpense("parking", field, value)} />
                <ExpenseRow label="Transit / TTC / GO / Presto" item={form.transit} onChange={(field: any, value: any) => updateExpense("transit", field, value)} />
                <ExpenseRow label="Breakfast" item={form.breakfast} onChange={(field: any, value: any) => updateExpense("breakfast", field, value)} />
                <ExpenseRow label="Lunch" item={form.lunch} onChange={(field: any, value: any) => updateExpense("lunch", field, value)} />
                <ExpenseRow label="Dinner" item={form.dinner} onChange={(field: any, value: any) => updateExpense("dinner", field, value)} />
                <ExpenseRow label="Other approved expense" item={form.otherExpense} onChange={(field: any, value: any) => updateExpense("otherExpense", field, value)} />
              </div>
            </Card>

            <Card title="5. Special Notes / Approval Reason">
              <textarea
                className="min-h-32 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                value={form.specialNotes}
                onChange={(e) => update("specialNotes", e.target.value)}
                placeholder="Examples: add-on assignment, replacement assignment, longer commute due to traffic, no lunch taken, hotel/Uber approved by management."
              />
            </Card>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <Card title="Validation Check">
              {ready ? (
                <div className="rounded-2xl bg-green-50 p-4 text-green-800 border border-green-200">
                  Ready for preview. No blocking issues found.
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-50 p-4 text-amber-900 border border-amber-200">
                  <p className="font-semibold">Needs attention:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                    {validation.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>

            <Card title="Live Calculation">
              <SummaryLine label="Attendance rate" value={`${money(result.attendanceHourlyRate)} / hour`} />
              <SummaryLine label="Billable attendance hours" value={`${result.billableAttendanceHours}`} />
              <SummaryLine label="Travel time hours" value={`${result.travelTimeHours}`} />
              <SummaryLine label="TOTAL billable hours" value={`${result.totalBillableHours}`} />
              <SummaryLine label="Attendance fee" value={money(result.attendanceFee)} />
              <SummaryLine label="Travel time fee" value={money(result.travelTimeFee)} />
              <div className="my-3 border-t border-slate-200" />
              <SummaryLine label="Taxable service subtotal" value={money(result.taxableServiceSubtotal)} />
              <SummaryLine label="HST on service only" value={money(result.hst)} />
              <div className="my-3 border-t border-slate-200" />
              <SummaryLine label="Mileage" value={money(result.mileageFee)} />
              <SummaryLine label="Receipted expenses" value={money(result.expenseTotal)} />
              <SummaryLine label="Non-taxable expenses" value={money(result.nonTaxableExpenseSubtotal)} />
              <div className="mt-4 rounded-2xl bg-slate-900 p-4 text-white">
                <div className="text-sm text-slate-300">Grand total</div>
                <div className="text-3xl font-bold">{money(result.grandTotal)}</div>
              </div>
            </Card>

            <Card title="Invoice Preview">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6">
                <PreviewRow label="Invoice" value={invoiceNumber} />
                <PreviewRow label="Invoice date" value={displayDate(form.invoiceDate)} />
                <PreviewRow label="Service date" value={displayDate(form.dateOfService)} />
                <PreviewRow label="Interpreter" value={form.interpreterName} />
                <PreviewRow label="Address" value={form.interpreterAddress} />
                <PreviewRow label="Supplier #" value={form.supplierNumber} />
                <PreviewRow label="HST #" value={form.claimsHst ? form.hstRegistrationNumber : "Not claimed"} />
                <PreviewRow label="Court" value={form.courtLocation} />
                <PreviewRow label="Matter" value={form.matterName} />
                <PreviewRow label="File #" value={form.courtFileNumber} />
                <PreviewRow label="Courtroom" value={form.courtroom} />
                <PreviewRow label="Language" value={form.language} />
                <PreviewRow label="Type" value={form.assignmentType} />
                <PreviewRow label="Mode" value={form.mode} />
                <PreviewRow label="Accreditation" value={form.accreditation} />
                <PreviewRow label="Time" value={`${form.startTime} - ${form.endTime}`} />
                {form.hasSecondAssignment && (
                  <PreviewRow label="2nd assignment" value={`${form.secondMatterName} / ${form.secondCourtroom} / ${form.secondStartTime} - ${form.secondEndTime}`} />
                )}
                <PreviewRow label="Service + HST" value={money(result.taxableServiceSubtotal + result.hst)} />
                <PreviewRow label="Expenses" value={money(result.nonTaxableExpenseSubtotal)} />
                <PreviewRow label="Total" value={money(result.grandTotal)} />
              </div>

              <button
                className={`mt-4 w-full rounded-2xl px-4 py-3 font-semibold shadow-sm ${
                  ready ? "bg-blue-700 text-white hover:bg-blue-800" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
                disabled={!ready}
                onClick={() => window.print()}
              >
                Download / Print Official PDF
              </button>

              <button
                className={`mt-3 w-full rounded-2xl px-4 py-3 font-semibold shadow-sm ${
                  ready ? "bg-slate-900 text-white hover:bg-black" : "bg-slate-200 text-slate-500 cursor-not-allowed"
                }`}
                disabled={ready ? false : true}
                onClick={() => {
                  const subject = `Interpreter Invoice ${invoiceNumber} - ${form.interpreterName}`;
                  const body = `Hello,

Please find below the interpreter invoice details for testing.

Invoice Number: ${invoiceNumber}
Invoice Date: ${displayDate(form.invoiceDate)}
Date of Service: ${displayDate(form.dateOfService)}
Interpreter: ${form.interpreterName}
Supplier Number: ${form.supplierNumber}
Court Location: ${form.courtLocation}
Matter/File: ${form.matterName} / ${form.courtFileNumber}
Language: ${form.language}
Mode: ${form.mode}
Accreditation: ${form.accreditation}
Total Billable Hours: ${result.totalBillableHours}
Service + HST: ${money(result.taxableServiceSubtotal + result.hst)}
Expenses: ${money(result.nonTaxableExpenseSubtotal)}
Grand Total: ${money(result.grandTotal)}

Special Notes / Approval Reason:
${form.specialNotes || "N/A"}

Receipt reminder: attach the generated PDF and all required receipts before sending.

This is a prototype-generated invoice email for testing only.
`;
                  window.location.href = `mailto:${encodeURIComponent(form.testRecipientEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                Prepare Email Draft
              </button>

              <p className="mt-3 text-xs text-slate-500">
                PDF uses the official print layout. Email opens a draft for testing; attachments must be added manually for now.
              </p>
            </Card>
          </aside>
        </div>
      </div>
          <OfficialInvoicePrint form={form} result={result} invoiceNumber={invoiceNumber} />
    </main>
  );
}

function OfficialInvoicePrint({ form, result, invoiceNumber }: any) {
  const totalServiceWithHst = result.taxableServiceSubtotal + result.hst;

  return (
    <section className="print-only text-black">
      <div className="mx-auto w-full text-[10px] leading-tight">
        <div className="flex items-start justify-between border-b-2 border-black pb-2">
          <div>
            <div className="text-xl font-bold">Ontario</div>
            <div className="font-semibold">Ministry of the Attorney General</div>
            <div>Court Services Division</div>
          </div>
          <div className="text-center font-bold text-lg">Interpreter Invoice</div>
          <div className="w-64 space-y-1">
            <PrintField label="Invoice No." value={invoiceNumber} />
            <PrintField label="Invoice Date" value={displayDate(form.invoiceDate)} />
            <div className="text-[9px] text-right">(DD/MM/YY)</div>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-[1.6fr_1fr] gap-3">
          <div className="space-y-1">
            <PrintField label="Name of Interpreter" value={form.interpreterName} />
            <PrintField label="Address" value={form.interpreterAddress} />
          </div>
          <div className="space-y-1">
            <PrintField label="Court Location" value={form.courtLocation} />
            <PrintField label="Language" value={form.language} />
            <PrintField label="HST Registration No." value={form.claimsHst ? form.hstRegistrationNumber : "N/A"} />
            <PrintField label="Supplier No." value={form.supplierNumber} />
          </div>
        </div>

        <table className="mt-3 w-full border-collapse border border-black text-[9px]">
          <thead>
            <tr className="bg-gray-100">
              <Th>Date of Service</Th>
              <Th>Case Name / Court File Number</Th>
              <Th>Scheduled Time of Court Commencement</Th>
              <Th>Time of Court Adjournment</Th>
              <Th>DEDUCT Time of Lunch Recess</Th>
              <Th>ADD Additional Authorized Hours</Th>
              <Th>Total In-Court Hours</Th>
              <Th>Court Clerk Initials</Th>
              <Th>TOTAL BILLABLE HOURS</Th>
              <Th>Additional Authorized Expenditures</Th>
              <Th>Kilometre Allowance or Transit Fare</Th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <Td>{displayDate(form.dateOfService)}</Td>
              <Td>{form.matterName} / {form.courtFileNumber}</Td>
              <Td>{form.startTime}</Td>
              <Td>{form.endTime}</Td>
              <Td>{form.noLunchTaken ? "No lunch taken" : `${form.recessStart} - ${form.recessEnd}`}</Td>
              <Td>{result.travelTimeHours > 0 ? `${result.travelTimeHours} travel` : ""}</Td>
              <Td>{result.actualCourtHours.toFixed(2)}</Td>
              <Td></Td>
              <Td>{form.hasSecondAssignment ? "" : result.totalBillableHours}</Td>
              <Td>{money(result.expenseTotal)}</Td>
              <Td>{result.currentKm} km @ mixed rate = {money(result.mileageFee)}</Td>
            </tr>
            {form.hasSecondAssignment && (
              <tr>
                <Td>{displayDate(form.dateOfService)}</Td>
                <Td>{form.secondMatterName} / {form.secondCourtFileNumber}</Td>
                <Td>{form.secondStartTime}</Td>
                <Td>{form.secondEndTime}</Td>
                <Td>{form.secondRecessStart && form.secondRecessEnd ? `${form.secondRecessStart} - ${form.secondRecessEnd}` : ""}</Td>
                <Td></Td>
                <Td>{result.secondActualCourtHours.toFixed(2)}</Td>
                <Td></Td>
                <Td>{result.totalBillableHours}</Td>
                <Td></Td>
                <Td></Td>
              </tr>
            )}
            {[1, 2, 3].map((row) => (
              <tr key={row}>
                {Array.from({ length: 11 }).map((_, i) => <Td key={i}>&nbsp;</Td>)}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-3 grid grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="space-y-2">
            <div className="border-b border-black pb-1">
              I, <strong>{form.interpreterName}</strong>, certify that I was in attendance in court as described above.
            </div>
            <PrintField label="Reason / Notes" value={form.specialNotes || "N/A"} />
            <div className="mt-6 grid grid-cols-2 gap-8">
              <div className="border-t border-black pt-1 text-center">Signature of Interpreter</div>
              <div className="border-t border-black pt-1 text-center">Date</div>
            </div>
          </div>

          <div className="space-y-1">
            <PrintTotal label={`Value of TOTAL Billable Hours (${result.totalBillableHours} hrs)`} value={money(result.taxableServiceSubtotal)} />
            <PrintTotal label="Value of TOTAL KM" value={money(result.mileageFee)} />
            <PrintTotal label="TOTAL Other Expenses Excluding KM" value={money(result.expenseTotal)} />
            <PrintTotal label="SUBTOTAL Before Taxes" value={money(result.taxableServiceSubtotal + result.nonTaxableExpenseSubtotal)} />
            <PrintTotal label="HST for Billable Hours" value={money(result.hst)} />
            <PrintTotal label="HST for Expenses" value={money(0)} />
            <div className="mt-2 border-2 border-black p-2 text-center text-sm font-bold">
              GRAND TOTAL WITH TAXES<br />{money(result.grandTotal)}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t-8 border-black pt-2">
          <div className="mb-2 text-center font-bold">BELOW FOR USE BY COURT SERVICE DIVISION STAFF ONLY</div>
          <table className="w-full border-collapse border border-black text-[9px]">
            <thead>
              <tr className="bg-gray-100">
                <Th>MINISTRY DATE RECEIVED</Th>
                <Th>NATURAL ACCOUNT CODE</Th>
                <Th>COST CENTRE CODE</Th>
                <Th>SUB-TOTAL BEFORE TAXES</Th>
                <Th>HST AMOUNT</Th>
                <Th>GRAND TOTAL WITH TAXES</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td></Td>
                <Td>5462800</Td>
                <Td></Td>
                <Td>{money(result.taxableServiceSubtotal)}</Td>
                <Td>{money(result.hst)}</Td>
                <Td>{money(totalServiceWithHst)}</Td>
              </tr>
              <tr>
                <Td></Td>
                <Td>5462750</Td>
                <Td></Td>
                <Td>{money(result.nonTaxableExpenseSubtotal)}</Td>
                <Td>{money(0)}</Td>
                <Td>{money(result.nonTaxableExpenseSubtotal)}</Td>
              </tr>
              <tr>
                <Td colSpan={5} className="border border-black p-1 text-right font-bold">TOTAL CLAIM</Td>
                <Td>{money(result.grandTotal)}</Td>
              </tr>
            </tbody>
          </table>
          <div className="mt-3 flex justify-between">
            <div>Contact Name and Number: ______________________________</div>
            <div className="font-semibold">☒ Payment Terms Exemption 016</div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrintField({ label, value }: any) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2">
      <span className="font-semibold">{label}</span>
      <span className="border-b border-black px-1">{value || ""}</span>
    </div>
  );
}

function PrintTotal({ label, value }: any) {
  return (
    <div className="grid grid-cols-[1fr_110px] gap-2">
      <span className="text-right font-semibold">{label}</span>
      <span className="border border-black px-2 py-1 text-right">{value}</span>
    </div>
  );
}

function Th({ children }: any) {
  return <th className="border border-black p-1 text-center font-bold">{children}</th>;
}

function Td({ children, colSpan, className = "" }: any) {
  return <td colSpan={colSpan} className={`border border-black p-1 align-top ${className}`}>{children}</td>;
}

function Card({ title, children }: any) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

function TextInput({ label, value, onChange, type = "text" }: any) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
      />
    </label>
  );
}

function ReadOnlyInput({ label, value }: any) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <input
        readOnly
        value={value}
        className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-slate-700 outline-none"
      />
    </label>
  );
}

function CheckboxInput({ label, checked, onChange }: any) {
  return (
    <label className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" />
      <span className="text-sm font-medium text-slate-700">{label}</span>
    </label>
  );
}

function SelectInput({ label, value, options, onChange }: any) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
      >
        {options.map((option: string) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ExpenseRow({ label, item, onChange }: any) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <label className="flex items-center gap-3 font-medium">
          <input
            type="checkbox"
            checked={item.selected}
            onChange={(e) => onChange("selected", e.target.checked)}
            className="h-5 w-5"
          />
          {label}
        </label>
        {item.selected && (
          <div className="grid flex-1 gap-3 md:grid-cols-2 md:pl-4">
            <input
              type="number"
              placeholder="Amount already includes HST"
              value={item.amount}
              onChange={(e) => onChange("amount", e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Receipt filename / photo name"
              value={item.fileName}
              onChange={(e) => onChange("fileName", e.target.value)}
              className="rounded-2xl border border-slate-300 px-4 py-2 outline-none focus:border-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: any) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function PreviewRow({ label, value }: any) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 border-b border-slate-100 py-1 last:border-0">
      <span className="font-semibold text-slate-500">{label}</span>
      <span>{value || "—"}</span>
    </div>
  );
}
