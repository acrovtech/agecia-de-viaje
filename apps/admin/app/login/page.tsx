import { isApiAdmin } from '../../lib/admin-mode';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm apiMode={isApiAdmin()} />;
}
