import { useEffect, useState, useCallback } from "react";
import { getAllData, updateData, deleteData, addData } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";

export default function ViewMeasurementsModal({ open, onClose, customer }) {
  const { toast } = useToast();
  const [measurements, setMeasurements] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [editableMeasurement, setEditableMeasurement] = useState(null);

  const fetchData = useCallback(async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const [allMeasurements, allTemplates] = await Promise.all([
        getAllData('measurements'),
        getAllData('templates')
      ]);
      setMeasurements(allMeasurements.filter(m => m.customerId === customer._id));
      setTemplates(allTemplates);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast({ title: "Error", description: "Could not load measurements data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [customer, toast]);

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      // reset editing state when modal is closed
      setEditingMeasurement(null);
      setEditableMeasurement(null);
    }
  }, [open, fetchData]);

  const handleAddNewMeasurement = async () => {
    if (!customer) return;
    if (!templates || templates.length === 0) {
      toast({ title: 'No Template', description: 'No measurement templates available to create a measurement.', variant: 'destructive' });
      return;
    }

    const templateId = templates[0]._id;
    const newMeasurement = {
      _id: `local-${Date.now()}`,
      customerId: customer._id,
      templateId,
      values: {},
      synced: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await addData('measurements', newMeasurement);
      // Open it for editing immediately
      setEditingMeasurement(newMeasurement._id);
      setEditableMeasurement(JSON.parse(JSON.stringify(newMeasurement)));
      toast({ title: 'Created', description: 'New measurement created. You can edit and save it.' });
      fetchData();
    } catch (err) {
      console.error('Add measurement error:', err);
      toast({ title: 'Error', description: 'Failed to create measurement.', variant: 'destructive' });
    }
  };

  const handleSave = async (measurementId) => {
    try {
      await updateData('measurements', { ...editableMeasurement, synced: false });
      setEditingMeasurement(null);
      toast({ title: "Success", description: "Measurement updated." });
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Update measurement error:", err);
      toast({ title: "Error", description: "Failed to save measurement.", variant: "destructive" });
    }
  };

  const handleDelete = async (measurementId) => {
    if (!window.confirm("Are you sure you want to delete this measurement?")) return;
    try {
      await deleteData('measurements', measurementId);
      toast({ title: "Success", description: "Measurement deleted." });
      fetchData(); // Refresh data
    } catch (err) {
      console.error("Delete measurement error:", err);
      toast({ title: "Error", description: "Failed to delete measurement.", variant: "destructive" });
    }
  };

  const getTemplate = (templateId) => {
    return templates.find(t => t._id === templateId);
  }

  if (!open || !customer) return null;
  
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg overflow-auto max-h-[90vh]">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Measurements — {customer.name}</h3>
            <p className="text-sm text-gray-500">Total: {measurements.length}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleAddNewMeasurement}>+ Add Measurement</Button>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {loading ? (
            <div className="text-center text-gray-500">Loading…</div>
          ) : measurements.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No measurements found for this customer.</div>
          ) : (
            measurements.map((m) => {
              const template = getTemplate(m.templateId);
              return (
              <div key={m._id} className="border rounded p-4 bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">{template?.name || "Measurement"}</div>
                    <div className="text-sm text-gray-500">Date: {new Date(m.createdAt || Date.now()).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    {editingMeasurement === m._id ? (
                      <>
                        <Button size="sm" onClick={() => handleSave(m._id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingMeasurement(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => { setEditingMeasurement(m._id); setEditableMeasurement(JSON.parse(JSON.stringify(m))); }}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(m._id)}>Delete</Button>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  {editingMeasurement === m._id ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {template?.measurements.map((field) => (
                        <div key={field.field} className="flex flex-col">
                          <label className="text-sm font-medium text-gray-600 mb-1">{field.label_en}</label>
                          <input 
                            type="text" 
                            value={editableMeasurement.values[field.field] || ''} 
                            onChange={(e) => {
                              const newValues = { ...editableMeasurement.values, [field.field]: e.target.value };
                              setEditableMeasurement({ ...editableMeasurement, values: newValues });
                            }}
                            className="p-2 border rounded"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                      {template?.measurements.map((field) => (
                        <div key={field.field} className="flex justify-between text-sm py-1 border-b">
                          <div className="font-medium text-gray-700">{field.label_en}</div>
                          <div>{m.values[field.field] || '-'} {m.values[field.field] && field.unit}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )})
          )}
        </div>
      </div>
    </div>
  );
}
