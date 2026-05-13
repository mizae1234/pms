"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Hotel, Home, ChevronRight, ChevronLeft, Check, Loader2, Zap, BedDouble, CreditCard } from "lucide-react";
import { savePropertyInfo, savePropertyType, saveFirstBranch, saveBankAccount, completeOnboarding } from "@/app/actions/onboarding";
import { bulkCreateRooms, type RoomConfig } from "@/app/actions/settings";
import { updateBranchSettings } from "@/app/actions/settings";

const STEPS = ["ข้อมูลกิจการ", "ประเภทอาคาร", "สาขาแรก", "ตั้งค่าห้อง", "ค่าบริการ", "บัญชีธนาคาร"];

const propertyTypes = [
  { value: "APARTMENT", label: "หอพัก/อพาร์ทเม้นท์", sub: "เฉพาะรายเดือน", icon: Home, color: "border-blue-400 bg-blue-50" },
  { value: "HOTEL", label: "โรงแรม", sub: "เฉพาะรายวัน", icon: Hotel, color: "border-amber-400 bg-amber-50" },
];

const roomTypeOpts = [
  { value: "STANDARD", label: "Standard" }, { value: "DELUXE", label: "Deluxe" },
  { value: "SUITE", label: "Suite" }, { value: "STUDIO", label: "Studio" },
  { value: "ONE_BED", label: "1 Bedroom" }, { value: "TWO_BED", label: "2 Bedroom" },
];
const rentalOpts = [
  { value: "DAILY", label: "รายวัน" }, { value: "MONTHLY", label: "รายเดือน" }, { value: "FLEXIBLE", label: "Flexible" },
];

