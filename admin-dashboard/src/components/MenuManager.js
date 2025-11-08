import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'https://restaurant-app-backend-qwfb.onrender.com';

function MenuManager() {
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState('');
  
  // State for the form
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState(''); // NEW state for category

  // Helper function to get the auth token
  const getAuthToken = () => {
    // We use a fake token for "skip login" mode
    return localStorage.getItem('admin_token') || 'DEV_BYPASS_TOKEN';
  };

  // --- Data Functions ---
  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/menu`);
      setMenuItems(response.data);
    } catch (err) {
      console.error("Failed to fetch menu:", err);
      setError("Could not fetch menu.");
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // --- Form Handlers ---
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = getAuthToken();
    const headers = { 'x-auth-token': token };
    // NEW: Add category to the data
    const itemData = { name, price: parseFloat(price), image, category };

    try {
      if (isEditing) {
        // Update existing item
        await axios.put(`${API_URL}/api/menu/${currentItem.id}`, itemData, { headers });
      } else {
        // Create new item
        await axios.post(`${API_URL}/api/menu`, itemData, { headers });
      }
      resetForm();
      fetchMenu(); // Refresh the list
    } catch (err) {
      console.error("Failed to save item:", err);
      setError("Failed to save item. Are you logged in?");
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const token = getAuthToken();
        await axios.delete(`${API_URL}/api/menu/${itemId}`, {
          headers: { 'x-auth-token': token }
        });
        fetchMenu(); // Refresh the list
      } catch (err) {
        console.error("Failed to delete item:", err);
        setError("Failed to delete item.");
      }
    }
  };

  // --- Helper Functions ---
  const editItem = (item) => {
    setIsEditing(true);
    setCurrentItem(item);
    setName(item.name);
    setPrice(item.price);
    setImage(item.image);
    setCategory(item.category); // NEW: set category on edit
    window.scrollTo(0, 0); 
  };

  const resetForm = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setName('');
    setPrice('');
    setImage('');
    setCategory(''); // NEW: reset category
    setError('');
  };


  return (
    <div className="menu-manager">
      {/* --- The Form for Adding/Editing --- */}
      <form onSubmit={handleFormSubmit} className="menu-form">
        <h2>{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div className="form-row">
          <div>
            <label>Dish Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Paneer Butter Masala"
              required
            />
          </div>
          <div>
            <label>Price (₹)</label>
            <input
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 250"
              required
            />
          </div>
        </div>
        <div className="form-row">
          <div>
            <label>Image Path</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="e.g., /images/paneer.jpg"
            />
          </div>
          <div>
            {/* --- NEW CATEGORY FIELD --- */}
            <label>Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., House Specials"
              required
            />
          </div>
        </div>
        <button type="submit">{isEditing ? 'Update Item' : 'Add Item'}</button>
        {isEditing && <button type="button" onClick={resetForm} style={{ marginLeft: '1rem', backgroundColor: '#6c757d' }}>Cancel Edit</button>}
      </form>

      {/* --- The Table of Existing Items --- */}
      <table className="menu-list-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Price</th>
            <th>Category</th> {/* NEW: Category column */}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {menuItems.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>₹{item.price}</td>
              <td>{item.category}</td> {/* NEW: Category data */}
              <td>
                <button className="edit-btn" onClick={() => editItem(item)}>Edit</button>
                <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default MenuManager;