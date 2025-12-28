import { motion } from "framer-motion";
import { listCategories as findAll } from "@agape/catalogs/category";
import PageLayout from "@/app/cms/PageLayout";
import { useRouter } from "@/components/router/router-hook";
import {
  UsersIcon,
  CubeIcon,
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  TagIcon,
  TruckIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
    } as any,
  },
};

const StatCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: any;
  color: string;
}) => (
  <motion.div
    variants={itemVariants}
    className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 text-${color}-600 dark:text-${color}-400 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
        {trend === "up" ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
        {change}
      </div>
    </div>
    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</h3>
    <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
    <div className={`absolute bottom-0 left-0 h-1 bg-${color}-500/30 w-full transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
  </motion.div>
);

const QuickAction = ({
  title,
  icon: Icon,
  path,
  color,
}: {
  title: string;
  icon: any;
  path: string;
  color: string;
}) => {
  const router = useRouter();
  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => router.navigate(path)}
      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-900 hover:shadow-md transition-all group"
    >
      <div className={`p-3 rounded-xl mb-3 text-${color}-600 dark:text-${color}-400 group-hover:bg-${color}-50 dark:group-hover:bg-${color}-900/30 transition-colors`}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white text-center">
        {title}
      </span>
    </motion.button>
  );
};

const ActivityItem = ({
  user,
  action,
  time,
  type,
}: {
  user: string;
  action: string;
  time: string;
  type: "success" | "info" | "warning";
}) => (
  <div className="flex items-center gap-4 py-4 border-b border-gray-100 dark:border-gray-800 last:border-0 group">
    <div className={`w-2 h-2 rounded-full ${type === "success" ? "bg-green-500" : type === "info" ? "bg-blue-500" : "bg-amber-500"
      }`} />
    <div className="flex-1">
      <p className="text-sm text-gray-900 dark:text-gray-100 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        <span className="font-bold">{user}</span> {action}
      </p>
      <div className="flex items-center gap-1 mt-0.5">
        <ClockIcon className="w-3 h-3 text-gray-400" />
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    </div>
  </div>
);

export default function CMSHome() {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "¡Buenos días" : hour < 18 ? "¡Buenas tardes" : "¡Buenas noches";

  return (
    <PageLayout>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-8"
      >
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 md:p-12 text-white shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-3xl md:text-5xl font-extrabold mb-3 tracking-tight">
                {greeting}, Administrador!
              </h1>
              <p className="text-indigo-100 text-base md:text-lg max-w-xl font-medium opacity-90 leading-relaxed">
                Todo está bajo control. Tienes 4 pedidos pendientes y el stock está actualizado.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col items-center justify-center min-w-[140px]"
            >
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-200 mb-1">Estado</div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                <span className="text-lg font-bold">Operativo</span>
              </div>
            </motion.div>
          </div>

          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px]" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-1">
          <StatCard
            title="Ventas Totales"
            value="$24,500"
            change="+12.5%"
            trend="up"
            icon={BanknotesIcon}
            color="indigo"
          />
          <StatCard
            title="Nuevos Clientes"
            value="128"
            change="+8.2%"
            trend="up"
            icon={UsersIcon}
            color="purple"
          />
          <StatCard
            title="Productos en Stock"
            value="1,240"
            change="-2.4%"
            trend="down"
            icon={CubeIcon}
            color="blue"
          />
          <StatCard
            title="Tasa de Conversión"
            value="3.2%"
            change="+1.1%"
            trend="up"
            icon={ChartBarIcon}
            color="pink"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Actions Section */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                  Módulos del Sistema
                </h2>
                <button className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Ver todo</button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <QuickAction title="Ventas & Fact " icon={BanknotesIcon} path="/cms/invoicing" color="indigo" />
                <QuickAction title="Inventario" icon={CubeIcon} path="/cms/inventory/products" color="blue" />
                <QuickAction title="Clientes" icon={UsersIcon} path="/cms/crm/clients" color="purple" />
                <QuickAction title="Compras" icon={TruckIcon} path="/cms/purchasing/orders" color="orange" />
                <QuickAction title="Recursos H." icon={UserGroupIcon} path="/cms/hr" color="pink" />
                <QuickAction title="Categorías" icon={TagIcon} path="/cms/inventory/categories" color="cyan" />
                <QuickAction title="Reportes" icon={ChartBarIcon} path="/cms/report" color="slate" />
                <QuickAction title="Ajustes" icon={Cog6ToothIcon} path="/cms/configuration" color="slate" />
              </div>
            </motion.div>

            {/* Placeholder for a chart or summary table */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                Resumen de Ventas (Mensual)
              </h2>
              <div className="h-64 flex items-end justify-between gap-2 pt-4">
                {[40, 60, 35, 80, 55, 90, 75, 45, 65, 85, 40, 70].map((height, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.5 + (i * 0.05) }}
                      className="w-full bg-gradient-to-t from-indigo-500/40 to-indigo-600 rounded-t-lg hover:to-indigo-500 transition-colors cursor-pointer group relative"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        ${height * 200}
                      </div>
                    </motion.div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase">{['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Activity Feed Section */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-pink-600 rounded-full" />
                  Actividad Reciente
                </h2>
              </div>

              <div className="space-y-1">
                <ActivityItem user="Carlos Ruiz" action="creó una nueva factura" time="hace 5 min" type="success" />
                <ActivityItem user="Sistema" action="actualizó el stock de 'iPhone 15'" time="hace 15 min" type="info" />
                <ActivityItem user="Ana López" action="registró un nuevo cliente" time="hace 1 hora" type="success" />
                <ActivityItem user="Marta Pérez" action="reportó una falta de stock" time="hace 2 horas" type="warning" />
                <ActivityItem user="Admin" action="cambió la configuración global" time="hace 4 horas" type="info" />
                <ActivityItem user="Roberto G." action="completó una compra" time="hace 5 horas" type="success" />
                <ActivityItem user="Sistema" action="falló el proceso de backup" time="hace 12 horas" type="warning" />
              </div>

              <button className="w-full mt-6 py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-all">
                Ver historial completo
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </PageLayout>
  );
}

export function onInit() {
  return findAll();
}
