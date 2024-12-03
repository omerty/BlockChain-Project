import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import Web3 from 'web3';
import Marketplace from '../abis/Marketplace.json';
import MarketplaceAddress from '../abis/Marketplace-address.json';
import ChatRoom from './ChatRoom';

const ChatPopup = ({ buyerEmail, sellerEmail }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <div>
      <button
        onClick={toggleChat}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '50%',
          fontSize: '20px',
          cursor: 'pointer',
        }}
      >
        💬
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '60px',
            right: '20px',
            width: '300px',
            height: '400px',
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '10px',
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
            <ChatRoom buyerAccount={buyerEmail} sellerAccount={sellerEmail} />
          </div>
          <button
            onClick={toggleChat}
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: 'red',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
          >
            ✖
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatPopup;
