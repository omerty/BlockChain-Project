import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './style.css';
import { GoogleLogin } from '@react-oauth/google'; // Import GoogleLogin component

function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isSignUp, setIsSignUp] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/registerUser", {
                email,
                password,
            });

            if (response.status === 201) {
                localStorage.setItem('userEmail', email);
                setMessage('User registered successfully!');
                setShowModal(true);
                navigate('/AddProducts');
            } else {
                setMessage('User registration failed.');
                setShowModal(true);
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
            setShowModal(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async (response) => {
        console.log('Google login response:', response);

        // Send the Google token to your backend for validation
        try {
            const res = await axios.post('http://localhost:5000/googleSignup', {
                token: response.credential,
            });

            if (res.status === 201) {
                localStorage.setItem('userEmail', res.data.email);
                setMessage('User registered with Google!');
                setShowModal(true);
                navigate('/AddProducts');
            } else {
                setMessage('Google sign-up failed.');
                setShowModal(true);
            }
        } catch (error) {
            setMessage('An error occurred with Google sign-up.');
            setShowModal(true);
        }
    };

    const toggleForm = () => {
        setIsSignUp(!isSignUp);
        if (isSignUp) {
            navigate('/login');
        } else {
            navigate('/register');
        }
    };

    const closeModal = () => {
        setShowModal(false);
    };

    return (
        <div className="container" id="register-container">
            <div className="form-container sign-up">
                <form onSubmit={handleRegister}>
                    <h1>Create Account</h1>
                    <span>or use your email for registration</span>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? 'Hide' : 'Show'}
                    </button>

                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Registering...' : 'Sign Up'}
                    </button>

                    {/* Google Sign Up Button */}
                    <div className="google-signup">
                        <GoogleLogin 
                            onSuccess={handleGoogleSignUp} 
                            onError={() => setMessage('Google Sign Up failed')}
                        />
                    </div>
                </form>
            </div>

            <div className="toggle-container">
                <div className="toggle">
                    <div className={`toggle-panel ${isSignUp ? 'toggle-right' : 'toggle-left'}`}>
                        <h1>{isSignUp ? 'Welcome Back!' : 'Hello, Friend!'}</h1>
                        <p>{isSignUp ? 'To keep connected with us please login with your personal info' : 'Enter your personal details and start journey with us'}</p>
                        <button onClick={toggleForm} className="hidden">
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Component */}
            {/* {showModal && <Modal message={message} onClose={closeModal} />} */}
        </div>
    );
}

export default Register;
