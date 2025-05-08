import React from 'react';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Our Website</h1>
        <p className="text-gray-600">Click the chat button in the bottom right corner to get started!</p>
      </div>
      <ChatWidget />
    </div>
  );
}

export default App;