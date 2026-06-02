interface RatingInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export const RatingInput = ({
  label,
  value,
  onChange,
}: RatingInputProps) => {
  const options = ["x", "1", "2", "3", "4", "5"];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {" "}
        {label}{" "}
      </label>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`flex-1 h-10 rounded-md text-sm font-bold transition-all ${
              value === opt
                ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            }`}
          >
            {opt.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};