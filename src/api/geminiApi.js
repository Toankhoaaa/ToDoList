/**
 * Gọi API Gemini với một prompt văn bản đơn giản.
 * @param {string} prompt - Câu lệnh prompt cho AI.
 * @returns {Promise<string>} - Văn bản trả về từ AI.
 */
export const callGeminiApi = async (prompt) => {
  const apiKey = ""; // API key được Canvas tự động cung cấp
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: "Bạn là một trợ lý năng suất. Hãy trả lời ngắn gọn, súc tích, tập trung vào yêu cầu." }]
    }
  };

  // Logic thử lại (retry) với exponential backoff
  let response;
  let retries = 3;
  let delayMs = 1000;
  while (retries > 0) {
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) break; // Thành công
      if (response.status === 429) { // Quá tải
        console.warn("Gemini API rate limit exceeded. Retrying...");
      }
    } catch (error) {
      // Lỗi mạng
      console.error("Network error calling Gemini:", error);
    }
    retries--;
    if (retries > 0) {
      await new Promise(res => setTimeout(res, delayMs));
      delayMs *= 2; // Tăng gấp đôi thời gian chờ
    }
  }

  if (!response || !response.ok) {
    console.error('Gemini API call failed after retries.');
    throw new Error('Gemini API call failed after retries.');
  }

  const result = await response.json();
  const candidate = result.candidates?.[0];
  if (candidate && candidate.content?.parts?.[0]?.text) {
    return candidate.content.parts[0].text;
  } else {
    console.error('Invalid response structure from Gemini API:', result);
    throw new Error('Invalid response structure from Gemini API.');
  }
};

/**
 * Gọi API Gemini và yêu cầu trả về dữ liệu dạng JSON.
 * @param {string} prompt - Câu lệnh prompt cho AI.
 * @returns {Promise<Array<object>>} - Một mảng các đối tượng task.
 */
export const callGeminiApiWithJson = async (prompt) => {
  const apiKey = ""; // API key được Canvas tự động cung cấp
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    systemInstruction: {
      parts: [{ text: "Bạn là một trợ lý năng suất. Hãy trả lời chính xác theo cấu trúc JSON được yêu cầu." }]
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            "taskName": { "type": "STRING", "description": "Tên của công việc cần làm" }
          },
          required: ["taskName"]
        }
      }
    }
  };
  
  // Logic thử lại (retry)
  let response;
  let retries = 3;
  let delayMs = 1000;
  while (retries > 0) {
    try {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (response.ok) break;
    } catch (error) {
      console.error("Network error calling Gemini (JSON):", error);
    }
    retries--;
    if (retries > 0) {
      await new Promise(res => setTimeout(res, delayMs));
      delayMs *= 2;
    }
  }

  if (!response || !response.ok) {
    console.error('Gemini API (JSON) call failed after retries.');
    throw new Error('Gemini API (JSON) call failed after retries.');
  }

  const result = await response.json();
  const candidate = result.candidates?.[0];
  if (candidate && candidate.content?.parts?.[0]?.text) {
    try {
      // API trả về một chuỗi JSON, cần parse nó
      return JSON.parse(candidate.content.parts[0].text);
    } catch (e) {
      console.error('Failed to parse JSON response from Gemini:', e);
      throw new Error('Failed to parse JSON response from Gemini.');
    }
  } else {
    console.error('Invalid response structure from Gemini API (JSON):', result);
    throw new Error('Invalid response structure from Gemini API (JSON).');
  }
};

