import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Web3 from 'web3';
import Marketplace from '../abis/Marketplace.json'; // Assuming you have the Marketplace ABI file

const SpecificProduct = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [web3, setWeb3] = useState(null);

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
    if (!web3 || !product || !account) {
      alert('Please connect to MetaMask and ensure product details are loaded.');
      return;
    }

    try {
      const marketplaceAddress = 11111; // Replace with actual address
      const marketplace = new web3.eth.Contract(Marketplace.abi, marketplaceAddress);

      const priceInEther = web3.utils.toWei(product.price.toString(), 'ether'); // Convert price to Wei

      // Call the purchaseProduct method in the smart contract
      await marketplace.methods.purchaseProduct(productId).send({
        from: account,
        value: priceInEther, // Send Ether with the transaction
      });

      alert('Product purchased successfully!');
    } catch (error) {
      console.error('Error purchasing product:', error);
      alert('Error purchasing product, please try again.');
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
      <p>Description: {product.description}</p>

      {/* Buy Button */}
      <button onClick={purchaseProduct} style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
        Buy
      </button>
    </div>
  );
};

export default SpecificProduct;
