// src/components/TranslatedMessage.jsx
import React, { useState, useEffect } from 'react';
import { MessageText, useMessageContext } from 'stream-chat-react';

export const TranslatedMessage = ({ userLanguage, onDelete }) => {
  const { message } = useMessageContext();
  const [translatedText, setTranslatedText] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (message) {
      console.log('Translation attempt:', {
        messageId: message.id,
        currentLanguage: userLanguage,
        availableTranslations: message.translations,
        messageText: message.text
      });

      // Try different translation fields in order of preference
      const translation = 
        message.translations?.[userLanguage] ||
        message[`text_${userLanguage}`] ||
        message[`translated_${userLanguage}`];
      
      if (translation) {
        console.log('Translation found:', translation);
        setTranslatedText(translation);
      } else {
        console.log('No translation available for:', userLanguage);
        setTranslatedText(message.text); // Fallback to original text
      }
    }
  }, [message, userLanguage]);

  // Create modified message with translated text
  const modifiedMessage = {
    ...message,
    text: translatedText || message.text,
  };

  const handleDelete = async () => {
    if (!onDelete || isDeleting) return;
    try {
      setIsDeleting(true);
      await onDelete(message.id);
    } catch (error) {
      console.error('Failed to delete message:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="str-chat__message-translation-wrapper">
      <div className="message-content">
        <MessageText message={modifiedMessage} />
        <button 
          className="delete-message-btn"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete message"
        >
          {isDeleting ? '...' : '🗑️'}
        </button>
      </div>
    </div>
  );
};