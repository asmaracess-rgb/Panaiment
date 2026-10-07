import React, { useState } from 'react';
import {
  ArrowLeft,
  Recycle,
  PlusCircle,
  Calculator,
  Scale,
  Leaf,
  Trash2,
} from 'lucide-react';
import { WasteBankUnit, WasteLogEntry, AppView } from '../types';

interface MonitoringSampahViewProps {
  wasteUnits: WasteBankUnit[];
  wasteLogs: WasteLogEntry[];
  onAddWasteLog: (
    rw: string,
    organikKg: number,
    anorganikKg: number,
    residuKg: number,
    officerName: string,
    notes: string
  ) => void;
  onNavigate: (view: AppView) => void;
}

export const MonitoringSampahView: React.FC<MonitoringSampahViewProps> = ({
  wasteUnits,
  wasteLogs,
  onAddWasteLog,
  onNavigate,
}) => {
  const [selectedRw, setSelectedRw] = useState<string>('RW 02');
  const [organikInput, setOrganikInput] = useState<string>('85');
  const [anorganikInput, setAnorganikInput] = useState<string>('70');
  const [residuInput, setResiduInput] = useState<string>('25');
  const [officerInput, setOfficerInput] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [logSuccess, setLogSuccess] = useState<boolean>(false);

  // Citizen Waste Bank Conversion Calculator State
  const [petKg, setPetKg] = useState<number>(5);
  const [cardboardKg, setCardboardKg] = useState<number>(8);
  const [aluminumKg, setAluminumKg] = useState<number>(2);
  const [cookingOilLiters, setCookingOilLiters] = useState<number>(3);

  const totalOrganik = wasteUnits.reduce((acc, u) => acc + u.organikKg, 0);
  const totalAnorganik = wasteUnits.reduce((acc, u) => acc + u.anorganikKg, 0);
  const totalResidu = wasteUnits.reduce((acc, u) => acc + u.residuKg, 0);
  const grandTotal = totalOrganik + totalAnorganik + totalResidu;

  const pctOrganik = Math.round((totalOrganik / Math.max(grandTotal, 1)) * 100);
  const pctAnorganik = Math.round((totalAnorganik / Math.max(grandTotal, 1)) * 100);
  const pctResidu = 100 - pctOrganik - pctAnorganik;

  const estimatedRupiah =
    petKg * 4200 + cardboardKg * 2500 + aluminumKg * 14000 + cookingOilLiters * 6500;

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const org = Math.max(0, Number(organikInput) || 0);
    const anorg = Math.max(0, Number(anorganikInput) || 0);
    const res = Math.max(0, Number(residuInput) || 0);
    if (org + anorg + res <= 0) return;

    onAddWasteLog(
      selectedRw,
      org,
      anorg,
      res,
      officerInput.trim() || `Petugas BSU ${selectedRw}`,
      notesInput.trim() || `Penimbangan harian terpilah ${selectedRw} Kelurahan Panaikang.`
    );
    setLogSuccess(true);
    setNotesInput('');
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <button
            type="button"
            onClick={() => onNavigate('beranda')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EF6C00] hover:text-[#E65100] mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Portal Utama</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0D3868] tracking-tight">
            Monitoring Sampah Kelurahan Panaikang
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Data timbulan sampah Organik, Anorganik, dan Residu dari 6 Bank Sampah Unit (BSU) RW
            dan armada kebersihan.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('peta')}
          className="self-start px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          Lihat Titik BSU di Peta Digital
        </button>
      </div>

      {/* 3 Primary Waste Stream Cards: Organik, Anorganik, Residu */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
            <span>SAMPAH ORGANIK (KOMPOS & MAGGOT)</span>
            <Leaf className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-num">
              {totalOrganik.toLocaleString('id-ID')} kg
            </span>
            <span className="text-xs font-semibold text-emerald-700 font-mono-num">
              ({pctOrganik}%)
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Diolah menjadi kompos tanaman lorong dan pakan budidaya maggot BSF Kelurahan Panaikang.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-sky-700">
            <span>SAMPAH ANORGANIK (DAUR ULANG BSU)</span>
            <Recycle className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-num">
              {totalAnorganik.toLocaleString('id-ID')} kg
            </span>
            <span className="text-xs font-semibold text-sky-700 font-mono-num">
              ({pctAnorganik}%)
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Botol plastik PET, kardus, kertas, kaleng, dan minyak jelantah tabungan warga di BSU RW.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between text-xs font-semibold text-amber-700">
            <span>SAMPAH RESIDU (DIANGKUT KE TPA)</span>
            <Trash2 className="w-4 h-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono-num">
              {totalResidu.toLocaleString('id-ID')} kg
            </span>
            <span className="text-xs font-semibold text-amber-700 font-mono-num">
              ({pctResidu}%)
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            Residu non-daur ulang yang diangkut armada menuju TPA Antang. Target terus ditekan &lt;
            20%.
          </p>
        </div>
      </div>

      {/* Proportion Bar */}
      <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-bold text-slate-900">
            Komposisi Pengelolaan Sampah Kelurahan Panaikang (Total{' '}
            <span className="font-mono-num">{grandTotal.toLocaleString('id-ID')} kg</span>)
          </h2>
          <div className="flex items-center gap-4 text-xs text-slate-600 font-mono-num">
            <span>Organik {pctOrganik}%</span>
            <span>·</span>
            <span>Anorganik {pctAnorganik}%</span>
            <span>·</span>
            <span>Residu {pctResidu}%</span>
          </div>
        </div>
        <div className="w-full h-4 rounded-xl overflow-hidden bg-slate-100 flex">
          <div
            className="bg-emerald-600 h-full transition-all"
            style={{ width: `${pctOrganik}%` }}
            title={`Organik: ${pctOrganik}%`}
          />
          <div
            className="bg-sky-600 h-full transition-all"
            style={{ width: `${pctAnorganik}%` }}
            title={`Anorganik: ${pctAnorganik}%`}
          />
          <div
            className="bg-amber-500 h-full transition-all"
            style={{ width: `${pctResidu}%` }}
            title={`Residu: ${pctResidu}%`}
          />
        </div>
      </div>

      {/* RW Bank Sampah Data Table + Input Form */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table of RW Units */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-[#0D3868]">
              Data Timbulan per Bank Sampah Unit (BSU) RW
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rekapitulasi volume terpilah per wilayah RW di Kelurahan Panaikang
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                  <th className="py-3 px-4">RW & Unit BSU</th>
                  <th className="py-3 px-4 text-right">Organik</th>
                  <th className="py-3 px-4 text-right">Anorganik</th>
                  <th className="py-3 px-4 text-right">Residu</th>
                  <th className="py-3 px-4 text-right">Reduksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {wasteUnits.map((unit) => {
                  const total = unit.organikKg + unit.anorganikKg + unit.residuKg;
                  const reduction = Math.round(
                    ((unit.organikKg + unit.anorganikKg) / Math.max(total, 1)) * 100
                  );
                  return (
                    <tr key={unit.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0D3868]">
                          {unit.rw} · {unit.unitName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {unit.locationLabel}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-emerald-700">
                        {unit.organikKg} kg
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-sky-700">
                        {unit.anorganikKg} kg
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-semibold text-amber-700">
                        {unit.residuKg} kg
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono-num font-bold text-slate-900">
                        {reduction}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Recent Weighing Logs */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/50">
            <h3 className="text-xs font-bold text-slate-700 mb-3">
              Riwayat Input Penimbangan Harian Terbaru
            </h3>
            <div className="space-y-2.5">
              {wasteLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-white border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      {log.rw} · {log.unitName}{' '}
                      <span className="font-normal text-slate-500">({log.officerName})</span>
                    </div>
                    <div className="text-slate-500 mt-0.5">{log.notes}</div>
                  </div>
                  <div className="font-mono-num text-[11px] font-semibold text-slate-700 whitespace-nowrap">
                    Org: {log.organikKg}kg · Anorg: {log.anorganikKg}kg · Res: {log.residuKg}kg
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Input Penimbangan Baru & Kalkulator Bank Sampah */}
        <div className="lg:col-span-5 space-y-6">
          {/* Form Input Penimbangan Harian */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Scale className="w-4 h-4 text-[#EF6C00]" />
              <h2 className="text-base font-bold text-[#0D3868]">
                Input Data Timbulan / Penimbangan BSU
              </h2>
            </div>

            {logSuccess && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
                Data penimbangan berhasil ditambahkan ke rekapitulasi {selectedRw}.
              </div>
            )}

            <form onSubmit={handleLogSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Wilayah RW / BSU
                </label>
                <select
                  value={selectedRw}
                  onChange={(e) => {
                    setSelectedRw(e.target.value);
                    setLogSuccess(false);
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm bg-white text-slate-900"
                >
                  {wasteUnits.map((u) => (
                    <option key={u.id} value={u.rw}>
                      {u.rw} — {u.unitName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-emerald-800 mb-1">
                    Organik (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={organikInput}
                    onChange={(e) => setOrganikInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-sky-800 mb-1">
                    Anorganik (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={anorganikInput}
                    onChange={(e) => setAnorganikInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-amber-800 mb-1">
                    Residu (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={residuInput}
                    onChange={(e) => setResiduInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petugas / Armada Pencatat
                </label>
                <input
                  type="text"
                  value={officerInput}
                  onChange={(e) => setOfficerInput(e.target.value)}
                  placeholder="Contoh: Pengurus BSU / Armada Tangkasaki"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Penimbangan
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Setoran rutin warga RT 01 - RT 03"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#EF6C00] hover:bg-[#E65100] text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Simpan Data Penimbangan</span>
              </button>
            </form>
          </div>

          {/* Interactive Waste Bank Savings Calculator for Citizens */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <Calculator className="w-4 h-4 text-emerald-700" />
              <h2 className="text-base font-bold text-[#0D3868]">
                Simulasi Tabungan Bank Sampah Warga
              </h2>
            </div>
            <p className="mt-2 text-xs text-slate-600">
              Hitung nilai ekonomis sampah terpilah rumah tangga Anda berdasarkan harga acuan BSU
              Kelurahan Panaikang:
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Botol Plastik PET (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  value={petKg}
                  onChange={(e) => setPetKg(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kardus & Kertas (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  value={cardboardKg}
                  onChange={(e) => setCardboardKg(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kaleng Aluminium (kg)
                </label>
                <input
                  type="number"
                  min="0"
                  value={aluminumKg}
                  onChange={(e) => setAluminumKg(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Minyak Jelantah (Liter)
                </label>
                <input
                  type="number"
                  min="0"
                  value={cookingOilLiters}
                  onChange={(e) => setCookingOilLiters(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono-num"
                />
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="text-xs font-semibold text-emerald-900">
                Estimasi Saldo Tabungan BSU:
              </div>
              <div className="text-lg font-extrabold text-emerald-800 font-mono-num">
                Rp {estimatedRupiah.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
