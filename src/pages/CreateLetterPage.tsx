import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LetterType, Priority, Classification } from '@/types/mail';
import { api } from '@/lib/api';
import type { Department, Member } from '@/lib/api';
import {
  Send,
  FileEdit,
  Paperclip,
  X,
  ArrowLeft,
  Save,
  SendHorizontal,
  Plus,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { RichTextToolbar } from '@/components/mail/RichTextToolbar';
import { ContentPreview } from '@/components/mail/ContentPreview';
import { useRichTextarea } from '@/hooks/useRichTextarea';
import { useContentEditable } from '@/hooks/useContentEditable';
import { getTemplatesByType } from '@/data/letterTemplates';
import {
  formatEventDetailsHtml,
  hasEventDetailsPlaceholder,
  EVENT_DETAILS_PLACEHOLDER,
} from '@/lib/eventDetails';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronsUpDown } from 'lucide-react';

const letterTypes: { value: LetterType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'surat_keluar', label: 'Surat Keluar', icon: <Send className="h-4 w-4" />, description: 'Surat resmi keluar organisasi' },
  { value: 'surat_keputusan', label: 'Surat Keputusan', icon: <FileEdit className="h-4 w-4" />, description: 'SK pengangkatan, pembentukan tim, dll' },
  { value: 'proposal', label: 'Proposal', icon: <FileEdit className="h-4 w-4" />, description: 'Proposal kegiatan atau anggaran' },
];

const priorities: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Rendah' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Penting' },
  { value: 'urgent', label: 'Sangat Penting' },
];

const classifications: { value: Classification; label: string }[] = [
  { value: 'public', label: 'Umum' },
  { value: 'internal', label: 'Internal' },
  { value: 'confidential', label: 'Rahasia' },
  { value: 'secret', label: 'Sangat Rahasia' },
];

