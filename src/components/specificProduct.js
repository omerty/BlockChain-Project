// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { useParams } from 'react-router-dom';
// import Web3 from 'web3';
// import Marketplace from '../abis/Marketplace.json'; 
// import MarketplaceAddress from '../abis/Marketplace-address.json'; 
// import ChatRoom from './ChatRoom';
// import Navbar from './Navbar';

// const SpecificProduct = () => {
//   const { productId } = useParams();
//   const [product, setProduct] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [account, setAccount] = useState('');
//   const [sellAcc, setsellAcc] = useState('');
//   const [web3, setWeb3] = useState(null);
//   const [marketplaceAddress] = useState(MarketplaceAddress.address); 
//   const [email, setEmail] = useState(localStorage.getItem('userEmail'));

//   useEffect(() => {
//     const fetchProductDetails = async () => {
//       try {
//         setLoading(true);

//         const productResponse = await axios.get(`http://localhost:5000/api/products/${productId}`);
//         if (productResponse.data.length > 0) {
//           setProduct(productResponse.data[0]);
//         } else {
//           setProduct(null);
//         }

//         const emailResponse = await axios.get(`http://localhost:5000/api/email/${productId}`);
//         setsellAcc(emailResponse.data);
//       } catch (error) {
//         console.error('Error fetching product or email:', error);
//         setProduct(null);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProductDetails();
//     initializeWeb3();

//     const storedEmail = localStorage.getItem('userEmail');
//     setEmail(storedEmail);
//   }, [productId]);

//   const initializeWeb3 = async () => {
//     if (window.ethereum) {
//       const web3Instance = new Web3(window.ethereum);
//       await window.ethereum.request({ method: 'eth_requestAccounts' });
//       const accounts = await web3Instance.eth.getAccounts();
//       setAccount(accounts[0]);
//       setWeb3(web3Instance);
//     } else {
//       alert('Please install MetaMask or use an Ethereum-enabled browser!');
//     }
//   };

//   console.log("Email passed to ChatRoom:", email);
//   console.log("Seller Email:", sellAcc);

//   const purchaseProduct = async () => {
//     if (!product || !account || !web3 || !marketplaceAddress) {
//       console.error("Missing data for purchase");
//       alert("Missing data. Please ensure all information is loaded.");
//       return;
//     }

//     try {
//       const priceInEther = web3.utils.toWei(product.price.toString(), 'ether');

//       const marketplace = new web3.eth.Contract(Marketplace.abi, marketplaceAddress);
//       await marketplace.methods.purchaseProduct(product.id).send({
//         from: account,
//         value: priceInEther,
//       })
//         .on('transactionHash', (hash) => {
//           console.log("Transaction sent, hash:", hash);
//         })
//         .on('receipt', (receipt) => {
//           console.log("Transaction confirmed, receipt:", receipt);
//           alert("Product purchased successfully!");
//         })
//         .on('error', (error) => {
//           console.error("Transaction failed:", error);
//           alert("Error purchasing product, please try again.");
//         });

//     } catch (error) {
//       console.error("Error purchasing product:", error);
//       alert("Error purchasing product. Please try again later.");
//     }
//   };

//   if (loading) {
//     return <div>Loading product details...</div>;
//   }

//   if (!product) {
//     return <div>Product not found.</div>;
//   }

//   return (
//     <div style={{ padding: '20px' }}>
//       <Navbar/>
//       <ChatRoom buyerAccount={email} sellerAccount={sellAcc} />
//       <h1>{product.name}</h1>
//       <p>Price: {Number(product.price).toFixed(2)} Ether</p>
//       <p>Owner: {product.walletAddress}</p>
//       {product.imageUrl && (
//         <img
//           src={product.imageUrl}
//           alt={product.name}
//           style={{ maxWidth: '100%', height: 'auto', marginBottom: '20px' }}
//         />
//       )}

//       <button
//         onClick={purchaseProduct}
//         style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
//       >
//         Buy
//       </button>
//     </div>
//   );
// };

// export default SpecificProduct;


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import Web3 from 'web3';
import Marketplace from '../abis/Marketplace.json'; 
import MarketplaceAddress from '../abis/Marketplace-address.json'; 
import ChatRoom from './ChatRoom';
import Navbar from './Navbar';

const SpecificProduct = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [sellAcc, setsellAcc] = useState('');
  const [web3, setWeb3] = useState(null);
  const [marketplaceAddress] = useState(MarketplaceAddress.address); 
  const [email, setEmail] = useState(localStorage.getItem('userEmail'));

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
          setLoading(true);
  
          // Fetch product details
          const productResponse = await axios.get(`http://localhost:5000/api/products/${productId}`);
          if (productResponse.data) {
              console.log(productResponse.data);
              setProduct(productResponse.data[0]);
          } else {
              setProduct(null);
          }
  
          // Fetch owner's email
          const emailResponse = await axios.get(`http://localhost:5000/api/email/${productId}`);
          setsellAcc(emailResponse.data);
      } catch (error) {
          console.error('Error fetching product or email:', error);
          setProduct(null);
      } finally {
          setLoading(false);
      }
  };

    fetchProductDetails();
    initializeWeb3();

    const storedEmail = localStorage.getItem('userEmail');
    setEmail(storedEmail);
  }, [productId]);

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

  const handlePayPalPayment = async (details) => {
    try {
      const response = await axios.post("http://localhost:5000/paypal-transaction", {
        productId: product.id,
        buyerEmail: email,
        sellerEmail: sellAcc,
        paymentDetails: details,
      });
      alert("Payment successful! Your order has been processed.");
    } catch (error) {
      console.error("Error processing PayPal payment:", error);
      alert("Error processing payment. Please try again later.");
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
      <Navbar/>
      <ChatRoom buyerAccount={email} sellerAccount={sellAcc} />
      <h1>{product.name || 'Unnamed Product'}</h1>
      <p>Price: {product.price ? `${Number(product.price).toFixed(2)} Ether` : 'Not available'}</p>
      <p>Owner: {product.walletAddress || 'Not available'}</p>
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          style={{ maxWidth: '100%', height: 'auto', marginBottom: '20px' }}
        />
      )}

      <h3>Pay with PayPal:</h3>
      <PayPalScriptProvider options={{ "client-id": "AX-w3_s62D3HfGpQBdPtPfRtw4gt_HZX2HheFEYOc2fV-ytK_YZ83Za4CVtCmIRxJsRC2ZUJAlOnmdRQ" }}>
        <PayPalButtons
          style={{ layout: "vertical" }}
          createOrder={(data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: product.price, // Price in USD
                  },
                  payee: {
                    email_address: "rimshah.abid1@gmail.com", 
                  }
                },
              ],
            });
          }}
          onApprove={(data, actions) => {
            return actions.order.capture().then((details) => {
              console.log("Transaction completed by:", details.payer.name.given_name);
              handlePayPalPayment(details);
            });
          }}
          onError={(err) => {
            console.error("PayPal Checkout onError:", err);
            alert("Payment failed. Please try again.");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
};

export default SpecificProduct;
