import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dashboardStats, mockLetters, currentUser } from '@/data/mockData';
import { LetterCard } from '@/components/mail/LetterCard';
import {
  Send,
  FileEdit,
  ClipboardCheck,
  ArrowRight,
  GraduationCap,
  BarChart3,
  Wallet,
  UsersRound,
  Mail,
  TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const moduleCards = [
  {
    label: 'Surat Menyurat',
    description: 'Kelola surat keluar, SK, dan proposal',
    value: dashboardStats.outbox,
    unit: 'dokumen',
    icon: Mail,
    path: '/outbox',
    color: 'bg-primary/10 text-primary',
  },
  {
    label: 'Database Awardee',
    description: 'Data penerima beasiswa',
    value: 156,
    unit: 'awardee',
    icon: GraduationCap,
    path: '/awardees',
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  {
    label: 'Monitoring Program',
    description: 'Tracking kegiatan organisasi',
    value: 4,
    unit: 'program',
    icon: BarChart3,
    path: '/programs',
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  },
  {
    label: 'Keuangan',
    description: 'Anggaran dan realisasi',
    value: 'Rp 37,5jt',
    unit: 'saldo',
    icon: Wallet,
    path: '/finance',
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  },
  {
    label: 'Anggota',
    description: 'Manajemen anggota organisasi',
    value: 6,
    unit: 'anggota',
    icon: UsersRound,
    path: '/members',
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  },
];

export default function Dashboard() {
  const recentLetters = mockLetters.slice(0, 3);
  const pendingApprovals = mockLetters.filter(l => l.status === 'pending_approval').slice(0, 3);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
            Selamat Datang, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-muted-foreground">
            Ringkasan aktivitas organisasi Ikatan Awardee Beasiswa
          </p>
        </motion.div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          {moduleCards.map((card, index) => (
            <motion.div
              key={card.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07 }}
            >
              <Link to={card.path}>
                <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer group h-full">
                  <CardContent className="p-5">
                    <div className={`p-2.5 rounded-lg ${card.color} w-fit mb-3`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="text-xs text-muted-foreground mb-1">{card.unit}</p>
                    <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors">
                      {card.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{card.description}</p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Letters */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg font-semibold">Surat Terbaru</CardTitle>
                <Link to="/outbox">
                  <Button variant="ghost" size="sm" className="gap-1">
                    Lihat Semua
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentLetters.map((letter, index) => (
                  <LetterCard key={letter.id} letter={letter} index={index} />
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Pending Approvals */}
            {pendingApprovals.length > 0 && (
              <Card className="border-orange-200 dark:border-orange-800/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-orange-500" />
                    Menunggu Persetujuan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingApprovals.map((letter) => (
                    <div key={letter.id} className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-medium text-sm line-clamp-1">{letter.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {letter.referenceNumber}
                      </p>
                    </div>
                  ))}
                  <Link to="/approvals">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Lihat Semua
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ringkasan Cepat
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Awardee Aktif</span>
                  <span className="font-semibold text-foreground">89</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Program Berjalan</span>
                  <span className="font-semibold text-foreground">2</span>
                </div>
                <div className="flex justify-between items-center p-2 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Draft Surat</span>
                  <span className="font-semibold text-foreground">{dashboardStats.drafts}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}
