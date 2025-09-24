# User Guide

## Getting Started

### What is the Teams AI Agent?

The Microsoft Teams AI Agent is an intelligent assistant that can help you with various tasks using advanced AI capabilities and integrated tools. It's designed to work seamlessly within Microsoft Teams, providing a natural conversational experience.

### Key Features

- **🤖 AI-Powered Conversations**: Chat with an intelligent AI assistant powered by AWS Bedrock
- **🛠️ Tool Integration**: Access various tools and services through the MCP Gateway
- **📱 Teams Integration**: Native Microsoft Teams experience with SSO authentication
- **💬 Chat History**: Keep track of your conversations with search and filtering
- **⚡ Real-time Responses**: Streaming responses for a ChatGPT-like experience
- **🔒 Secure**: Enterprise-grade security with Azure AD authentication

## First Time Setup

### 1. Access the App

1. **Open Microsoft Teams**
2. **Navigate to Apps** in the left sidebar
3. **Search for "AI Agent"** or find it in your organization's apps
4. **Click "Add"** to install the app
5. **Grant permissions** when prompted

### 2. Sign In

The app will automatically sign you in using your Microsoft 365 credentials. No additional setup is required!

### 3. Start Chatting

Once signed in, you can immediately start chatting with the AI agent. Try asking:
- "What can you help me with?"
- "Show me the available tools"
- "Help me with a task"

## Using the Chat Interface

### Sending Messages

1. **Type your message** in the input box at the bottom
2. **Press Enter** or click the Send button
3. **Wait for the AI response** - you'll see a typing indicator
4. **View the response** as it streams in real-time

### Message Types

#### User Messages
- Your messages appear on the right side
- They're clearly labeled with your name
- Timestamps show when you sent them

#### AI Responses
- AI responses appear on the left side
- They include the AI agent's name
- Tool usage is indicated with badges
- Results are displayed in structured format

### Tool Execution

When the AI agent uses a tool:
1. **Tool invocation** is shown in the status bar
2. **Tool results** are displayed in collapsible cards
3. **Success/error indicators** show the outcome
4. **Detailed results** can be viewed by expanding the cards

## Chat History

### Accessing History

1. **Click the History button** (clock icon) in the top-right corner
2. **Browse your conversations** in the side panel
3. **Search conversations** using the search box
4. **Filter by time** using the filter dropdown

### History Features

#### Search
- **Search by keywords** in your messages or AI responses
- **Search by tool names** to find tool-related conversations
- **Case-insensitive search** for easy finding

#### Filtering
- **Today**: Conversations from today
- **This Week**: Conversations from this week
- **This Month**: Conversations from this month
- **All Time**: All conversations

#### Conversation Details
- **Click any conversation** to view full details
- **See tool usage** with success/error indicators
- **View timestamps** for each message
- **Copy results** from tool executions

## Available Tools

The AI agent has access to various tools through the MCP Gateway. These tools can help you with:

### Common Tasks
- **Data Analysis**: Process and analyze data
- **File Operations**: Work with files and documents
- **API Integrations**: Connect to external services
- **Automation**: Automate repetitive tasks

### Tool Categories
- **Productivity**: Tools to improve your workflow
- **Data**: Tools for data processing and analysis
- **Communication**: Tools for team collaboration
- **Development**: Tools for software development

### Using Tools

1. **Ask the AI** what tools are available
2. **Describe your task** in natural language
3. **The AI will select** the appropriate tool
4. **Provide parameters** if needed
5. **View results** in the chat interface

## Tips and Best Practices

### Getting Better Results

#### Be Specific
- **Describe your task clearly** with specific requirements
- **Provide context** when asking questions
- **Include relevant details** for better tool selection

#### Use Natural Language
- **Ask questions naturally** as you would to a human
- **Use follow-up questions** to refine results
- **Provide feedback** on tool results

#### Leverage History
- **Reference previous conversations** for context
- **Use search** to find related discussions
- **Build on previous work** for complex tasks

### Common Use Cases

#### Data Analysis
```
You: "Analyze the sales data from last quarter"
AI: I'll help you analyze the sales data. Let me use the data analysis tool...
[Tool execution with results]
```

#### File Processing
```
You: "Convert this CSV file to Excel format"
AI: I'll convert your CSV file to Excel format using the file conversion tool...
[Tool execution with download link]
```

