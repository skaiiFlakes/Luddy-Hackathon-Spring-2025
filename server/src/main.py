import os

import pypdf
import json
import base64
import ollama

from flask       import Flask, request, jsonify
from uuid        import uuid4
from pathlib     import Path
from datetime    import datetime

from llm           import Interviewer, LLM, CFG, VoiceAnalysis
from transcription import transcribe_webm
from scraping      import scrape_job, save_to_json
from coach         import coach_video_file

app = Flask(__name__)
ctx = {}

UPLOAD_FOLDER = 'uploads'
RECORD_FOLDER = 'recordings'

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RECORD_FOLDER, exist_ok=True)

def extract_resume(stream) -> str:
    reader = pypdf.PdfReader(stream)
    output = ""

    for page in reader.pages:
        output += page.extract_text(
            extraction_mode="layout",
            # 1.2 seems to give the best results on the test documents.
            layout_mode_scale_weight=1.2
        )

    return output

def bad_request(msg):
    return jsonify({"error": msg}), 400

@app.route('/api/start_interview', methods = ['POST'])
def start_interview():
    REQUIRED_FIELDS = [
        'interviewer',
        'interview_type',
        'focus_areas',
        'job_link',
    ]

    if 'file' not in request.files:
        return bad_request("No file part in the request")
    
    for field in REQUIRED_FIELDS:
        if field not in request.form:
            return bad_request(f"Required field {field} not provided")

    file = request.files['file']
    name = file.filename

    if not name:
        return bad_request("No file selected")
    
    if Path(name).suffix != ".pdf":
        return bad_request("Must provide a PDF file")
    
    uuid = f"{uuid4()}"
    path = os.path.join(UPLOAD_FOLDER, uuid)
    text = extract_resume(file)

    with open(path, "w") as dest:
        dest.write(text)

    interviewer    = request.form['interviewer']
    interview_type = request.form['interview_type']
    focus_areas    = request.form['focus_areas']
    job_link       = request.form['job_link']
    
    # https://careers.servicenow.com/jobs/744000052094688/sr-manager-product-design-crm-industry-workflows/
    job_data = scrape_job(job_link)
    save_to_json(job_data, "../static/job_data.json") 

    ctx[uuid] = Interviewer(
        interviewer,
        interview_type,
        open("../static/job_data.json").read(),
        text,
        json.loads(focus_areas)
    )

    response = {
        "session_id"   : uuid,
        'introduction' : ctx[uuid].generate_introduction(),
    }
    
    return jsonify(response), 200

@app.route('/api/interview/<session_id>/next_question', methods=['GET'])
def next_question(session_id):
    if session_id not in ctx:
        return bad_request("Interview session not found")
    
    session       = ctx[session_id]
    question      = session.next_question()

    if question is None:
        response = {
            "finished" : True,
            "closer"   : session.generate_closer()
        }
    else:
        question, idx = question

        response = {
            "question"         : question,
            "question_number"  : idx,
            "total_questions"  : len(session.questions),
            "finished"         : False,
        }

    return response, 200

@app.route('/api/interview/<session_id>/next_response', methods=["POST"])
def next_response(session_id):
    if session_id not in ctx:
        return bad_request("Interview session not found")
    
    session = ctx[session_id]
    data    = request.json

    if 'data' not in data:
        return jsonify({"error": "No recording data provided"}), 400
    
    time = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = f"{session_id}_{time}.wav"
    path = os.path.join(RECORD_FOLDER, name)

    try:
        # Decode base64 data
        encoded_data = data['data'].split(',')[1] if ',' in data['data'] else data['data']
        binary_data = base64.b64decode(encoded_data)
        
        # Save the recording
        with open(path, 'wb') as f:
            f.write(binary_data)
        
        # Transcribe the recording
        try:
            text = transcribe_webm(path, auto_translate_non_english = True)['text']
        except Exception as e:
            return jsonify({"error": f"Error transcribing recording: {str(e)}"}), 500
        
        reply, follow_up = session.process_response(text)

        response = {
            "transcription"     : text,
            "interviewer_reply" : reply,
            "is_follow_up"      : follow_up,
        }

        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": f"Error processing recording: {str(e)}"}), 500

@app.route('/api/interview/<session_id>/feedback', methods=["GET"])
def feedback(session_id):
    if session_id not in ctx:
        return bad_request("Interview session not found")
    
    session = ctx[session_id]

    response                        = session.generate_feedback()
    response['sentiment_analysis']  = voice_sentiment(session_id)

    return jsonify(response), 200

@app.route('/api/coach', methods=['POST'])
def coach():
    if 'file' not in request.files:
        return bad_request("No file part in the request")
    
    file = request.files['file']
    name = file.filename

    if not name:
        return bad_request("No file selected")
    
    if Path(name).suffix != ".webm":
        return bad_request("Must provide a WEBM file")

    uuid = f"{uuid4()}"
    path = os.path.join(UPLOAD_FOLDER, uuid)

    with open(path, "wb") as dest:
        file.save(dest)

    analysis = coach_video_file(path)

    return jsonify(analysis), 200

