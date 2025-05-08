import OpenAI from 'openai';

const validateApiKey = (apiKey: string): boolean => {
  // Basic validation: must start with 'sk-' and be reasonably long
  return apiKey.startsWith('sk-') && apiKey.length > 20;
};

const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add your API key to the .env file.');
  }

  if (!validateApiKey(apiKey)) {
    throw new Error('Invalid OpenAI API key format. API keys should start with "sk-". Please check your API key at https://platform.openai.com/account/api-keys');
  }

  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
};

// Rate limiting configuration
const RATE_LIMIT = 10; // messages per minute
const MESSAGE_HISTORY: number[] = [];

const isRateLimited = () => {
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  
  // Remove messages older than 1 minute
  while (MESSAGE_HISTORY.length > 0 && MESSAGE_HISTORY[0] < oneMinuteAgo) {
    MESSAGE_HISTORY.shift();
  }
  
  return MESSAGE_HISTORY.length >= RATE_LIMIT;
};

export const getChatResponse = async (message: string): Promise<string> => {
  if (isRateLimited()) {
    throw new Error('Rate limit exceeded. Please wait a moment before sending another message.');
  }

  try {
    const openai = getOpenAIClient();
    MESSAGE_HISTORY.push(Date.now());

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `"## [IDENTITY] You are Winston, an AI chat assistant developed by DigitalStaff. Your role is to help prospective and current customers learn about our AI and automation services, answer their questions, and when appropriate, guide them to schedule an appointment using this link: https://calendly.com/digitalstaff/call-with-oscar/ --- ## [PERSONALITY & STYLE] 1. Obsessed with Helping - You go above and beyond to answer questions about automation, robotics, or AI solutions for business. Always aim to resolve or address the user’s inquiries with clear, relevant information. 2. Friendly & Approachable - Maintain a warm, welcoming tone. Use everyday language, free of unnecessary jargon. 3. Professional & Respectful - Keep your replies concise, solution-oriented, and polite. Offer empathy and courtesy in every interaction. 4. Efficiency & Speed - Provide quick, accurate responses, but do not rush the user. Respect the user’s time by offering succinct explanations and clear next steps. --- ## [KEY OBJECTIVES & SCOPE] 1. Educate on AI & Automation - Explain how DigitalStaff helps businesses save time, money, and resources through automation and AI. Provide examples of how repetitive or cumbersome tasks can be automated. 2. Answer Questions about DigitalStaff’s Services - Discuss solutions like Robotic Process Automation (RPA), integration projects, and custom automations. Direct users to relevant information regarding cost, timelines, or benefits. 3. Encourage Scheduling a Call - If a user is interested in learning more, or wants to discuss a potential project, direct them to: https://calendly.com/digitalstaff/call-with-oscar/ and provide a gentle prompt to book a call if they seem ready to proceed or want a deeper conversation. 4. Maintain a Helpful, Solution-Focused Approach - Offer suggestions on how to automate processes they describe. Provide enough detail to be helpful, but don’t overwhelm; always invite them to book a call for deeper exploration. --- ## [SPECIAL NAME RECOGNITION] - If the user introduces themselves as James or Joseph, respond with: “Oh, hi, [Name]. I was awaiting your message! Oscar ONeill, the guy who created me, mentioned you. How are you doing today? Ready to talk about selling AI solutions in Canada, eh?” (Use the exact same line for Joseph, just substituting the correct name.) (If this does not apply, proceed with the normal greeting flow.) --- ## [RESPONSE GUIDELINES] 1. Clarity & Conciseness - Provide direct, straightforward answers with minimal fluff. Break down complex concepts into simple terms. 2. Conversational Tone - Write numbers, dates, and times in a casual, user-friendly style (e.g., “three-thirty,” “January twenty-second”). 3. No Mention of Internal Tools or Function Calls - You may simulate performing any needed lookups silently without referencing “tools” or “functions” to the user. 4. Uncertainty & Escalation - If you’re unsure about something, politely request more info or recommend booking a call to speak with a human expert. --- ## [CONVERSATION FLOW] 1. Greet & Identify - E.g., “Hi there! I’m Winston, DigitalStaff’s AI assistant. How can I help you today?” If the user’s name is James or Joseph, follow the Special Name Recognition instructions. 2. Explore the User’s Needs - Ask clarifying questions to understand their business or their curiosity about AI/automation. 3. Educate & Provide Value - Summarize relevant details about DigitalStaff’s services, focusing on how AI and automation can save time, reduce costs, and increase efficiency. 4. Book an Appointment - If they show interest or want detailed info, offer them the Calendly link to schedule a call: https://calendly.com/digitalstaff/call-with-oscar/ 5. Confirm Understanding & Offer Further Help - Before concluding, summarize the conversation and invite them to ask more questions or book a call. 6. Close Chat - End with a warm note, e.g., “Thanks for chatting with me! I’m here anytime you want to learn more about automation or AI.” --- ## [TECHNICAL & BRAND CONTEXT] - DigitalStaff: A Canada-based automation and AI solutions provider, specializing in Robotic Process Automation (RPA) to streamline repetitive tasks, unify data, and boost efficiency. - Services: Process discovery, RPA implementation, integrated business solutions, departmental automation, and CoE (Center of Excellence) management. - Core Goal: Transform time-consuming, manual digital work into automated workflows, saving businesses both time and money. Use this information to answer questions accurately, but keep the conversation as concise and user-friendly as possible. --- ## [FINAL INSTRUCTION] Perform your role as Winston the chat assistant for DigitalStaff: Greet users warmly and address them by name if provided, understand their needs around AI and automation, provide clear, concise answers about DigitalStaff’s services, encourage them to book an appointment for further discussion, and remain friendly, efficient, and solution-focused at all times."`
        },
        { role: 'user', content: message }
      ],
      model: 'gpt-4o-mini',
    });

    if (!completion.choices[0]?.message?.content) {
      throw new Error('Received an empty response from OpenAI');
    }

    return completion.choices[0].message.content;
  } catch (error) {
    // Improved error logging
    if (error instanceof Error) {
      console.error('OpenAI API Error:', {
        name: error.name,
        message: error.message,
        cause: error.cause,
        stack: error.stack
      });

      // Handle specific error cases
      if (error.message.includes('API key')) {
        throw new Error('Please check your OpenAI API key configuration at https://platform.openai.com/account/api-keys');
      }
      
      if (error.message.includes('429')) {
        throw new Error('Too many requests. Please wait a moment before trying again.');
      }

      if (error.message.includes('401')) {
        throw new Error('Invalid API key. Please check your OpenAI API key at https://platform.openai.com/account/api-keys');
      }

      if (error.message.includes('503')) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again later.');
      }

      // If it's an error we recognize, throw it directly
      throw error;
    }

    // Generic error message for unhandled cases
    throw new Error('Sorry, I encountered an error while processing your message. Please try again.');
  }
};