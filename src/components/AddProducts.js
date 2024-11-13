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

    this._isMounted = false;
    this.loadingTimeout = null;

    this.createProduct = this.createProduct.bind(this);
    this.purchaseProduct = this.purchaseProduct.bind(this);
    this.connectToMarketplace = this.connectToMarketplace.bind(this);
  }

  async componentDidMount() {
    this._isMounted = true;
    this.loadingTimeout = setTimeout(() => {
      if (this._isMounted && this.state.loading) {
        this.setState({ loading: false, showPopup: true });
      }
    }, 30000); // 30 seconds timeout

    await this.loadWeb3();
    await this.loadBlockchainData();

    const pendingTransaction = localStorage.getItem('pendingTransaction');
    if (pendingTransaction) {
      console.log("Pending transaction hash:", pendingTransaction);
      this.checkTransactionStatus(pendingTransaction);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
    clearTimeout(this.loadingTimeout);
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

  async createProduct(name, price) {
    if (!this.state.marketplace) {
        this.setState({ showPopup: true });
        console.log("Marketplace not available, showing popup.");
        return;
    }

    console.log("Entering createProduct method.");
    this.setState({ loading: true });

    try {
        // Send transaction and get the receipt immediately to access transactionHash
        const receipt = await this.state.marketplace.methods.createProduct(name, price)
            .send({ from: this.state.account, gas: 300000 })
            .on('transactionHash', (hash) => {
                console.log("Transaction hash:", hash); // Log transaction hash
                localStorage.setItem('pendingTransaction', hash); // Store in localStorage
            });

        // Check if receipt was successful
        if (receipt && receipt.status) {
            const productCount = await this.state.marketplace.methods.productCount().call();
            const newProduct = await this.state.marketplace.methods.products(productCount).call();

            const newPrice = price / 1e18;

            // Save new product to the database using Axios
            try {
                await axios.post('http://localhost:5000/saveProduct', {
                    owner: this.state.email,
                    ownerId: this.state.account,
                    price: newPrice,
                    name: name,
                });

                console.log("Product saved successfully.");
            } catch (error) {
                console.error("Error saving product to the database:", error);
            }

            // Clear the transaction hash from localStorage
            localStorage.removeItem('pendingTransaction');
            if (this._isMounted) this.setState({ loading: false });
        } else {
            console.log("Transaction failed.");
        }
    } catch (error) {
        console.error("Error creating product:", error);
        this.setState({ loading: false });
    }
}


async componentDidMount() {
    this._isMounted = true;
    await this.loadWeb3();
    await this.loadBlockchainData();

    // Check if there's a pending transaction in localStorage
    const pendingTransaction = localStorage.getItem('pendingTransaction');
    if (pendingTransaction) {
        console.log("Pending transaction hash:", pendingTransaction);
        // Monitor the transaction until it completes
        this.checkTransactionStatus(pendingTransaction);
    }
}

componentWillUnmount() {
  this._isMounted = false; 
}

async checkTransactionStatus(transactionHash) {
    const web3 = window.web3;
    this.setState({ loading: true });

    const receipt = await web3.eth.getTransactionReceipt(transactionHash);
    if (receipt && receipt.status) {
        // Transaction completed successfully
        const productCount = await this.state.marketplace.methods.productCount().call();
        const newProduct = await this.state.marketplace.methods.products(productCount).call();

        // Save new product to the database using Axios
        try {
            await axios.post('http://localhost:5000/saveProduct', {
                owner: this.state.email,
                ownerId: this.state.account,
                price: newProduct.price / 1e18,
                name: newProduct.name,
            });

            console.log("Product saved successfully.");
        } catch (error) {
            console.error("Error saving product to the database:", error);
        }

        // Clear the pending transaction from localStorage
        localStorage.removeItem('pendingTransaction');
        if (this._isMounted) this.setState({ loading: false });
    } else {
        // If transaction hasn't completed, retry after a delay
        if (this._isMounted) {
          setTimeout(() => this.checkTransactionStatus(transactionHash), 3000);
      }
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



// import React, { Component } from 'react';
// import Web3 from 'web3';
// import axios from 'axios';
// import Marketplace from '../abis/Marketplace.json';
// import Navbar from './Navbar';
// import Main from './Main';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
// class AddProducts extends Component {
//   constructor(props) {
//     super(props);
//     const email = localStorage.getItem('userEmail');
//     this.state = {
//       account: '',
//       productCount: 0,
//       products: [],
//       loading: true,
//       showPopup: false,
//       email: email,
//     };

//     this._isMounted = false;
//     this.loadingTimeout = null;

//     this.createProduct = this.createProduct.bind(this);
//     this.purchaseProduct = this.purchaseProduct.bind(this);
//     this.connectToMarketplace = this.connectToMarketplace.bind(this);
//   }

//   async componentDidMount() {
//     this._isMounted = true;
//     this.loadingTimeout = setTimeout(() => {
//       if (this._isMounted && this.state.loading) {
//         this.setState({ loading: false, showPopup: true });
//       }
//     }, 30000); // 30 seconds timeout

//     await this.loadWeb3();
//     await this.loadBlockchainData();

//     const pendingTransaction = localStorage.getItem('pendingTransaction');
//     if (pendingTransaction) {
//       console.log("Pending transaction hash:", pendingTransaction);
//       this.checkTransactionStatus(pendingTransaction);
//     }
//   }

//   componentWillUnmount() {
//     this._isMounted = false;
//     clearTimeout(this.loadingTimeout);
//   }

//   async loadWeb3() {
//     if (window.ethereum) {
//       window.web3 = new Web3(window.ethereum);
//     } else {
//       window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!');
//     }
//   }

//   async loadBlockchainData() {
//     try {
//       const web3 = window.web3;
//       const accounts = await web3.eth.getAccounts();

//       if (accounts.length > 0) {
//         this.setState({ account: accounts[0] });
//         const networkId = await web3.eth.net.getId();
//         const networkData = Marketplace.networks[networkId];
//         if (networkData) {
//           const marketplace = new web3.eth.Contract(Marketplace.abi, networkData.address);
//           this.setState({ marketplace });
//           const productCount = await marketplace.methods.productCount().call();
//           this.setState({ productCount });

//           // Load products
//           const products = [];
//           for (let i = 1; i <= productCount; i++) {
//             const product = await marketplace.methods.products(i).call();
//             products.push(product);
//           }
//           if (this._isMounted) {
//             this.setState({ products, loading: false });
//           }
//         } else {
//           if (this._isMounted) {
//             this.setState({ showPopup: true, loading: false });
//           }
//         }
//       } else {
//         if (this._isMounted) {
//           this.setState({ loading: false });
//         }
//       }
//     } catch (error) {
//       console.error("Error loading blockchain data:", error);
//       if (this._isMounted) {
//         this.setState({ loading: false, showPopup: true });
//       }
//     }
//   }

//   async connectToMarketplace() {
//     await window.ethereum.enable();
//     this.setState({ showPopup: false });
//     this.loadBlockchainData();
//   }

//   async createProduct(name, price) {
//     if (!this.state.marketplace) {
//       this.setState({ showPopup: true });
//       console.log("Marketplace not available, showing popup.");
//       return;
//     }

//     console.log("Entering createProduct method.");
//     this.setState({ loading: true });

//     try {
//       // Send transaction and get the receipt immediately to access transactionHash
//       const receipt = await this.state.marketplace.methods.createProduct(name, price)
//         .send({ from: this.state.account, gas: 300000 })
//         .on('transactionHash', (hash) => {
//           console.log("Transaction hash:", hash); // Log transaction hash
//           localStorage.setItem('pendingTransaction', hash); // Store in localStorage
//         });

//       // Check if receipt was successful
//       if (receipt && receipt.status) {
//         const productCount = await this.state.marketplace.methods.productCount().call();
//         const newProduct = await this.state.marketplace.methods.products(productCount).call();

//         const newPrice = price / 1e18;

//         // Save new product to the database using Axios
//         try {
//           await axios.post('http://localhost:5000/saveProduct', {
//             owner: this.state.email,
//             ownerId: this.state.account,
//             price: newPrice,
//             name: name,
//           });

//           console.log("Product saved successfully.");
//         } catch (error) {
//           console.error("Error saving product to the database:", error);
//         }

//         // Clear the transaction hash from localStorage
//         localStorage.removeItem('pendingTransaction');
//         if (this._isMounted) this.setState({ loading: false });
//       } else {
//         console.log("Transaction failed.");
//       }
//     } catch (error) {
//       console.error("Error creating product:", error);
//       this.setState({ loading: false });
//     }
//   }

//   async checkTransactionStatus(transactionHash) {
//     const web3 = window.web3;
//     this.setState({ loading: true });

//     const receipt = await web3.eth.getTransactionReceipt(transactionHash);
//     if (receipt && receipt.status) {
//       // Transaction completed successfully
//       const productCount = await this.state.marketplace.methods.productCount().call();
//       const newProduct = await this.state.marketplace.methods.products(productCount).call();

//       // Save new product to the database using Axios
//       try {
//         await axios.post('http://localhost:5000/saveProduct', {
//           owner: this.state.email,
//           ownerId: this.state.account,
//           price: newProduct.price / 1e18,
//           name: newProduct.name,
//         });

//         console.log("Product saved successfully.");
//       } catch (error) {
//         console.error("Error saving product to the database:", error);
//       }

//       // Clear the pending transaction from localStorage
//       localStorage.removeItem('pendingTransaction');
//       if (this._isMounted) this.setState({ loading: false });
//     } else {
//       // If transaction hasn't completed, retry after a delay
//       if (this._isMounted) {
//         setTimeout(() => this.checkTransactionStatus(transactionHash), 3000);
//       }
//     }
//   }

//   async purchaseProduct(id, price) {
//     this.setState({ loading: true });
//     try {
//       await this.state.marketplace.methods.purchaseProduct(id).send({
//         from: this.state.account,
//         value: price,
//       });

//       await fetch('http://localhost:5000/purchaseProduct', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           walletAddress: this.state.account,
//           email: this.state.email,
//         }),
//       });

//       const products = await this.fetchUserProducts(this.state.email);
//       this.setState({ products, loading: false });
//     } catch (error) {
//       console.error('Error purchasing product:', error);
//       this.setState({ loading: false });
//     }
//   }

//   fetchUserProducts = async (email) => {
//     const response = await fetch(`http://localhost:5000/addProducts?email=${email}`);
//     const data = await response.json();
//     return data;
//   };

//   render() {
//     return (
//       <div>
//         <Navbar account={this.state.account} />
//         <div className="container-fluid mt-5">
//           <div className="row">
//             <main role="main" className="col-lg-12 d-flex">
//               {this.state.loading ? (
//                 <div id="loader" className="text-center"><p className="text-center">Loading...</p></div>
//               ) : (
//                 <Main
//                   products={this.state.products}
//                   createProduct={this.createProduct}
//                   purchaseProduct={this.purchaseProduct}
//                 />
//               )}
//             </main>
//           </div>
//         </div>

//         {/* Popup for marketplace connection */}
//         {this.state.showPopup && (
//           <div className="popup">
//             <div className="popup-content">
//               <h4>Marketplace Connection Required</h4>
//               <p>The marketplace contract is not connected. Please connect to continue.</p>
//               <button onClick={this.connectToMarketplace}>Connect Marketplace</button>
//             </div>
//           </div>
//         )}
//       </div>
//     );
//   }
// }

// export default AddProducts;
