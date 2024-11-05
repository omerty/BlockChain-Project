import React, { Component } from 'react';
import Web3 from 'web3';
import logo from '../logo.png';
import './App.css';
import Marketplace from '../abis/Marketplace.json';
import Navbar from './Navbar';
import Main from './Main';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

const prisma = new PrismaClient();

class AddProducts extends Component {
  constructor(props) {
    super(props);
    const email = localStorage.getItem('userEmail'); 
    this.state = {
      account: '',
      productCount: 0,
      products: [],
      loading: true,
      showPopup: false,
      email: email, 
    };

    // Binding methods
    this.createProduct = this.createProduct.bind(this);
    this.purchaseProduct = this.purchaseProduct.bind(this);
    this.connectToMarketplace = this.connectToMarketplace.bind(this);
  }

  async componentDidMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();

    if (accounts.length > 0) {
      this.setState({ account: accounts[0] });
      const networkId = await web3.eth.net.getId();
      const networkData = Marketplace.networks[networkId];
      if (networkData) {
        const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address);
        this.setState({ marketplace });
        const productCount = await marketplace.methods.productCount().call();
        this.setState({ productCount });

        // Load products
        for (let i = 1; i <= productCount; i++) {
          const product = await marketplace.methods.products(i).call();
          this.setState((prevState) => ({
            products: [...prevState.products, product],
          }));
        }
        this.setState({ loading: false });
      } else {
        this.setState({ showPopup: true, loading: false });
      }
    } else {
      this.setState({ loading: false });
    }
  }

  async connectToMarketplace() {
    await window.ethereum.enable();
    this.setState({ showPopup: false });
    this.loadBlockchainData();
  }

  async createProduct(name, price) {
    if (!this.state.marketplace) {
        this.setState({ showPopup: true });
        console.log("Marketplace not available, showing popup.");
        return;
    }
  
    console.log("Entering createProduct method.");
    this.setState({ loading: true });
  
    try {
        const transaction = this.state.marketplace.methods.createProduct(name, price);
  
        transaction.send({ from: this.state.account, gas: 300000 })
            .on('transactionHash', (hash) => {
                console.log("Transaction hash:", hash);
            })
            .on('confirmation', async (confirmationNumber, receipt) => {
  
                if (confirmationNumber === 1) {  // Only fetch product after the first confirmation
                    const productCount = await this.state.marketplace.methods.productCount().call();
                    const newProduct = await this.state.marketplace.methods.products(productCount).call();
  
                    console.log("New product fetched:", newProduct);
  
                    // Save new product to the database using Axios
                    try {
                        const response = await axios.post('http://localhost:5000/saveProduct', {
                            name: newProduct.name,
                            ownerId: this.state.email,
                            price: price
                        });
  
                        console.log("Product saved:", response.data);
  
                        // Update state with new product
                        this.setState((prevState) => ({
                            products: [...prevState.products, newProduct],
                            productCount: productCount,
                            loading: false,
                        }));
                    } catch (error) {
                        console.error("Error saving product:", error);
                        this.setState({ loading: false });
                    }
                }
            })
            .on('error', (error) => {
                console.error("Transaction error:", error);
                this.setState({ loading: false });
            });
  
    } catch (error) {
        console.error("Transaction error:", error);
        this.setState({ loading: false });
    }
  }


  async purchaseProduct(id, price) {
    this.setState({ loading: true });
    try {
      // Purchase the product via the marketplace contract
      await this.state.marketplace.methods.purchaseProduct(id).send({
        from: this.state.account,
        value: price,
      });

      // After successful purchase, save the product in the database
      await fetch('http://localhost:5000/saveProduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          email: this.state.email, // Assuming the account is the user's email
          price: price,
        }),
      });

      // Optionally refresh the product list or handle success response
      const products = await this.fetchUserProducts(this.state.email);
      this.setState({ products, loading: false });
    } catch (error) {
      console.error('Error purchasing product:', error);
      this.setState({ loading: false });
    }
  }

  fetchUserProducts = async (email) => {
    const response = await fetch(`http://localhost:5000/addProducts?email=${email}`);
    const data = await response.json();
    return data;
  };

  render() {
    return (
      <div>
        <Navbar account={this.state.account} />
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex">
              {this.state.loading ? (
                <div id="loader" className="text-center"><p className="text-center">Loading...</p></div>
              ) : (
                <Main
                  products={this.state.products}
                  createProduct={this.createProduct}
                  purchaseProduct={this.purchaseProduct}
                />
              )}
            </main>
          </div>
        </div>

        {/* Popup for marketplace connection */}
        {this.state.showPopup && (
          <div className="popup">
            <div className="popup-content">
              <h4>Marketplace Connection Required</h4>
              <p>The marketplace contract is not connected. Please connect to continue.</p>
              <button onClick={this.connectToMarketplace}>Connect Marketplace</button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default AddProducts;
