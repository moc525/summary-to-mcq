import React, { useState, useEffect } from 'react';
import useOpenaiApi from './hooks/openaiApi'; // Import the custom hook
import InputBox from './components/InputBox'; // Import the new component

function App() {
  const { response, summarizeParaToMcq } = useOpenaiApi(); // Use the custom hook
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [alertVisible, setAlertVisible] = useState(false); // State for alert visibility
  const [alertMessage, setAlertMessage] = useState(''); // State for alert message

  const successMessage = 'MCQs inserted into the DB!';

  const handleSummarize = async (input) => {
    setLoading(true); // Start loading
    await summarizeParaToMcq(input); // Call the summarize method with the input value
    setLoading(false); // End loading after response is received

    setAlertMessage(response); // Set the alert message to the response
    setAlertVisible(true);

    console.log(`response: ${response}`);
    
    const timer = setTimeout(() => {
      setAlertVisible(false); // Hide the alert after 3 seconds
    }, 3000);

    return () => clearTimeout(timer); // Cleanup timer on unmount or when response changes
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-400 to-blue-500 text-white overflow-hidden"> {/* Prevent page scroll */}

      {(alertVisible && (alertMessage == successMessage)) && (
        <div className="fixed top-0 left-0 right-0 bg-green-500 text-white text-center p-4">
          {alertMessage}
        </div>
      )}

      {(alertVisible && (alertMessage != successMessage)) && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white text-center p-4">
          {alertMessage}
        </div>
      )}

      <div className="flex flex-col items-center justify-center flex-grow">
        <h1 className="text-5xl font-bold mb-2 text-white">Text to MCQ Generator</h1>
        <p className="text-lg mb-4 text-gray-200">Transform your paragraphs into multiple-choice questions!</p>

        {!loading && (
          <InputBox onSummarize={handleSummarize} />
        )}

        {loading && (
          <h1 className="text-3xl font-bold mb-2 text-gray-600">Loading results... Please wait!</h1>
        )}

      </div>

      <footer className="mt-4 text-center">
        <p>
          Made with <span className="text-red-500">❤️</span> by the <a href="https://www.aorysoft.com" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-600 hover:text-slate-800">Aorians</a>
        </p>
      </footer>
    </div>
  );
}

export default App;
