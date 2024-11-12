import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Register from './Register';
import AddProducts from './AddProducts';
import Login from './Login';
import ProductPage from './buyProducts';
import SpecificProduct from './specificProduct';

function App() {
    return (
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
    );
}

export default App;
