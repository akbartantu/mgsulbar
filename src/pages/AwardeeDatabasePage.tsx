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
import { GraduationCap, Search, Plus, Users, BookOpen, Award } from 'lucide-react';
import { motion } from 'framer-motion';

const summaryCardConfig = [
  { label: 'Total Awardee', key: 'total' as const, icon: Users, color: 'bg-primary/10 text-primary' },
  { label: 'Aktif', key: 'aktif' as const, icon: BookOpen, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Alumni', key: 'alumni' as const, icon: Award, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
];

const initialAwardees = [
  { id: 1, name: 'Ahmad Fauzi', university: 'Universitas Indonesia', major: 'Teknik Informatika', year: 2023, status: 'Aktif' as const },
  { id: 2, name: 'Siti Nurhaliza', university: 'ITB', major: 'Teknik Sipil', year: 2022, status: 'Aktif' as const },
  { id: 3, name: 'Budi Santoso', university: 'UGM', major: 'Kedokteran', year: 2021, status: 'Alumni' as const },
  { id: 4, name: 'Dewi Lestari', university: 'Universitas Airlangga', major: 'Farmasi', year: 2023, status: 'Aktif' as const },
  { id: 5, name: 'Rizky Pratama', university: 'ITS', major: 'Teknik Elektro', year: 2020, status: 'Alumni' as const },
];

export default function AwardeeDatabasePage() {
  const { toast } = useToast();
  const [awardees, setAwardees] = useState(initialAwardees);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    university: '',
    major: '',
    year: '',
    status: 'Aktif' as 'Aktif' | 'Alumni',
  });

  useEffect(() => {
    api.getAwardees().then((data) => setAwardees(data)).catch(() => {
      toast({ title: 'Database offline', description: 'Menampilkan data lokal.', variant: 'destructive' });
    });
  }, [toast]);

  const total = awardees.length;
  const aktifCount = awardees.filter((a) => a.status === 'Aktif').length;
  const alumniCount = awardees.filter((a) => a.status === 'Alumni').length;
  const summaryValues = { total, aktif: aktifCount, alumni: alumniCount };

  const handleSubmitAwardee = () => {
    if (!form.name.trim()) {
      toast({ title: 'Nama wajib diisi', variant: 'destructive' });
      return;
    }
    const year = form.year ? parseInt(form.year, 10) : new Date().getFullYear();
    api
      .createAwardee({
        name: form.name.trim(),
        university: form.university.trim() || '-',
        major: form.major.trim() || '-',
        year: Number.isNaN(year) ? new Date().getFullYear() : year,
        status: form.status,
      })
      .then(() => api.getAwardees().then(setAwardees))
      .then(() => {
        setForm({ name: '', university: '', major: '', year: '', status: 'Aktif' });
        setAddOpen(false);
        toast({ title: 'Awardee berhasil ditambahkan' });
      })
      .catch((err) => toast({ title: 'Gagal menambahkan awardee', description: err?.message, variant: 'destructive' }));
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
                <GraduationCap className="h-7 w-7 text-primary" />
                Database Awardee
              </h1>
              <p className="text-muted-foreground mt-1">Kelola data penerima beasiswa</p>
            </div>
            <Button variant="gradient" className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Tambah Awardee
            </Button>
          </div>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {summaryCardConfig.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{summaryValues[card.key]}</p>
                    <p className="text-sm text-muted-foreground">{card.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Cari awardee berdasarkan nama, universitas, atau jurusan..." className="pl-10" />
        </div>

        {/* Awardee Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Daftar Awardee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Nama</th>
                    <th className="pb-3 font-medium text-muted-foreground">Universitas</th>
                    <th className="pb-3 font-medium text-muted-foreground">Jurusan</th>
                    <th className="pb-3 font-medium text-muted-foreground">Angkatan</th>
                    <th className="pb-3 font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {awardees.map((a) => (
                    <tr key={String(a.id)} className="border-b last:border-0 hover:bg-muted/50 cursor-pointer">
                      <td className="py-3 font-medium text-foreground">{a.name}</td>
                      <td className="py-3 text-muted-foreground">{a.university}</td>
                      <td className="py-3 text-muted-foreground">{a.major}</td>
                      <td className="py-3 text-muted-foreground">{a.year}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            a.status === 'Aktif'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Awardee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="awardee-name">Nama</Label>
              <Input
                id="awardee-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awardee-university">Universitas</Label>
              <Input
                id="awardee-university"
                value={form.university}
                onChange={(e) => setForm((p) => ({ ...p, university: e.target.value }))}
                placeholder="Nama universitas"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awardee-major">Jurusan</Label>
              <Input
                id="awardee-major"
                value={form.major}
                onChange={(e) => setForm((p) => ({ ...p, major: e.target.value }))}
                placeholder="Jurusan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="awardee-year">Angkatan</Label>
              <Input
                id="awardee-year"
                type="number"
                value={form.year}
                onChange={(e) => setForm((p) => ({ ...p, year: e.target.value }))}
                placeholder="Tahun"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: 'Aktif' | 'Alumni') => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Alumni">Alumni</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitAwardee}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
