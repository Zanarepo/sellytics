import React, { useState, useRef, useEffect } from 'react';
import { FaPen, FaTrash, FaSave } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignaturePad = ({ receiptId, onSave, initialSignature }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000'); // Default: black
  const [isCanvasOpen, setIsCanvasOpen] = useState(false);
  const [signature, setSignature] = useState(initialSignature || null);

  // Initialize canvas when modal is open
  useEffect(() => {
    if (!isCanvasOpen || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Canvas context not available');
      return;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;

    // Load initial signature if provided
    if (initialSignature) {
      const img = new Image();
      img.src = initialSignature;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
    }

    // Handle canvas resizing
    const resizeCanvas = () => {
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);

      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = 150;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = penColor;
      ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, canvas.width, canvas.height);
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isCanvasOpen, penColor, initialSignature]);

  // Get coordinates from mouse or touch event
  const getCoordinates = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let x, y;
    if (event.type.includes('touch')) {
      x = (event.touches[0].clientX - rect.left) * scaleX;
      y = (event.touches[0].clientY - rect.top) * scaleY;
    } else {
      x = (event.clientX - rect.left) * scaleX;
      y = (event.clientY - rect.top) * scaleY;
    }

    return { x, y };
  };

  // Start drawing
  const startDrawing = (event) => {
    event.preventDefault();
    if (!canvasRef.current) return;

    const coords = getCoordinates(event);
    if (!coords) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  // Draw on canvas
  const draw = (event) => {
    if (!isDrawing || !canvasRef.current) return;
    event.preventDefault();

    const coords = getCoordinates(event);
    if (!coords) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  // Stop drawing
  const stopDrawing = () => {
    if (!canvasRef.current) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.closePath();
  };

  // Clear canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
    toast.info('Signature cleared.');
  };

  // Save signature to Supabase with store_id authentication
  const saveSignature = async () => {
    if (!canvasRef.current) return;

    // Retrieve store_id from localStorage
    const store_id = Number(localStorage.getItem('store_id'));
    if (!store_id) {
      toast.error('No store selected. Please log in again.');
      return;
    }

    try {
      // Authenticate user and validate store_id
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error('User not authenticated. Please log in.');
        return;
      }

      const { data: userStore, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('store_id', store_id)
        .single();

      if (storeError || !userStore) {
        toast.error('Unauthorized: You are not associated with this store.');
        return;
      }

      // Save signature
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      const { error } = await supabase
        .from('receipts')
        .update({ signature: dataUrl })
        .eq('id', receiptId);
      if (error) throw error;

      setSignature(dataUrl);
      setIsCanvasOpen(false);
      toast.success('Signature saved successfully!');
      if (onSave) onSave(dataUrl);
    } catch (err) {
      toast.error(`Error saving signature: ${err.message}`);
    }
  };

  // Pen color options
  const penColors = [
    { name: 'Black', value: '#000000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Green', value: '#008000' },
  ];

  return (
    <div className="relative">
      {/* Pen Icon to Open Canvas */}
      <button
        onClick={() => setIsCanvasOpen(!isCanvasOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        title="Add Signature"
      >
        <FaPen /> {isCanvasOpen ? 'Close Signature Pad' : 'Sign Receipt'}
      </button>

      {/* Signature Canvas Modal */}
      {isCanvasOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Draw Signature</h3>
            <canvas
              ref={canvasRef}
              className="border border-gray-300 dark:border-gray-600 rounded-lg w-full h-[150px] bg-white dark:bg-gray-900"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseOut={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {penColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    setPenColor(color.value);
                  }}
                  className={`w-8 h-8 rounded-full border-2 ${
                    penColor === color.value ? 'border-indigo-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={`Select ${color.name}`}
                />
              ))}
            </div>
            <div className="flex justify-between gap-2">
              <button
                onClick={clearCanvas}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <FaTrash /> Clear
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsCanvasOpen(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSignature}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <FaSave /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Display Saved Signature */}
      {signature && (
        <div className="mt-2">
          <img src={signature} alt="Signature" className="w-full h-16 object-contain" />
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default SignaturePad;