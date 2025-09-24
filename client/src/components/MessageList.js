import React from 'react';
import {
  makeStyles,
  tokens,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Badge,
  Avatar,
  Divider
} from '@fluentui/react-components';
import {
  PersonRegular,
  BotRegular,
  ErrorCircleRegular,
  ToolboxRegular,
  CheckmarkCircleRegular,
  ClockRegular
} from '@fluentui/react-icons';
import { format } from 'date-fns';
import ToolResult from './ToolResult';

const useStyles = makeStyles({
  messageContainer: {
    marginBottom: '16px',
    display: 'flex',
    flexDirection: 'column'
  },
  userMessage: {
    alignItems: 'flex-end'
  },
  assistantMessage: {
    alignItems: 'flex-start'
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '18px',
    wordWrap: 'break-word',
    position: 'relative'
  },
  userBubble: {
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    borderBottomRightRadius: '4px'
  },
  assistantBubble: {
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground1,
    borderBottomLeftRadius: '4px',
    border: `1px solid ${tokens.colorNeutralStroke2}`
  },
  errorBubble: {
    backgroundColor: tokens.colorPaletteRedBackground2,
    color: tokens.colorPaletteRedForeground2,
    border: `1px solid ${tokens.colorPaletteRedBorder1}`
  },
  messageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px'
  },
  messageContent: {
    lineHeight: '1.4',
    whiteSpace: 'pre-wrap'
  },
  messageTimestamp: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3,
    marginTop: '4px',
    padding: '0 8px'
  },
  streamingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '8px',
    fontSize: '12px',
    color: tokens.colorNeutralForeground3'
  },
  typingDot: {
    width: '4px',
    height: '4px',
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

function MessageList({ messages }) {
  const styles = useStyles();

  const getMessageIcon = (message) => {
    switch (message.type) {
      case 'user':
        return <PersonRegular />;
      case 'assistant':
        return <BotRegular />;
      case 'error':
        return <ErrorCircleRegular />;
      default:
        return <BotRegular />;
    }
  };

  const getMessageStyle = (message) => {
    switch (message.type) {
      case 'user':
        return styles.userMessage;
      case 'assistant':
        return styles.assistantMessage;
      case 'error':
        return styles.assistantMessage;
      default:
        return styles.assistantMessage;
    }
  };

  const getBubbleStyle = (message) => {
    switch (message.type) {
      case 'user':
        return styles.userBubble;
      case 'assistant':
        return styles.assistantBubble;
      case 'error':
        return styles.errorBubble;
      default:
        return styles.assistantBubble;
    }
  };

  const formatTimestamp = (timestamp) => {
    if (timestamp instanceof Date) {
      return format(timestamp, 'HH:mm');
    }
    return format(new Date(timestamp), 'HH:mm');
  };

  if (messages.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        textAlign: 'center',
        padding: '32px',
        color: tokens.colorNeutralForeground3
      }}>
        <BotRegular fontSize={48} />
        <Text size={500} weight="semibold" style={{ marginTop: '16px' }}>
          Welcome to AI Agent
        </Text>
        <Text size={300} style={{ marginTop: '8px' }}>
          I can help you with various tasks using available tools. Try asking me something!
        </Text>
      </div>
    );
  }

  return (
    <div>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`${styles.messageContainer} ${getMessageStyle(message)}`}
        >
          <div className={`${styles.messageBubble} ${getBubbleStyle(message)}`}>
            {/* Message Header */}
            <div className={styles.messageHeader}>
              {getMessageIcon(message)}
              <Text size={300} weight="semibold">
                {message.type === 'user' ? (message.user?.name || 'You') : 'AI Agent'}
              </Text>
              {message.type === 'assistant' && message.toolResult && (
                <Badge appearance="filled" color="success" icon={<ToolboxRegular />}>
                  Tool Used
                </Badge>
              )}
            </div>

            {/* Message Content */}
            <div className={styles.messageContent}>
              {message.content}
            </div>

            {/* Streaming Indicator */}
            {message.isStreaming && (
              <div className={styles.streamingIndicator}>
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
                <div className={styles.typingDot} />
                <span>AI is typing...</span>
              </div>
            )}

            {/* Tool Result */}
            {message.toolResult && (
              <ToolResult toolResult={message.toolResult} />
            )}

            {/* Timestamp */}
            <div className={styles.messageTimestamp}>
              {formatTimestamp(message.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MessageList;
