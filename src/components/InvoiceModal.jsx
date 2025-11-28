import { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import html2canvas from 'html2canvas';
import { Share2, Download, X, Scissors, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast"; // Assuming you have this hook

export default function InvoiceModal({ open, onClose, customer }) {
  const invoiceRef = useRef();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!open || !customer) return null;

  // --- DATA MAPPING ---
  const order = customer.latestOrder || {};
  
  const safeVal = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  const totalAmount = safeVal(order.totalAmount);
  const advance = safeVal(order.advancePayment);
  const balance = totalAmount - advance;
  const notes = order.notes || "";
  const orderItems = Array.isArray(order.items) ? order.items : [];


  

  // --- THE MAGIC SHARE FUNCTION ---
  const handleShareImage = async () => {
    if (!invoiceRef.current) return;
    setLoading(true);

    try {
      // 1. Convert HTML to Image
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // High Quality
        backgroundColor: "#ffffff"
      });

      // 2. Convert Canvas to Blob (File object)
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], `Invoice-${customer.name}.png`, { type: "image/png" });

        // 3. Check if Browser Supports Sharing Files (Works on Android/iOS)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: 'Tailor Invoice',
              text: `Hello ${customer.name}, here is your invoice from My Tailor Shop.`,
            });
            toast({ title: "Shared successfully" });
          } catch (error) {
            // User cancelled share or error
            console.log("Share cancelled", error);
          }
        } else {
          // 4. FALLBACK FOR PC: Download the image instead
          const link = document.createElement('a');
          link.download = `Invoice-${customer.name}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          toast({ title: "Image Downloaded", description: "Open WhatsApp and attach this image manually." });
        }
        setLoading(false);
      }, 'image/png');

    } catch (err) {
      console.error("Error generating invoice", err);
      setLoading(false);
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-50 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Scissors className="w-5 h-5 text-blue-600" /> Invoice Preview
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-red-50 hover:text-red-500 rounded-full">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/50">
          
          {/* --- INVOICE DESIGN --- */}
          <div 
            ref={invoiceRef} 
            className="bg-white p-6 md:p-8 shadow-sm border border-slate-200 text-slate-800 relative"
          >
            {/* Top Bar */}
            <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-6 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-blue-900 tracking-tight">INVOICE</h1>
                <p className="text-xs text-slate-400 mt-1">
                  ID: #{order._id ? order._id.slice(-6) : 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <div className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full inline-block mb-1">
                  {order.status ? order.status.toUpperCase() : "ORDER"}
                </div>
                <div className="text-xs text-slate-500">
                  {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Billed To</p>
                <h3 className="font-bold text-slate-800">{customer.name}</h3>
                <p className="text-xs text-slate-500">{customer.phone}</p>
              </div>
              <div className="text-right">
                 <p className="text-[10px] font-bold text-slate-400 uppercase">TailorBook</p>
                 <h3 className="font-bold text-slate-800">Due To</h3>
                 <p className="text-xs text-slate-500">{order.deliveryDate}</p>
              </div>
            </div>

            {/* Table Header */}
            <div className="bg-slate-50 border border-slate-100 rounded-t-lg p-2 grid grid-cols-12 gap-2 text-[10px] font-bold text-slate-500 uppercase">
              <div className="col-span-6 pl-2">Description</div>
              <div className="col-span-2 text-right">Rate</div>
              <div className="col-span-1 text-right">Qty</div>
              <div className="col-span-3 text-right pr-2">Total</div>
            </div>

            {/* Table Body */}
            <div className="border border-t-0 border-slate-100 rounded-b-lg mb-6">
              {orderItems.length > 0 ? (
                orderItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 text-sm py-3 px-2 border-b border-slate-50 last:border-0 items-center">
                    <div className="col-span-6 pl-2 font-medium text-slate-700">
                      {item.description || "Custom Item"}
                    </div>
                    <div className="col-span-2 text-right text-slate-500">
                      {safeVal(item.rate)}
                    </div>
                    <div className="col-span-1 text-right text-slate-500">
                      {item.quantity || 1}
                    </div>
                    <div className="col-span-3 text-right pr-2 font-bold text-slate-800">
                      {safeVal(item.amount) || (safeVal(item.rate) * (item.quantity || 1))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-sm italic">
                  No items listed
                </div>
              )}
            </div>

            {/* Notes Section */}
            {notes && (
              <div className="mb-6 bg-yellow-50 border border-yellow-100 p-3 rounded-md">
                <p className="text-[10px] font-bold text-yellow-600 uppercase mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Notes
                </p>
                <p className="text-xs text-slate-700 italic">"{notes}"</p>
              </div>
            )}

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-1/2 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>{totalAmount}</span>
                </div>
                <div className="flex justify-between text-xs text-green-600">
                  <span>Advance</span>
                  <span>- {advance}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-blue-900 border-t border-slate-200 mt-2 pt-2">
                  <span>Total Due</span>
                  <span>{balance}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
                Generated via TailorApp
            </div>
          </div>
          {/* --- END INVOICE DESIGN --- */}

        </div>

        {/* Buttons */}
        <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 gap-3">
          <Button 
            onClick={handleShareImage}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-100 h-11 text-base"
          >
            {loading ? (
                "Generating..." 
            ) : (
                <span className="flex items-center">
                    <Share2 className="w-5 h-5 mr-2" /> Share via WhatsApp
                </span>
            )}
          </Button>
          
          <div className="text-center">
            <button 
                onClick={() => {
                     const link = document.createElement('a');
                     html2canvas(invoiceRef.current).then(canvas => {
                        link.download = `Invoice-${customer.name}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                     });
                }}
                className="text-xs text-slate-400 hover:text-blue-600 underline"
            >
                Download Image Only
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}