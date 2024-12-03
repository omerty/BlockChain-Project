// ChatRoom.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ChatRoom = ({ buyerAccount, sellerAccount }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch messages for the specific product/chat
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/messages/${buyerAccount}/${sellerAccount}`);
        setMessages(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); 
    return () => clearInterval(interval);
    
  }, [buyerAccount, sellerAccount]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!newMessage) return;

    try {
      const messageData = {
        sender: buyerAccount,
        receiver: sellerAccount,
        message: newMessage,
      };

      await axios.post('http://localhost:5000/api/messages', messageData);
      setMessages([...messages, messageData]); // Update messages
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', marginBottom: '20px' }}>
      <h3>Chat with {sellerAccount}</h3>
      {loading ? (
        <div>Loading messages...</div>
      ) : (
        <div style={{ marginBottom: '10px', maxHeight: '300px', overflowY: 'scroll' }}>
          {messages.map((msg, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <strong>{msg.sender}:</strong> {msg.message}
            </div>
          ))}
        </div>
      )}
      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        style={{ padding: '10px', width: '80%' }}
        placeholder="Type your message..."
      />
      <button
        onClick={handleSendMessage}
        style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}
      >
        Send
      </button>
    </div>
  );
};

export default ChatRoom;