export default function CreateLetterPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { id: letterId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [editLoaded, setEditLoaded] = useState(false);
  const [editLetterStatus, setEditLetterStatus] = useState<'draft' | 'pending_approval' | undefined>(undefined);

  const initialType = (searchParams.get('type') as LetterType) || 'surat_keluar';

  useEffect(() => {
    api.getDepartments().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!letterId || !user) return;
    api
      .getLetter(letterId)
      .then((letter) => {
        setFormData((prev) => ({
          ...prev,
          type: letter.type,
          from: letter.from,
          to: letter.to,
          fromDepartment: letter.fromDepartment || '',
          subject: letter.subject,
          content: letter.content || '',
          priority: letter.priority,
          classification: letter.classification,
          contentJustification: (letter.contentJustification as 'left' | 'center' | 'right' | 'justify') || 'left',
          lineHeight: letter.lineHeight ?? 1.5,
          letterSpacing: letter.letterSpacing || 'normal',
          fontFamily: letter.fontFamily || 'Times New Roman',
          fontSize: letter.fontSize ?? 12,
          eventDate: letter.eventDate ?? '',
          eventWaktu: letter.eventWaktu ?? '',
          eventTempat: letter.eventLocation ?? '',
          eventAcara: letter.eventAcara ?? '',
        }));
        if (letter.content?.includes(EVENT_DETAILS_PLACEHOLDER)) setSelectedTemplate('sk-undangan');
        const approverIds =
          letter.approvalSteps?.length > 0
            ? letter.approvalSteps.map((s) => (s.approver?.id ?? (s as { approverId?: string }).approverId) || '')
            : [''];
        setSelectedApprovers(approverIds.length ? approverIds : ['']);
        setSelectedCc(Array.isArray(letter.cc) ? letter.cc : []);
        setEditLetterStatus(letter.status === 'draft' || letter.status === 'pending_approval' ? letter.status : 'draft');
        setEditLoaded(true);
      })
      .catch(() => {
        toast({ title: 'Gagal memuat draft', variant: 'destructive' });
        navigate('/drafts');
      });
  }, [letterId, user, navigate, toast]);
  const [members, setMembers] = useState<Member[]>([]);
  useEffect(() => {
    api.getMembers({ periodId: 'current' }).then(setMembers).catch(() => setMembers([]));
  }, []);
  const [fromComboboxOpen, setFromComboboxOpen] = useState(false);
  const [approverComboboxOpen, setApproverComboboxOpen] = useState<number | null>(null);
  const [ccComboboxOpen, setCcComboboxOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: initialType,
    from: '',
    fromDepartment: '',
    to: '',
    subject: '',
    content: '',
    priority: 'normal' as Priority,
    classification: 'internal' as Classification,
    contentJustification: 'left' as 'left' | 'center' | 'right' | 'justify',
    lineHeight: 1.5,
    letterSpacing: 'normal' as string,
    fontFamily: 'Times New Roman',
    fontSize: 12,
    // Undangan template event details (Hari/Tanggal, Waktu, Tempat, Acara)
    eventDate: '',
    eventWaktu: '',
    eventTempat: '',
    eventAcara: '',
  });
  const [departments, setDepartments] = useState<Department[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>(['']);
  const [selectedCc, setSelectedCc] = useState<string[]>([]);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isProposalType = formData.type === 'proposal';
  const richText = useRichTextarea(formData.content, (val) => handleInputChange('content', val), contentRef);
  const contentEditable = useContentEditable(
    formData.content,
    (html) => handleInputChange('content', html),
    !isProposalType
  );

  // Loading check must run AFTER all hooks so hook order/count is stable (Rules of Hooks).
  const isEditMode = Boolean(letterId);
  if (isEditMode && !editLoaded) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-4xl mx-auto flex items-center justify-center min-h-[200px]">
          <p className="text-muted-foreground">Memuat draft...</p>
        </div>
      </AppLayout>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraft = async () => {
    if (!user) {
      toast({ title: 'Anda harus masuk untuk menyimpan draft.', variant: 'destructive' });
      return;
    }
    setIsSavingDraft(true);
    const now = new Date().toISOString();
    const validApprovers = selectedApprovers.filter((a) => a !== '');
    const letter = {
      type: formData.type,
      subject: formData.subject || '',
      content: formData.content || '',
      from: formData.from,
      to: formData.to,
      fromDepartment: formData.fromDepartment || '',
      priority: formData.priority,
      classification: formData.classification,
      status: (letterId && editLetterStatus ? editLetterStatus : 'draft') as 'draft' | 'pending_approval',
      contentJustification: formData.contentJustification,
      lineHeight: formData.lineHeight,
      letterSpacing: formData.letterSpacing,
      fontFamily: formData.fontFamily,
      fontSize: formData.fontSize,
      createdBy: { id: user.id, name: user.name, email: user.email, role: user.role },
      approvalSteps: validApprovers.map((approverId, i) => ({ approverId, approver: { id: approverId }, order: i + 1 })),
      ...(letterId ? {} : { statusHistory: [{ status: 'draft' as const, changedBy: { id: user.id }, changedAt: now }] }),
      cc: selectedCc.filter(Boolean),
      attachments: [],
      ...(selectedTemplate === 'sk-undangan'
        ? {
            eventDate: formData.eventDate,
            eventWaktu: formData.eventWaktu,
            eventLocation: formData.eventTempat,
            eventAcara: formData.eventAcara,
          }
        : {}),
    };
    try {
      // When editing a draft, always overwrite the existing letter (PATCH); never create a new one (POST).
      if (letterId) {
        await api.updateLetter(letterId, letter);
        toast({ title: 'Draft Diperbarui', description: 'Perubahan draft berhasil disimpan.' });
      } else {
        await api.createLetter(letter);
        toast({ title: 'Draft Tersimpan', description: 'Surat berhasil disimpan sebagai draft.' });
      }
      navigate('/drafts');
    } catch (err) {
      toast({
        title: 'Gagal menyimpan draft',
        description: err instanceof Error ? err.message : 'Coba lagi.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingDraft(false);
    }
  };

  const addApprover = () => {
    setSelectedApprovers(prev => [...prev, '']);
  };

  const removeApprover = (index: number) => {
    if (selectedApprovers.length > 1) {
      setSelectedApprovers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateApprover = (index: number, value: string) => {
    setSelectedApprovers(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const templates = getTemplatesByType(formData.type);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        content: template.content,
        ...(templateId === 'sk-undangan'
          ? {
              eventDate: '[Hari, Tanggal Lengkap]',
              eventWaktu: '[Pukul Mulai - Selesai] WIB',
              eventTempat: '[Lokasi Lengkap]',
              eventAcara: '[Nama Acara]',
            }
          : {}),
      }));
    }
  };

  const handleTypeChange = (type: string) => {
    handleInputChange('type', type);
    setSelectedTemplate('');
    setFormData(prev => ({ ...prev, subject: '', content: '' }));
  };

  const availableTemplates = getTemplatesByType(formData.type);

  const handleSubmitForApproval = async () => {
    if (!user) {
      toast({ title: 'Anda harus masuk untuk mengirim surat.', variant: 'destructive' });
      return;
    }
    if (!formData.to || !formData.subject || !formData.content) {
      toast({
        title: "Data Tidak Lengkap",
        description: "Mohon lengkapi semua field yang wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    const validApprovers = selectedApprovers.filter(a => a !== '');
    if (validApprovers.length === 0) {
      toast({
        title: "Pilih Approver",
        description: "Mohon pilih minimal satu pejabat yang akan menyetujui surat ini.",
        variant: "destructive",
      });
      return;
    }

    // Validate: person in Dari (Nama/Jabatan) must be the last approver
    if (formData.from) {
      const fromMember = members.find((m) => `${m.role} – ${m.name}` === formData.from);
      if (fromMember) {
        const lastApproverId = validApprovers[validApprovers.length - 1];
        const lastIsFrom = lastApproverId === fromMember.id || lastApproverId === fromMember.userId;
        if (!lastIsFrom) {
          toast({
            title: "Urutan Approver Salah",
            description: "Orang yang tercantum di Dari (Nama/Jabatan) harus menjadi approver terakhir.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();
    // First step is pending; rest get status when previous approver approves
    const approvalStepsWithStatus = validApprovers.map((approverId, i) => ({
      approverId,
      approver: { id: approverId },
      order: i + 1,
      ...(i === 0 ? { status: 'pending' as const } : {}),
    }));
    const letter = {
      type: formData.type,
      subject: formData.subject || '',
      content: formData.content || '',
      from: formData.from,
      to: formData.to,
      fromDepartment: formData.fromDepartment || '',
      priority: formData.priority,
      classification: formData.classification,
      status: 'pending_approval' as const,
      contentJustification: formData.contentJustification,
      lineHeight: formData.lineHeight,
      letterSpacing: formData.letterSpacing,
      fontFamily: formData.fontFamily,
      fontSize: formData.fontSize,
      createdBy: { id: user.id, name: user.name, email: user.email, role: user.role },
      approvalSteps: approvalStepsWithStatus,
      ...(letterId ? {} : { statusHistory: [{ status: 'pending_approval' as const, changedBy: { id: user.id }, changedAt: now }] }),
      cc: selectedCc.filter(Boolean),
      attachments: [],
      ...(selectedTemplate === 'sk-undangan'
        ? {
            eventDate: formData.eventDate,
            eventWaktu: formData.eventWaktu,
            eventLocation: formData.eventTempat,
            eventAcara: formData.eventAcara,
          }
        : {}),
    };
    try {
      if (letterId) {
        await api.updateLetter(letterId, letter);
      } else {
        await api.createLetter(letter);
      }
      toast({
        title: "Surat Terkirim untuk Persetujuan",
        description: "Surat Anda telah dikirim ke approver untuk ditinjau.",
      });
      navigate('/drafts');
    } catch (err) {
      toast({
        title: "Gagal mengirim",
        description: err instanceof Error ? err.message : "Coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getApproverOptions = (index: number) =>
    members.filter((m) => !selectedApprovers.includes(m.id) || selectedApprovers[index] === m.id);
  const getApproverLabel = (id: string) => {
    const m = members.find((x) => x.id === id || x.userId === id);
    return m ? `${m.role} – ${m.name}` : (id ? `${id.slice(0, 12)}…` : '—');
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4 gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            {letterId ? 'Edit Draft' : 'Buat Surat Baru'}
          </h1>
          <p className="text-muted-foreground">
            {letterId ? 'Perbarui draft surat Anda' : 'Lengkapi formulir di bawah untuk membuat surat baru'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detail Surat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Letter Type Selection */}
              <div className="grid grid-cols-3 gap-3">
                {letterTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => handleTypeChange(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.type === type.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      formData.type === type.value
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}>
                      {type.icon}
                    </div>
                    <span className="text-sm font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground text-center">{type.description}</span>
                  </button>
                ))}
              </div>

              {/* Template Selection */}
              {availableTemplates.length > 0 && (
                <div className="space-y-2">
                  <Label>Pilih Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={handleTemplateSelect}
                  >
                    <SelectTrigger className="text-left [&>span]:flex [&>span]:flex-col [&>span]:items-start [&>span]:text-left">
                      <SelectValue placeholder="Pilih template untuk memulai..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{template.name}</span>
                            <span className="text-xs text-muted-foreground">{template.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Dari (Unit & Nama) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dari (Unit)</Label>
                  <Select
                    value={formData.fromDepartment || ''}
                    onValueChange={(v) => {
                      handleInputChange('fromDepartment', v);
                      handleInputChange('from', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih unit/department" />
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
                  <Label>Dari (Nama/Jabatan)</Label>
                  <Popover open={fromComboboxOpen} onOpenChange={setFromComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={fromComboboxOpen}
                        className={cn(
                          'w-full justify-between font-normal',
                          !formData.from && 'text-muted-foreground'
                        )}
                        disabled={!formData.fromDepartment}
                      >
                        {formData.from || (formData.fromDepartment ? 'Pilih nama/jabatan...' : 'Pilih unit terlebih dahulu')}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari nama atau jabatan..." />
                        <CommandList>
                          <CommandEmpty>Tidak ada anggota.</CommandEmpty>
                          {members
                            .filter((m) => m.department === formData.fromDepartment)
                            .map((member) => {
                              const value = `${member.role} – ${member.name}`;
                              return (
                                <CommandItem
                                  key={member.id}
                                  value={value}
                                  onSelect={() => {
                                    handleInputChange('from', value);
                                    setFromComboboxOpen(false);
                                  }}
                                >
                                  {value}
                                </CommandItem>
                              );
                            })}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to">Kepada <span className="text-destructive">*</span></Label>
                  <Input
                    id="to"
                    placeholder="Nama penerima atau instansi"
                    value={formData.to}
                    onChange={(e) => handleInputChange('to', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioritas</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classification">Klasifikasi</Label>
                <Select
                  value={formData.classification}
                  onValueChange={(value) => handleInputChange('classification', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classifications.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tembusan (Cc) */}
              <div className="space-y-2">
                <Label>Tembusan</Label>
                <p className="text-xs text-muted-foreground">
                  Penerima tembusan akan mendapat notifikasi setelah surat disetujui oleh approver terakhir.
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedCc.map((memberId) => {
                    const m = members.find((x) => x.id === memberId);
                    if (!m) return null;
                    return (
                      <span
                        key={memberId}
                        className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 text-sm"
                      >
                        {m.role} – {m.name}
                        <button
                          type="button"
                          className="rounded p-0.5 hover:bg-muted"
                          onClick={() => setSelectedCc((prev) => prev.filter((id) => id !== memberId))}
                          aria-label="Hapus"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    );
                  })}
                  <Popover open={ccComboboxOpen} onOpenChange={setCcComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" size="sm" className="gap-1 h-8">
                        <Plus className="h-3.5 w-3.5" />
                        Tambah tembusan
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Cari anggota..." />
                        <CommandList>
                          <CommandEmpty>Tidak ada anggota.</CommandEmpty>
                          {members
                            .filter((m) => !selectedCc.includes(m.id))
                            .map((member) => (
                              <CommandItem
                                key={member.id}
                                value={`${member.role} – ${member.name}`}
                                onSelect={() => {
                                  setSelectedCc((prev) => (prev.includes(member.id) ? prev : [...prev, member.id]));
                                  setCcComboboxOpen(false);
                                }}
                              >
                                {member.role} – {member.name}
                              </CommandItem>
                            ))}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Approvers Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Approver <span className="text-destructive">*</span></Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addApprover}
                    className="gap-1 h-8"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Tambah Approver
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Urutan approver menentukan alur persetujuan: approver pertama menerima lebih dulu, lalu berikutnya. Orang di Dari (Nama/Jabatan) harus menjadi approver terakhir.
                </p>
                <div className="space-y-2">
                  {selectedApprovers.map((approverId, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium shrink-0">
                        {index + 1}
                      </div>
                      <Popover
                        open={approverComboboxOpen === index}
                        onOpenChange={(open) => setApproverComboboxOpen(open ? index : null)}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={approverComboboxOpen === index}
                            className={cn('flex-1 justify-between font-normal', !approverId && 'text-muted-foreground')}
                          >
                            {approverId ? getApproverLabel(approverId) : 'Pilih approver...'}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Cari nama atau jabatan..." />
                            <CommandList>
                              <CommandEmpty>Tidak ada anggota.</CommandEmpty>
                              {getApproverOptions(index).map((member) => {
                                const value = `${member.role} – ${member.name}`;
                                return (
                                  <CommandItem
                                    key={member.id}
                                    value={value}
                                    onSelect={() => {
                                      updateApprover(index, member.id);
                                      setApproverComboboxOpen(null);
                                    }}
                                  >
                                    {value}
                                  </CommandItem>
                                );
                              })}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedApprovers.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="iconSm"
                          onClick={() => removeApprover(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Perihal <span className="text-destructive">*</span></Label>
                <Input
                  id="subject"
                  placeholder="Perihal surat"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Isi Surat <span className="text-destructive">*</span></Label>
                <div>
                  <RichTextToolbar
                    prefix={
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs text-muted-foreground shrink-0">Perataan</span>
                        <div className="flex items-center rounded-md border border-input overflow-hidden">
                          {(['left', 'center', 'right', 'justify'] as const).map((align) => {
                            const Icon = align === 'left' ? AlignLeft : align === 'center' ? AlignCenter : align === 'right' ? AlignRight : AlignJustify;
                            return (
                              <Tooltip key={align}>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="iconSm"
                                    className={cn('h-7 w-7 rounded-none', formData.contentJustification === align && 'bg-muted')}
                                    onClick={() => handleInputChange('contentJustification', align)}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="text-xs">
                                  {align === 'left' ? 'Kiri' : align === 'center' ? 'Tengah' : align === 'right' ? 'Kanan' : 'Rata kanan-kiri'}
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                        <span className="text-xs text-muted-foreground shrink-0">Font</span>
                        <Select
                          value={formData.fontFamily}
                          onValueChange={(v) => setFormData((p) => ({ ...p, fontFamily: v }))}
                        >
                          <SelectTrigger id="fontFamily" className="h-7 w-[140px] text-xs" aria-label="Font">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                            <SelectItem value="Calibri">Calibri</SelectItem>
                            <SelectItem value="Cambria">Cambria</SelectItem>
                            <SelectItem value="Verdana">Verdana</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground shrink-0">Ukuran</span>
                        <Select
                          value={String(formData.fontSize)}
                          onValueChange={(v) => setFormData((p) => ({ ...p, fontSize: parseInt(v, 10) }))}
                        >
                          <SelectTrigger id="fontSize" className="h-7 w-[56px] text-xs" aria-label="Ukuran font">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[10, 11, 12, 14, 16, 18, 20, 24].map((n) => (
                              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground shrink-0">Jarak baris</span>
                        <Select
                          value={String(formData.lineHeight)}
                          onValueChange={(v) => setFormData((p) => ({ ...p, lineHeight: parseFloat(v) }))}
                        >
                          <SelectTrigger id="lineHeight" className="h-7 w-[72px] text-xs" aria-label="Jarak baris">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1.0</SelectItem>
                            <SelectItem value="1.15">1.15</SelectItem>
                            <SelectItem value="1.5">1.5</SelectItem>
                            <SelectItem value="2">2.0</SelectItem>
                            <SelectItem value="2.5">2.5</SelectItem>
                            <SelectItem value="3">3.0</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className="text-xs text-muted-foreground shrink-0">Jarak huruf</span>
                        <Select
                          value={formData.letterSpacing}
                          onValueChange={(v) => setFormData((p) => ({ ...p, letterSpacing: v }))}
                        >
                          <SelectTrigger id="letterSpacing" className="h-7 w-[90px] text-xs" aria-label="Jarak huruf">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="0.03em">Sedang</SelectItem>
                            <SelectItem value="0.05em">Lebar</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    }
                    onBold={isProposalType ? richText.toggleBold : contentEditable.toggleBold}
                    onItalic={isProposalType ? richText.toggleItalic : contentEditable.toggleItalic}
                    onUnderline={isProposalType ? richText.toggleUnderline : contentEditable.toggleUnderline}
                    onBullet={isProposalType ? richText.toggleBullet : contentEditable.toggleBullet}
                    onNumbered={isProposalType ? richText.toggleNumbered : contentEditable.toggleNumbered}
                    onAlpha={isProposalType ? richText.toggleAlpha : contentEditable.toggleAlpha}
                    onRoman={isProposalType ? richText.toggleRoman : contentEditable.toggleRoman}
                    onClearList={isProposalType ? richText.clearList : contentEditable.clearList}
                    onIndent={isProposalType ? richText.indentLines : contentEditable.indentLines}
                    onOutdent={isProposalType ? richText.outdentLines : contentEditable.outdentLines}
                  />
                  {isProposalType ? (
                    <Textarea
                      id="content"
                      ref={contentRef}
                      placeholder="Tulis isi surat di sini..."
                      rows={12}
                      spellCheck={false}
                      className="rounded-t-none border-t-0 text-sm"
                      style={{
                        fontFamily: formData.fontFamily,
                        fontSize: formData.fontSize,
                        textAlign: formData.contentJustification,
                        lineHeight: formData.lineHeight,
                        letterSpacing: formData.letterSpacing,
                      }}
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      onKeyDown={richText.handleKeyDown}
                    />
                  ) : (
                    <div
                      ref={contentEditable.editorRef}
                      id="content"
                      contentEditable
                      role="textbox"
                      aria-label="Isi Surat"
                      data-placeholder="Tulis isi surat di sini..."
                      spellCheck={false}
                      className="rounded-t-none border-t-0 border border-input rounded-b-md min-h-[12rem] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:pl-6 [&_ol]:list-decimal [&_li]:my-0.5"
                      style={{
                        fontFamily: formData.fontFamily,
                        fontSize: formData.fontSize,
                        textAlign: formData.contentJustification,
                        lineHeight: formData.lineHeight,
                        letterSpacing: formData.letterSpacing,
                      }}
                      onInput={contentEditable.handleInput}
                      onBlur={contentEditable.handleBlur}
                      onKeyDown={contentEditable.handleKeyDown}
                      suppressContentEditableWarning
                    />
                  )}
                  {/* Detail Acara (Hari/Tanggal, Waktu, Tempat, Acara) — inside Isi Surat, for undangan */}
                  {selectedTemplate === 'sk-undangan' && (
                    <div className="mt-3 space-y-3 rounded-lg border border-border p-4 bg-muted/30">
                      <p className="text-sm font-medium text-muted-foreground">Detail Acara (kolom sejajar)</p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="eventDate">Hari/Tanggal</Label>
                          <Input
                            id="eventDate"
                            placeholder="Hari, Tanggal Lengkap"
                            value={formData.eventDate}
                            onChange={(e) => handleInputChange('eventDate', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventWaktu">Waktu</Label>
                          <Input
                            id="eventWaktu"
                            placeholder="Pukul Mulai - Selesai WIB"
                            value={formData.eventWaktu}
                            onChange={(e) => handleInputChange('eventWaktu', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventTempat">Tempat</Label>
                          <Input
                            id="eventTempat"
                            placeholder="Lokasi Lengkap"
                            value={formData.eventTempat}
                            onChange={(e) => handleInputChange('eventTempat', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventAcara">Acara</Label>
                          <Input
                            id="eventAcara"
                            placeholder="Nama Acara"
                            value={formData.eventAcara}
                            onChange={(e) => handleInputChange('eventAcara', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  {formData.content.trim() !== '' && (
                    <div className="mt-4 rounded-lg border border-border bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                      <p className="text-xs font-medium text-muted-foreground px-6 pt-4 pb-2 border-b border-border">Pratinjau</p>
                      <div className="p-6 min-h-[8rem]" style={{ maxWidth: '210mm' }}>
                        <ContentPreview
                          content={
                            hasEventDetailsPlaceholder(formData.content)
                              ? formData.content.replace(EVENT_DETAILS_PLACEHOLDER, formatEventDetailsHtml(formData))
                              : formData.content
                          }
                          className="text-black dark:text-zinc-100"
                          style={{
                            fontFamily: formData.fontFamily,
                            fontSize: formData.fontSize,
                            textAlign: formData.contentJustification,
                            lineHeight: formData.lineHeight,
                            letterSpacing: formData.letterSpacing,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-3">
                <Label>Lampiran</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Paperclip className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Klik untuk mengunggah atau drag & drop
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, XLS, XLSX (Max 10MB)
                    </span>
                  </label>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="iconSm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft}
                >
                  {isSavingDraft ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Simpan Draft
                    </>
                  )}
                </Button>
                <Button
                  variant="gradient"
                  className="gap-2 flex-1"
                  onClick={handleSubmitForApproval}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="h-4 w-4" />
                      Kirim untuk Persetujuan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}
