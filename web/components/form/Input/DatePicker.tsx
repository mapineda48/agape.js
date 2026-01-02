import { useMemo } from "react";
import useInput from "./useInput";
import stringToPath from "@/utils/stringToPath";
import DateTime from "@utils/data/DateTime";
import { DatePicker } from "../../ui/datepicker";

export interface DatePickerProps {
    path: string | number;
    materialize?: boolean;
    autoCleanup?: boolean;
    placeholder?: string;
    className?: string;
    showTime?: boolean;
    disabled?: boolean;
    required?: boolean;
}

const DatePickerInput = ({ path, materialize = true, autoCleanup, placeholder, className, showTime, disabled, required }: DatePickerProps) => {
    const paths = useMemo(() => stringToPath(path), [path]);

    const [state, setState] = useInput<DateTime>(paths, new DateTime(), {
        materialize,
        autoCleanup,
    });

    const handleDateChange = (date: Date) => {
        setState(new DateTime(date));
    };

    return (
        <DatePicker
            value={state}
            onChange={handleDateChange}
            placeholder={placeholder}
            className={className}
            showTime={showTime}
            disabled={disabled}
            required={required}
        />
    );
};

export default DatePickerInput;
