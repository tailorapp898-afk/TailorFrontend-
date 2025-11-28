import { useEffect, useState, useCallback } from "react";
import { getAllData, updateData, deleteData, addData } from "@/lib/indexedDB";
import { useToast } from "@/hooks/use-toast";
import { Button } from "./ui/button";
import {
  X,
  Plus,
  Save,
  Trash2,
  Edit2,
  Ruler,
  Calendar,
  Check,
} from "lucide-react";

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
        getAllData("measurements"),
        getAllData("templates"),
      ]);
      setMeasurements(
        allMeasurements.filter((m) => m.customerId === customer._id)
      );
      setTemplates(allTemplates);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast({
        title: "Error",
        description: "Could not load measurements data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [customer, toast]);

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      setEditingMeasurement(null);
      setEditableMeasurement(null);
    }
  }, [open, fetchData]);

  const handleAddNewMeasurement = async () => {
    if (!customer) return;
    if (!templates || templates.length === 0) {
      toast({
        title: "No Template",
        description: "No measurement templates available.",
        variant: "destructive",
      });
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
      await addData("measurements", newMeasurement);
      setEditingMeasurement(newMeasurement._id);
      setEditableMeasurement(JSON.parse(JSON.stringify(newMeasurement)));
      toast({ title: "Created", description: "New measurement created." });
      fetchData();
    } catch (err) {
      console.error("Add measurement error:", err);
      toast({
        title: "Error",
        description: "Failed to create measurement.",
        variant: "destructive",
      });
    }
  };

  const handleSave = async (measurementId) => {
    try {
      await updateData("measurements", {
        ...editableMeasurement,
        synced: false,
      });
      setEditingMeasurement(null);
      toast({ title: "Success", description: "Measurement updated." });
      fetchData();
    } catch (err) {
      console.error("Update measurement error:", err);
      toast({
        title: "Error",
        description: "Failed to save measurement.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (measurementId) => {
    if (!window.confirm("Are you sure you want to delete this measurement?"))
      return;
    try {
      await deleteData("measurements", measurementId);
      toast({ title: "Success", description: "Measurement deleted." });
      fetchData();
    } catch (err) {
      console.error("Delete measurement error:", err);
      toast({
        title: "Error",
        description: "Failed to delete measurement.",
        variant: "destructive",
      });
    }
  };

  const getTemplate = (templateId) => {
    return templates.find((t) => t._id === templateId);
  };

  if (!open || !customer) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[90vh] md:h-auto md:max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ruler className="w-5 h-5 text-indigo-600" />
              {customer.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {measurements.length}{" "}
              {measurements.length === 1 ? "Record" : "Records"} Found
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleAddNewMeasurement}
              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-sm"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Measurement</span>
              <span className="inline sm:hidden">Add</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-500 hover:bg-slate-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 gap-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <p>Loading records...</p>
            </div>
          ) : measurements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white dark:bg-slate-900/50">
              <Ruler className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium text-lg text-slate-600 dark:text-slate-300">
                No measurements yet
              </p>
              <p className="text-sm">Click "New Measurement" to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {measurements.map((m) => {
                const template = getTemplate(m.templateId);
                const isEditing = editingMeasurement === m._id;

                return (
                  <div
                    key={m._id}
                    className={`bg-white dark:bg-slate-900 rounded-xl border transition-all duration-200 ${
                      isEditing
                        ? "border-indigo-500 ring-2 ring-indigo-500/10 shadow-lg"
                        : "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-xl gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Ruler className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            {template?.name || "Measurement Set"}
                          </h4>
                          <div className="flex items-center text-xs text-slate-500 gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              m.createdAt || Date.now()
                            ).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isEditing ? (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleSave(m._id)}
                              className="bg-green-600 hover:bg-green-700 text-white h-8 text-xs gap-1"
                            >
                              <Check className="w-3 h-3" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingMeasurement(null)}
                              className="h-8 text-xs hover:bg-slate-100 text-slate-600"
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingMeasurement(m._id);
                                setEditableMeasurement(
                                  JSON.parse(JSON.stringify(m))
                                );
                              }}
                              className="h-8 px-3 text-xs gap-1.5 border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50"
                            >
                              <Edit2 className="w-3 h-3" />{" "}
                              <span className="hidden sm:inline">Edit</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(m._id)}
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                      {isEditing ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {template?.measurements.map((field) => (
                            <div key={field.field} className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {field.label_en}
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={
                                    editableMeasurement.values[field.field] ||
                                    ""
                                  }
                                  onChange={(e) => {
                                    const newValues = {
                                      ...editableMeasurement.values,
                                      [field.field]: e.target.value,
                                    };
                                    setEditableMeasurement({
                                      ...editableMeasurement,
                                      values: newValues,
                                    });
                                  }}
                                  className="w-full p-2.5 text-sm bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:bg-slate-950 dark:border-slate-700"
                                  placeholder="0.0"
                                  autoFocus={field === template.measurements[0]} // Focus first input
                                />
                                <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none">
                                  {field.unit}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4">
                          {template?.measurements.map((field) => (
                            <div
                              key={field.field}
                              className="flex flex-col border-l-2 border-indigo-100 pl-3"
                            >
                              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                                {field.label_en}
                              </span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                  {m.values[field.field] || "-"}
                                </span>
                                {m.values[field.field] && (
                                  <span className="text-xs text-slate-400 font-medium">
                                    {field.unit}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
