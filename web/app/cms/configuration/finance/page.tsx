import {
    listCurrencies,
    type ICurrency,
} from "@agape/finance/currency";
import {
    listPaymentMethods,
    type PaymentMethodDto,
} from "@agape/finance/payment_method";
import {
    listTaxes,
    listTaxGroups,
    type ITax,
    type ITaxGroupWithTaxes,
} from "@agape/finance/tax_group";
import CurrenciesList from "./Currencies";
import PaymentMethodsList from "./PaymentMethods";
import TaxesList from "./Taxes";

export async function onInit() {
    const [currencies, paymentMethodsResult, taxes, taxGroups] = await Promise.all([
        listCurrencies({ activeOnly: false }),
        listPaymentMethods({ includeTotalCount: false }),
        listTaxes({ activeOnly: false }),
        listTaxGroups({ activeOnly: false }),
    ]);

    return {
        currencies,
        paymentMethods: paymentMethodsResult.paymentMethods,
        taxes,
        taxGroups,
    };
}

interface FinancePageProps {
    currencies: ICurrency[];
    paymentMethods: PaymentMethodDto[];
    taxes: ITax[];
    taxGroups: ITaxGroupWithTaxes[];
}

export default function FinancePage({
    currencies,
    paymentMethods,
    taxes,
    taxGroups,
}: FinancePageProps) {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-emerald-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-300">
                            Configuración Financiera
                        </p>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                            Monedas, Impuestos y Métodos de Pago
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                            Administra las monedas del sistema, grupos de impuestos y métodos
                            de pago disponibles para transacciones.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <StatChip
                            label="Monedas"
                            value={currencies.length}
                            tone="emerald"
                        />
                        <StatChip
                            label="Impuestos"
                            value={taxes.length}
                            tone="amber"
                        />
                        <StatChip
                            label="Métodos de pago"
                            value={paymentMethods.length}
                            tone="blue"
                        />
                    </div>
                </div>
            </div>

            {/* Currencies and Payment Methods */}
            <div className="grid gap-6 xl:grid-cols-2">
                <CurrenciesList currencies={currencies} />
                <PaymentMethodsList paymentMethods={paymentMethods} />
            </div>

            {/* Taxes */}
            <TaxesList taxes={taxes} taxGroups={taxGroups} />
        </div>
    );
}

function StatChip({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "emerald" | "amber" | "blue";
}) {
    const tones: Record<"emerald" | "amber" | "blue", string> = {
        emerald:
            "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
        amber:
            "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
        blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
    };

    return (
        <div
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm border border-white/60 dark:border-gray-700 ${tones[tone]}`}
        >
            {label}: {value}
        </div>
    );
}
