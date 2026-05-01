const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export async function testGemini() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: "I just came to say HELLO! -O -O -O" }
                        ]
                    }
                ]
            })
        });
        const data = await response.json();
        console.log("Full response:", data);
        if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
            console.log(data.candidates[0].content.parts[0].text);
        } else {
            console.log("No candidates or text found in response.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
    }
}