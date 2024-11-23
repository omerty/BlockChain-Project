import React, { Component } from 'react';
import axios from 'axios';

class AccountPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {
        name: '',
        email: '',
        address: '',
        phone: '',
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
    try {
      // Make API call to fetch user data (this is just an example URL)
      const response = await axios.get('/api/user/profile');
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
    try {
      const { updatedUser } = this.state;
      // Make API call to update user data
      const response = await axios.put('/api/user/profile', updatedUser);
      this.setState({ user: response.data, editing: false });
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  render() {
    const { user, editing, updatedUser } = this.state;

    return (
      <div className="account-page">
        <h1>Account Page</h1>
        <div className="account-info">
          <h3>User Information</h3>
          <p>Name: {editing ? <input type="text" name="name" value={updatedUser.name} onChange={this.handleChange} /> : user.name}</p>
          <p>Email: {editing ? <input type="text" name="email" value={updatedUser.email} onChange={this.handleChange} /> : user.email}</p>
          <p>Address: {editing ? <input type="text" name="address" value={updatedUser.address} onChange={this.handleChange} /> : user.address}</p>
          <p>Phone: {editing ? <input type="text" name="phone" value={updatedUser.phone} onChange={this.handleChange} /> : user.phone}</p>
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
