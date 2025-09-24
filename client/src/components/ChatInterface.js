import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Textarea,
  Spinner,
  makeStyles,
  tokens,
  Card,
  CardHeader,
  CardPreview,
  Text,
  Badge,
  Divider
} from '@fluentui/react-components';
import {
  SendRegular,
  BotRegular,
  PersonRegular,
  ToolboxRegular,
  CheckmarkCircleRegular,
  ErrorCircleRegular,
  ClockRegular
} from '@fluentui/react-icons';
import { format } from 'date-fns';
import AgentService from '../services/AgentService';
import MessageList from './MessageList';
import ToolResult from './ToolResult';

const useStyles = makeStyles({
  chatContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.colorNeutralBackground2
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1
  },
  inputContainer: {
    padding: '16px',
    backgroundColor: tokens.colorNeutralBackground1,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end'
  },
  inputField: {
    flex: 1
  },
  sendButton: {
    minWidth: '48px',
    height: '48px'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: '14px',
    color: tokens.colorNeutralForeground2
  },
  typingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  typingDot: {
    width: '6px',
    height: '6px',
    backgroundColor: tokens.colorNeutralForeground3,
    borderRadius: '50%',
    animation: 'typing 1.4s infinite ease-in-out'
  },
  '@keyframes typing': {
    '0%, 80%, 100%': {
      transform: 'scale(0)',
      opacity: 0.5
    },
    '40%': {
      transform: 'scale(1)',
      opacity: 1
    }
  }
});

function ChatInterface({ user, onError }) {
  const styles = useStyles();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      user: user
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setIsStreaming(true);
    setCurrentStatus('Thinking...');

    try {
      // Start streaming response
      const response = await AgentService.sendMessageStream(inputValue.trim(), user.id);
      
      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        toolResult: null,
        isStreaming: true
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              switch (data.type) {
                case 'chunk':
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.type === 'assistant') {
                      lastMessage.content += data.content;
                    }
                    return newMessages;
                  });
                  break;
                  
                case 'tool_invocation':
                  setCurrentStatus(`Invoking tool: ${data.tool}`);
                  break;
                  
                case 'tool_result':
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.type === 'assistant') {
                      lastMessage.toolResult = {
                        tool: data.tool,
                        result: data.result
                      };
                    }
                    return newMessages;
                  });
                  setCurrentStatus('Processing results...');
                  break;
                  
                case 'tool_error':
                  setCurrentStatus(`Tool error: ${data.error}`);
                  break;
                  
                case 'complete':
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.type === 'assistant') {
                      lastMessage.isStreaming = false;
                    }
                    return newMessages;
                  });
                  setCurrentStatus('');
                  break;
                  
                case 'error':
                  throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      onError('Failed to send message. Please try again.');
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setCurrentStatus('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStopGeneration = () => {
    setIsLoading(false);
    setIsStreaming(false);
    setCurrentStatus('');
    
    // Mark current message as stopped
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.type === 'assistant') {
        lastMessage.isStreaming = false;
        lastMessage.content += '\n\n[Generation stopped]';
      }
      return newMessages;
    });
  };

  return (
    <div className={styles.chatContainer}>
      {/* Messages */}
      <div className={styles.messagesContainer}>
        <MessageList messages={messages} />
        <div ref={messagesEndRef} />
      </div>

      {/* Status Indicator */}
      {(isLoading || currentStatus) && (
        <div className={styles.statusIndicator}>
          {isStreaming ? (
            <div className={styles.typingIndicator}>
              <div className={styles.typingDot} />
              <div className={styles.typingDot} />
              <div className={styles.typingDot} />
            </div>
          ) : (
            <Spinner size="tiny" />
          )}
          <span>{currentStatus || 'Processing...'}</span>
        </div>
      )}

      {/* Input */}
      <div className={styles.inputContainer}>
        <Textarea
          ref={inputRef}
          className={styles.inputField}
          placeholder="Ask me anything... I can help you with various tasks using available tools."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
          resize="vertical"
          rows={1}
        />
        {isLoading ? (
          <Button
            className={styles.sendButton}
            appearance="secondary"
            onClick={handleStopGeneration}
            icon={<ErrorCircleRegular />}
            title="Stop generation"
          />
        ) : (
          <Button
            className={styles.sendButton}
            appearance="primary"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            icon={<SendRegular />}
            title="Send message"
          />
        )}
      </div>
    </div>
  );
}

export default ChatInterface;
