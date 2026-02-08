import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
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
import { BarChart3, Plus, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const initialPrograms = [
  { id: 1, name: 'Workshop Leadership 2025', status: 'Berjalan' as const, progress: 65, startDate: '1 Jan 2025', endDate: '30 Jun 2025', pic: 'Ahmad Fauzi' },
  { id: 2, name: 'Mentoring Akademik Semester 2', status: 'Berjalan' as const, progress: 40, startDate: '1 Feb 2025', endDate: '31 Jul 2025', pic: 'Siti Nurhaliza' },
  { id: 3, name: 'Bakti Sosial Ramadan', status: 'Perencanaan' as const, progress: 15, startDate: '1 Mar 2025', endDate: '30 Apr 2025', pic: 'Budi Santoso' },
  { id: 4, name: 'Seminar Nasional Pendidikan', status: 'Selesai' as const, progress: 100, startDate: '1 Nov 2024', endDate: '15 Dec 2024', pic: 'Dewi Lestari' },
];

const statusConfig: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  'Selesai': { icon: CheckCircle2, color: 'text-emerald-600' },
  'Berjalan': { icon: Clock, color: 'text-primary' },
  'Perencanaan': { icon: AlertCircle, color: 'text-amber-600' },
};

const summaryConfig = [
  { label: 'Berjalan', key: 'Berjalan' as const, color: 'bg-primary/10 text-primary' },
  { label: 'Perencanaan', key: 'Perencanaan' as const, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
  { label: 'Selesai', key: 'Selesai' as const, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
];

export default function ProgramMonitoringPage() {
  const { toast } = useToast();
  const [programs, setPrograms] = useState(initialPrograms);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    department: '',
    status: 'Berjalan' as 'Berjalan' | 'Perencanaan' | 'Selesai',
    progress: '',
    startDate: '',
    endDate: '',
    pic: '',
  });
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    api.getPrograms().then((data) => setPrograms(data)).catch(() => {
      toast({ title: 'Database offline', description: 'Menampilkan data lokal.', variant: 'destructive' });
    });
  }, [toast]);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const berjalanCount = programs.filter((p) => p.status === 'Berjalan').length;
  const perencanaanCount = programs.filter((p) => p.status === 'Perencanaan').length;
  const selesaiCount = programs.filter((p) => p.status === 'Selesai').length;
  const summaryValues = { Berjalan: berjalanCount, Perencanaan: perencanaanCount, Selesai: selesaiCount };

  const handleSubmitProgram = () => {
    if (!form.name.trim()) {
      toast({ title: 'Nama program wajib diisi', variant: 'destructive' });
      return;
    }
    const progress = form.progress ? Math.min(100, Math.max(0, parseInt(form.progress, 10))) : 0;
    api
      .createProgram({
        name: form.name.trim(),
        department: form.department.trim() || '-',
        status: form.status,
        progress: Number.isNaN(progress) ? 0 : progress,
        startDate: form.startDate.trim() || '-',
        endDate: form.endDate.trim() || '-',
        pic: form.pic.trim() || '-',
      })
      .then(() => api.getPrograms().then(setPrograms))
      .then(() => {
        setForm({ name: '', department: '', status: 'Berjalan', progress: '', startDate: '', endDate: '', pic: '' });
        setAddOpen(false);
        toast({ title: 'Program berhasil ditambahkan' });
      })
      .catch((err) => toast({ title: 'Gagal menambahkan program', description: err?.message, variant: 'destructive' }));
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
                <BarChart3 className="h-7 w-7 text-primary" />
                Monitoring Program
              </h1>
              <p className="text-muted-foreground mt-1">Pantau progress kegiatan dan program organisasi</p>
            </div>
            <Button variant="gradient" className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Tambah Program
            </Button>
          </div>
        </motion.div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {summaryConfig.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card>
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${s.color}`}>
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{summaryValues[s.key]}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Program Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {programs.map((program, i) => {
            const config = statusConfig[program.status] || statusConfig['Perencanaan'];
            const StatusIcon = config.icon;
            return (
              <motion.div key={String(program.id)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.1 }}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{program.name}</CardTitle>
                      <span className={`flex items-center gap-1 text-xs font-medium ${config.color}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {program.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {program.department && (
                      <p className="text-xs text-muted-foreground">{program.department}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {program.startDate} — {program.endDate}
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium text-foreground">{program.progress}%</span>
                      </div>
                      <Progress value={program.progress} className="h-2" />
                    </div>
                    <p className="text-xs text-muted-foreground">PIC: {program.pic}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Program</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="program-name">Nama Program</Label>
              <Input
                id="program-name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama program"
              />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.department} onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: 'Berjalan' | 'Perencanaan' | 'Selesai') => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Berjalan">Berjalan</SelectItem>
                  <SelectItem value="Perencanaan">Perencanaan</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-progress">Progress (%)</Label>
              <Input
                id="program-progress"
                type="number"
                min={0}
                max={100}
                value={form.progress}
                onChange={(e) => setForm((p) => ({ ...p, progress: e.target.value }))}
                placeholder="0–100"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program-start">Tanggal Mulai</Label>
                <Input
                  id="program-start"
                  value={form.startDate}
                  onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  placeholder="Contoh: 1 Jan 2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="program-end">Tanggal Selesai</Label>
                <Input
                  id="program-end"
                  value={form.endDate}
                  onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                  placeholder="Contoh: 30 Jun 2025"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="program-pic">PIC</Label>
              <Input
                id="program-pic"
                value={form.pic}
                onChange={(e) => setForm((p) => ({ ...p, pic: e.target.value }))}
                placeholder="Nama PIC"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSubmitProgram}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
