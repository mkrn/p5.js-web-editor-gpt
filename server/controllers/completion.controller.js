const functions = [
  {
    name: 'answer_with_code',
    description: 'Answer the prompt with updated code',
    parameters: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Updated code'
        }
      },
      required: ['code']
    }
  }
];

// Define the route handler
export async function completion(req, res) {
  const { code, query, model = 'gpt-3.5-turbo-0613' } = req.body;
  const messages = [
    {
      role: 'system',
      content:
        `You are an expert p5.js coder. You help user update the code to the requirements. ` +
        ` You always extract ALL constants into meaningfully called variables and comment your code where it is necessary to understand. ` +
        ` You always return full code without omissions`
    },
    {
      role: 'user',
      content: `CODE:\n${code}\n\nREQUIREMENTS:\n${query}\n\nUpdated code:`
      // TODO: try this: Answer with return_code function and make sure the JSON is valid:
    }
  ];

  let maxTokens;

  // Roughly dividing capacity in 2
  switch (model) {
    // case 'gpt-4-32k-0613':
    //   maxTokens = 16000;
    //   break;
    case 'gpt-4-0613':
      maxTokens = 4000;
      break;
    case 'gpt-3.5-turbo-16k':
      maxTokens = 8000;
      break;
    default:
      maxTokens = 2500;
      break;
  }

  try {
    const params = {
      model,
      messages,
      temperature: 0,
      functions,
      max_tokens: maxTokens
    };

    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify(params)
    };

    let response;
    try {
      const r = await fetch(
        'https://api.openai.com/v1/chat/completions',
        requestOptions
      );
      response = await r.json();
      console.log(response);
    } catch (err) {
      console.error('Error on request:', err);
      res.send(err);
    }

    const responseMessage = response.choices[0].message;
    console.log(responseMessage);

    if (!responseMessage.function_call) {
      // ATTEMPT TO EXTRACT everything in responseMessage between ```javascript and ```
      const match = responseMessage.content.match(/```javascript([\s\S]*?)```/);

      // If there's content, return it.
      if (match && match[1]) {
        const extracted = match[1].trim(); // Extract the code
        res.status(200).json({ code: extracted });
      } else {
        // Return as-is
        res.status(200).json({ code: responseMessage.content });
      }
    } else {
      let functionArgs;
      try {
        functionArgs = JSON.parse(responseMessage.function_call.arguments);
        res.status(200).json({ code: functionArgs.code });
      } catch {
        console.log('JSON invalid, trying to extract the code');
        // Sometimes GPT 3.5 replies with invalid json like: {"code": `code here`}
        const match = responseMessage.function_call.arguments.match(
          /"code":\s*`([^`]+)`/
        );

        if (match && match[1]) {
          res.status(200).json({ code: match[1] });
        } else {
          // return as-is
          // TODO: try to remove { "code" : " && "}
          res
            .status(200)
            .json({ code: responseMessage.function_call.arguments });
          throw new Error('Invalid');
        }
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export default completion;
