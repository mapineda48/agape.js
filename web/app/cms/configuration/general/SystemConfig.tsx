import { useState, useEffect } from "react";
import { useNotificacion } from "@/components/ui/notification";
import clsx from "clsx";
import {
    BuildingOffice2Icon,
    GlobeAltIcon,
    CurrencyDollarIcon,
    PhotoIcon,
    CheckIcon,
} from "@heroicons/react/24/outline";
import {
    getSystemConfig,
    updateSystemConfig,
    type ISystemConfig,
} from "@agape/config/systemConfig";
import { listCurrencies } from "@agape/finance/currency";
import Form from "@/components/form";
import * as Input from "@/components/form/Input";
import Submit from "@/components/ui/submit";
import Select from "@/components/form/Select";
import { SelectItem } from "@/components/ui/select";

interface Currency {
    id: number;
    code: string;
    fullName: string;
    symbol: string;
    isEnabled: boolean;
}

type TabId = "company" | "regional" | "appearance";

/**
 * SystemConfig component for managing global system configuration.
 * Includes company info, regional settings, and appearance options.
 */
export default function SystemConfig() {
    const notify = useNotificacion();
    const [config, setConfig] = useState<ISystemConfig | null>(null);
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>("company");

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        try {
            const [configData, currencyData] = await Promise.all([
                getSystemConfig(),
                listCurrencies({ activeOnly: true }),
            ]);
            setConfig(configData);
            setCurrencies(currencyData);
        } catch (error) {
            console.error("Error loading system config:", error);
            notify({ payload: "Error al cargar la configuración", type: "error" });
        } finally {
            setLoading(false);
        }
    }

    async function handleSave(data: ISystemConfig) {
        setSaving(true);
        try {
            const updatedConfig = await updateSystemConfig(data);
            setConfig(updatedConfig);
            notify({
                payload: "Configuración guardada correctamente",
                type: "success",
            });
        } catch (error) {
            console.error("Error saving system config:", error);
            notify({ payload: "Error al guardar la configuración", type: "error" });
            throw error;
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    <div className="space-y-3 mt-6">
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!config) {
        return (
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                    No se pudo cargar la configuración del sistema.
                </p>
                <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    const tabs: { id: TabId; label: string; icon: typeof BuildingOffice2Icon }[] =
        [
            { id: "company", label: "Empresa", icon: BuildingOffice2Icon },
            { id: "regional", label: "Regional", icon: GlobeAltIcon },
            { id: "appearance", label: "Apariencia", icon: PhotoIcon },
        ];

    return (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-50/70 dark:from-amber-900/20 to-transparent border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300">
                        <BuildingOffice2Icon className="w-6 h-6" />
                    </span>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Configuración del Sistema
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Datos de la empresa, configuración regional y preferencias de
                            visualización.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex px-6 -mb-px" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "group inline-flex items-center py-4 px-4 border-b-2 font-medium text-sm transition-colors",
                                activeTab === tab.id
                                    ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                            )}
                        >
                            <tab.icon
                                className={clsx(
                                    "mr-2 h-5 w-5",
                                    activeTab === tab.id
                                        ? "text-indigo-500 dark:text-indigo-400"
                                        : "text-gray-400 group-hover:text-gray-500 dark:text-gray-500"
                                )}
                            />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Form */}
            <Form.Root<ISystemConfig> state={config}>
                <div className="p-6">
                    {activeTab === "company" && (
                        <CompanyTab currencies={currencies} />
                    )}
                    {activeTab === "regional" && <RegionalTab />}
                    {activeTab === "appearance" && <AppearanceTab />}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40">
                    <Submit<ISystemConfig>
                        onSubmit={handleSave}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <CheckIcon className="w-4 h-4" />
                        {saving ? "Guardando..." : "Guardar configuración"}
                    </Submit>
                </div>
            </Form.Root>
        </div>
    );
}

