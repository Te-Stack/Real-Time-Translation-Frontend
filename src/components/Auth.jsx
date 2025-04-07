import { useState } from 'react';

export function Auth({ onLogin, error, onError }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [language, setLanguage] = useState('en');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const endpoint = isLogin ? 'login' : 'signup';
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username,
          language 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || (isLogin ? 'Login failed' : 'Signup failed'));
      }

      // Pass the user data, token, and channel info to parent component
      onLogin({
        user: data.user,
        token: data.token,
        apiKey: data.apiKey,
        defaultChannel: data.defaultChannel
      });
    } catch (err) {
      console.error(isLogin ? 'Login error:' : 'Signup error:', err);
      // If you have an error handling prop, you might want to call it here
      if (typeof onError === 'function') {
        onError(err.message);
      }
    }
  };

  return (
    <div className="auth-form">
      <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="language">Preferred Language</label>
          <select
            id="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            {/* Add more language options as needed */}
          </select>
        </div>
        <button type="submit" className="auth-button">
          {isLogin ? 'Login' : 'Sign Up'}
        </button>
      </form>
      <button 
        className="toggle-auth-button"
        onClick={() => setIsLogin(!isLogin)}
      >
        {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
      </button>
    </div>
  );
}