
import { useRef } from 'react';
import { Button } from "./ui/button";
import Invoice from './Invoice';
import html2canvas from 'html2canvas';

export default function InvoiceModal({ open, onClose, customer }) {
  const invoiceRef = useRef();

  const handleSendWhatsApp = () => {
    if (invoiceRef.current) {
      html2canvas(invoiceRef.current).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const message = `Hello ${customer.name}, here is your invoice.`;
        const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}&attachment=${encodeURIComponent(imgData)}`;
        window.open(whatsappUrl, '_blank');
      });
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-semibold">Invoice</h3>
        </div>
        <div className="p-6">
          <div ref={invoiceRef}>
            <Invoice customer={customer} />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSendWhatsApp}>
            Send to WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
