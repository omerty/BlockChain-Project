import React, { Component } from 'react';
import axios from 'axios';
import Navbar from './Navbar';
import { Nav } from 'react-bootstrap';
class AccountPage extends Component {
  constructor(props) {
    super(props);
    const email = localStorage.getItem('userEmail');
    this.state = {
      email: email,
      user: {
        email: email,       
        password: '', 
        products: [],       
        wallets: [],        
        purchased: [],     
      },
      editing: false,
      updatedUser: {
        name: '',
        email: '',
        address: '',
        phone: '',
      },
    };
  }

  // Fetch user data from the server (or use static data)
  componentDidMount() {
    this.fetchUserData();
  }

  fetchUserData = async () => {
    const email = this.state.email;
    try {
      console.log("HERE");
      const response = await axios.get(`http://localhost:5000/api/user/${email}`);
      console.log(response);
      this.setState({ user: response.data, updatedUser: response.data });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      updatedUser: { ...this.state.updatedUser, [name]: value },
    });
  };

  toggleEditMode = () => {
    this.setState({ editing: !this.state.editing });
  };

  handleUpdate = async () => {
    const email = this.state.email;
    try {
      const { updatedUser } = this.state;
      const response = await axios.put(`http://localhost:5000/api/user/${email}`, updatedUser);
      console.log(response);
      this.setState({ user: response.data, editing: false });
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  render() {
    const { user, editing, updatedUser } = this.state;

    return (
      <div className="account-page">
        <Navbar/>
        <h1>Account Page</h1>
        <div className="account-info">
          <h3>User Information</h3>
          <p>Email: {editing ? <input type="text" name="email" value={updatedUser.email} onChange={this.handleChange} /> : user.email}</p>
          <p>Password: {editing ? <input type="password" name="password" value={updatedUser.password} onChange={this.handleChange} /> : '••••••••'}</p>
          
          {/* Products Section */}
          <p>Products: {editing ? 
            <textarea 
              name="products" 
              value={(updatedUser.products || []).join(', ')} 
              onChange={this.handleChange} 
              placeholder="Enter product names separated by commas"
            /> : 
            (user.products || []).map((product, index) => (
              <span key={index}>
                <a href={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'blue' }}>
                  {product.name}
                </a>
                {index < user.products.length - 1 ? ', ' : ''}
              </span>
            ))
          }</p>
            
          {/* Wallets Section */}
          <p>Wallets: {editing ? 
            <textarea 
              name="wallets" 
              value={(updatedUser.wallets || []).join(', ')} 
              onChange={this.handleChange} 
              placeholder="Enter wallet addresses separated by commas"
            /> : (user.wallets || []).join(', ')}</p>

          {/* Purchased Section */}
          <p>Purchased Products: {editing ? 
            <textarea 
              name="purchased" 
              value={(updatedUser.purchased || []).join(', ')} 
              onChange={this.handleChange} 
              placeholder="Enter purchased products separated by commas"
            /> : (user.purchased || []).join(', ')}</p>
        </div>

        <div className="account-actions">
          {editing ? (
            <button onClick={this.handleUpdate}>Save Changes</button>
          ) : (
            <button onClick={this.toggleEditMode}>Edit Information</button>
          )}
        </div>
      </div>
    );
}
}

export default AccountPage;
