import {
  HomeIcon,
  ChartBarIcon,
  UsersIcon,
  CubeIcon,
  CogIcon,
} from "@heroicons/react/24/outline";
import { session } from "@agape/access";
import AvaterDemo from "../../app/cms/AvaterDemo";
import { LogOut } from "@/app/login";
import Link from "@/components/ui/link";
import { router } from "@/app/Router";

const CMS_PATH = "/cms";
const CMS_REPORT_PATH = "/cms/report";
const CMS_USER_PATH = "/cms/user";
const CMS_INVENTORY_PATH = "/cms/inventory";
const CMS_CONFIGURATION_PATH = "/cms/configuration";

// Estilos base semánticos según la paleta extendida
const STYLE_SELECT =
  "flex items-center py-2 px-6 bg-secondary bg-opacity-20 hover:bg-accent hover:bg-opacity-25 text-white transition-colors duration-200";
const STYLE_UNSELECT =
  "flex items-center py-2 px-6 hover:bg-accent hover:bg-opacity-20 text-white transition-colors duration-200";

export default function SidebarCms() {
  return (
    <aside className="w-64 bg-primary text-white flex flex-col h-screen sticky top-0 z-10">
      {/* HEADER */}
      <div className="p-6 text-2xl font-bold">AgapeApp</div>

      {/* NAV */}
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-4 space-y-1">
          <Link
            to={CMS_PATH}
            className={
              router.pathname === CMS_PATH ? STYLE_SELECT : STYLE_UNSELECT
            }
          >
            <HomeIcon className="w-6 h-6 mr-3" />
            <span>Inicio</span>
          </Link>

          <Link
            to={CMS_REPORT_PATH}
            className={
              router.pathname === CMS_REPORT_PATH
                ? STYLE_SELECT
                : STYLE_UNSELECT
            }
          >
            <ChartBarIcon className="w-6 h-6 mr-3" />
            <span>Reportes</span>
          </Link>

          <Link
            to={CMS_USER_PATH}
            className={
              router.pathname === CMS_USER_PATH ? STYLE_SELECT : STYLE_UNSELECT
            }
          >
            <UsersIcon className="w-6 h-6 mr-3" />
            <span>Usuarios</span>
          </Link>

          <Link
            to={CMS_INVENTORY_PATH}
            className={
              router.pathname === CMS_INVENTORY_PATH
                ? STYLE_SELECT
                : STYLE_UNSELECT
            }
          >
            <CubeIcon className="w-6 h-6 mr-3" />
            <span>Inventario</span>
          </Link>

          <Link
            to={CMS_CONFIGURATION_PATH}
            className={
              router.pathname === CMS_CONFIGURATION_PATH
                ? STYLE_SELECT
                : STYLE_UNSELECT
            }
          >
            <CogIcon className="w-6 h-6 mr-3" />
            <span>Configuración</span>
          </Link>
        </nav>
      </div>

      {/* FOOTER */}
      <div className="p-6 border-t border-secondary border-opacity-40">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full overflow-hidden mr-4">
            <img
              src={AvaterDemo}
              alt="Avatar del Usuario"
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-semibold">{session.fullName}</p>
            <LogOut />
          </div>
        </div>
      </div>
    </aside>
  );
}
