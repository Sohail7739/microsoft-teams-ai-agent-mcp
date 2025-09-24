import React, { useState, useEffect } from 'react';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Text,
  Card,
  CardHeader,
  CardPreview,
  Badge,
  Divider,
  Spinner,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem
} from '@fluentui/react-components';
import {
  DismissRegular,
  SearchRegular,
  FilterRegular,
  CalendarRegular,
  ClockRegular,
  PersonRegular,
  BotRegular,
  ToolboxRegular
} from '@fluentui/react-icons';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';
import AgentService from '../services/AgentService';

const useStyles = makeStyles({
  sidePanel: {
    width: '320px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderLeft: `1px solid ${tokens.colorNeutralStroke2}`,
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  header: {
    padding: '16px',
    borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px'
  },
  searchContainer: {
    marginBottom: '16px',
    display: 'flex',
    gap: '8px'
  },
  searchInput: {
    flex: 1
  },
  filterContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap'
  },
  historyItem: {
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: tokens.colorNeutralBackground1
    }
  },
  historyItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    borderColor: tokens.colorBrandStroke1
  },
  historyItemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  historyItemPreview: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground2,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '4px'
  },
  historyItemTimestamp: {
    fontSize: '12px',
    color: tokens.colorNeutralForeground3
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px',
    textAlign: 'center',
    color: tokens.colorNeutralForeground3
  },
  loadingState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '200px'
  }
});

function SidePanel({ user, onClose }) {
  const styles = useStyles();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [user]);

  useEffect(() => {
    filterHistory();
  }, [history, searchQuery, timeFilter]);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const response = await AgentService.getHistory(user.id);
      if (response.success) {
        setHistory(response.history);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.userMessage?.toLowerCase().includes(query) ||
        item.assistantMessage?.toLowerCase().includes(query) ||
        item.toolUsed?.toLowerCase().includes(query)
      );
    }

    // Apply time filter
    const now = new Date();
    filtered = filtered.filter(item => {
      const itemDate = new Date(item.timestamp);
      switch (timeFilter) {
        case 'today':
          return isToday(itemDate);
        case 'week':
          return isThisWeek(itemDate);
        case 'month':
          return isThisMonth(itemDate);
        default:
          return true;
      }
    });

    setFilteredHistory(filtered);
  };

  const handleItemClick = (item) => {
    setSelectedItem(item);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isThisWeek(date)) {
      return format(date, 'EEE HH:mm');
    } else {
      return format(date, 'MMM dd');
    }
  };

  const getTimeFilterLabel = (filter) => {
    switch (filter) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return 'All Time';
    }
  };

  if (isLoading) {
    return (
      <div className={styles.sidePanel}>
        <div className={styles.header}>
          <Text weight="semibold">Chat History</Text>
          <Button
            icon={<DismissRegular />}
            appearance="subtle"
            onClick={onClose}
          />
        </div>
        <div className={styles.loadingState}>
          <Spinner size="medium" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.sidePanel}>
      {/* Header */}
      <div className={styles.header}>
        <Text weight="semibold">Chat History</Text>
        <Button
          icon={<DismissRegular />}
          appearance="subtle"
          onClick={onClose}
        />
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Search */}
        <div className={styles.searchContainer}>
          <Input
            className={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            contentBefore={<SearchRegular />}
          />
        </div>

        {/* Time Filter */}
        <div className={styles.filterContainer}>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Button
                appearance="subtle"
                icon={<FilterRegular />}
                iconPosition="after"
              >
                {getTimeFilterLabel(timeFilter)}
              </Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => setTimeFilter('all')}>All Time</MenuItem>
                <MenuItem onClick={() => setTimeFilter('today')}>Today</MenuItem>
                <MenuItem onClick={() => setTimeFilter('week')}>This Week</MenuItem>
                <MenuItem onClick={() => setTimeFilter('month')}>This Month</MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
          <div className={styles.emptyState}>
            <ClockRegular fontSize={48} />
            <Text size={300} style={{ marginTop: '16px' }}>
              {searchQuery ? 'No conversations found' : 'No chat history yet'}
            </Text>
            <Text size={200} style={{ marginTop: '8px' }}>
              {searchQuery ? 'Try adjusting your search' : 'Start a conversation to see history here'}
            </Text>
          </div>
        ) : (
          <div>
            {filteredHistory.map((item, index) => (
              <Card
                key={index}
                className={`${styles.historyItem} ${
                  selectedItem === item ? styles.historyItemSelected : ''
                }`}
                onClick={() => handleItemClick(item)}
              >
                <CardHeader
                  header={
                    <div className={styles.historyItemHeader}>
                      <Text weight="semibold" size={300}>
                        {formatTimestamp(item.timestamp)}
                      </Text>
                      {item.toolUsed && (
                        <Badge appearance="filled" color="success" icon={<ToolboxRegular />}>
                          Tool Used
                        </Badge>
                      )}
                    </div>
                  }
                />
                <CardPreview>
                  <div className={styles.historyItemPreview}>
                    <Text size={300} weight="semibold" style={{ display: 'block', marginBottom: '4px' }}>
                      You: {item.userMessage}
                    </Text>
                    <Text size={200}>
                      AI: {item.assistantMessage}
                    </Text>
                  </div>
                  <div className={styles.historyItemTimestamp}>
                    {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                  </div>
                </CardPreview>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SidePanel;
