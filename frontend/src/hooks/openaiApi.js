import { useState } from 'react';

const useOpenaiApi = () => {

    const [response, setResponse] = useState('');
    const [error, setError] = useState(false);

    const summarizeParaToMcq = async (payload) => {
        try {
            const url = process.env.RESOURCE_URL + '/api/generatemcqs';
            console.log(url);

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET
                },
                body: JSON.stringify({
                    paragraph: payload
                })
            });

            const data = await res.json();
            
            setResponse(data.message);
            setError(!data.success);

        } catch (error) {
            console.error('Error summarizing paragraph to MCQ:', error);
            setResponse('Internal server error!');
            setError(true);
        }
    };

    return { error, response, summarizeParaToMcq }; // Return the new method
};

export default useOpenaiApi;
