"use client"

import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import Navbar from "../components/Navbar"
import { useToast } from "@/hooks/use-toast";
import { useIndexedDBStore } from "@/hooks/useIndexedDB";

export default function MeasurementsPage() {
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const { data: families, refreshData: fetchFamilies } = useIndexedDBStore('families');
  const { data: customers, refreshData: fetchCustomers } = useIndexedDBStore('customers');
  const { data: templates, refreshData: fetchTemplates } = useIndexedDBStore('templates');
  const { addItem: addMeasurement } = useIndexedDBStore('measurements');

  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedFamily, setSelectedFamily] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [measurements, setMeasurements] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFamilies()
    fetchCustomers()
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (location.state?.customer) {
      const customer = location.state.customer;
      setSelectedCustomer(customer);
      if (customer.familyId) {
        setSelectedFamily(customer.familyId);
      }
    }
  }, [location.state])

  useEffect(() => {
    if (selectedFamily) {
      setFilteredCustomers(customers.filter(c => c.familyId === selectedFamily));
    } else {
      setFilteredCustomers(customers);
    }
  }, [selectedFamily, customers]);

  // 🔹 Save measurements
  const handleSaveMeasurements = async () => {
    if (!selectedCustomer || !selectedTemplate) {
      toast({
        title: "Missing Information",
        description: "Please select customer and template first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true)
    try {
      await addMeasurement(
        {
          _id: Date.now().toString(),
          customerId: selectedCustomer._id,
          templateId: selectedTemplate._id,
          values: measurements,
        }
      )
      toast({
        title: "Success",
        description: "Measurements saved successfully!",
      });
      navigate(-1); // Navigate back
      setMeasurements({})
      setSelectedCustomer(null)
      setSelectedTemplate(null)
    } catch (error) {
      console.error("Failed to save measurements:", error)
      toast({
        title: "Error",
        description: "Failed to save measurements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Export as JSON
  const exportAsJSON = () => {
    const dataToExport = {
      customer: selectedCustomer?.name,
      template: selectedTemplate?.name,
      measurements: measurements,
      date: new Date().toISOString(),
    }
    const dataStr = JSON.stringify(dataToExport, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `measurements-${selectedCustomer?.name}-${Date.now()}.json`
    link.click()
  }

  // 🔹 Import from JSON
  const importFromJSON = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = handleFileChange;
    input.click();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        const { customer: customerName, template: templateName, measurements: importedMeasurements } = importedData;

        const customer = customers.find(c => c.name === customerName);
        const template = templates.find(t => t.name === templateName);

        if (customer) {
          setSelectedCustomer(customer);
        } else {
          toast({
            title: "Customer not found",
            description: `Customer "${customerName}" not found.`,
            variant: "destructive",
          });
        }

        if (template) {
          setSelectedTemplate(template);
        } else {
          toast({
            title: "Template not found",
            description: `Template "${templateName}" not found.`,
            variant: "destructive",
          });
        }

        if (customer && template) {
          setMeasurements(importedMeasurements);
          toast({
            title: "Success",
            description: "Measurements imported successfully!",
          });
        }
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to parse JSON file.",
          variant: "destructive",
        });
        console.error("Failed to import measurements:", error);
      }
    };
    reader.readAsText(file);
  };

  // 🔹 When family changes, load customers
  const handleFamilyChange = (familyId) => {
    setSelectedFamily(familyId)
    setSelectedCustomer(null)
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Measurements</h2>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* 🔸 Family Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Select Family</label>
              <select
                value={selectedFamily || ""}
                onChange={(e) => handleFamilyChange(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">All Families</option>
                {families.map((fam) => (
                  <option key={fam._id} value={fam._id}>
                    {fam.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔸 Customer Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Select Customer</label>
              <select
                value={selectedCustomer?._id || ""}
                onChange={(e) => {
                  const customer = customers.find((c) => c._id === e.target.value)
                  setSelectedCustomer(customer)
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Choose a customer</option>
                {filteredCustomers.map((customer) => (
                  <option key={customer._id} value={customer._id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔸 Template Dropdown */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-700">Select Template</label>
              <select
                value={selectedTemplate?._id || ""}
                onChange={(e) => {
                  const template = templates.find((t) => t._id === e.target.value)
                  setSelectedTemplate(template)
                  setMeasurements({})
                }}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">Choose a template</option>
                {templates.map((template) => (
                  <option key={template._id} value={template._id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 🔸 Measurement Fields */}
          {selectedTemplate && (
            <div className="bg-slate-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Measurement Fields</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.measurements?.map((field, idx) => (
                  <div key={idx}>
                    <label className="block text-sm font-medium mb-2 text-slate-700">
                      {field.label_en} ({field.unit})
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={measurements[field.field] || ""}
                      onChange={(e) =>
                        setMeasurements({
                          ...measurements,
                          [field.field]: Number.parseFloat(e.target.value),
                        })
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🔸 Buttons */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleSaveMeasurements}
              disabled={loading || !selectedCustomer || !selectedTemplate}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition"
            >
              {loading ? "Saving..." : "Save Measurements"}
            </button>
            <button
              onClick={exportAsJSON}
              disabled={!selectedCustomer || !selectedTemplate}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-slate-400 transition"
            >
              Export as JSON
            </button>
            <button
              onClick={importFromJSON}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Import from JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
