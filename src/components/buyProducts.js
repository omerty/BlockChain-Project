import React, { Component } from 'react';
import Web3 from 'web3';
import Marketplace from '../abis/Marketplace.json';
import { Link } from 'react-router-dom'; // Import Link from react-router-dom
import MarketplaceAddress from '../abis/Marketplace-address.json'; // Import the address

class ProductPage extends Component {
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
      marketplaceAddress: MarketplaceAddress.address, // Replace this with the actual contract address
    };
    
    this.loadProductsFromDatabase = this.loadProductsFromDatabase.bind(this);
    this.connectToMetaMask = this.connectToMetaMask.bind(this);
  }

  async componentDidMount() {
    await this.loadProductsFromDatabase();
    await this.connectToMetaMask(); // Connect to MetaMask and set account
  }

  async connectToMetaMask() {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3.eth.getAccounts();
      this.setState({ account: accounts[0] });
    } else {
      alert('Please install MetaMask or use an Ethereum-enabled browser!');
    }
  }

  async loadProductsFromDatabase() {
    this.setState({ loading: true });

    try {
      const response = await fetch('http://localhost:5000/api/products');
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const products = await response.json();
      this.setState({ products, productCount: products.length, loading: false });
    } catch (error) {
      console.error('Error fetching products:', error);
      this.setState({ showPopup: true, loading: false });
    }
  }

  async purchaseProduct(productId) {
    const { account, products, marketplaceAddress } = this.state;
    console.log("Test");

    console.log("Marketplace Address:", marketplaceAddress);
    
    if (!marketplaceAddress) {
      console.error("Marketplace contract address is not set.");
      alert("Marketplace contract address is missing. Please check your setup.");
      return;
    }
    
    console.log("Test 1");
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.error("Product not found");
      alert("Selected product does not exist.");
      return;
    }
    
    console.log("Test 2");
    try {
      console.log("Test 3");
      const web3 = new Web3(window.ethereum);
      console.log("Test 4");
      
      // Get the network ID
      const networkId = await web3.eth.net.getId();
      console.log("Network ID: ", networkId);
      
      const marketplace = new web3.eth.Contract(Marketplace.abi, marketplaceAddress);
      console.log("Test 5");
      const priceInEther = web3.utils.toWei(product.price.toString(), 'ether');
      console.log("Test 6");
    
      await marketplace.methods.purchaseProduct(productId).send({
        from: account,
        value: priceInEther,
      })
      .on('transactionHash', (hash) => {
          console.log("Transaction sent, hash:", hash);
      })
      .on('receipt', (receipt) => {
          console.log("Transaction confirmed, receipt:", receipt);
          alert("Product purchased successfully!");
      })
      .on('error', (error) => {
          console.error("Transaction failed:", error);
          alert("Error purchasing product, please try again.");
      });

      alert("product succesfully purchased");
    
    } catch (error) {
      console.error("Error purchasing product:", error);
    
      if (error.code === 4001) {
        alert("Transaction rejected by user.");
      } else if (error.message && error.message.includes("insufficient funds")) {
        alert("Insufficient funds for this purchase.");
      } else if (error.message && error.message.includes("execution reverted")) {
        alert("Transaction failed: possible reasons include insufficient allowance or invalid product ID.");
      } else if (error.message && error.message.includes("User denied transaction signature")) {
        alert("Transaction signature denied.");
      } else {
        alert("Error purchasing product. Please try again later.");
      }
    }
}
  
  render() {
    const { email, products, loading, showPopup } = this.state;

    console.log(products);
    return (
      <div className="product-page" style={{ padding: '20px' }}>
        <h1>Product Page</h1>
        <div>Email: {email}</div>

        {loading ? (
          <div>Loading products...</div>
        ) : (
          <>
            <h2>Products</h2>
            {products.length === 0 ? (
              <div>No products available.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                {products.map((product, index) => (
                  <div key={index} style={{ border: '1px solid #ccc', padding: '10px' }}>
                    <h3>
                      {/* Wrap product name with Link */}
                      <Link to={`/products/${product.id}`} style={{ textDecoration: 'none', color: 'black' }}>
                        {product.name}
                      </Link>
                    </h3>
                    <p>Price: {product.price} Ether</p>
                    <button onClick={() => this.purchaseProduct(product.id)}>Buy</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {showPopup && (
          <div className="popup">
            <p>Network not supported. Please switch to a supported network.</p>
          </div>
        )}
      </div>
    );
  }
}

export default ProductPage;
