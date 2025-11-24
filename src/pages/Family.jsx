import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useIndexedDBStore } from "../hooks/useIndexedDB";
import { Plus, Edit, Trash2 } from "lucide-react"; // Using icons

export default function FamilyPage() {
  const { data: families, loading, addItem: addFamily, updateItem: updateFamily, deleteItem: deleteFamily, refreshData: fetchFamilies } = useIndexedDBStore('families');
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingFamily, setEditingFamily] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchFamilies();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return alert("Family name is required");
    setIsSubmitting(true);

    try {
      if (editingFamily) {
        await updateFamily({ ...editingFamily, ...form });
      } else {
        await addFamily({ ...form, _id: Date.now().toString() });
      }
      setForm({ name: "", description: "" });
      setEditingFamily(null);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to save family:", error);
      alert("Failed to save family");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (family) => {
    setEditingFamily(family);
    setForm({ name: family.name, description: family.description || "" });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this family?")) return;
    try {
      await deleteFamily(id);
    } catch (error) {
      console.error("Failed to delete family:", error);
      alert("Failed to delete family");
    }
  };

  const handleAddNew = () => {
    setEditingFamily(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Family Management
          </h1>
          <button
            onClick={handleAddNew}
            className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus size={20} />
            <span>Add Family</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center text-slate-500">Loading families...</div>
        ) : families.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <p className="text-5xl mb-4">👨‍👩‍👧‍👦</p>
            <h3 className="text-xl font-semibold text-slate-800">No families found</h3>
            <p className="text-slate-500 mt-2">
              Get started by adding your first family.
            </p>
            <button
              onClick={handleAddNew}
              className="mt-6 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              Add Family
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {families.map((family) => (
              <div key={family._id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{family.name}</h3>
                  <p className="text-slate-600 mt-2 text-sm">{family.description || "No description"}</p>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    onClick={() => handleEdit(family)}
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    aria-label="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(family._id)}
                    className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={handleAddNew}
        className="sm:hidden fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
        aria-label="Add Family"
      >
        <Plus size={24} />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 sm:p-8 animate-fadeIn">
            <h3 className="text-2xl font-bold mb-6 text-slate-800 text-center">
              {editingFamily ? "Edit Family" : "Add New Family"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Family Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="e.g. Khan Family"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="A short note about this family"
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {isSubmitting ? "Saving..." : editingFamily ? "Update" : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}