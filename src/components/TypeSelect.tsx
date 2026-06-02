import { ISSUE_TYPES } from "../types";

interface TypeSelectProps {
  value: string;
  onChange: (val: string) => void;
}

export const TypeSelect = ({ value, onChange }: TypeSelectProps) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
      {" "}
      Classification{" "}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none cursor-pointer"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
        backgroundPosition: `right 0.5rem center`,
        backgroundRepeat: `no-repeat`,
        backgroundSize: `1.5em 1.5em`,
        paddingRight: `2.5rem`,
      }}
    >
      <option value="" disabled className="text-slate-500">
        {" "}
        Select Type...
      </option>
      {ISSUE_TYPES.map((t) => (
        <option key={t} value={t}>
          {" "}
          {t}{" "}
        </option>
      ))}
    </select>
  </div>
);