#### API Integration
```
You: "Get the latest weather data for New York"
AI: I'll fetch the current weather data for New York using the weather API...
[Tool execution with weather data]
```

## Troubleshooting

### Common Issues

#### Authentication Problems
- **Refresh the page** if you see authentication errors
- **Check with your IT admin** if you can't access the app
- **Verify your Microsoft 365 account** is active

#### Slow Responses
- **Check your internet connection**
- **Wait for the response** to complete streaming
- **Try a simpler question** if the response is too complex

#### Tool Execution Errors
- **Check the error message** in the tool result card
- **Try rephrasing your request** with different parameters
- **Contact support** if the issue persists

#### Chat History Issues
- **Refresh the page** to reload history
- **Check your internet connection**
- **Clear browser cache** if problems persist

### Getting Help

#### In-App Help
- **Click the Settings button** for app configuration
- **Check the status indicators** for system health
- **Review error messages** for specific issues

#### Contact Support
- **IT Support**: Contact your organization's IT support
- **Admin Help**: Reach out to your Teams administrator
- **Documentation**: Check the technical documentation

## Privacy and Security

### Data Protection
- **Your conversations** are stored securely
- **Only you** can see your chat history
- **Data is encrypted** in transit and at rest
- **No data sharing** with third parties

### Authentication
- **Microsoft 365 SSO** for secure access
- **Tenant isolation** ensures data privacy
- **Token-based authentication** for API calls
- **Automatic session management**

### Compliance
- **Enterprise security** standards
- **GDPR compliance** for data protection
- **SOC 2** security controls
- **Regular security audits**

## Advanced Features

### Keyboard Shortcuts
- **Enter**: Send message
- **Shift + Enter**: New line in message
- **Ctrl + K**: Focus search (in history panel)
- **Escape**: Close side panels

### Customization
- **Theme**: Follows your Teams theme
- **Language**: Supports multiple languages
- **Notifications**: Configurable notification settings

### Integration
- **Teams Integration**: Native Teams experience
- **Office 365**: Seamless integration with Office apps
- **SharePoint**: Access to organizational content
- **OneDrive**: File sharing and collaboration

## Best Practices

### For Users
1. **Be clear and specific** in your requests
2. **Use the chat history** to build on previous work
3. **Provide feedback** on tool results
4. **Keep conversations organized** with clear topics

### For Administrators
1. **Monitor usage** through Teams admin center
2. **Configure permissions** appropriately
3. **Set up monitoring** for system health
4. **Provide user training** on best practices

### For Developers
1. **Follow security guidelines** for tool development
2. **Test tools thoroughly** before deployment
3. **Document tool capabilities** clearly
4. **Monitor tool performance** and usage

## Frequently Asked Questions

### Q: How do I access the AI Agent?
A: The AI Agent is available as a tab in Microsoft Teams. Look for it in your apps or ask your administrator to install it.

### Q: Is my data secure?
A: Yes, all data is encrypted and stored securely. Only you can access your chat history, and all communications are protected.

### Q: Can I use tools with the AI Agent?
A: Yes, the AI Agent has access to various tools through the MCP Gateway. Ask the AI what tools are available or describe your task.

### Q: How do I search my chat history?
A: Click the History button in the top-right corner, then use the search box to find specific conversations.

### Q: What if a tool doesn't work?
A: Check the error message in the tool result card. Try rephrasing your request or contact support if the issue persists.

### Q: Can I share conversations with others?
A: Currently, conversations are private to each user. Contact your administrator if you need collaboration features.

### Q: How do I get help?
A: Use the in-app help features, contact your IT support, or check the documentation for more information.

## Support and Resources

### Getting Help
- **In-App Help**: Use the help features within the app
- **IT Support**: Contact your organization's IT support team
- **Documentation**: Check the technical documentation
- **Training**: Attend user training sessions

### Resources
- **User Guide**: This comprehensive guide
- **Video Tutorials**: Step-by-step video instructions
- **Best Practices**: Tips for getting the most out of the app
- **Troubleshooting**: Common issues and solutions

### Feedback
- **Feature Requests**: Suggest new features or improvements
- **Bug Reports**: Report issues or problems
- **User Experience**: Share feedback on the user interface
- **Training Needs**: Request additional training or documentation
