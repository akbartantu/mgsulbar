import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const summaryConfig = [
  { label: 'Total Anggaran', key: 'total' as const, icon: DollarSign, color: 'bg-primary/10 text-primary' },
  { label: 'Pemasukan', key: 'pemasukan' as const, icon: TrendingUp, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Pengeluaran', key: 'pengeluaran' as const, icon: TrendingDown, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
];

const initialTransactions = [
  { id: 1, description: 'Dana Beasiswa Semester 2', amount: -25000000, date: '5 Feb 2025', category: 'Beasiswa' },
  { id: 2, description: 'Iuran Anggota Januari', amount: 5000000, date: '1 Feb 2025', category: 'Iuran' },
  { id: 3, description: 'Biaya Workshop Leadership', amount: -8500000, date: '28 Jan 2025', category: 'Kegiatan' },
  { id: 4, description: 'Donasi Alumni', amount: 15000000, date: '25 Jan 2025', category: 'Donasi' },
  { id: 5, description: 'Biaya Seminar Nasional', amount: -12000000, date: '20 Jan 2025', category: 'Kegiatan' },
];

const categoryOptions = ['Beasiswa', 'Iuran', 'Kegiatan', 'Donasi'];

function formatCurrency(amount: number) {
  const abs = Math.abs(amount);
  return `${amount < 0 ? '-' : '+'} Rp ${abs.toLocaleString('id-ID')}`;
}

export default function FinancePage() {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState(initialTransactions);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    description: '',
    jumlah: '',
    tipe: 'Pemasukan' as 'Pemasukan' | 'Pengeluaran',
    date: '',
    category: 'Beasiswa',
  });

  useEffect(() => {
    api.getTransactions().then((data) => setTransactions(data)).catch(() => {
      toast({ title: 'Database offline', description: 'Menampilkan data lokal.', variant: 'destructive' });
    });
  }, [toast]);

  const totalPemasukan = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const totalPengeluaran = transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalAnggaran = totalPemasukan - totalPengeluaran;
  const summaryValues = {
    total: `Rp ${totalAnggaran.toLocaleString('id-ID')}`,
    pemasukan: `Rp ${totalPemasukan.toLocaleString('id-ID')}`,
    pengeluaran: `Rp ${totalPengeluaran.toLocaleString('id-ID')}`,
  };

  const handleSubmitTransaction = () => {
    if (!form.description.trim()) {
      toast({ title: 'Keterangan wajib diisi', variant: 'destructive' });
      return;
    }
    const jumlah = form.jumlah ? Math.abs(parseFloat(form.jumlah) || 0) : 0;
    const amount = form.tipe === 'Pengeluaran' ? -jumlah : jumlah;
    const dateStr = form.date.trim() || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    api
      .createTransaction({
        description: form.description.trim(),
        amount,
        date: dateStr,
        category: form.category.trim() || '-',
      })
      .then(() => api.getTransactions().then(setTransactions))
      .then(() => {
        setForm({ description: '', jumlah: '', tipe: 'Pemasukan', date: '', category: 'Beasiswa' });
        setAddOpen(false);
        toast({ title: 'Transaksi berhasil dicatat' });
      })
      .catch((err) => toast({ title: 'Gagal mencatat transaksi', description: err?.message, variant: 'destructive' }));
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Wallet className="h-7 w-7 text-primary" />
                Keuangan
              </h1>
              <p className="text-muted-foreground mt-1">Pencatatan anggaran dan realisasi keuangan</p>
            </div>
            <Button variant="gradient" className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Catat Transaksi
            </Button>
          </div>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {summaryConfig.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{summaryValues[card.key]}</p>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Transaksi Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={String(tx.id)} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        tx.amount > 0
                          ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {tx.amount > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.date} · {tx.category}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${
                      tx.amount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat Transaksi</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tx-description">Keterangan</Label>
              <Input
                id="tx-description"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Deskripsi transaksi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-jumlah">Jumlah (Rp)</Label>
              <Input
                id="tx-jumlah"
                type="number"
                min={0}
                value={form.jumlah}
                onChange={(e) => setForm((p) => ({ ...p, jumlah: e.target.value }))}
                placeholder="Nominal positif"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe</Label>
              <Select
                value={form.tipe}
                onValueChange={(v: 'Pemasukan' | 'Pengeluaran') => setForm((p) => ({ ...p, tipe: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tx-date">Tanggal</Label>
              <Input
                id="tx-date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                placeholder="Contoh: 5 Feb 2025"
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitTransaction}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
