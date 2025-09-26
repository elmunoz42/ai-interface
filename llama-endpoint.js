// src/index.js
var index_default = {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
    try {
      const body = await request.json();
      const {
        prompt,
        messages,
        max_tokens = 1e3,
        temperature = 0.7,
        system_prompt = "You are a helpful assistant."
      } = body;
      let inputMessages = [];
      if (messages && Array.isArray(messages)) {
        inputMessages = messages;
      } else if (prompt) {
        inputMessages = [
          { role: "system", content: system_prompt },
          { role: "user", content: prompt }
        ];
      } else {
        return new Response(JSON.stringify({
          error: "Missing required field: prompt or messages"
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        });
      }
      const response = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
        messages: inputMessages,
        max_tokens,
        temperature
      });
      const formattedResponse = {
        id: crypto.randomUUID(),
        object: "chat.completion",
        created: Date.now(),
        model: "llama-3-8b-instruct",
        choices: [{
          index: 0,
          message: {
            role: "assistant",
            content: response.response || response
          },
          finish_reason: "stop"
        }],
        usage: {
          prompt_tokens: -1,
          // Cloudflare doesn't provide token counts
          completion_tokens: -1,
          total_tokens: -1
        }
      };
      return new Response(JSON.stringify(formattedResponse), {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    } catch (error) {
      console.error("Error:", error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        details: error.message
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      });
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
