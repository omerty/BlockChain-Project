import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './style.css'; // Link to external CSS for styling
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGooglePlusG, faFacebookF, faGithub, faLinkedinIn } from '@fortawesome/free-brands-svg-icons';
import { GoogleLogin } from '@react-oauth/google'; // Import GoogleLogin component

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true);
        try {
            const response = await axios.post("http://localhost:5000/loginUser", {
                email,
                password,
            });

            if (response.status === 200) {
                localStorage.setItem('userEmail', email);
                setMessage('User Logged-In successfully!');
                navigate('/AddProducts');
            } else {
                setMessage('Login-Failed.');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async (response) => {
        try {
            // Send the token received from Google to your backend for verification
            const googleToken = response.credential;
            const res = await axios.post("http://localhost:5000/google-login", {
                token: googleToken
            });

            if (res.status === 200) {
                // Handle successful Google login, store user data, etc.
                localStorage.setItem('userEmail', res.data.email); 
                setMessage('User logged in via Google!');
                navigate('/AddProducts');
            } else {
                alert("Not Valid Account, Please Register!");
            }
        } catch (error) {
            alert("Not Valid Account, Please Register!");
        }
    };

    const toggleForm = () => {
        if (isSignUp) {
            navigate('/login'); // Navigate to login page when signing in
        } else {
            navigate('/register'); // Navigate to register page when signing up
        }
    };

    return (
        <div className="container" id="container">
            {isSignUp ? (
                <div className="form-container sign-up">
                    <form onSubmit={(e) => e.preventDefault()}>
                        <h1>Create Account</h1>
                        <div className="social-icons">
                            <GoogleLogin
                                onSuccess={handleGoogleLogin}
                                onError={() => setMessage('Google login failed.')}
                            />
                        </div>
                        <span>or use your email for registration</span>
                        <input type="text" placeholder="Name" />
                        <input type="email" placeholder="Email" />
                        <input type="password" placeholder="Password" />
                        <button type="submit">Sign Up</button>
                    </form>
                </div>
            ) : (
                <div className="form-container sign-in">
                    <form onSubmit={handleLogin}>
                        <h1>Sign In</h1>
                        <div className="social-icons">
                            <GoogleLogin
                                onSuccess={handleGoogleLogin}
                                onError={() => setMessage('Google login failed.')}
                            />
                        </div>
                        <span>or use your email password</span>
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
                        <a href="#">Forget Your Password?</a>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Logging In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            )}

            <div className="toggle-container">
                <div className="toggle">
                    <div className={`toggle-panel ${isSignUp ? 'toggle-left' : 'toggle-right'}`}>
                        <h1>{isSignUp ? 'Welcome Back!' : 'Hello, Friend!'}</h1>
                        <p>{isSignUp ? 'Enter your personal details to use all of site features' : 'Register with your personal details to use all of site features'}</p>
                        <button onClick={toggleForm} className="hidden">
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </div>
            </div>
            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default Login;
