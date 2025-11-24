
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

export default function MessageModal({ open, onClose, customer, onSend, onConfirmOrder }) {
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState([]);



  const loadTemplates = () => {
    const storedTemplates = localStorage.getItem('messageTemplates');
    if (storedTemplates) {
      try {
        const parsedTemplates = JSON.parse(storedTemplates);
        if (Array.isArray(parsedTemplates)) {
          setTemplates(parsedTemplates);
        } else {
          console.error("Stored templates are not an array.");
          setTemplates([]);
        }
      } catch (e) {
        console.error("Failed to parse stored templates from localStorage:", e);
        setTemplates([]);
      }
    } else {
      setTemplates([]);
    }
  };

  const handleSend = () => {
    if (customer && customer.phone) {
      const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
    onSend(message);
    onClose();
  };

  const handleTemplateSelect = (templateContent) => {
    let finalMessage = templateContent;
    if (customer) {
      finalMessage = finalMessage.replace(/{{customer_name}}/g, customer.name || "");
      finalMessage = finalMessage.replace(/{{order_id}}/g, customer.latestOrder?.orderId || "");
      finalMessage = finalMessage.replace(/{{price}}/g, customer.latestOrder?.price || "");
      finalMessage = finalMessage.replace(/{{date}}/g, new Date().toLocaleDateString() || "");
      finalMessage = finalMessage.replace(/{{amount}}/g, customer.latestOrder?.amount || "");
    }
    setMessage(finalMessage);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg">
        <div className="px-6 py-4 border-b">
          <h3 className="text-xl font-semibold">Send Message</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-slate-500">Loaded templates: {templates.length}</p>
            <Button onClick={loadTemplates} variant="outline">Load Templates</Button>
          </div>
          <Select onValueChange={handleTemplateSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {templates.map((template, index) => (
                <SelectItem key={index} value={template.content}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            rows={5}
          />
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirmOrder(customer)} variant="outline">
            Confirm Order
          </Button>
          <Button onClick={handleSend}>
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
