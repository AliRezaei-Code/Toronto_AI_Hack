"use client";

import { useState } from "react";

export default function DebugPage() {
  const [apiKey, setApiKey] = useState("b85a4491c961e9c92af496a79dcc2cbd704897fb");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult("Testing...");
    
    try {
      // console.log("Testing API with key:", apiKey.substring(0, 10) + "...");
      
      const response = await fetch("https://api.deepgram.com/v1/projects", {
        headers: {
          Authorization: `Token ${apiKey}`,
        },
      });

      // console.log("Response:", response);

      const responseInfo = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      };

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ SUCCESS!\n\n${JSON.stringify({ ...responseInfo, data }, null, 2)}`);
      } else {
        const error = await response.text();
        setResult(`❌ FAILED!\n\n${JSON.stringify({ ...responseInfo, error }, null, 2)}`);
      }
    } catch (error) {
      // console.error("Fetch error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack available';
      setResult(`❌ NETWORK ERROR!\n\n${errorMessage}\n\nStack:\n${errorStack}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Deepgram API Debug Page</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl mb-4">API Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">API Key:</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                placeholder="Enter Deepgram API Key"
              />
            </div>
            <button
              onClick={testAPI}
              disabled={loading || !apiKey}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg"
            >
              {loading ? "Testing..." : "Test API"}
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl mb-4">Results</h2>
          <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            {result || "Click 'Test API' to see results"}
          </pre>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mt-6">
          <h2 className="text-xl mb-4">Environment Info</h2>
          <div className="text-sm space-y-2">
            <p><strong>User Agent:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'N/A'}</p>
            <p><strong>Origin:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
            <p><strong>Protocol:</strong> {typeof window !== 'undefined' ? window.location.protocol : 'N/A'}</p>
            <p><strong>Fetch Available:</strong> {typeof fetch !== 'undefined' ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
