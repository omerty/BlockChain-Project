import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './Register';
import AddProducts from './AddProducts';
import Login from './Login';
import ProductPage from './buyProducts';
import SpecificProduct from './specificProduct';
import { GoogleOAuthProvider } from '@react-oauth/google';


function App() {
    return (
        <GoogleOAuthProvider clientId="914908438061-rsoo3512p3b0nngm4lh8tjo7dn3sbbkk.apps.googleusercontent.com">
            <Router>
                <Routes>
                    <Route path="/register" element={<Register />} />
                    <Route path="/AddProducts" element={<AddProducts />} />
                    <Route path="/Login" element={<Login />} />
                    <Route path="/" element={<Login />} />
                    <Route path="/products/:productId" element={<SpecificProduct />} />
                    <Route path="/BuyProducts" element={<ProductPage />} />
                </Routes>
            </Router>
        </GoogleOAuthProvider>
    );
}

export default App;
