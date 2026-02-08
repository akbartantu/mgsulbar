import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const { login, clearNeedRegister } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.register({ name, email, password });
      clearNeedRegister();
      if (res.token && res.user) {
        login(res.token, res.user);
        const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
        navigate(from ?? '/', { replace: true });
      } else {
        toast({
          title: 'Pendaftaran berhasil',
          description: res.message ?? 'Anda dapat masuk setelah disetujui oleh admin.',
        });
        navigate('/login', { replace: true });
      }
    } catch (err) {
      const isNetworkError =
        err instanceof TypeError && (err.message === 'Failed to fetch' || err.message.includes('fetch'));
      const description = isNetworkError
        ? 'Server tidak dapat dihubungi. Pastikan backend berjalan (npm run dev di folder server).'
        : err instanceof Error
          ? err.message
          : 'Terjadi kesalahan. Coba lagi.';
      toast({
        title: 'Gagal mendaftar',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Daftar ke MGSULBAR</CardTitle>
          <p className="text-sm text-muted-foreground text-center">
            Buat akun dengan nama, email, dan kata sandi. Data Anda akan disimpan untuk keperluan surat menyurat.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <form className="space-y-3" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input
                id="name"
                type="text"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Memuat...' : 'Daftar'}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
