import json
import ollama
import requests
import time
import os
from typing import Dict, List, Any, Optional

# Global variables
llama_model = None
current_llama_model = "llama3"


def initialize_llama(model_name="llama3"):
    """Initialize the Llama model"""
    global llama_model, current_llama_model

    # Set the current model name
    current_llama_model = model_name

    # Set Ollama API endpoint (use environment variable if available)
    ollama_host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

    # Try to connect to Ollama and ensure the model is available
    max_retries = 5
    retries = 0

    while retries < max_retries:
        try:
            # Check if Ollama server is running
            response = requests.get(f"{ollama_host}")

            # Check if the model exists
            model_response = requests.get(f"{ollama_host}/api/tags")

            if model_response.status_code == 200:
                models = model_response.json().get("models", [])
                model_exists = any(m.get("name") == model_name for m in models)

                if not model_exists:
                    print(f"Model {model_name} not found, pulling it now...")
                    pull_response = requests.post(
                        f"{ollama_host}/api/pull",
                        json={"name": model_name}
                    )

                    if pull_response.status_code != 200:
                        print(f"Failed to pull model {model_name}: {pull_response.text}")

                print(f"Llama model {model_name} ready to use via Ollama at {ollama_host}")
                return True

        except requests.exceptions.RequestException as e:
            print(f"Ollama not ready yet (attempt {retries + 1}/{max_retries}): {str(e)}")
            retries += 1
            time.sleep(5)  # Wait 5 seconds before retrying

    print("Failed to connect to Ollama after multiple attempts")
    return False


def generate_interview_feedback(question: str, response: str, model_name: str = "llama3") -> Dict[str, Any]:
    """
    Generate structured feedback for an interview response using Llama3.

    Args:
        question: The interview question that was asked
        response: The text transcription of the interviewee's response
        model_name: The name of the Llama model to use

    Returns:
        A structured JSON object with feedback
    """
    try:
        # Ensure the model is initialized
        if not initialize_llama(model_name):
            raise Exception("Failed to initialize Llama model. Check if Ollama is running.")

        # Set Ollama API endpoint (use environment variable if available)
        ollama_host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

        # Construct the prompt for Llama
        prompt = f"""
        You are an expert interview coach providing feedback on interview responses.

        INTERVIEW QUESTION: {question}

        CANDIDATE'S RESPONSE: {response}

        Please analyze this response and provide detailed feedback in the following JSON format:
        {{
            "question": "The original question",
            "response": "The candidate's response",
            "strengths": [
                "Detailed point about what the candidate did well (specific to this response)",
                "Another specific strength",
                "A third specific strength"
            ],
            "areas_for_improvement": [
                "Specific area where the response could be improved",
                "Another specific improvement opportunity",
                "A third specific improvement opportunity"
            ],
            "suggestions": [
                "Actionable suggestion for future responses",
                "Another specific suggestion",
                "A third specific suggestion"
            ],
            "grade": "A letter grade (A, B, C, D, or F) that evaluates the overall quality of the response"
        }}

        Ensure your feedback is specific to the content of the response and relevant to the question asked. Return ONLY the JSON.
        """

        try:
            # First try with the ollama Python library
            result = ollama.generate(
                model=model_name,
                prompt=prompt,
                format="json"
            )
            response_text = result['response']
        except Exception as e:
            print(f"Error using ollama Python library: {str(e)}")
            print("Falling back to direct API call...")

            # Fall back to direct API call
            try:
                api_response = requests.post(
                    f"{ollama_host}/api/generate",
                    json={
                        "model": model_name,
                        "prompt": prompt,
                        "format": "json"
                    },
                    timeout=60
                )

                if api_response.status_code != 200:
                    raise Exception(f"Ollama API error: {api_response.status_code} - {api_response.text}")

                response_text = api_response.json().get("response", "")
            except requests.exceptions.RequestException as req_err:
                raise Exception(
                    f"Failed to connect to Ollama. Please check that Ollama is downloaded, running and accessible. https://ollama.com/download") from req_err

        # Clean up the response if needed (remove markdown code blocks if present)
        if response_text.startswith("```json"):
            response_text = response_text.split("```json")[1]
        if response_text.endswith("```"):
            response_text = response_text.split("```")[0]

        # Strip any whitespace
        response_text = response_text.strip()

        # Parse the JSON response
        feedback_data = json.loads(response_text)

        return feedback_data

    except json.JSONDecodeError:
        # Handle case where Llama doesn't return valid JSON
        return {
            "question": question,
            "response": response,
            "error": "Failed to generate structured feedback. The model did not return valid JSON."
        }

    except Exception as e:
        # Handle any other exceptions
        print(f"Error generating interview feedback: {str(e)}")
        return {
            "question": question,
            "response": response,
            "error": f"Failed to generate feedback: {str(e)}"
        }