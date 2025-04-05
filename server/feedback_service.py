import json
import ollama
import requests
import time
import os
import statistics
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

        ONLY analyze the words being used, you do not have any context from the actual voice of the interviewee, beyond filler words.
        Return your answers in a first-person format, as if you were talking directly to the candidate after interviewing them.
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


def generate_batch_feedback(qa_pairs: List[Dict[str, str]], model_name: str = "llama3") -> Dict[str, Any]:
    """
    Generate feedback for multiple question/answer pairs and provide an overall assessment.

    Args:
        qa_pairs: List of dictionaries containing question/answer pairs
                 [{"question": "...", "response": "..."}, ...]
        model_name: The name of the Llama model to use

    Returns:
        A structured JSON object with individual feedback for each Q&A pair
        and overall feedback with a grade
    """
    try:
        # Process each question/answer pair
        feedback_results = []
        grade_values = []

        for qa_pair in qa_pairs:
            question = qa_pair.get("question", "")
            response = qa_pair.get("response", "")

            # Get feedback for this individual question/answer pair
            feedback = generate_interview_feedback(question, response, model_name)
            feedback_results.append(feedback)

            # Convert letter grade to numeric value for averaging
            grade = feedback.get("grade", "")
            if grade == "A":
                grade_values.append(4.0)
            elif grade == "B":
                grade_values.append(3.0)
            elif grade == "C":
                grade_values.append(2.0)
            elif grade == "D":
                grade_values.append(1.0)
            elif grade == "F":
                grade_values.append(0.0)

        # Calculate overall grade
        if grade_values:
            avg_grade = statistics.mean(grade_values)

            # Convert numeric grade back to letter grade with plus/minus
            if avg_grade >= 3.85:
                overall_grade = "A"
            elif avg_grade >= 3.5:
                overall_grade = "A-"
            elif avg_grade >= 3.15:
                overall_grade = "B+"
            elif avg_grade >= 2.85:
                overall_grade = "B"
            elif avg_grade >= 2.5:
                overall_grade = "B-"
            elif avg_grade >= 2.15:
                overall_grade = "C+"
            elif avg_grade >= 1.85:
                overall_grade = "C"
            elif avg_grade >= 1.5:
                overall_grade = "C-"
            elif avg_grade >= 1.15:
                overall_grade = "D+"
            elif avg_grade >= 0.85:
                overall_grade = "D"
            elif avg_grade >= 0.5:
                overall_grade = "D-"
            else:
                overall_grade = "F"
        else:
            overall_grade = "N/A"

        # Generate overall feedback
        # Ensure the model is initialized
        if not initialize_llama(model_name):
            raise Exception("Failed to initialize Llama model. Check if Ollama is running.")

        # Set Ollama API endpoint
        ollama_host = os.environ.get("OLLAMA_HOST", "http://localhost:11434")

        # Prepare a summary of all Q&A pairs for the model
        qa_summary = ""
        for i, qa in enumerate(qa_pairs):
            qa_summary += f"Question {i + 1}: {qa.get('question', '')}\n"
            qa_summary += f"Response {i + 1}: {qa.get('response', '')}\n\n"

        # Prompt for generating overall feedback
        prompt = f"""
        You are an expert interview coach providing overall feedback on multiple interview responses.

        Here are the questions and responses:

        {qa_summary}

        Based on all these responses, provide overall feedback in the following JSON format:
        {{
            "overall_feedback": "Detailed, holistic assessment of the candidate's interview performance across all questions, including patterns observed, general strengths and weaknesses"
        }}

        Return your feedback in a first-person format, as if you were talking directly to the candidate.
        Make your feedback concise but comprehensive, highlighting the most important patterns across all responses.
        Return ONLY the JSON with the overall_feedback field.
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
            print(f"Error using ollama Python library for overall feedback: {str(e)}")
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
                    f"Failed to connect to Ollama for overall feedback.") from req_err

        # Clean up the response if needed
        if response_text.startswith("```json"):
            response_text = response_text.split("```json")[1]
        if response_text.endswith("```"):
            response_text = response_text.split("```")[0]

        # Strip any whitespace
        response_text = response_text.strip()

        # Parse the JSON response
        try:
            overall_feedback_data = json.loads(response_text)
            overall_feedback = overall_feedback_data.get("overall_feedback", "")
        except json.JSONDecodeError:
            overall_feedback = "Unable to generate overall feedback."

        # Construct the final response
        final_response = {
            "feedback_results": feedback_results,
            "overall_grade": overall_grade,
            "overall_feedback": overall_feedback
        }

        return final_response

    except Exception as e:
        # Handle any exceptions
        print(f"Error generating batch feedback: {str(e)}")
        return {
            "feedback_results": feedback_results if 'feedback_results' in locals() else [],
            "overall_grade": "Error",
            "overall_feedback": f"Failed to generate complete feedback: {str(e)}"
        }


def process_interview_json(interview_data: Dict[str, Any], model_name: str = "llama3") -> Dict[str, Any]:
    """
    Process a full interview JSON and generate feedback for all questions and answers.

    Args:
        interview_data: Dictionary containing the full interview data in the specified format
        model_name: The name of the Llama model to use

    Returns:
        The updated interview_data with feedback for each answer and overall feedback
    """
    try:
        # Extract questions and answers from the interview data
        questions = interview_data.get("questions", [])
        answers = interview_data.get("answers", [])

        # Create list of QA pairs from unanswered questions
        answered_question_ids = set(answer.get("question_id") for answer in answers)

        # Create a copy of the interview data to update
        updated_data = interview_data.copy()

        # Check if there are already answers in the JSON
        if answers:
            # Process existing answers
            qa_pairs = []
            for answer in answers:
                question_id = answer.get("question_id")
                if question_id is not None and question_id < len(questions):
                    question = answer.get("question", questions[question_id])
                    response = answer.get("answer", "")

                    qa_pairs.append({
                        "question": question,
                        "response": response
                    })

            # Generate feedback for the QA pairs
            if qa_pairs:
                feedback_results = generate_batch_feedback(qa_pairs, model_name)

                # Update the answers with their evaluations
                for i, result in enumerate(feedback_results.get("feedback_results", [])):
                    if i < len(answers):
                        # Create evaluation if it doesn't exist
                        if "evaluation" not in answers[i]:
                            answers[i]["evaluation"] = {}

                        # Update evaluation fields
                        answers[i]["evaluation"]["strengths"] = result.get("strengths", [])
                        answers[i]["evaluation"]["areas_for_improvement"] = result.get("areas_for_improvement", [])
                        answers[i]["evaluation"]["suggestions"] = result.get("suggestions", [])
                        answers[i]["evaluation"]["grade"] = result.get("grade", "")

                # Update the interview data
                updated_data["answers"] = answers

                # Add overall analysis if it doesn't exist
                if "analysis" not in updated_data:
                    updated_data["analysis"] = {}

                # Update or create performance metrics
                if "performance_metrics" not in updated_data["analysis"]:
                    updated_data["analysis"]["performance_metrics"] = {}

                # Convert overall grade to numeric for performance metrics
                grade = feedback_results.get("overall_grade", "")
                grade_value = 0.0
                if grade.startswith("A"):
                    grade_value = 0.9 if "+" in grade else (0.85 if "-" in grade else 0.87)
                elif grade.startswith("B"):
                    grade_value = 0.8 if "+" in grade else (0.75 if "-" in grade else 0.77)
                elif grade.startswith("C"):
                    grade_value = 0.7 if "+" in grade else (0.65 if "-" in grade else 0.67)
                elif grade.startswith("D"):
                    grade_value = 0.6 if "+" in grade else (0.55 if "-" in grade else 0.57)

                # Update performance metrics
                updated_data["analysis"]["performance_metrics"]["average_score"] = grade_value
                updated_data["analysis"]["performance_metrics"]["overall_rating"] = get_rating_from_grade(grade)

                # Add overall feedback to the analysis
                updated_data["analysis"]["overall_feedback"] = feedback_results.get("overall_feedback", "")

        return updated_data

    except Exception as e:
        print(f"Error processing interview JSON: {str(e)}")
        return {
            "error": f"Failed to process interview data: {str(e)}",
            "original_data": interview_data
        }


def get_rating_from_grade(grade: str) -> str:
    """Convert a letter grade to a verbal rating"""
    if grade.startswith("A"):
        return "Excellent"
    elif grade.startswith("B"):
        return "Above Average"
    elif grade.startswith("C"):
        return "Average"
    elif grade.startswith("D"):
        return "Below Average"
    elif grade.startswith("F"):
        return "Poor"
    else:
        return "Not Rated"