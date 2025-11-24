export default function FiltersBar({
  families,
  searchTerm,
  setSearchTerm,
  selectedFamily,
  setSelectedFamily,
  statusFilter,
  setStatusFilter,
}) {
  return (
    <div className="bg-white p-3 rounded-lg shadow mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search name or phone..."
        className="px-3 py-2 border rounded-md"
      />
      <select
        value={selectedFamily}
        onChange={(e) => setSelectedFamily(e.target.value)}
        className="px-3 py-2 border rounded-md"
      >
        <option value="">All Families</option>
        {families.map((f) => (
          <option key={f._id} value={f._id}>
            {f.name}
          </option>
        ))}
      </select>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border rounded-md"
      >
        <option value="">All Statuses</option>
        <option value="draft">Draft</option>
        <option value="confirmed">Confirmed</option>
        <option value="in-progress">In Progress</option>
        <option value="ready">Ready</option>
        <option value="delivered">Delivered</option>
      </select>
    </div>
  );
}
