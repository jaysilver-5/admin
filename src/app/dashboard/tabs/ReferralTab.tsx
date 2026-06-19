'use client';

import * as React from 'react';
import { Pencil, Settings2, ChevronDown, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';

/* ----------------------------- helpers / types ----------------------------- */
type Period = 'Today' | 'This Week' | 'This Month' | 'This Year';
type ReferralRow = {
  id: string;
  referrerName: string;
  referredName: string;
  referredEmail?: string;
  dateISO: string;
  rewardAmount: number;
};
type SettingsHistoryRow = {
  id: string;
  initialAmount: number;
  updatedAmount: number;
  adminName: string;
  changedAtISO: string;
};
type ReferralListRow = {
  id: string;
  name: string;
  email: string;
  activeCount: number;
  rewardEarned: number;
};

const naira0 = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(v);

const naira2 = (v: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);

const fmtDT = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB');
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date} (${time})`;
};

/* ---------------------------------- data ---------------------------------- */
const MOCK_REWARD = 3000;

const MOCK_REFERRALS: ReferralRow[] = [
  { id: 'r1', referrerName: 'Ore Aisha Moro', referredName: 'Adams Abdullah', dateISO: '2024-12-12T21:35:00Z', rewardAmount: 1400 },
  { id: 'r2', referrerName: 'Ore Aisha Moro', referredName: 'Adams Abdullah', dateISO: '2024-12-12T21:35:00Z', rewardAmount: 1400 },
  { id: 'r3', referrerName: 'Ore Aisha Moro', referredName: 'Adams Abdullah', dateISO: '2024-12-12T21:35:00Z', rewardAmount: 1400 },
  { id: 'r4', referrerName: 'Ore Aisha Moro', referredName: 'Adams Abdullah', dateISO: '2024-12-12T21:35:00Z', rewardAmount: 1400 },
];

const MOCK_HISTORY: SettingsHistoryRow[] = [
  { id: 'h1', initialAmount: 1100, updatedAmount: 1500, adminName: 'Admin Doe', changedAtISO: '2024-10-14T14:32:00Z' },
  { id: 'h2', initialAmount: 1500, updatedAmount: 2000, adminName: 'Admin Doe', changedAtISO: '2024-11-01T10:20:00Z' },
  { id: 'h3', initialAmount: 2000, updatedAmount: 3000, adminName: 'Admin Doe', changedAtISO: '2024-12-02T08:05:00Z' },
];

const MOCK_LIST: ReferralListRow[] = [
  { id: 'l1', name: 'Ore Aisha', email: 'oreoeraisha63@gmail.com', activeCount: 22, rewardEarned: 1500 },
  { id: 'l2', name: 'John Smith', email: 'johnsmith@gmail.com', activeCount: 17, rewardEarned: 1200 },
  { id: 'l3', name: 'Mercy Dan', email: 'mercydan@gmail.com', activeCount: 9, rewardEarned: 700 },
];

/* --------------------------------- modals --------------------------------- */
function ModalShell({
  open,
  onClose,
  widthClass = 'max-w-[720px]',
  children,
}: {
  open: boolean;
  onClose: () => void;
  widthClass?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className={`absolute left-1/2 top-10 -translate-x-1/2 rounded-2xl bg-white shadow-xl w-[92vw] ${widthClass}`}>
        {children}
      </div>
    </div>
  );
}

function EditRewardModal({
  open,
  current,
  onClose,
  onUpdate,
}: {
  open: boolean;
  current: number;
  onClose: () => void;
  onUpdate: (v: number) => void;
}) {
  const [value, setValue] = React.useState<string>('');
  React.useEffect(() => setValue(''), [open]);

  return (
    <ModalShell open={open} onClose={onClose} widthClass="max-w-[540px]">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Referral Amount</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-indigo-50 px-4 py-3 text-gray-900">
            <span className="text-sm">Current Reward </span>
            <span className="font-semibold">{naira2(current)}</span>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Input new Amount</label>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Input new reward amount"
              className="w-full h-11 rounded-lg border border-gray-300 px-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={() => {
              const n = parseInt(value.replace(/\D/g, ''), 10);
              if (!isNaN(n)) onUpdate(n);
              onClose();
            }}
            className="w-full h-12 rounded-lg bg-[#0B1E53] text-white font-medium"
          >
            Update
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function SettingsHistoryModal({
  open,
  onClose,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  rows: SettingsHistoryRow[];
}) {
  return (
    <ModalShell open={open} onClose={onClose} widthClass="max-w-[900px]">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Settings history</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* borderless list */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-gray-500">
                <th className="py-2 px-3 font-normal">Initial Amount</th>
                <th className="py-2 px-3 font-normal">Admin Name</th>
                <th className="py-2 px-3 font-normal">Date and Time of Change</th>
                <th className="py-2 px-3 font-normal">Updated Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-900">{naira0(r.initialAmount)}</td>
                  <td className="py-3 px-3 text-gray-900">{r.adminName}</td>
                  <td className="py-3 px-3 text-gray-900">{fmtDT(r.changedAtISO)}</td>
                  <td className="py-3 px-3 text-gray-900">{naira0(r.updatedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}

function ReferralListModal({
  open,
  onClose,
  rows,
}: {
  open: boolean;
  onClose: () => void;
  rows: ReferralListRow[];
}) {
  return (
    <ModalShell open={open} onClose={onClose} widthClass="max-w-[980px]">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Referral List</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* borderless list */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="text-gray-500">
                <th className="py-2 px-3 font-normal">Referral Name</th>
                <th className="py-2 px-3 font-normal">Email Address</th>
                <th className="py-2 px-3 font-normal">Number of active Referrals</th>
                <th className="py-2 px-3 font-normal">Reward Earned</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-3 px-3 text-gray-900">{r.name}</td>
                  <td className="py-3 px-3 text-gray-900">{r.email}</td>
                  <td className="py-3 px-3 text-gray-900">{r.activeCount}</td>
                  <td className="py-3 px-3 text-gray-900">{naira0(r.rewardEarned)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}

/* ------------------------------- HEADER ----------------------------------- */

type HeaderProps = {
  reward: number;
  totals: { totalReferrals: number; totalPaid: number; thisMonth: number; sub?: string };
  onOpenEdit: () => void;
  onOpenHistory: () => void;
  onOpenList: () => void;
};

export function ReferralHeader({
  reward,
  totals,
  onOpenEdit,
  onOpenHistory,
  onOpenList,
}: HeaderProps) {
  const [periodA, setPeriodA] = React.useState<Period>('This Month');
  const [periodB, setPeriodB] = React.useState<Period>('This Month');
  const [periodC, setPeriodC] = React.useState<Period>('This Month');

  return (
    <div className="space-y-5">
      {/* Top line: title + history button */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-gray-900">Referral</h1>

        <button
          onClick={onOpenHistory}
          className="inline-flex items-center text-black gap-2 h-10 rounded-lg bg-white px-3 py-2 text-sm ring-1 ring-black/30 hover:bg-gray-50"
          type="button"
        >
          <Settings2 className="h-4 w-4 text-black" />
          View Settings History
        </button>
      </div>

      {/* Reward tile row (left) */}
      <div className="flex justify-between">
        <div className="w-[240px]">
          <div className="rounded-xl bg-[#DDE6FF] p-4 ring-1 ring-[#3E5798]">
            <div className="text-sm text-gray-800">Referral reward</div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-[22px] font-semibold text-gray-900">{naira2(reward)}</div>
              <button
                type="button"
                aria-label="Edit referral reward"
                onClick={onOpenEdit}
                className="grid h-9 w-9 place-items-center rounded-md bg-indigo-200 text-indigo-900"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics with dotted separators (no cards) */}
      <div className="flex items-start gap-8">
        {/* Left spacer/divider to align with screenshot */}

        <div className="flex flex-1 items-start gap-8 w-full justify-between">
          <MetricInline
            label="Total Referrals"
            value={totals.totalReferrals.toLocaleString()}
            period={periodA}
            onPeriod={setPeriodA}
          />

          <div className="hidden sm:block h-[84px] w-px border-r border-dashed border-gray-300" />

          <MetricInline
            label="Total Rewards Paid Out"
            value={naira0(totals.totalPaid)}
            sub={totals.sub ?? '0 new sign up'}
            period={periodB}
            onPeriod={setPeriodB}
          />

          <div className="hidden sm:block h-[84px] w-px border-r border-dashed border-gray-300" />

          <MetricInline
            label="Total Referrals"
            value={totals.thisMonth.toLocaleString()}
            rightLink="See List"
            onRightLink={onOpenList}
            period={periodC}
            onPeriod={setPeriodC}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------- page ---------------------------------- */
export default function ReferralTab() {
  const [reward, setReward] = React.useState<number>(0);
  const [referrals, setReferrals] = React.useState<ReferralRow[]>([]);
  const [referrers, setReferrers] = React.useState<ReferralListRow[]>([]);
  const [history, setHistory] = React.useState<SettingsHistoryRow[]>([]);
  const [totals, setTotals] = React.useState({ totalReferrals: 0, totalPaid: 0, thisMonth: 0, sub: '0 active referrals' });
  const [message, setMessage] = React.useState<string | null>(null);

  const loadReferrals = React.useCallback(() => {
    apiFetch<any>('/admin/referrals')
      .then((data) => {
        setReward(Number(data?.settings?.rewardAmount || 0));
        setReferrals((data?.referrals || []).map((r: any) => ({
          id: r.id,
          referrerName: r.referrerName,
          referredName: r.referredName,
          referredEmail: r.referredEmail,
          dateISO: r.dateISO,
          rewardAmount: Number(r.rewardAmount || data?.settings?.rewardAmount || 0),
        })));
        setReferrers((data?.referrers || []).map((r: any) => ({ id: r.id, name: r.name, email: r.email || '—', activeCount: Number(r.activeCount || 0), rewardEarned: Number(r.rewardEarned || 0) })));
        setHistory(data?.settings?.history || []);
        setTotals({
          totalReferrals: Number(data?.totals?.totalReferrals || 0),
          totalPaid: Number(data?.totals?.estimatedReward || 0),
          thisMonth: Number(data?.totals?.thisMonth || 0),
          sub: `${Number(data?.totals?.totalActive || 0).toLocaleString()} active referrals`,
        });
      })
      .catch((err) => setMessage(err?.message || 'Unable to load referrals'));
  }, []);

  React.useEffect(loadReferrals, [loadReferrals]);

  const updateReward = async (amount: number) => {
    try {
      const res = await apiFetch<any>('/admin/referrals/settings', { method: 'PUT', body: JSON.stringify({ rewardAmount: amount }) });
      setReward(Number(res.rewardAmount || amount));
      setMessage('Referral reward updated.');
      loadReferrals();
    } catch (err: any) {
      setMessage(err?.message || 'Unable to update referral reward');
    }
  };

  // modal state kept at parent and passed to header
  const [editOpen, setEditOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [listOpen, setListOpen] = React.useState(false);

  return (
    <div className="space-y-6 bg-white rounded-xl px-6 py-5">
      <ReferralHeader
        reward={reward}
        totals={totals}
        onOpenEdit={() => setEditOpen(true)}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenList={() => setListOpen(true)}
      />

      {message && <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">{message}</div>}

      {/* list */}
      <div>
        <div className="mb-3 font-medium text-gray-900">Referral Details</div>
        <div className="rounded-xl bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className=' border rounded-2xl border-gray-200'>
                <tr className="text-gray-500">
                  <th className="py-3 px-4 font-normal">Referrer Name</th>
                  <th className="py-3 px-4 font-normal">Referred User Name</th>
                  <th className="py-3 px-4 font-normal">Referral Date</th>
                  <th className="py-3 px-4 font-normal">Reward Amount</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setListOpen(true)}
                  >
                    <td className="py-3 px-4 text-gray-900">{r.referrerName}</td>
                    <td className="py-3 px-4 text-gray-900">{r.referredName}</td>
                    <td className="py-3 px-4 text-gray-900">{fmtDT(r.dateISO)}</td>
                    <td className="py-3 px-4 text-gray-900">{naira0(r.rewardAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* modals */}
      <EditRewardModal
        open={editOpen}
        current={reward}
        onClose={() => setEditOpen(false)}
        onUpdate={updateReward}
      />
      <SettingsHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        rows={history}
      />
      <ReferralListModal
        open={listOpen}
        onClose={() => setListOpen(false)}
        rows={referrers}
      />
    </div>
  );
}

/* ------------------------------ subcomponents ------------------------------ */

function MetricInline({
  label,
  value,
  sub,
  rightLink,
  onRightLink,
  period,
  onPeriod,
}: {
  label: string;
  value: string;
  sub?: string;
  rightLink?: string;
  onRightLink?: () => void;
  period: Period;
  onPeriod: (p: Period) => void;
}) {
  return (
    <div className="min-w-[220px]">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{label}</span>
        <PeriodPill value={period} onChange={onPeriod} />
      </div>
      <div className="mt-1 text-[22px] font-semibold text-gray-900">{value}</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-gray-500">{sub}</span>
        {rightLink && (
          <button
            type="button"
            onClick={onRightLink}
            className="text-xs text-sky-700 underline underline-offset-2"
          >
            {rightLink}
          </button>
        )}
      </div>
    </div>
  );
}

function PeriodPill({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const click = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', click);
    return () => window.removeEventListener('click', click);
  }, []);

  const items: Period[] = ['Today', 'This Week', 'This Month', 'This Year'];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-gray-700"
      >
        {value}
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-md border border-gray-200 bg-white shadow-lg z-10">
          {items.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                onChange(p);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                p === value ? 'text-indigo-700 font-medium' : 'text-gray-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
