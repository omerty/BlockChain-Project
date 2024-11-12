import React, { Component } from 'react';
import axios from 'axios';

class Main extends Component {
  state = {
    products: [],
    loading: true,
    error: null,
  };

  _isMounted = false; // Flag to track component mounting

  componentDidMount() {
    this._isMounted = true; // Set the flag to true when the component mounts
    this.fetchProducts(localStorage.getItem('userEmail'));
  }

  componentWillUnmount() {
    this._isMounted = false; // Set the flag to false when the component unmounts
  }

  fetchProducts = async (email) => {
    console.log(email);
    try {
        const response = await axios.get(`http://localhost:5000/Products?email=${encodeURIComponent(email)}`);
        console.log('Products:', response.data);
        if (this._isMounted) { // Only update state if component is still mounted
          this.setState({ products: response.data, loading: false });
        }
    } catch (error) {
        console.error('Error fetching products:', error);
        if (this._isMounted) {
          this.setState({ loading: false, error: 'Error fetching products. Please try again.' });
        }
    }
  }

  removeProduct = async (productId) => {
    try {
      await axios.delete(`http://localhost:5000/products/${productId}`);
      if (this._isMounted) { // Only update state if component is still mounted
        this.setState(prevState => ({
          products: prevState.products.filter(product => product.id !== productId),
        }));
      }
    } catch (error) {
      console.error('Error removing product:', error);
      if (this._isMounted) {
        this.setState({ error: 'Error removing product. Please try again.' });
      }
    }
  }

  render() {
    const { products, loading, error } = this.state;

    return (
      <div id="content">
        <h1>Add Product</h1>
        <form onSubmit={(event) => {
          event.preventDefault();
          const name = this.productName.value;
          const price = window.web3.utils.toWei(this.productPrice.value.toString(), 'Ether');
          this.props.createProduct(name, price);
        }}>
          <div className="form-group mr-sm-2">
            <input
              id="productName"
              type="text"
              ref={(input) => { this.productName = input; }}
              className="form-control"
              placeholder="Product Name"
              required />
          </div>
          <div className="form-group mr-sm-2">
            <input
              id="productPrice"
              type="text"
              ref={(input) => { this.productPrice = input; }}
              className="form-control"
              placeholder="Product Price"
              required />
          </div>
          <button type="submit" className="btn btn-primary">Add Product</button>
        </form>
        <p>&nbsp;</p>
        <h2>Your Products</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Price (Ether)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="3">Loading...</td>
              </tr>
            ) : products.length > 0 ? products.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.price ? product.price.toString() : 'N/A'}</td>
                <td>
                  <button onClick={() => this.removeProduct(product.id)} className="btn btn-danger">Remove</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3">No products found</td>
              </tr>
            )}
          </tbody>
        </table>
        {error && <div className="alert alert-danger">{error}</div>}
      </div>
    );
  }
}

export default Main;

