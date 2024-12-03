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
      imageFile: null, 
      imageUrl: '',
      email: email,
    };

    this._isMounted = false;
    this.loadingTimeout = null;

    this.createProduct = this.createProduct.bind(this);
    this.purchaseProduct = this.purchaseProduct.bind(this);
    this.connectToMarketplace = this.connectToMarketplace.bind(this);
    this.handleFileChange = this.handleFileChange.bind(this); 
  }

  async componentDidMount() {
    this._isMounted = true;
    this.loadingTimeout = setTimeout(() => {
      if (this._isMounted && this.state.loading) {
        this.setState({ loading: false, showPopup: true });
      }
    }, 30000); // 30 seconds timeout
  
    // Load saved image URL from localStorage if available
    const savedImageUrl = localStorage.getItem('imageUrl');
    if (savedImageUrl) {
      this.setState({ imageUrl: savedImageUrl });
    }
  
    await this.loadWeb3();
    await this.loadBlockchainData();
  
    const pendingTransaction = localStorage.getItem('pendingTransaction');
    if (pendingTransaction) {
      console.log("Pending transaction hash:", pendingTransaction);
      this.checkTransactionStatus(pendingTransaction);
    }
  }

  async loadWeb3() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
    } else {
      window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
    }
  }

  async loadBlockchainData() {
    try {
      const web3 = window.web3;
      const accounts = await web3.eth.getAccounts();

      if (accounts.length > 0) {
        this.setState({ account: accounts[0] });
        const networkId = await web3.eth.net.getId();
        console.log(networkId);
        const networkData = Marketplace.networks[networkId];
        if (networkData) {
          const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address);
          this.setState({ marketplace });
          const productCount = await marketplace.methods.productCount().call();
          this.setState({ productCount });

          // Load products
          const products = [];
          for (let i = 1; i <= productCount; i++) {
            const product = await marketplace.methods.products(i).call();
            products.push(product);
          }
          if (this._isMounted) {
            this.setState({ products, loading: false });
          }
        } else {
          if (this._isMounted) {
            this.setState({ showPopup: true, loading: false });
          }
        }
      } else {
        if (this._isMounted) {
          this.setState({ loading: false });
        }
      }
    } catch (error) {
      console.error("Error loading blockchain data:", error);
      if (this._isMounted) {
        this.setState({ loading: false, showPopup: true });
      }
    }
  }

  async connectToMarketplace() {
    await window.ethereum.enable();
    this.setState({ showPopup: false });
    this.loadBlockchainData();
  }

  handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      this.setState({ imageFile: file });
    }
  };

  async checkTransactionStatus(transactionHash) {
    if (!this._isMounted) return;

    const web3 = window.web3;
    this.setState({ loading: true });

    const receipt = await web3.eth.getTransactionReceipt(transactionHash);

    if (receipt && receipt.status) {
        // Transaction completed successfully
        const productCount = await this.state.marketplace.methods.productCount().call();
        const newProduct = await this.state.marketplace.methods.products(productCount).call();
        const safeNumber = parseInt(newProduct.price.toString(), 10);

        // Ensure imageUrl is loaded from localStorage if not already in state
        let imageUrl = this.state.imageUrl || localStorage.getItem('imageUrl');

        try {
            if (!imageUrl) {
                throw new Error("No image URL available. Please upload an image.");
            }

            // Save new product to the database using Axios
            await axios.post('http://localhost:5000/saveProduct', {
                owner: this.state.email,
                ownerId: this.state.account,
                price: safeNumber,
                name: newProduct.name,
                imageUrl, // Use the persisted or current imageUrl
            });

            console.log("Product saved successfully.", imageUrl);
        } catch (error) {
            console.error("Error saving product to the database:", error);
        }

        // Remove the pending transaction from localStorage
        localStorage.removeItem('pendingTransaction');

        if (this._isMounted) this.setState({ loading: false });
    } else {
        if (this._isMounted) {
            setTimeout(() => this.checkTransactionStatus(transactionHash), 3000);
        }
    }
}

  componentWillUnmount() {
    this._isMounted = false;
    clearTimeout(this.loadingTimeout);
  }

  async createProduct(name, price, imageFile) {
    if (!this._isMounted) return;
  
    this.setState({ loading: true });
    try {
      let ImgR;
      // Step 1: Upload image to the server only if a new file is provided
      if (imageFile) {
        const formData = new FormData();
        formData.append('file', imageFile);
  
        try {
          const imageResponse = await axios.post('http://localhost:5000/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
  
          ImgR = imageResponse.data.ImgR;
          console.log(ImgR);
          if (!ImgR) throw new Error("Image URL not received from the server.");
  
          // Save imageUrl in state and localStorage
          this.setState({ imageUrl: ImgR });
          localStorage.setItem('imageUrl', ImgR);
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError);
          throw new Error("Image upload failed. Please try again.");
        }
      } else {
        // Use the previously saved imageUrl
        ImgR = this.state.imageUrl;
        if (!ImgR) {
          throw new Error("No image available. Please upload an image.");
        }
      }
  
      // Step 2: Create product on the blockchain
      const receipt = await this.state.marketplace.methods.createProduct(name, price)
        .send({ from: this.state.account, gas: 200000 })
        .on('transactionHash', (hash) => {
          localStorage.setItem('pendingTransaction', hash);
        });
  
      if (!receipt || !receipt.status) {
        throw new Error("Blockchain transaction failed.");
      }
  
      // Step 3: Fetch product details and save to the server
      const productCount = await this.state.marketplace.methods.productCount().call();
      const newProduct = await this.state.marketplace.methods.products(productCount).call();
      const safeNumber = parseInt(newProduct.price.toString(), 10);
  
      await axios.post('http://localhost:5000/saveProduct', {
        owner: this.state.email,
        ownerId: this.state.account,
        price: safeNumber,
        name,
        imageUrl: ImgR, // Use the persisted or newly uploaded imageUrl
      });
  
      console.log("Product saved successfully.");
      localStorage.removeItem('pendingTransaction');
    } catch (error) {
      console.error("Error creating product:", error.message);
      alert(error.message); // Notify the user of the error
    } finally {
      if (this._isMounted) this.setState({ loading: false });
    }
  }

  async purchaseProduct(id, price) {
    this.setState({ loading: true });
    try {
      await this.state.marketplace.methods.purchaseProduct(id).send({
        from: this.state.account,
        value: price,
      });

      await fetch('http://localhost:5000/purchaseProduct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: this.state.account,
          email: this.state.email,
        }),
      });

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
        <Navbar account={this.state.account}/>
        <div className="container-fluid mt-5">
        </div>

        <div className="container">
          <h3>Add New Product</h3>
          <form onSubmit={(e) => { 
            e.preventDefault(); 
            this.createProduct(
              e.target.productName.value, 
              e.target.productPrice.value, 
              this.state.imageFile,
            ); 
          }}>
            <input type="text" name="productName" placeholder="Product Name" required />
            <input type="number" name="productPrice" placeholder="Product Price (in ETH)" required />
            <input type="file" name="image" onChange={this.handleFileChange} accept="image/*" required />
            <button type="submit">Create Product</button>
          </form>
        </div>

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

