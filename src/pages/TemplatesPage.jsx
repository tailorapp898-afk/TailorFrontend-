"use client"

import { useState, useEffect } from "react"
import Navbar from "../components/Navbar"
import { useIndexedDBStore } from "@/hooks/useIndexedDB";

const CATEGORIES = ["shirt", "trouser", "suit", "kameez", "sherwani", "other"]

export default function TemplatesPage() {
  const { data: templates, loading, addItem: addTemplate, refreshData: fetchTemplates } = useIndexedDBStore('templates');
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    category: "shirt",
    measurements: [],
  })
  const [newField, setNewField] = useState({ label_en: "", label_ur: "", unit: "inches" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const addMeasurementField = () => {
    if (!newField.label_en) {
      alert("Please enter a field name")
      return
    }
    setFormData({
      ...formData,
      measurements: [
        ...formData.measurements,
        {
          field: newField.label_en.toLowerCase().replace(/\s+/g, "_"),
          label_en: newField.label_en,
          label_ur: newField.label_ur,
          unit: newField.unit,
        },
      ],
    })
    setNewField({ label_en: "", label_ur: "", unit: "inches" })
  }

  const removeMeasurementField = (idx) => {
    setFormData({
      ...formData,
      measurements: formData.measurements.filter((_, i) => i !== idx),
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || formData.measurements.length === 0) {
      alert("Please fill all fields")
      return
    }

    setIsSubmitting(true)
    try {
      await addTemplate({ ...formData, _id: Date.now().toString() });
      setFormData({ name: "", category: "shirt", measurements: [] })
      setShowForm(false)
      alert("Template created successfully")
    } catch (error) {
      console.error("Failed to create template:", error)
      alert("Failed to create template")
    } finally {
      setIsSubmitting(false)
    }
  }

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(templates, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `templates-${Date.now()}.json`;
    link.click();
  };

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
    reader.onload = async (e) => {
      try {
        const importedTemplates = JSON.parse(e.target.result);
        if (Array.isArray(importedTemplates)) {
          setIsSubmitting(true);
          for (const template of importedTemplates) {
            await addTemplate({ ...template, _id: Date.now().toString() });
          }
          alert("Templates imported successfully!");
          setIsSubmitting(false);
        }
      } catch (error) {
        alert("Failed to parse or import templates.");
        console.error("Failed to import templates:", error);
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <h2 className="text-3xl font-bold text-slate-900">Measurement Templates</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {showForm ? "Cancel" : "Create Template"}
            </button>
            <button
              onClick={exportAsJSON}
              disabled={templates.length === 0}
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

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text-xl font-bold mb-4 text-slate-900">Create New Template</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Template Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg">
                <h4 className="font-bold mb-4 text-slate-900">Measurement Fields</h4>

                {formData.measurements.map((field, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 mb-2 rounded">
                    <span>
                      {field.label_en} ({field.label_ur}) - {field.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMeasurementField(idx)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <div className="mt-4 space-y-2">
                  <input
                    type="text"
                    placeholder="Field name (English)"
                    value={newField.label_en}
                    onChange={(e) => setNewField({ ...newField, label_en: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Field name (Urdu)"
                    value={newField.label_ur}
                    onChange={(e) => setNewField({ ...newField, label_ur: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <select
                    value={newField.unit}
                    onChange={(e) => setNewField({ ...newField, unit: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="inches">Inches</option>
                    <option value="cm">Centimeters</option>
                  </select>
                  <button
                    type="button"
                    onClick={addMeasurementField}
                    className="w-full bg-slate-600 text-white py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition"
              >
                {isSubmitting ? "Creating..." : "Create Template"}
              </button>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template._id} className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-bold text-slate-900 mb-2">{template.name}</h3>
              <p className="text-sm text-slate-600 mb-4">
                Category: <span className="font-medium">{template.category}</span>
              </p>
              <div className="space-y-1">
                {template.measurements?.map((field, idx) => (
                  <p key={idx} className="text-sm text-slate-600">
                    {field.label_en} ({field.unit})
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
        {templates.length === 0 && !loading && (
          <div className="text-center py-12 text-slate-500">No templates yet. Create one to get started!</div>
        )}
      </div>
    </div>
  )
}
