# AI Chat Widget Project

This project is a React application featuring an interactive chat widget with AI-powered responses using OpenAI's API. The chat widget integrates seamlessly into any web page and provides a responsive, animated interface for users to interact with an AI assistant.

## Features

- **Interactive Chat Widget**: Floating chat button that expands into a full chat interface
- **AI-Powered Responses**: Integration with OpenAI's GPT models
- **Animated UI**: Smooth transitions and animations using Framer Motion
- **Persistent Chat History**: Conversations are saved in the browser's local storage
- **Rate Limiting**: Prevents excessive API usage
- **Error Handling**: Robust error management for API issues
- **Responsive Design**: Works well on all device sizes
- **Clickable Links**: Automatically converts URLs in AI responses to clickable hyperlinks
- **Markdown Support**: Basic formatting of AI responses

## Prerequisites

- Node.js (v16 or newer)
- OpenAI API key (add to `.env` file)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Open your browser to the URL displayed in the terminal (typically http://localhost:5173)

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the project for production
- `npm run preview`: Preview the production build locally
- `npm run lint`: Run ESLint to check for code issues

## Project Structure

```
src/
├── components/
│   └── ChatWidget.tsx       # Main chat interface component
├── lib/
│   └── openai.ts            # OpenAI API integration
├── store/
│   └── chatStore.ts         # Zustand state management
├── types/
│   └── chat.ts              # TypeScript interfaces
├── App.tsx                  # Main application component
├── main.tsx                 # Application entry point
└── index.css                # Global styles (Tailwind)
```

## Key Dependencies

- **React**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library
- **Zustand**: State management
- **OpenAI**: AI model API
- **Lucide React**: Icon library
- **date-fns**: Date formatting
- **DOMPurify**: HTML sanitization for secure link rendering

## Chat Widget Implementation

The chat widget consists of several core components:

1. **UI Elements**:
   - Chat toggle button
   - Chat window with header, message area, and input field
   - Minimize/maximize and close buttons
   - Loading indicators

2. **State Management**:
   - Uses Zustand for global state
   - Tracks messages, open/closed state, minimized state
   - Persists chat history in localStorage

3. **API Integration**:
   - Communicates with OpenAI's API
   - Handles rate limiting
   - Manages API errors

4. **Hyperlink Processing**:
   - Detects URLs in AI responses
   - Converts them to clickable links
   - Sanitizes HTML content for security

## Customization

You can customize various aspects of the chat widget:

- Change the UI colors by modifying the Tailwind classes
- Update the system prompt in `openai.ts` to alter the AI's personality
- Modify the rate limits in `openai.ts`
- Change the animation settings in Framer Motion components

## License

This project is available for your use and modification.

## Troubleshooting

If you encounter issues with the OpenAI API:
1. Ensure your API key is correctly set in the `.env` file
2. Check that your API key has sufficient credits/quota
3. Verify that the API key format is correct (starts with "sk-")
4. Check the browser console for specific error messages