@app.route("/api/interview/<session_id>/summarize", methods=["GET"])
def summarize_interview(session_id):
    if session_id not in ctx:
        return bad_request("Interview session not found")
    
    session    = ctx[session_id]
    transcript = ""

    for message in session.history:
        transcript += f"{message['role']}: {message['content']}\n"
    
    # Generate summary using LLM
    summary_prompt = f"""
    Generate a comprehensive summary of this job interview.
    
    Job Type: {session.mode}
    Focus Areas: {', '.join(session.focus_areas) if hasattr(session, 'focus_areas') else 'General'}
    
    Interview Content:
    {transcript}
    
    Please include:
    1. Main topics discussed
    2. Key skills and experiences highlighted
    3. Overall impression
    4. Areas where the candidate showed strength
    5. Areas where the candidate could improve
    
    Keep the summary concise but thorough, focusing on the most important aspects of the interview.
    """
    
    response = ollama.chat(
        model   = LLM,
        options = CFG,
        messages=[
            {'role': 'system', 'content': "You are an expert interview analyst. Provide clear, balanced, and constructive interview summaries."},
            {'role': 'user', 'content': summary_prompt}
        ]
    )
    
    summary = response['message']['content'].strip()
    
    return jsonify({
        "session_id": session_id,
        "summary": summary
    }), 200

# New endpoint for voice sentiment analysis
@app.route('/api/interview/<session_id>/voice_sentiment', methods=['GET'])
def analyze_voice_sentiment(session_id):
    if session_id not in ctx:
        return bad_request("Interview session not found")
    
    result = voice_sentiment(session_id)
    
    return jsonify(result), 200
    

def voice_sentiment(session_id):
    # Get all recordings for this session
    recordings = []
    for file in os.listdir(RECORD_FOLDER):
        if file.startswith(session_id) and (file.endswith('.wav') or file.endswith('.webm')):
            recordings.append(file)
    
    if not recordings:
        return jsonify({"error": "No recordings found for analysis"}), 404
    
    # Transcribe all recordings and combine them
    all_text = ""
    for recording in recordings:
        file_path = os.path.join(RECORD_FOLDER, recording)
        try:
            transcript = transcribe_webm(file_path, auto_translate_non_english = True)['text']
            all_text += transcript + " "
        except Exception as e:
            print(f"Error transcribing {recording}: {str(e)}")
    
    # Analyze the emotional states using LLM
    sentiment_prompt = f"""
    Analyze the following interview responses and identify the presence and strength of these emotional/mental states:
    1. Confidence
    2. Nervousness 
    3. Excitement
    4. Uncertainty
    5. Neutral tone
    
    For each state, provide:
    - A score from 0 to 100
    - Brief explanation with specific examples from the text
    
    Interview responses:
    {all_text}
    
    Format your response as a JSON object with these five states as keys, each containing a score and evidence field.
    """
    
    response = ollama.chat(
        model    = LLM,
        options  = CFG,
        format   = VoiceAnalysis.model_json_schema(),
        messages = [
            {'role': 'system', 'content': "You are an expert in analyzing emotional states from text. Provide detailed, evidence-based analysis."},
            {'role': 'user', 'content': sentiment_prompt}
        ]
    )

    analysis = VoiceAnalysis.model_validate_json(response.message.content)

    analysis = {
        'confidence'  : analysis.confidence.to_dict(),
        'nervousness' : analysis.nervousness.to_dict(),
        'excitement'  : analysis.excitement.to_dict(),
        'uncertainty' : analysis.uncertainty.to_dict(),
        'neutral'     : analysis.neutral.to_dict(),
    }
    
    # Find the dominant emotion
    try:
        dominant_emotion = max(
            ["confidence", "nervousness", "excitement", "uncertainty", "neutral"],
            key=lambda x: analysis.get(x, {}).get("score", 0)
        )
    except:
        dominant_emotion = "unknown"
    
    # Generate summary feedback
    try:
        feedback_prompt = f"""
        Based on this emotional analysis of a job interview:
        {json.dumps(analysis, indent=2)}
        
        The dominant emotion detected was: {dominant_emotion}
        
        Provide 3-4 sentences of constructive feedback about how these emotional states might have affected the interview performance, along with 2 specific suggestions for improvement.
        """
        response = ollama.chat(
            model    = LLM,
            options  = CFG,
            messages = [
                {'role': 'system', 'content': "You are a helpful interview coach providing constructive feedback."},
                {'role': 'user', 'content': feedback_prompt}
            ]
        )
        
        feedback = response['message']['content'].strip()
    except Exception as e:
        feedback = f"Unable to generate feedback: {str(e)}"
    
    # Create the final result
    result = {
        "dominant_emotion": dominant_emotion,
        "emotion_analysis": analysis,
        "feedback": feedback,
    }

    return result

if __name__ == "__main__":
    app.run(host = '0.0.0.0', debug=True)