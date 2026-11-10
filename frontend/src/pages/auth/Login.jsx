import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../services/AuthContext';
import { motion } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import EmailInput from '../../components/EmailInput';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.error || 'Error al iniciar sesion');
    }
  }

  return (
    <div className="min-h-[calc(100vh-60px)] flex relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900" />
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-cyan-400 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-primary-400 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              className="inline-block mb-3 bg-white/95 rounded-2xl px-6 py-4 shadow-[0_0_40px_rgba(0,206,209,0.15)]"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <img src="/brand/freximos-full.png" alt="Freximos AI Systems" className="h-40 object-contain" />
            </motion.div>
            <p className="text-white/40 text-sm">Ingresa a tu cuenta</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 space-y-5 shadow-2xl">
            {error && (
              <div className="bg-red-500/20 text-red-200 p-3 rounded-xl text-sm border border-red-400/30">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-cyan-100/80 mb-1.5">Email</label>
              <EmailInput value={email} onChange={setEmail} />
            </div>

            <div>
              <label className="block text-sm font-medium text-cyan-100/80 mb-1.5">Contrasena</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="********" className="input-modern !pl-10" />
              </div>
            </div>

            <motion.button
              type="submit"
              className="w-full bg-gradient-to-r from-primary-600 to-cyan-500 text-white py-3 rounded-xl font-semibold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              Ingresar <ArrowRight size={18} />
            </motion.button>

            <p className="text-center text-sm text-white/50">
              No tienes cuenta?{' '}
              <Link to="/register" className="text-cyan-300 hover:text-cyan-200 font-medium transition">Registrate</Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
