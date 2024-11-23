import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Web3 from 'web3';
import Marketplace from '../abis/Marketplace.json'; 
import MarketplaceAddress from '../abis/Marketplace-address.json'; 

const SpecificProduct = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [web3, setWeb3] = useState(null);
  const [marketplaceAddress] = useState(MarketplaceAddress.address); 

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/products/${productId}`);
        setProduct(response.data[0]);
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
    initializeWeb3();
  }, [productId]);

  console.log(product);

  // Initialize Web3 and get the user's account from MetaMask
  const initializeWeb3 = async () => {
    if (window.ethereum) {
      const web3Instance = new Web3(window.ethereum);
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await web3Instance.eth.getAccounts();
      setAccount(accounts[0]);
      setWeb3(web3Instance);
    } else {
      alert('Please install MetaMask or use an Ethereum-enabled browser!');
    }
  };

  // Purchase product logic
  const purchaseProduct = async () => {
    if (!product || !account || !web3 || !marketplaceAddress) {
      console.error("Missing data for purchase");
      alert("Missing data. Please ensure all information is loaded.");
      return;
    }

    try {
      const priceInEther = web3.utils.toWei(product.price.toString(), 'ether');

      const marketplace = new web3.eth.Contract(Marketplace.abi, marketplaceAddress);
      await marketplace.methods.purchaseProduct(product.id).send({
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

    } catch (error) {
      console.error("Error purchasing product:", error);
      alert("Error purchasing product. Please try again later.");
    }
  };

  if (loading) {
    return <div>Loading product details...</div>;
  }

  if (!product) {
    return <div>Product not found.</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>{product.name}</h1>
      <p>Price: {Number(product.price).toFixed(2)} Ether</p>
      <p>Owner: {product.walletAddress}</p>
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{ maxWidth: '100%', height: 'auto', marginBottom: '20px' }}
        />
      )}

      {}
      <button
        onClick={purchaseProduct}
        style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Buy
      </button>
    </div>
  );
};

export default SpecificProduct;