interface FloorSetup { floor: number; roomCount: number; roomType: string; rentalMode: string; basePrice: number; monthlyRate: number; }

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Property
  const [propName, setPropName] = useState("");
  const [propAddress, setPropAddress] = useState("");
  const [propTaxId, setPropTaxId] = useState("");
  const [propPhone, setPropPhone] = useState("");
  const [propEmail, setPropEmail] = useState("");
  const [propertyId, setPropertyId] = useState("");

  // Step 2: Type
  const [propType, setPropType] = useState("HOTEL");

  // Step 3: Branch
  const [branchName, setBranchName] = useState("");
  const [branchAddr, setBranchAddr] = useState("");
  const [branchPhone, setBranchPhone] = useState("");
  const [branchId, setBranchId] = useState("");

  // Step 4: Rooms
  const [floorCount, setFloorCount] = useState(3);
  const [floors, setFloors] = useState<FloorSetup[]>([]);

  // Step 5: Rates
  const [electricRate, setElectricRate] = useState(8);
  const [waterRate, setWaterRate] = useState(18);
  const [billingDay, setBillingDay] = useState(25);
  const [depositMonths, setDepositMonths] = useState(2);

  // Step 6: Bank
  const [bankName, setBankName] = useState("");
  const [accName, setAccName] = useState("");
  const [accNo, setAccNo] = useState("");
  const [promptPay, setPromptPay] = useState("");

  const initFloors = () => {
    const defaultMode = propType === "APARTMENT" ? "MONTHLY" : "DAILY";
    const arr: FloorSetup[] = [];
    for (let i = 1; i <= floorCount; i++) {
      arr.push({ floor: i, roomCount: 5, roomType: "STANDARD", rentalMode: defaultMode, basePrice: 1500, monthlyRate: 15000 });
    }
    setFloors(arr);
  };

  const handleNext = async () => {
    setSaving(true);
    try {
      if (step === 0) {
        if (!propName) { alert("กรุณาใส่ชื่อกิจการ"); setSaving(false); return; }
        const p = await savePropertyInfo({ name: propName, address: propAddress, taxId: propTaxId, phone: propPhone, email: propEmail });
        setPropertyId(p.id);
      } else if (step === 1) {
        await savePropertyType(propertyId, propType);
        initFloors();
      } else if (step === 2) {
        if (!branchName) { alert("กรุณาใส่ชื่อสาขา"); setSaving(false); return; }
        const b = await saveFirstBranch(propertyId, { name: branchName, address: branchAddr, phone: branchPhone });
        setBranchId(b.id);
      } else if (step === 3) {
        const rooms: RoomConfig[] = [];
        for (const f of floors) {
          for (let i = 1; i <= f.roomCount; i++) {
            rooms.push({
              number: `${f.floor}${String(i).padStart(2, "0")}`,
              floor: f.floor,
              type: f.roomType,
              rentalMode: f.rentalMode,
              basePrice: f.rentalMode === "MONTHLY" ? 0 : f.basePrice,
              monthlyRate: f.rentalMode === "DAILY" ? null : f.monthlyRate,
            });
          }
        }
        await bulkCreateRooms(branchId, rooms);
      } else if (step === 4) {
        await updateBranchSettings(branchId, { electricRate, waterRate, billingDay, securityDepositMonths: depositMonths });
      } else if (step === 5) {
        if (bankName && accName && accNo) {
          await saveBankAccount(branchId, { bankName, accountName: accName, accountNo: accNo, promptPay: promptPay || undefined });
        }
        await completeOnboarding(propertyId);
        router.push("/dashboard");
        return;
      }
      setStep(step + 1);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown"));
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) => (
    <div>
      <label className="text-sm font-medium text-gray-700">{label} {required && <span className="text-red-500">*</span>}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo + Title */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xl font-bold mb-3">P</div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบ PMS</h1>
          <p className="text-gray-500 text-sm mt-1">กรอกข้อมูลเพื่อเริ่มต้นใช้งาน</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && <div className={`h-px w-6 ${i <= step ? "bg-blue-500" : "bg-gray-200"}`} />}
              <div className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                i === step ? "bg-blue-600 text-white" : i < step ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
              }`}>{i + 1}</div>
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-xl p-8">

          {/* Step 0: ข้อมูลกิจการ */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center"><Building2 className="h-5 w-5 text-blue-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">ข้อมูลกิจการ</h2><p className="text-sm text-gray-500">กรอกชื่อและข้อมูลติดต่อ</p></div>
              </div>
              <InputField label="ชื่อกิจการ" value={propName} onChange={setPropName} placeholder="เช่น สุขุมวิท เรสซิเดนซ์" required />
              <InputField label="ที่อยู่" value={propAddress} onChange={setPropAddress} placeholder="ที่อยู่สำนักงาน" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="เลขผู้เสียภาษี" value={propTaxId} onChange={setPropTaxId} placeholder="0-0000-00000-00-0" />
                <InputField label="เบอร์โทร" value={propPhone} onChange={setPropPhone} placeholder="02-xxx-xxxx" />
              </div>
              <InputField label="อีเมล" value={propEmail} onChange={setPropEmail} placeholder="info@example.com" />
            </div>
          )}

          {/* Step 1: ประเภทอาคาร */}
          {step === 1 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center"><Hotel className="h-5 w-5 text-amber-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">ประเภทอาคาร</h2><p className="text-sm text-gray-500">เลือกรูปแบบการดำเนินกิจการ</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {propertyTypes.map(t => (
                  <button key={t.value} onClick={() => setPropType(t.value)} className={`rounded-xl border-2 p-6 text-left transition-all ${propType === t.value ? t.color + " ring-2 ring-offset-2 ring-blue-400" : "border-gray-200 hover:border-gray-300"}`}>
                    <t.icon className="h-8 w-8 mb-3 text-gray-600" />
                    <div className="font-bold text-gray-900">{t.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{t.sub}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-4 text-center">💡 หากต้องการทำทั้งรายวันและรายเดือน สามารถตั้งค่าแต่ละห้องเป็น Flexible ได้ใน Step ถัดไป</p>
            </div>
          )}

          {/* Step 2: สาขาแรก */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Building2 className="h-5 w-5 text-emerald-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">สาขาแรก</h2><p className="text-sm text-gray-500">ข้อมูลสาขาหลักของคุณ</p></div>
              </div>
              <InputField label="ชื่อสาขา" value={branchName} onChange={setBranchName} placeholder="เช่น สาขาสุขุมวิท" required />
              <InputField label="ที่อยู่สาขา" value={branchAddr} onChange={setBranchAddr} placeholder="ที่อยู่สาขา" />
              <InputField label="เบอร์โทรสาขา" value={branchPhone} onChange={setBranchPhone} placeholder="02-xxx-xxxx" />
            </div>
          )}

          {/* Step 3: ตั้งค่าห้อง */}
          {step === 3 && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center"><BedDouble className="h-5 w-5 text-purple-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">ตั้งค่าห้อง</h2><p className="text-sm text-gray-500">กำหนดจำนวนชั้นและห้อง</p></div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">จำนวนชั้น</label>
                <input type="number" onFocus={(e) => e.target.select()} min={1} max={50} value={floorCount} onChange={e => { setFloorCount((e.target.value === "" ? "" as any : Number(e.target.value))); }} className="mt-1 w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
                <button onClick={initFloors} className="ml-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">อัปเดต</button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50"><tr>
                    <th className="py-2 px-3 text-left text-gray-500 font-medium">ชั้น</th>
                    <th className="py-2 px-3 text-left text-gray-500 font-medium">จำนวน</th>
                    <th className="py-2 px-3 text-left text-gray-500 font-medium">ประเภท</th>
                    <th className="py-2 px-3 text-left text-gray-500 font-medium">โหมด</th>
                    <th className="py-2 px-3 text-left text-gray-500 font-medium">ราคา/คืน</th>
                    <th className="py-2 px-3 text-left text-gray-500 font-medium">ราคา/เดือน</th>
                  </tr></thead>
                  <tbody>
                    {floors.map((f, i) => (
                      <tr key={f.floor} className="border-t border-gray-100">
                        <td className="py-2 px-3 font-semibold">ชั้น {f.floor}</td>
                        <td className="py-2 px-3"><input type="number" onFocus={(e) => e.target.select()} min={1} max={99} value={f.roomCount} onChange={e => { const v = [...floors]; v[i].roomCount = (e.target.value === "" ? "" as any : Number(e.target.value)); setFloors(v); }} className="w-16 rounded border border-gray-300 px-2 py-1 text-sm" /></td>
                        <td className="py-2 px-3"><select value={f.roomType} onChange={e => { const v = [...floors]; v[i].roomType = e.target.value; setFloors(v); }} className="rounded border border-gray-300 px-2 py-1 text-sm">{roomTypeOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                        <td className="py-2 px-3"><select value={f.rentalMode} onChange={e => { const v = [...floors]; v[i].rentalMode = e.target.value; setFloors(v); }} className="rounded border border-gray-300 px-2 py-1 text-sm">{rentalOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></td>
                        <td className="py-2 px-3">{f.rentalMode !== "MONTHLY" ? <input type="number" onFocus={(e) => e.target.select()} value={f.basePrice} onChange={e => { const v = [...floors]; v[i].basePrice = (e.target.value === "" ? "" as any : Number(e.target.value)); setFloors(v); }} className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right" /> : <span className="text-gray-400">—</span>}</td>
                        <td className="py-2 px-3">{f.rentalMode !== "DAILY" ? <input type="number" onFocus={(e) => e.target.select()} value={f.monthlyRate} onChange={e => { const v = [...floors]; v[i].monthlyRate = (e.target.value === "" ? "" as any : Number(e.target.value)); setFloors(v); }} className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right" /> : <span className="text-gray-400">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-3">รวม {floors.reduce((s, f) => s + f.roomCount, 0)} ห้อง • เลขห้องจะ auto-generate (เช่น 101, 102...)</p>
            </div>
          )}

          {/* Step 4: ค่าบริการ */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center"><Zap className="h-5 w-5 text-yellow-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">อัตราค่าบริการ</h2><p className="text-sm text-gray-500">ตั้งค่าน้ำไฟและรอบบิล</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm font-medium text-gray-700">ค่าไฟ (บาท/หน่วย)</label><input type="number" onFocus={(e) => e.target.select()} step="0.5" value={electricRate} onChange={e => setElectricRate((e.target.value === "" ? "" as any : Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" /></div>
                <div><label className="text-sm font-medium text-gray-700">ค่าน้ำ (บาท/หน่วย)</label><input type="number" onFocus={(e) => e.target.select()} step="0.5" value={waterRate} onChange={e => setWaterRate((e.target.value === "" ? "" as any : Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" /></div>
                <div><label className="text-sm font-medium text-gray-700">ออกบิลวันที่</label><input type="number" onFocus={(e) => e.target.select()} min={1} max={28} value={billingDay} onChange={e => setBillingDay((e.target.value === "" ? "" as any : Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" /></div>
                <div><label className="text-sm font-medium text-gray-700">มัดจำ (เดือน)</label><input type="number" onFocus={(e) => e.target.select()} min={0} max={6} value={depositMonths} onChange={e => setDepositMonths((e.target.value === "" ? "" as any : Number(e.target.value)))} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm" /></div>
              </div>
              <p className="text-xs text-gray-400">💡 สามารถปรับรายละเอียดเพิ่มเติมได้ในหน้า ตั้งค่า หลังจากเริ่มใช้งาน</p>
            </div>
          )}

          {/* Step 5: บัญชีธนาคาร */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center"><CreditCard className="h-5 w-5 text-green-600" /></div>
                <div><h2 className="text-lg font-bold text-gray-900">บัญชีธนาคาร</h2><p className="text-sm text-gray-500">ข้อมูลสำหรับรับชำระเงิน</p></div>
              </div>
              <InputField label="ชื่อธนาคาร" value={bankName} onChange={setBankName} placeholder="เช่น ธนาคารกสิกรไทย" />
              <InputField label="ชื่อบัญชี" value={accName} onChange={setAccName} placeholder="ชื่อบัญชี" />
              <div className="grid grid-cols-2 gap-4">
                <InputField label="เลขบัญชี" value={accNo} onChange={setAccNo} placeholder="xxx-x-xxxxx-x" />
                <InputField label="PromptPay (ถ้ามี)" value={promptPay} onChange={setPromptPay} placeholder="เบอร์โทร/เลขบัตร" />
              </div>
              <p className="text-xs text-gray-400">💡 ข้ามได้ — สามารถเพิ่มภายหลังในหน้าตั้งค่า</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 0 ? (
              <button onClick={() => setStep(step - 1)} className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
                <ChevronLeft className="h-4 w-4" /> ก่อนหน้า
              </button>
            ) : <div />}
            <button onClick={handleNext} disabled={saving} className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 5 ? <><Check className="h-4 w-4" /> เริ่มใช้งาน</> : <>ถัดไป <ChevronRight className="h-4 w-4" /></>}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">ขั้นตอนที่ {step + 1} จาก {STEPS.length} — {STEPS[step]}</p>
      </div>
    </div>
  );
}

