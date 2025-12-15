import {
    listDepartments,
    type DepartmentDto,
} from "@agape/hr/department";
import {
    listJobPositions,
    type JobPositionDto,
} from "@agape/hr/job_position";
import DepartmentsList from "./Departments";
import JobPositionsList from "./JobPositions";

export async function onInit() {
    const [departmentsResult, jobPositionsResult] = await Promise.all([
        listDepartments({ includeTotalCount: false }),
        listJobPositions({ includeTotalCount: false }),
    ]);

    return {
        departments: departmentsResult.departments,
        jobPositions: jobPositionsResult.jobPositions,
    };
}

interface HRPageProps {
    departments: DepartmentDto[];
    jobPositions: JobPositionDto[];
}

export default function HRPage({ departments, jobPositions }: HRPageProps) {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="rounded-2xl border border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 shadow-sm p-6 sm:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">
                            Recursos Humanos
                        </p>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mt-1">
                            Departamentos y Puestos de Trabajo
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 max-w-2xl">
                            Administra la estructura organizacional de la empresa, incluyendo
                            departamentos y cargos disponibles.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <StatChip
                            label="Departamentos"
                            value={departments.length}
                            tone="violet"
                        />
                        <StatChip
                            label="Puestos"
                            value={jobPositions.length}
                            tone="fuchsia"
                        />
                    </div>
                </div>
            </div>

            {/* Lists */}
            <div className="grid gap-6 xl:grid-cols-2">
                <DepartmentsList departments={departments} />
                <JobPositionsList jobPositions={jobPositions} />
            </div>
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
    tone: "violet" | "fuchsia";
}) {
    const tones: Record<"violet" | "fuchsia", string> = {
        violet:
            "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200",
        fuchsia:
            "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/40 dark:text-fuchsia-200",
    };

    return (
        <div
            className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm border border-white/60 dark:border-gray-700 ${tones[tone]}`}
        >
            {label}: {value}
        </div>
    );
}
