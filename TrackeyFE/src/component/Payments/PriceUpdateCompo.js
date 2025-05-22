import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';

const SubscriptionPlansCRUD = () => {
  // State for plans, form data, errors, and notifications
  const [plans, setPlans] = useState([]);
  const [form, setForm] = useState({ id: null, name: '', price: '', description: '' });
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);

  // Define showNotification early to avoid no-use-before-define
  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, [setNotification]);

  // Memoize fetchPlans
  const fetchPlans = useCallback(async () => {
    const { data, error } = await supabase.from('subscription_plans').select('*');
    if (error) {
      showNotification('Error fetching plans', 'error');
      console.error('Fetch error:', error);
    } else {
      setPlans(data);
    }
  }, [setPlans, showNotification]);

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear errors for the field being edited
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.price || form.price <= 0) newErrors.price = 'Price must be a positive number';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission (create or update)
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (form.id) {
      // Update existing plan
      const { error } = await supabase
        .from('subscription_plans')
        .update({ name: form.name, price: parseFloat(form.price), description: form.description })
        .eq('id', form.id);
      if (error) {
        showNotification('Error updating plan', 'error');
        console.error('Update error:', error);
      } else {
        showNotification('Plan updated successfully', 'success');
        fetchPlans();
        resetForm();
      }
    } else {
      // Create new plan
      const { error } = await supabase
        .from('subscription_plans')
        .insert([{ name: form.name, price: parseFloat(form.price), description: form.description }]);
      if (error) {
        showNotification('Error creating plan', 'error');
        console.error('Create error:', error);
      } else {
        showNotification('Plan created successfully', 'success');
        fetchPlans();
        resetForm();
      }
    }
  };

  // Handle edit button click
  const handleEdit = (plan) => {
    setForm({ id: plan.id, name: plan.name, price: plan.price, description: plan.description });
    setErrors({});
  };

  // Handle delete button click
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
    if (error) {
      showNotification('Error deleting plan', 'error');
      console.error('Delete error:', error);
    } else {
      showNotification('Plan deleted successfully', 'success');
      fetchPlans();
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({ id: null, name: '', price: '', description: '' });
    setErrors({});
  };

  // ... (JSX rendering, unchanged from original)
  return (
    <div className="w-full px-4 sm:px-8 py-6 bg-gray-100 min-h-screen">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded text-white ${
            notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 text-center">
        Manage Subscription Plans
      </h1>

      {/* Form */}
      <div className="bg-white shadow-lg rounded px-4 sm:px-8 pt-6 pb-8 mb-8 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 gap-4">
          {/* Name */}
          <div>
            <label className="block text-gray-700 font-bold text-sm sm:text-base mb-2">
              Plan Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter plan name"
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded focus:outline-none focus:ring-2 ${
                errors.name ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Price */}
          <div>
            <label className="block text-gray-700 font-bold text-sm sm:text-base mb-2">
              Price ($)
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="Enter price"
              step="0.01"
              min="0"
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded focus:outline-none focus:ring-2 ${
                errors.price ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
              }`}
            />
            {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-700 font-bold text-sm sm:text-base mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter description"
              className={`w-full px-3 py-2 text-sm sm:text-base border rounded focus:outline-none focus:ring-2 ${
                errors.description ? 'border-red-500 focus:ring-red-500' : 'focus:ring-blue-500'
              }`}
              rows="4"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          {/* Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm sm:text-base"
            >
              {form.id ? 'Update Plan' : 'Add Plan'}
            </button>
            {form.id && (
              <button
                onClick={resetForm}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 text-sm sm:text-base"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-lg rounded">
          <thead>
            <tr className="bg-gray-200 text-gray-700 text-sm sm:text-base">
              <th className="py-3 px-4 text-left">Name</th>
              <th className="py-3 px-4 text-left">Price ($)</th>
              <th className="py-3 px-4 text-left">Description</th>
              <th className="py-3 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {plans.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                  No plans found
                </td>
              </tr>
            ) : (
              plans.map((plan) => (
                <tr key={plan.id} className="border-t text-sm sm:text-base">
                  <td className="py-3 px-4">{plan.name}</td>
                  <td className="py-3 px-4">{plan.price.toFixed(2)}</td>
                  <td className="py-3 px-4">{plan.description}</td>
                  <td className="py-3 px-4 flex space-x-2">
                    <button
                      onClick={() => handleEdit(plan)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(plan.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SubscriptionPlansCRUD;