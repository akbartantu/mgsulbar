import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import type { Member } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { UsersRound, Search, Plus, UserCheck, UserX, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const initialMembers = [
  { id: 1, name: 'Ahmad Fauzi', role: 'Ketua', department: 'Pengurus Inti', email: 'ahmad@org.id', status: 'Aktif' as const },
  { id: 2, name: 'Siti Nurhaliza', role: 'Sekretaris', department: 'Pengurus Inti', email: 'siti@org.id', status: 'Aktif' as const },
  { id: 3, name: 'Budi Santoso', role: 'Bendahara', department: 'Pengurus Inti', email: 'budi@org.id', status: 'Aktif' as const },
  { id: 4, name: 'Dewi Lestari', role: 'Koordinator', department: 'Divisi Pendidikan', email: 'dewi@org.id', status: 'Aktif' as const },
  { id: 5, name: 'Rizky Pratama', role: 'Koordinator', department: 'Divisi Sosial', email: 'rizky@org.id', status: 'Nonaktif' as const },
  { id: 6, name: 'Nurul Hidayah', role: 'Anggota', department: 'Divisi Pendidikan', email: 'nurul@org.id', status: 'Aktif' as const },
];

const summaryConfig = [
  { label: 'Total Anggota', key: 'total' as const, icon: UsersRound, color: 'bg-primary/10 text-primary' },
  { label: 'Aktif', key: 'aktif' as const, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { label: 'Nonaktif', key: 'nonaktif' as const, icon: UserX, color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
];

const roleOptions = ['Ketua', 'Wakil Ketua', 'Sekretaris', 'Wakil Sekretaris', 'Bendahara', 'Wakil Bendahara', 'Koordinator', 'Koordinator Wilayah', 'Anggota'];

export default function MembersPage() {
  const { toast } = useToast();
  const [members, setMembers] = useState(initialMembers);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    userId: '' as string,
    name: '',
    role: 'Anggota',
    department: '',
    email: '',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
  });
  const [nameComboboxOpen, setNameComboboxOpen] = useState(false);
  const [users, setUsers] = useState<{ id: string; name: string; email: string; status?: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', role: 'Anggota', department: '', email: '', status: 'Aktif' as 'Aktif' | 'Nonaktif' });

  useEffect(() => {
    api.getMembers().then((data) => setMembers(data)).catch(() => {
      toast({ title: 'Database offline', description: 'Menampilkan data lokal.', variant: 'destructive' });
    });
  }, [toast]);

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (addOpen) {
      api.getUsers().then((list) => setUsers(list)).catch(() => setUsers([]));
    }
  }, [addOpen]);

  const total = members.length;
  const activeCount = members.filter((m) => m.status === 'Aktif').length;
  const inactiveCount = members.filter((m) => m.status === 'Nonaktif').length;
  const summaryValues = { total, aktif: activeCount, nonaktif: inactiveCount };

  const q = searchQuery.trim().toLowerCase();
  const filteredMembers = q
    ? members.filter(
        (m) =>
          (m.name ?? '').toLowerCase().includes(q) ||
          (m.email ?? '').toLowerCase().includes(q) ||
          (m.role ?? '').toLowerCase().includes(q) ||
          (m.department ?? '').toLowerCase().includes(q)
      )
    : members;

  const handleSubmitMember = () => {
    if (!form.userId && !form.name.trim()) {
      toast({ title: 'Pilih pengguna terdaftar atau isi nama', variant: 'destructive' });
      return;
    }
    api
      .createMember({
        userId: form.userId || undefined,
        name: form.name.trim() || '-',
        role: form.role.trim() || 'Anggota',
        department: form.department.trim() || '-',
        email: form.email.trim() || '-',
        status: form.status,
      })
      .then(() => api.getMembers().then(setMembers))
      .then(() => {
        setForm({ userId: '', name: '', role: 'Anggota', department: '', email: '', status: 'Aktif' });
        setNameComboboxOpen(false);
        setAddOpen(false);
        toast({ title: 'Anggota berhasil ditambahkan' });
      })
      .catch((err) => toast({ title: 'Gagal menambahkan anggota', description: err?.message, variant: 'destructive' }));
  };

  const assignedUserIds = new Set(members.map((m) => (m.userId || '').trim()).filter(Boolean));
  const assignableUsers = users.filter(
    (u) => (u.status || 'active') === 'active' && !assignedUserIds.has(u.id)
  );

  const openDetail = (member: Member) => {
    setSelectedMember(member);
    setDetailOpen(true);
    setEditForm({ name: member.name, role: member.role, department: member.department, email: member.email, status: member.status as 'Aktif' | 'Nonaktif' });
  };

  const openEdit = () => {
    setEditOpen(true);
  };

  const handleSubmitEdit = () => {
    if (!selectedMember) return;
    if (!editForm.name.trim()) {
      toast({ title: 'Nama wajib diisi', variant: 'destructive' });
      return;
    }
    api
      .updateMember(selectedMember.id, {
        name: editForm.name.trim(),
        role: editForm.role.trim() || 'Anggota',
        department: editForm.department.trim() || '-',
        email: editForm.email.trim() || '-',
        status: editForm.status,
      })
      .then(() => api.getMembers().then(setMembers))
      .then(() => {
        setEditOpen(false);
        setDetailOpen(false);
        setSelectedMember(null);
        toast({ title: 'Data anggota berhasil diperbarui' });
      })
      .catch((err) => toast({ title: 'Gagal memperbarui anggota', description: err?.message, variant: 'destructive' }));
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
                <UsersRound className="h-7 w-7 text-primary" />
                Manajemen Anggota
              </h1>
              <p className="text-muted-foreground mt-1">Kelola data anggota dan struktur organisasi</p>
            </div>
            <Button variant="gradient" className="gap-2" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Tambah Anggota
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
                    <s.icon className="h-5 w-5" />
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

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari anggota..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Members Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member, i) => (
            <motion.div key={String(member.id)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => openDetail(member)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        member.status === 'Aktif'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}
                    >
                      {member.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium text-foreground">{member.role}</span> · {member.department}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggota</DialogTitle>
            <DialogDescription className="sr-only">Form tambah anggota baru</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Popover open={nameComboboxOpen} onOpenChange={setNameComboboxOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={nameComboboxOpen}
                    className={cn('w-full justify-between font-normal', !form.name && 'text-muted-foreground')}
                  >
                    {form.name || 'Cari pengguna terdaftar...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Cari nama atau email..." />
                    <CommandList>
                      <CommandEmpty>Tidak ada pengguna terdaftar (aktif).</CommandEmpty>
                      {assignableUsers.map((u) => {
                        const value = `${u.name} (${u.email})`;
                        return (
                          <CommandItem
                            key={u.id}
                            value={value}
                            onSelect={() => {
                              setForm((p) => ({ ...p, userId: u.id, name: u.name, email: u.email || '' }));
                              setNameComboboxOpen(false);
                            }}
                          >
                            <span className="font-medium">{u.name}</span>
                            {u.email && <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>}
                          </CommandItem>
                        );
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Divisi / Koordinator Wilayah</Label>
              <Select value={form.department} onValueChange={(v) => setForm((p) => ({ ...p, department: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(20rem,70vh)] overflow-y-auto">
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email</Label>
              <Input
                id="member-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@org.id"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v: 'Aktif' | 'Nonaktif') => setForm((p) => ({ ...p, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setNameComboboxOpen(false); setAddOpen(false); }}>
              Batal
            </Button>
            <Button onClick={handleSubmitMember}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setSelectedMember(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail Anggota</DialogTitle>
            <DialogDescription className="sr-only">Informasi detail anggota</DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {selectedMember.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-foreground">{selectedMember.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedMember.role} · {selectedMember.department}</p>
                </div>
              </div>
              <dl className="grid gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium">{selectedMember.email}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      selectedMember.status === 'Aktif'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {selectedMember.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>Tutup</Button>
            <Button onClick={openEdit}>Edit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => { setEditOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Anggota</DialogTitle>
            <DialogDescription className="sr-only">Form edit data anggota</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama lengkap"
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm((p) => ({ ...p, role: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Divisi / Koordinator Wilayah</Label>
              <Select value={editForm.department} onValueChange={(v) => setEditForm((p) => ({ ...p, department: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih divisi" />
                </SelectTrigger>
                <SelectContent className="max-h-[min(20rem,70vh)] overflow-y-auto">
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@org.id"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={(v: 'Aktif' | 'Nonaktif') => setEditForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktif">Aktif</SelectItem>
                  <SelectItem value="Nonaktif">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
            <Button onClick={handleSubmitEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
