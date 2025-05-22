import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function SuppliersManager() {
  const [showForm, setShowForm] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [supplierRows, setSupplierRows] = useState([{ device_name: "", device_id: "" }]);
  const [suppliers, setSuppliers] = useState([]);
  const [uniqueSupplierNames, setUniqueSupplierNames] = useState([]);
  const [searchId, setSearchId] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [newSupplierName, setNewSupplierName] = useState("");

  // Fetch suppliers and derive unique supplier names
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) {
      toast.error("Store ID not found in localStorage.");
      return;
    }

    // Fetch all supplier records for the store
    const { data: supplierData, error: supplierError } = await supabase
      .from("suppliers")
      .select("*")
      .eq("store_id", storeId);

    if (supplierError) {
      toast.error("Failed to load suppliers: " + supplierError.message);
    } else {
      // Set all supplier records for the table
      setSuppliers(supplierData);

      // Extract unique supplier names for the dropdown
      const uniqueNames = [...new Set(supplierData.map(item => item.supplier_name))];
      setUniqueSupplierNames(uniqueNames);
    }
  };

  // Add a new device row
  const handleAddRow = () => {
    setSupplierRows([...supplierRows, { device_name: "", device_id: "" }]);
  };

  // Remove a device row
  const handleRemoveRow = (index) => {
    const updatedRows = supplierRows.filter((_, idx) => idx !== index);
    setSupplierRows(updatedRows);
  };

  // Update device row fields
  const handleChange = (index, field, value) => {
    const updatedRows = [...supplierRows];
    updatedRows[index][field] = value;
    setSupplierRows(updatedRows);
  };

  // Save supplier entries
  const handleSave = async () => {
    const storeId = localStorage.getItem("store_id");
    if (!storeId) {
      toast.error("Store ID not found in localStorage.");
      return;
    }

    const supplierName = selectedSupplier === "new" ? newSupplierName : selectedSupplier;
    if (!supplierName) {
      toast.error("Please select a supplier or enter a new supplier name");
      return;
    }

    const invalidRows = supplierRows.filter(row => !row.device_name || !row.device_id);
    if (invalidRows.length > 0) {
      toast.error("Please fill in all device name and device ID fields");
      return;
    }

    const entries = supplierRows.map(row => ({
      supplier_name: supplierName,
      device_name: row.device_name,
      device_id: row.device_id,
      store_id: parseInt(storeId),
    }));

    // Check for duplicate device IDs
    const { data: existingDevices, error: fetchError } = await supabase
      .from("suppliers")
      .select("device_id");

    if (fetchError) {
      toast.error("Failed to validate device IDs");
      return;
    }

    const existingDeviceIds = new Set(existingDevices.map(d => d.device_id));
    const duplicateEntries = entries.filter(entry => existingDeviceIds.has(entry.device_id));

    if (duplicateEntries.length > 0) {
      const duplicateIds = duplicateEntries.map(entry => entry.device_id).join(", ");
      toast.error(`The following device ID(s) already exist: ${duplicateIds}. Please use unique device IDs.`);
      return;
    }

    const { error: insertError } = await supabase
      .from("suppliers")
      .insert(entries);

    if (insertError) {
      toast.error("Error saving suppliers: " + insertError.message);
    } else {
      toast.success("Suppliers saved successfully!");
      setSupplierRows([{ device_name: "", device_id: "" }]);
      setSelectedSupplier("");
      setNewSupplierName("");
      fetchSuppliers();
    }
  };

  // Delete a supplier
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) {
        toast.error("Delete failed");
      } else {
        toast.success("Supplier deleted");
        fetchSuppliers();
      }
    }
  };

  // Search for a supplier by device ID
  const handleSearch = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("*")
      .eq("device_id", searchId)
      .single();

    if (error || !data) {
      toast.error("Device not found");
      setSearchResult(null);
      localStorage.removeItem("deviceSearch");
    } else {
      setSearchResult(data);
      localStorage.setItem("deviceSearch", JSON.stringify(data));
    }
  };

  return (
    <div className="p-0 sm:p-0 max-w-7xl mx-auto dark:bg-gray-900 dark:text-white">
      <h1 className="text-2xl sm:text-3xl font-bold text-indigo-800 mb-6 dark:text-white">Suppliers Manager</h1>
      <ToastContainer />

      {/* Toggle Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Hide Add Form" : "Add Supplier"}
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          onClick={() => setShowTable(!showTable)}
        >
          {showTable ? "Hide Table" : "View Table"}
        </button>
      </div>

      {/* Search Section */}
      <div className="mb-6 ">
        <div className="flex flex-col sm:flex-row gap-2 mb-2 ">
          <input
            type="text"
            placeholder="Search by Device ID"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
          />
          <button
            className="bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-800 w-full sm:w-auto"
            onClick={handleSearch}
          >
            Search
          </button>
        </div>
        {searchResult && (
          <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm">
            <p className="mb-1">
              <strong>Supplier:</strong> {searchResult.supplier_name}
            </p>
            <p>
              <strong>Device:</strong> {searchResult.device_name} ({searchResult.device_id})
            </p>
          </div>
        )}
      </div>

      {/* Supplier Form */}
      {showForm && (
        <div className="mb-6 bg-white p-0 rounded-md shadow-md dark:bg-gray-900">
          <h2 className="text-xl font-semibold mb-4 dark:text-white dark:bg-gray-900">Add Supplier</h2>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-white dark:bg-gray-900">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
            >
              <option value="">Select Supplier</option>
              {uniqueSupplierNames.map((name, index) => (
                <option key={index} value={name}>
                  {name}
                </option>
              ))}
              <option value="new">+ Add New Supplier</option>
            </select>
            {selectedSupplier === "new" && (
              <div className="mt-2">
                <input
                  type="text"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  placeholder="Enter new supplier name"
                  className="w-full p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                />
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2 dark:text-white">Devices</h3>
            {supplierRows.map((row, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Device Name"
                  value={row.device_name}
                  onChange={(e) => handleChange(idx, "device_name", e.target.value)}
                  className="flex-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                />
                <input
                  type="text"
                  placeholder="Device ID"
                  value={row.device_id}
                  onChange={(e) => handleChange(idx, "device_id", e.target.value)}
                  className="flex-1 p-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                />
                <button
                  onClick={() => handleRemoveRow(idx)}
                  className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 w-full sm:w-auto"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex flex-col sm:flex-row gap-2 mt-2">
              <button
                onClick={handleAddRow}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 w-full sm:w-auto"
              >
                + Add Device
              </button>
              <button
                onClick={handleSave}
                className="bg-indigo-700 text-white px-4 py-2 rounded-md hover:bg-indigo-800 w-full sm:w-auto"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suppliers Table */}
      {showTable && (
        <div className="bg-white p-0 rounded-md shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Suppliers List</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Supplier Name</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Device Name</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Device ID</th>
                  <th className="p-3 text-left text-sm font-semibold text-gray-700 border-b dark:text-indigo-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                    <td className="p-3 border-b dark:text-white">{s.supplier_name}</td>
                    <td className="p-3 border-b dark:text-white">{s.device_name}</td>
                    <td className="p-3 border-b dark:text-white">{s.device_id}</td>
                    <td className="p-3 border-b">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center p-0 text-gray-500 dark:text-gray-400">
                      No suppliers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}