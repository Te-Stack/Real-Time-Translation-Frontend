// src/App.jsx
import React, { useState, useEffect } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Thread,
  Window
} from 'stream-chat-react';
import './App.css';
import { LanguageSelector } from './components/LanguageSelector';
import { TranslatedMessage } from './components/TranslatedMessages';
import { Auth } from './components/Auth'; // You'll need to create this

// Get API key from environment variable
const API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Create the client outside of component to prevent recreating it on renders
const chatClient = StreamChat.getInstance(API_KEY);

function App() {
  const [channel, setChannel] = useState(null);
  const [user, setUser] = useState(null);
  const [userLanguage, setUserLanguage] = useState('en');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [clientReady, setClientReady] = useState(false);

  const handleLogin = async (data) => {
    try {
      setIsConnecting(true);
      
      const { user, token, apiKey } = data;
  
      // Initialize Stream Chat client
      const chatClient = StreamChat.getInstance(apiKey);
  
      // Connect user to Stream Chat
      await chatClient.connectUser(
        {
          id: user.id,
          name: user.name,
          language: user.language,
        },
        token
      );
  
      // Create or join default channel
      const channelName = 'translation-demo';
      const channel = chatClient.channel('messaging', channelName, {
        name: 'Translation Demo Channel',
        members: [user.id],
      });
  
      await channel.watch();
      
      setChannel(channel);
      setUser(user);
      setUserLanguage(user.language);
      setClientReady(true);
      setError(null);
    } catch (error) {
      console.error('Login error:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (chatClient) {
        await chatClient.disconnectUser();
        setChannel(null);
        setUser(null);
        setClientReady(false);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chatClient.userID) {
        chatClient.disconnectUser();
      }
    };
  }, []);

  const handleLanguageChange = async (language) => {
    if (user) {
      try {
        setIsConnecting(true);
        console.log('Requesting translation to:', language);

        const channelMessages = channel.state.messages || [];
        console.log('Messages to translate:', channelMessages.length);

        // Send all messages for translation, even when target is English
        const response = await fetch(`${BACKEND_URL}/set-language`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify({
            userId: user.id,
            language,
            channelId: channel.id,
            messages: channelMessages.map(msg => ({
              id: msg.id,
              text: msg.text,
              // Always send source language for better translation
              language: msg.language || detectLanguage(msg.text)
            }))
          }),
        });

        const result = await response.json();
        console.log('Backend response:', result);

        if (!response.ok) {
          throw new Error(`Backend error: ${result.error || response.statusText}`);
        }

        // Process translations regardless of target language
        if (result.translations && Object.keys(result.translations).length > 0) {
          for (const [messageId, translation] of Object.entries(result.translations)) {
            if (translation && translation.trim()) {
              await channel.updateMessage({
                id: messageId,
                translations: {
                  [language]: translation
                }
              });
            }
          }
        }

        setUserLanguage(language);
        await channel.watch();
      } catch (error) {
        console.error('Translation error:', error);
        setError(`Failed to change language: ${error.message}`);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  // Helper function to detect language (basic implementation)
  const detectLanguage = (text) => {
    if (!text) return 'en';
    
    
    // Add more language detection logic if needed
    return 'en';
  };

  // Add message deletion handler
  const handleMessageDelete = async (messageId) => {
    try {
      if (!channel || !user) return;

      const response = await fetch(`${BACKEND_URL}/delete-messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          channelId: channel.id,
          channelType: 'messaging',
          messageIds: [messageId],
          userId: user.id
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete message');
      }

      // Refresh channel to update messages
      await channel.watch();
    } catch (error) {
      console.error('Delete message error:', error);
      setError('Failed to delete message. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="auth-container">
        <Auth onLogin={handleLogin} error={error} />
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="loading-container">
        <div className="loading-indicator">Connecting to chat...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Real-Time Translation Chat</h1>
        <div className="language-control">
          <LanguageSelector
            currentLanguage={userLanguage}
            onChange={handleLanguageChange}
          />
        </div>
        <div className="user-controls">
          <div className="user-info">Connected as: {user.name}</div>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
      
      {channel && (
        <div className="chat-container">
          <Chat client={chatClient} theme="messaging light">
            <Channel channel={channel}>
              <Window>
                <ChannelHeader />
                <MessageList
                  Message={(messageProps) => (
                    <TranslatedMessage
                      {...messageProps}
                      userLanguage={userLanguage}
                      onDelete={handleMessageDelete}
                    />
                  )}
                />
                <MessageInput />
              </Window>
              <Thread />
            </Channel>
          </Chat>
        </div>
      )}
    </div>
  );
}

export default App;