function CompanyTab({ currencies }: { currencies: Currency[] }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
                <FieldGroup title="Nombre de la empresa" required>
                    <Input.Text
                        path="companyName"
                        placeholder="Mi Empresa S.A.S."
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </FieldGroup>

                <FieldGroup title="NIT / ID Fiscal">
                    <Input.Text
                        path="companyNit"
                        placeholder="900.123.456-7"
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </FieldGroup>
            </div>

            <FieldGroup title="Dirección principal">
                <Input.Text
                    path="companyAddress"
                    placeholder="Calle 123 #45-67, Bogotá"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </FieldGroup>

            <div className="grid gap-6 sm:grid-cols-2">
                <FieldGroup title="Teléfono">
                    <Input.Text
                        path="companyPhone"
                        placeholder="+57 (1) 234 5678"
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </FieldGroup>

                <FieldGroup title="Email de contacto">
                    <Input.Text
                        path="companyEmail"
                        placeholder="contacto@miempresa.com"
                        className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </FieldGroup>
            </div>

            <FieldGroup
                title="Moneda principal"
                description="Moneda por defecto para transacciones y reportes."
            >
                <Select.String
                    path="currency"
                >
                    <SelectItem value="">Seleccionar moneda</SelectItem>
                    {currencies.map((c) => (
                        <SelectItem key={c.id} value={c.code}>
                            {c.code} - {c.fullName} ({c.symbol})
                        </SelectItem>
                    ))}
                </Select.String>
            </FieldGroup>
        </div>
    );
}

function RegionalTab() {
    const countries = [
        { code: "CO", name: "Colombia" },
        { code: "MX", name: "México" },
        { code: "AR", name: "Argentina" },
        { code: "CL", name: "Chile" },
        { code: "PE", name: "Perú" },
        { code: "EC", name: "Ecuador" },
        { code: "US", name: "Estados Unidos" },
        { code: "ES", name: "España" },
    ];

    const languages = [
        { code: "es", name: "Español" },
        { code: "en", name: "English" },
        { code: "pt", name: "Português" },
    ];

    const timezones = [
        { value: "America/Bogota", label: "América/Bogotá (GMT-5)" },
        { value: "America/Mexico_City", label: "América/Ciudad de México (GMT-6)" },
        { value: "America/Buenos_Aires", label: "América/Buenos Aires (GMT-3)" },
        { value: "America/Santiago", label: "América/Santiago (GMT-4)" },
        { value: "America/Lima", label: "América/Lima (GMT-5)" },
        { value: "America/New_York", label: "América/Nueva York (GMT-5)" },
        { value: "Europe/Madrid", label: "Europa/Madrid (GMT+1)" },
        { value: "UTC", label: "UTC (GMT+0)" },
    ];

    return (
        <div className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
                <FieldGroup title="País" description="País de operación principal.">
                    <Select.String
                        path="country"
                    >
                        <SelectItem value="">Seleccionar país</SelectItem>
                        {countries.map((c) => (
                            <SelectItem key={c.code} value={c.code}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </Select.String>
                </FieldGroup>

                <FieldGroup title="Idioma" description="Idioma de la interfaz.">
                    <Select.String
                        path="language"
                    >
                        <SelectItem value="">Seleccionar idioma</SelectItem>
                        {languages.map((l) => (
                            <SelectItem key={l.code} value={l.code}>
                                {l.name}
                            </SelectItem>
                        ))}
                    </Select.String>
                </FieldGroup>
            </div>

            <FieldGroup
                title="Zona horaria"
                description="Zona horaria para fechas y reportes."
            >
                <Select.String
                    path="timezone"
                >
                    <SelectItem value="">Seleccionar zona horaria</SelectItem>
                    {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                        </SelectItem>
                    ))}
                </Select.String>
            </FieldGroup>

            <FieldGroup
                title="Decimales para precios"
                description="Cantidad de decimales a mostrar en precios y cantidades (0-6)."
            >
                <Input.Int
                    path="decimalPlaces"
                    min={0}
                    max={6}
                    className="w-32 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </FieldGroup>
        </div>
    );
}

function AppearanceTab() {
    return (
        <div className="space-y-6">
            <FieldGroup
                title="URL del logo"
                description="URL de la imagen del logo de la empresa. Se mostrará en facturas y reportes."
            >
                <Input.Text
                    path="companyLogo"
                    placeholder="https://ejemplo.com/logo.png"
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </FieldGroup>

            <LogoPreview />
        </div>
    );
}

function LogoPreview() {
    const state = Form.useState<ISystemConfig>();
    const logoUrl = state?.companyLogo;

    if (!logoUrl) {
        return (
            <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                <div className="text-center">
                    <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        Vista previa del logo
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">
                Vista previa:
            </p>
            <div className="flex items-center justify-center h-24">
                <img
                    src={logoUrl}
                    alt="Logo de la empresa"
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                    }}
                />
            </div>
        </div>
    );
}

function FieldGroup({
    title,
    description,
    required,
    children,
}: {
    title: string;
    description?: string;
    required?: boolean;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-1.5">
            <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {title}
                {required && <span className="text-red-500 ml-1">*</span>}
            </span>
            {description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            )}
            {children}
        </label>
    );
}
