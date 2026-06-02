import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
}

export const Modal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
}: ModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
        <h3 className="text-lg font-bold text-slate-800 mb-2"> {title} </h3>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          {" "}
          {message}{" "}
        </p>
        <div className="flex gap-3">
          <Button onClick={onCancel} variant="secondary" className="flex-1">
            {" "}
            Cancel{" "}
          </Button>
          <Button onClick={onConfirm} variant="primary" className="flex-1">
            {" "}
            {confirmText}{" "}
          </Button>
        </div>
      </div>
    </div>
  );
};