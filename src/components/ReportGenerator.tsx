import React, { useState, useMemo } from 'react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { Printer, FileText, Calendar, Download, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface ReportGeneratorProps {
  visitors: any[];
  title: string;
}

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function ReportGenerator({ visitors, title }: ReportGeneratorProps) {
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const filteredVisitors = useMemo(() => {
    if (!startDate || !endDate) return visitors;
    
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));

    return visitors.filter((v) => {
      if (!v.entry_time) return false;
      const entryDate = parseISO(v.entry_time);
      return isWithinInterval(entryDate, { start, end });
    });
  }, [visitors, startDate, endDate]);

  const statsByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVisitors.forEach((v) => {
      if (!v.entry_time) return;
      const dateStr = format(parseISO(v.entry_time), 'MMM dd');
      counts[dateStr] = (counts[dateStr] || 0) + 1;
    });
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [filteredVisitors]);

  const statsByPurpose = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVisitors.forEach((v) => {
      const purpose = v.purpose || 'Unknown';
      counts[purpose] = (counts[purpose] || 0) + 1;
    });
    return Object.entries(counts).map(([purpose, count]) => ({ purpose, count }));
  }, [filteredVisitors]);

  const statsByDepartment = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredVisitors.forEach((v) => {
      const department = v.department || 'Unknown';
      counts[department] = (counts[department] || 0) + 1;
    });
    return Object.entries(counts).map(([department, count]) => ({ department, count }));
  }, [filteredVisitors]);

  const handlePrint = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    setShowPreview(true);
  };

  const executePrint = () => {
    window.print();
  };

  const reportContent = (
    <div className="p-8 print:p-0 print:block bg-white" id="printable-report" style={{ color: '#111827' }}>
      <div className={`${showPreview ? 'block' : 'hidden'} print:block mb-8 text-center border-b border-[#e5e7eb] pb-4`}>
        <h1 className="text-2xl font-bold text-[#111827]">{title}</h1>
        <p className="text-[#6b7280] mt-1">
          Report Period: {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
        </p>
        <p className="text-[#6b7280] text-sm mt-1">
          Generated on: {format(new Date(), 'MMM dd, yyyy HH:mm')}
        </p>
      </div>

      <div className={`mb-6 flex items-center justify-between ${showPreview ? 'hidden' : 'print:hidden'}`}>
        <h4 className="text-lg font-semibold text-[#1f2937]">Report Results</h4>
        <span className="bg-[#e0e7ff] text-[#3730a3] text-xs font-bold px-3 py-1 rounded-full">
          {filteredVisitors.length} Records Found
        </span>
      </div>

      {filteredVisitors.length === 0 ? (
        <div className={`text-center py-12 text-[#6b7280] bg-[#f9fafb] rounded-lg border border-dashed border-[#e5e7eb] ${showPreview ? 'hidden' : 'print:hidden'}`}>
          No visitors found in the selected date range.
        </div>
      ) : (
        <>
          <div className="mb-8" style={{ width: '100%', overflow: 'hidden' }}>
            <table className="w-full text-left text-sm text-[#4b5563] border-collapse">
              <thead className="bg-[#f9fafb] text-[#374151] uppercase font-semibold text-xs border-b border-t border-[#e5e7eb] print:bg-transparent print:border-[#d1d5db]">
                <tr>
                  <th className="px-4 py-3 border-b border-[#e5e7eb] print:border-[#d1d5db]">Date/Time</th>
                  <th className="px-4 py-3 border-b border-[#e5e7eb] print:border-[#d1d5db]">Visitor Name</th>
                  <th className="px-4 py-3 border-b border-[#e5e7eb] print:border-[#d1d5db]">Phone</th>
                  <th className="px-4 py-3 border-b border-[#e5e7eb] print:border-[#d1d5db]">Purpose</th>
                  <th className="px-4 py-3 border-b border-[#e5e7eb] print:border-[#d1d5db]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f4f6] print:divide-[#d1d5db]">
                {filteredVisitors.map((v) => (
                  <tr key={v.visitor_id} className="hover:bg-[#f9fafb] print:hover:bg-transparent">
                    <td className="px-4 py-3 print:border-b print:border-[#e5e7eb]">
                      {v.entry_time ? format(parseISO(v.entry_time), 'MMM dd, yyyy HH:mm') : 'N/A'}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#111827] print:border-b print:border-[#e5e7eb]">{v.name}</td>
                    <td className="px-4 py-3 print:border-b print:border-[#e5e7eb]">{v.phone}</td>
                    <td className="px-4 py-3 print:border-b print:border-[#e5e7eb]">{v.purpose}</td>
                    <td className="px-4 py-3 print:border-b print:border-[#e5e7eb]">{v.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:block print:space-y-8 print:break-inside-avoid">
            <div className="bg-white p-4 rounded-xl border border-[#f3f4f6] print:border-none print:p-0">
              <h3 className="text-md font-semibold text-[#1f2937] mb-4 text-center">Visitors per Day</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statsByDate} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ color: '#111827' }} />
                    <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#f3f4f6] print:border-none print:p-0 print:break-inside-avoid">
              <h3 className="text-md font-semibold text-[#1f2937] mb-4 text-center">Visitors by Purpose</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsByPurpose}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="purpose"
                      stroke="none"
                    >
                      {statsByPurpose.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ color: '#111827' }} />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#4b5563' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-[#f3f4f6] print:border-none print:p-0 print:break-inside-avoid">
              <h3 className="text-md font-semibold text-[#1f2937] mb-4 text-center">Visitors by Department</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsByDepartment}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="department"
                      stroke="none"
                    >
                      {statsByDepartment.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ color: '#111827' }} />
                    <Legend verticalAlign="bottom" height={40} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#4b5563' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (showPreview) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto print:bg-white print:static">
        <div className="max-w-5xl mx-auto p-4 sm:p-8 print:p-0 print:max-w-none">
          {/* Preview Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 print:hidden gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Print Preview</h2>
              <p className="text-sm text-gray-500">Review the report before printing</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowPreview(false)}
                className="flex-1 sm:flex-none px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Close Preview
              </button>
              <button
                onClick={executePrint}
                className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center justify-center font-medium transition-colors"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print / Save as PDF
              </button>
            </div>
          </div>

          {/* Report Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none">
            {reportContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none">
      {/* Non-printable controls */}
      <div className="p-6 border-b border-gray-200 bg-gray-50 print:hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-600" />
              Generate Report
            </h3>
            <p className="text-sm text-gray-500">Select a date range to generate and print visitor reports.</p>
          </div>
          <button
            onClick={handlePrint}
            disabled={filteredVisitors.length === 0}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Area */}
      {reportContent}
    </div>
  );
}
