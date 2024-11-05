import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ProductPage = () => {
  const [category, setCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('lowToHigh');
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/products'); 
        console.log('Fetched products:', response.data);
        setProducts(response.data); 
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false); 
      }
    };

    fetchProducts();
  }, []); 

  const handleCategoryChange = (e) => setCategory(e.target.value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleSortChange = (order) => setSortOrder(order);

  const filteredProducts = products
    .filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => (sortOrder === 'lowToHigh' ? a.price - b.price : b.price - a.price));

  if (loading) {
    return <div>Loading...</div>; 
  }

  if (filteredProducts.length === 0) {
    return <div>No products available.</div>; 
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Buy Product</h1>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <label>Category: </label>
        <select value={category} onChange={handleCategoryChange} style={{ marginRight: '10px' }}>
          <option value="All">All</option>
          <option value="Category1">Home</option>
          <option value="Category2">School Appliances</option>
          <option value="Category3">Textbooks</option>
        </select>

        <input
          type="text"
          placeholder="Search"
          value={searchTerm}
          onChange={handleSearchChange}
          style={{ marginRight: '10px' }}
        />

        <div>
          <label>Sort: </label>
          <button onClick={() => handleSortChange('lowToHigh')}>Low to High</button>
          <button onClick={() => handleSortChange('highToLow')}>High to Low</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              textAlign: 'center',
            }}
          >
            <h3>{product.name}</h3>
            <p>Price: ${product.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPage;
