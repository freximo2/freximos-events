import { Link } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { motion } from 'framer-motion';
import { CalendarDays, Users, Trophy, Sparkles, ArrowRight, Shield } from 'lucide-react';

const features = [
  { icon: CalendarDays, title: 'Multi-categoria', desc: 'Futbol, basketball, baile, bolos, reuniones y mas', color: 'from-blue-500 to-cyan-500' },
  { icon: Users, title: 'Lista de espera inteligente', desc: 'Prioridad automatica para los participantes mas activos', color: 'from-purple-500 to-pink-500' },
  { icon: Trophy, title: 'Estadisticas', desc: 'Metricas personales y dashboards para organizadores', color: 'from-amber-500 to-orange-500' },
  { icon: Shield, title: 'Control de roles', desc: 'Gestion granular de permisos: User, Admin, Super Admin', color: 'from-emerald-500 to-teal-500' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-60px)] overflow-hidden">
      {/* Hero */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-slate-900" />
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-400 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Logo final */}
            <motion.div
              className="inline-block mb-6 bg-white/95 rounded-3xl px-8 py-6 shadow-[0_0_60px_rgba(0,206,209,0.2)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              <img src="/brand/freximos-full.png" alt="Freximos AI Systems" className="h-56 md:h-72 object-contain" />
            </motion.div>

            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm text-white/90 mb-6">
              <Sparkles size={14} />
              Plataforma de gestion de eventos
            </div>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
              Crea, gestiona e inscribete en eventos de cualquier tipo.
              Sistema inteligente de lista de espera, notificaciones y estadisticas en tiempo real.
            </p>

            {/* CTA */}
            {user ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="inline-block"
              >
                <div className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-6 text-left inline-block">
                  <p className="text-white/80 text-lg">
                    Bienvenido, <span className="font-bold text-white">{user.name}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="badge bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">{user.role}</span>
                    <Link to="/events" className="bg-gradient-to-r from-cyan-500 to-primary-500 text-white px-5 py-2 rounded-xl text-sm font-medium inline-flex items-center gap-1 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all">
                      Ir a eventos <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                className="flex items-center justify-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Link to="/register" className="bg-gradient-to-r from-cyan-500 to-primary-500 text-white px-8 py-3 rounded-xl text-base font-semibold inline-flex items-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all">
                  Comenzar gratis <ArrowRight size={18} />
                </Link>
                <Link to="/login" className="bg-white/10 backdrop-blur border border-white/20 text-white px-8 py-3 rounded-xl text-base font-medium hover:bg-white/15 transition-all">
                  Iniciar sesion
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 card-hover"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                <f.icon size={22} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
