import os

import pypdf
import json
import base64

from dataclasses import dataclass
from flask       import Flask, request, jsonify
from uuid        import uuid4
from pathlib     import Path
from datetime    import datetime

from personas      import Interviewer
from transcription import transcribe_webm

app = Flask(__name__)
ctx = {}

UPLOAD_FOLDER = 'uploads'
RECORD_FOLDER = 'recordings'

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

    ctx[uuid] = Interviewer(
        interviewer,
        interview_type,
        open("job_data.json").read(),
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
    
    kind = data.get('type', 'audio')  # 'audio' or 'video'
    ext  = '.webm' if kind == 'video' else '.wav'
    
    time = datetime.now().strftime("%Y%m%d_%H%M%S")
    name = f"{session_id}_{time}{ext}"
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
            if kind == 'video':
                # text = extract_video(path)
                raise "Nuh uh"
            else:
                text = transcribe_webm(path)['text']
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

if __name__ == "__main__":
    app.run(debug=True)