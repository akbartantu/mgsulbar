import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { ClipboardCheck, RotateCcw, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [awaitingCount, setAwaitingCount] = useState(0);
  const [returned, setReturned] = useState<{ id: string; subject: string; updatedAt: string }[]>([]);
  const [approved, setApproved] = useState<{ id: string; subject: string; updatedAt: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDashboardStats(), api.getNotifications()])
      .then(([stats, notif]) => {
        setAwaitingCount(stats.awaitingMyApproval ?? 0);
        setReturned(
          (notif.returnedForRevision ?? []).map((l) => ({
            id: l.id,
            subject: l.subject || '—',
            updatedAt: l.updatedAt || '',
          }))
        );
        setApproved(
          (notif.approved ?? []).map((l) => ({
            id: l.id,
            subject: l.subject || '—',
            updatedAt: l.updatedAt || '',
          }))
        );
      })
      .catch(() => {
        toast({ title: 'Gagal memuat notifikasi', variant: 'destructive' });
      })
      .finally(() => setLoading(false));
  }, [toast]);

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-2xl mx-auto">
          <p className="text-muted-foreground">Memuat notifikasi...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Notifikasi</h1>

        {/* Surat menunggu persetujuan Anda (approver) */}
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <ClipboardCheck className="h-5 w-5 text-amber-600" />
            Surat menunggu persetujuan Anda
          </div>
          {awaitingCount > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-2">
                Ada {awaitingCount} surat yang perlu Anda setujui atau kembalikan.
              </p>
              <Link
                to="/approvals"
                className="text-sm font-medium text-primary hover:underline"
              >
                Buka halaman Persetujuan →
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada surat yang menunggu persetujuan Anda.</p>
          )}
        </section>

        {/* Surat dikembalikan untuk revisi (creator) */}
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            Surat dikembalikan untuk revisi
          </div>
          {returned.length > 0 ? (
            <ul className="space-y-2">
              {returned.map((l) => (
                <li key={l.id} className="flex flex-col gap-0.5">
                  <Link
                    to={`/create/${l.id}`}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {l.subject}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {l.updatedAt ? format(new Date(l.updatedAt), 'd MMM yyyy HH:mm', { locale: id }) : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada surat yang dikembalikan untuk revisi.</p>
          )}
        </section>

        {/* Surat disetujui (creator) */}
        <section className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 font-semibold mb-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Surat disetujui
          </div>
          {approved.length > 0 ? (
            <ul className="space-y-2">
              {approved.map((l) => (
                <li key={l.id} className="flex flex-col gap-0.5">
                  <Link
                    to="/outbox"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {l.subject}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {l.updatedAt ? format(new Date(l.updatedAt), 'd MMM yyyy HH:mm', { locale: id }) : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Tidak ada surat yang baru disetujui.</p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
