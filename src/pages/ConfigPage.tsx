import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import type { Period, Department, Member, Awardee, UserWithStatus } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Settings, Calendar, Building2, UsersRound, GraduationCap, Plus, Pencil, Trash2, ArrowRight, UserCheck } from 'lucide-react';

const SHORT_LIST_SIZE = 10;

export default function ConfigPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const [periods, setPeriods] = useState<Period[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [awardees, setAwardees] = useState<Awardee[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [periodAddOpen, setPeriodAddOpen] = useState(false);
  const [periodEditOpen, setPeriodEditOpen] = useState(false);
  const [periodForm, setPeriodForm] = useState({ name: '', startDate: '', endDate: '', isActive: false });
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [deptAddOpen, setDeptAddOpen] = useState(false);
  const [deptEditOpen, setDeptEditOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: '', sortOrder: 0 });
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [users, setUsers] = useState<UserWithStatus[]>([]);

  const loadPeriods = () => api.getPeriods().then(setPeriods).catch(() => setPeriods([]));
  const loadUsers = () => api.getUsers().then(setUsers).catch(() => setUsers([]));
  const loadDepartments = () => {
    if (!selectedPeriodId) return setDepartments([]);
    return api.getDepartments(selectedPeriodId).then(setDepartments).catch(() => setDepartments([]));
  };

  useEffect(() => {
    loadPeriods();
  }, []);
  useEffect(() => {
    loadDepartments();
  }, [selectedPeriodId]);
  useEffect(() => {
    if (periods.length && !selectedPeriodId) setSelectedPeriodId(periods[0].id);
  }, [periods, selectedPeriodId]);
  useEffect(() => {
    api.getMembers().then(setMembers).catch(() => setMembers([]));
    api.getAwardees().then(setAwardees).catch(() => setAwardees([]));
    loadUsers();
  }, []);

  const handleAddPeriod = () => {
    if (!periodForm.name.trim()) {
      toast({ title: 'Nama periode wajib', variant: 'destructive' });
      return;
    }
    api
      .createPeriod({
        name: periodForm.name.trim(),
        startDate: periodForm.startDate || undefined,
        endDate: periodForm.endDate || undefined,
        isActive: periodForm.isActive,
      })
      .then(() => {
        loadPeriods();
        setPeriodForm({ name: '', startDate: '', endDate: '', isActive: false });
        setPeriodAddOpen(false);
        toast({ title: 'Periode berhasil ditambahkan' });
      })
      .catch((err) => toast({ title: 'Gagal menambahkan periode', description: err?.message, variant: 'destructive' }));
  };

  const handleUpdatePeriod = () => {
    if (!editingPeriod) return;
    api
      .updatePeriod(editingPeriod.id, {
        name: periodForm.name.trim() || editingPeriod.name,
        startDate: periodForm.startDate || editingPeriod.startDate,
        endDate: periodForm.endDate || editingPeriod.endDate,
        isActive: periodForm.isActive,
      })
      .then(() => {
        loadPeriods();
        setPeriodEditOpen(false);
        setEditingPeriod(null);
        toast({ title: 'Periode berhasil diperbarui' });
      })
      .catch((err) => toast({ title: 'Gagal memperbarui periode', description: err?.message, variant: 'destructive' }));
  };

  const setPeriodActive = (p: Period) => {
    api
      .updatePeriod(p.id, { isActive: true })
      .then(() => {
        loadPeriods();
        toast({ title: `${p.name} ditetapkan sebagai periode aktif` });
      })
      .catch((err) => toast({ title: 'Gagal mengubah periode aktif', description: err?.message, variant: 'destructive' }));
  };

  const openEditPeriod = (p: Period) => {
    setEditingPeriod(p);
    setPeriodForm({
      name: p.name,
      startDate: p.startDate,
      endDate: p.endDate,
      isActive: p.isActive,
    });
    setPeriodEditOpen(true);
  };

  const handleAddDept = () => {
    if (!selectedPeriodId) {
      toast({ title: 'Pilih periode dulu', variant: 'destructive' });
      return;
    }
    if (!deptForm.name.trim()) {
      toast({ title: 'Nama departemen wajib', variant: 'destructive' });
      return;
    }
    api
      .createDepartment({
        name: deptForm.name.trim(),
        periodId: selectedPeriodId,
        sortOrder: deptForm.sortOrder,
      })
      .then(() => {
        loadDepartments();
        setDeptForm({ name: '', sortOrder: departments.length });
        setDeptAddOpen(false);
        toast({ title: 'Departemen berhasil ditambahkan' });
      })
      .catch((err) => toast({ title: 'Gagal menambahkan departemen', description: err?.message, variant: 'destructive' }));
  };

  const handleUpdateDept = () => {
    if (!editingDept) return;
    api
      .updateDepartment(editingDept.id, {
        name: deptForm.name.trim() || editingDept.name,
        sortOrder: deptForm.sortOrder,
      })
      .then(() => {
        loadDepartments();
        setDeptEditOpen(false);
        setEditingDept(null);
        toast({ title: 'Departemen berhasil diperbarui' });
      })
      .catch((err) => toast({ title: 'Gagal memperbarui departemen', description: err?.message, variant: 'destructive' }));
  };

  const handleDeleteDept = (d: Department) => {
    if (!confirm(`Hapus departemen "${d.name}"?`)) return;
    api
      .deleteDepartment(d.id)
      .then(() => {
        loadDepartments();
        toast({ title: 'Departemen dihapus' });
      })
      .catch((err) => toast({ title: 'Gagal menghapus departemen', description: err?.message, variant: 'destructive' }));
  };

  const openEditDept = (d: Department) => {
    setEditingDept(d);
    setDeptForm({ name: d.name, sortOrder: d.sortOrder });
    setDeptEditOpen(true);
  };

  const shortMembers = members.slice(0, SHORT_LIST_SIZE);
  const shortAwardees = awardees.slice(0, SHORT_LIST_SIZE);

  if (user && user.role !== 'admin') {
    return null;
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Pengaturan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola periode, departemen, anggota, dan awardee.
          </p>
        </div>

        <Tabs defaultValue="periods" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
            <TabsTrigger value="periods" className="gap-2">
              <Calendar className="h-4 w-4" />
              Periode
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2">
              <Building2 className="h-4 w-4" />
              Departemen
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <UsersRound className="h-4 w-4" />
              Anggota
            </TabsTrigger>
            <TabsTrigger value="awardees" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              Awardee
            </TabsTrigger>
            <TabsTrigger value="verification" className="gap-2">
              <UserCheck className="h-4 w-4" />
              Verifikasi pengguna
            </TabsTrigger>
          </TabsList>

          <TabsContent value="periods" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Periode</CardTitle>
                <Button size="sm" onClick={() => setPeriodAddOpen(true)} className="gap-1">
                  <Plus className="h-4 w-4" />
                  Tambah Periode
                </Button>
              </CardHeader>
              <CardContent>
                {periods.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Belum ada periode. Tambah periode baru.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Mulai</TableHead>
                        <TableHead>Selesai</TableHead>
                        <TableHead>Aktif</TableHead>
                        <TableHead className="w-[180px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periods.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.startDate || '-'}</TableCell>
                          <TableCell>{p.endDate || '-'}</TableCell>
                          <TableCell>
                            {p.isActive ? (
                              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Aktif</span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPeriodActive(p)}
                              >
                                Jadikan aktif
                              </Button>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => openEditPeriod(p)} className="gap-1">
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle>Departemen</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Periode </span>
                  <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Pilih periode" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} {p.isActive ? '(aktif)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => setDeptAddOpen(true)} disabled={!selectedPeriodId} className="gap-1">
                    <Plus className="h-4 w-4" />
                    Tambah Departemen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedPeriodId ? (
                  <p className="text-muted-foreground text-sm">Pilih periode untuk melihat departemen.</p>
                ) : departments.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Belum ada departemen untuk periode ini.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Urutan</TableHead>
                        <TableHead className="w-[160px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.name}</TableCell>
                          <TableCell>{d.sortOrder}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openEditDept(d)} className="gap-1">
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteDept(d)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verification" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verifikasi pengguna</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Setujui atau tolak pendaftaran pengguna. Hanya pengguna dengan status aktif yang dapat masuk.
                </p>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Belum ada pengguna terdaftar.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[200px]">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell>{u.role || '—'}</TableCell>
                          <TableCell>
                            <span
                              className={
                                (u.status || 'active') === 'active'
                                  ? 'text-xs font-medium text-emerald-600 dark:text-emerald-400'
                                  : (u.status || '') === 'pending'
                                    ? 'text-xs font-medium text-amber-600 dark:text-amber-400'
                                    : 'text-xs font-medium text-red-600 dark:text-red-400'
                              }
                            >
                              {(u.status || 'active') === 'active'
                                ? 'Aktif'
                                : (u.status || '') === 'pending'
                                  ? 'Menunggu verifikasi'
                                  : 'Ditolak'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {(u.status || 'active') === 'pending' ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    api
                                      .updateUserAdmin(u.id, { status: 'active' })
                                      .then(() => {
                                        loadUsers();
                                        toast({ title: 'Pengguna disetujui' });
                                      })
                                      .catch(() => toast({ title: 'Gagal menyetujui', variant: 'destructive' }));
                                  }}
                                >
                                  Setujui
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    api
                                      .updateUserAdmin(u.id, { status: 'rejected' })
                                      .then(() => {
                                        loadUsers();
                                        toast({ title: 'Pengguna ditolak' });
                                      })
                                      .catch(() => toast({ title: 'Gagal menolak', variant: 'destructive' }));
                                  }}
                                >
                                  Tolak
                                </Button>
                              </div>
                            ) : (
                              '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Anggota</CardTitle>
                <Button asChild size="sm" className="gap-1">
                  <Link to="/members">
                    Kelola lengkap <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Belum ada anggota.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Departemen</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shortMembers.map((m) => (
                          <TableRow key={m.id}>
                            <TableCell className="font-medium">{m.name}</TableCell>
                            <TableCell>{m.role}</TableCell>
                            <TableCell>{m.department}</TableCell>
                            <TableCell>{m.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {members.length > SHORT_LIST_SIZE && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Menampilkan {SHORT_LIST_SIZE} dari {members.length}. Gunakan &quot;Kelola lengkap&quot; untuk melihat semua.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="awardees" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Awardee</CardTitle>
                <Button asChild size="sm" className="gap-1">
                  <Link to="/awardees">
                    Kelola lengkap <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {awardees.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Belum ada awardee.</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nama</TableHead>
                          <TableHead>Universitas</TableHead>
                          <TableHead>Prodi</TableHead>
                          <TableHead>Tahun</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shortAwardees.map((a) => (
                          <TableRow key={a.id}>
                            <TableCell className="font-medium">{a.name}</TableCell>
                            <TableCell>{a.university}</TableCell>
                            <TableCell>{a.major}</TableCell>
                            <TableCell>{a.year}</TableCell>
                            <TableCell>{a.status}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {awardees.length > SHORT_LIST_SIZE && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Menampilkan {SHORT_LIST_SIZE} dari {awardees.length}. Gunakan &quot;Kelola lengkap&quot; untuk melihat semua.
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Period Dialog */}
      <Dialog open={periodAddOpen} onOpenChange={setPeriodAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Periode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama periode</Label>
              <Input
                value={periodForm.name}
                onChange={(e) => setPeriodForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: Periode 2024–2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal mulai</Label>
                <Input
                  type="date"
                  value={periodForm.startDate}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal selesai</Label>
                <Input
                  type="date"
                  value={periodForm.endDate}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="period-active"
                checked={periodForm.isActive}
                onChange={(e) => setPeriodForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="period-active">Jadikan periode aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodAddOpen(false)}>Batal</Button>
            <Button onClick={handleAddPeriod}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Period Dialog */}
      <Dialog open={periodEditOpen} onOpenChange={(open) => { setPeriodEditOpen(open); if (!open) setEditingPeriod(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Periode</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama periode</Label>
              <Input
                value={periodForm.name}
                onChange={(e) => setPeriodForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama periode"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal mulai</Label>
                <Input
                  type="date"
                  value={periodForm.startDate}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tanggal selesai</Label>
                <Input
                  type="date"
                  value={periodForm.endDate}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="period-edit-active"
                checked={periodForm.isActive}
                onChange={(e) => setPeriodForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="rounded border-input"
              />
              <Label htmlFor="period-edit-active">Periode aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPeriodEditOpen(false)}>Batal</Button>
            <Button onClick={handleUpdatePeriod}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Department Dialog */}
      <Dialog open={deptAddOpen} onOpenChange={setDeptAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Departemen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama departemen</Label>
              <Input
                value={deptForm.name}
                onChange={(e) => setDeptForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Contoh: Divisi Pendidikan"
              />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input
                type="number"
                min={0}
                value={deptForm.sortOrder}
                onChange={(e) => setDeptForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptAddOpen(false)}>Batal</Button>
            <Button onClick={handleAddDept}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={deptEditOpen} onOpenChange={(open) => { setDeptEditOpen(open); if (!open) setEditingDept(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Departemen</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nama departemen</Label>
              <Input
                value={deptForm.name}
                onChange={(e) => setDeptForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nama departemen"
              />
            </div>
            <div className="space-y-2">
              <Label>Urutan</Label>
              <Input
                type="number"
                min={0}
                value={deptForm.sortOrder}
                onChange={(e) => setDeptForm((p) => ({ ...p, sortOrder: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeptEditOpen(false)}>Batal</Button>
            <Button onClick={handleUpdateDept}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
