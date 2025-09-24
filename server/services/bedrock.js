const { BedrockRuntimeClient } = require('@aws-sdk/client-bedrock-runtime');
const { Bedrock } = require('@langchain/aws');
const { ChatPromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');

let bedrockClient;
let langchainBedrock;

// Initialize AWS Bedrock
async function initializeBedrock() {
  try {
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not found in environment variables');
    }

    // Initialize Bedrock client
    bedrockClient = new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    // Initialize LangChain Bedrock
    langchainBedrock = new Bedrock({
      model: process.env.BEDROCK_MODEL || 'anthropic.claude-3-sonnet-20240229-v1:0',
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      },
      streaming: true,
      maxTokens: 4000,
      temperature: 0.7
    });

    console.log('✅ AWS Bedrock initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AWS Bedrock:', error);
    throw error;
  }
}

// Generate AI response with streaming
async function generateResponse(prompt, context = {}) {
  try {
    const systemPrompt = `You are an AI assistant integrated with Microsoft Teams. You have access to various tools through the MCP Gateway. 
    
    Your capabilities:
    - Answer questions and provide information
    - Execute tools based on user requests
    - Provide structured responses with tool results
    - Maintain conversation context
    
    Current context: ${JSON.stringify(context, null, 2)}
    
    Always be helpful, accurate, and professional. When using tools, explain what you're doing and present results clearly.`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', '{input}']
    ]);

    const outputParser = new StringOutputParser();
    
    const chain = RunnableSequence.from([
      chatPrompt,
      langchainBedrock,
      outputParser
    ]);

    return chain.stream({
      input: prompt
    });
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
}

// Generate response with tool selection
async function generateResponseWithTools(prompt, availableTools = [], context = {}) {
  try {
    const toolsDescription = availableTools.map(tool => 
      `- ${tool.name}: ${tool.description} (parameters: ${JSON.stringify(tool.parameters)})`
    ).join('\n');

    const systemPrompt = `You are an AI assistant with access to the following tools:
    
    ${toolsDescription}
    
    When a user makes a request, analyze if you need to use any tools to fulfill it. If so, respond with a JSON object containing:
    {
      "action": "use_tool",
      "tool": "tool_name",
      "parameters": {...}
    }
    
    If no tool is needed, respond normally with helpful information.
    
    Current context: ${JSON.stringify(context, null, 2)}`;

    const chatPrompt = ChatPromptTemplate.fromMessages([
      ['system', systemPrompt],
      ['human', '{input}']
    ]);

    const outputParser = new StringOutputParser();
    
    const chain = RunnableSequence.from([
      chatPrompt,
      langchainBedrock,
      outputParser
    ]);

    return chain.stream({
      input: prompt
    });
  } catch (error) {
    console.error('Error generating AI response with tools:', error);
    throw new Error('Failed to generate AI response with tools');
  }
}

// Parse tool selection from AI response
function parseToolSelection(response) {
  try {
    // Look for JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.action === 'use_tool') {
        return parsed;
      }
    }
    return null;
  } catch (error) {
    console.error('Error parsing tool selection:', error);
    return null;
  }
}

module.exports = {
  initializeBedrock,
  generateResponse,
  generateResponseWithTools,
  parseToolSelection,
  getBedrockClient: () => bedrockClient,
  getLangchainBedrock: () => langchainBedrock
};
