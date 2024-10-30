import React, { useState } from 'react';

const InputBox = ({ onSummarize }) => {
    const [inputValue, setInputValue] = useState('');
    const maxLength = 1024;

    const handleInputChange = (event) => {
        if (event.target.value.length <= maxLength) {
            setInputValue(event.target.value);
        }
    };

    const handleSummarize = () => {
        onSummarize(inputValue); // Call the summarize method with the input value
    };

    return (
        <div className="mb-4 w-full max-w-2xl">
            <textarea
                className="w-full h-80 p-2 border border-gray-300 text-black rounded-md resize-none overflow-y-auto"
                placeholder="Enter your paragraph here..."
                value={inputValue}
                onChange={handleInputChange}
                maxLength={maxLength}
                rows={6}
                style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }} // Added shadow for better aesthetics
                onFocus={(e) => e.target.select()} // Select text on focus
            />
            <div className="flex justify-between mt-2 text-gray-600">
                <span>{`${inputValue.length} / ${maxLength}`}</span>
                <button 
                    onClick={handleSummarize}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md text-white"
                >
                    Generate MCQs
                </button>
            </div>
        </div>
    );
};

export default InputBox;
