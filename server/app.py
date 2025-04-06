from flask import Flask, request, jsonify
import os
import shutil
from typing import Optional, Dict, Any, List
import whisper_service
import feedback_service
from werkzeug.utils import secure_filename
import tempfile
import json

app = Flask(__name__)

# Initialize Whisper model
model = None
current_model_name = None  # Track which model is loaded


# Use with_app_context instead of before_first_request
def initialize_models():
    # Initialize the models on startup
    whisper_service.load_models("base")

    # Try to initialize Llama, but don't block startup if it fails
    # It will try again when the endpoint is called
    try:
        feedback_service.initialize_llama("llama3")
    except Exception as e:
        print(f"Warning: Could not initialize Llama model at startup: {str(e)}")
        print("The model will be initialized when the endpoint is first called.")


# Initialize models when the application starts
with app.app_context():
    initialize_models()

@app.route('/convert-audio', methods=['POST'])
def convert_audio():
    """
    Endpoint to handle WebM audio files, convert them to MP3, and then transcribe.
    Supports automatic language detection and automatic translation of non-English to English.
    """
    # Check if the file is in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Get model name from the request
    model_name = request.form.get('model_name', 'base')

    # Get translation preferences from the request
    translate_to_english = request.form.get('translate_to_english', 'false').lower() == 'true'
    auto_translate = request.form.get('auto_translate', 'true').lower() == 'true'

    # Verify file extension is WebM
    if not file.filename.lower().endswith('.webm'):
        return jsonify({"error": "File must be a WebM file"}), 400

    # Save the uploaded file temporarily
    temp_file = os.path.join(tempfile.gettempdir(), f"temp_{secure_filename(file.filename)}")
    file.save(temp_file)

    try:
        # Use the imported service to transcribe with language support
        result = whisper_service.transcribe_webm(
            temp_file,
            model_name,
            translate_to_english=translate_to_english,
            auto_translate_non_english=auto_translate
        )

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file):
            os.remove(temp_file)


@app.route('/interview-feedback', methods=['POST'])
def get_interview_feedback():
    """
    Endpoint to generate feedback on interview responses using Llama3.

    Takes:
    - question: The interview question that was asked
    - response: The text transcription of the interviewee's response
    - model_name: (Optional) The name of the Llama model to use

    Returns:
    - Structured feedback including strengths, areas for improvement, suggestions, and a grade
    """
    data = request.json

    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Extract data from request
    question = data.get('question')
    response_text = data.get('response')
    model_name = data.get('model_name', 'llama3')

    if not question or not response_text:
        return jsonify({"error": "Question and response fields are required"}), 400

    try:
        # Call the Llama service to generate feedback
        feedback = feedback_service.generate_interview_feedback(
            question=question,
            response=response_text,
            model_name=model_name
        )

        return jsonify(feedback)
    except Exception as e:
        # Return a more user-friendly error response instead of throwing an HTTP exception
        return jsonify({
            "question": question,
            "response": response_text,
            "error": f"Failed to generate feedback: {str(e)}"
        }), 500


@app.route('/batch-interview-feedback', methods=['POST'])
def get_batch_interview_feedback():
    """
    Endpoint to generate feedback on multiple interview responses using Llama3.

    Takes:
    - qa_pairs: List of dictionaries containing question/answer pairs
                [{"question": "...", "response": "..."}, ...]
    - model_name: (Optional) The name of the Llama model to use

    Returns:
    - Structured feedback for each question/answer pair
    - Overall grade and feedback across all responses
    """
    data = request.json

    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Extract data from request
    qa_pairs = data.get('qa_pairs')
    model_name = data.get('model_name', 'llama3')

    if not qa_pairs or not isinstance(qa_pairs, list):
        return jsonify({"error": "qa_pairs field is required and must be a list"}), 400

    # Validate each qa pair
    for pair in qa_pairs:
        if not isinstance(pair, dict) or not pair.get('question') or not pair.get('response'):
            return jsonify({"error": "Each qa_pair must have both question and response fields"}), 400

    try:
        # Call the Llama service to generate batch feedback
        feedback = feedback_service.generate_batch_feedback(
            qa_pairs=qa_pairs,
            model_name=model_name
        )

        return jsonify(feedback)
    except Exception as e:
        # Return a more user-friendly error response
        return jsonify({
            "error": f"Failed to generate batch feedback: {str(e)}"
        }), 500


@app.route('/process-interview-json', methods=['POST'])
def process_interview_json():
    """
    Endpoint to process a full interview JSON and generate feedback for all answers.

    Takes:
    - interview_data: The full interview JSON in the specified format
    - model_name: (Optional) The name of the Llama model to use

    Returns:
    - The updated interview JSON with evaluations for each answer
    """
    # Get request data
    data = request.json

    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Extract interview data and model name
    interview_data = data.get('interview_data')
    model_name = data.get('model_name', 'llama3')

    if not interview_data:
        return jsonify({"error": "interview_data field is required"}), 400

    try:
        # Process the interview JSON
        updated_data = feedback_service.process_interview_json(
            interview_data=interview_data,
            model_name=model_name
        )

        return jsonify(updated_data)
    except Exception as e:
        # Return a more user-friendly error response
        return jsonify({
            "error": f"Failed to process interview JSON: {str(e)}",
            "original_data": interview_data
        }), 500


@app.route('/process-interview-file', methods=['POST'])
def process_interview_file():
    """
    Endpoint to process an interview JSON file and generate feedback for all answers.

    Takes:
    - file: The interview JSON file
    - model_name: (Optional) The name of the Llama model to use

    Returns:
    - The updated interview JSON with evaluations for each answer
    """
    # Check if the file is in the request
    if 'file' not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No file selected"}), 400

    # Get model name from the request
    model_name = request.form.get('model_name', 'llama3')

    # Verify file extension is JSON
    if not file.filename.lower().endswith('.json'):
        return jsonify({"error": "File must be a JSON file"}), 400

    # Save the uploaded file temporarily
    temp_file = os.path.join(tempfile.gettempdir(), f"temp_{secure_filename(file.filename)}")
    file.save(temp_file)

    try:
        # Read the JSON file
        with open(temp_file, 'r') as f:
            interview_data = json.load(f)

        # Process the interview JSON
        updated_data = feedback_service.process_interview_json(
            interview_data=interview_data,
            model_name=model_name
        )

        return jsonify(updated_data)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid JSON file"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file):
            os.remove(temp_file)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)