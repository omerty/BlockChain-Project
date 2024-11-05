import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); 
    const [showPassword, setShowPassword] = useState(false); 
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsLoading(true); // Set loading state
        console.log('Loggin-In:', { email, password });
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
                console.log(response.status);
                setMessage('Login-Failed.');
            }
        } catch (error) {
            console.error('Error:', error);
            setMessage('An error occurred. Please try again.');
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    return (
        <div className="container">
            <h2>Register</h2>
            <form onSubmit={handleLogin}>
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <input
                        type={showPassword ? 'text' : 'password'} // Toggle password visibility
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Loggin-In...' : 'Login'} {}
                </button>
            </form>
            {message && <p className="message">{message}</p>}
        </div>
    );
}

export default Login;
