from fastapi import FastAPI, HTTPException, UploadFile, File, Body
from fastapi.middleware.cors import CORSMiddleware
from utils.database import Database
from utils.scraper import scrape_website
from models.model_inference import predict_model
import uvicorn
import os
import shutil
from typing import Optional, Dict, Any
import whisper_service
import feedback_service
from pydantic import BaseModel


# Define the model for interview feedback request
class InterviewFeedbackRequest(BaseModel):
    question: str
    response: str
    model_name: Optional[str] = "llama3"

app = FastAPI()

# Initialize Whisper model
model = None
current_model_name = None  # Track which model is loaded

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize database connection
# db = Database()

@app.on_event("startup")
async def startup_event():
    # Initialize the models on startup
    whisper_service.load_models("base")

    # Try to initialize Llama, but don't block startup if it fails
    # It will try again when the endpoint is called
    try:
        feedback_service.initialize_llama("llama3")
    except Exception as e:
        print(f"Warning: Could not initialize Llama model at startup: {str(e)}")
        print("The model will be initialized when the endpoint is first called.")

@app.post("/convert-audio")
async def convert_audio(file: UploadFile = File(...), model_name: Optional[str] = "base"):
    """
    Endpoint to handle WebM audio files, convert them to MP3, and then transcribe.
    Returns simple JSON with just the text.
    """
    # Verify file extension is WebM
    if not file.filename.lower().endswith('.webm'):
        raise HTTPException(status_code=400, detail="File must be a WebM file")

    # Save the uploaded file temporarily
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        # Use the imported service to convert WebM to MP3 and transcribe simply
        result = whisper_service.transcribe_webm(temp_file, model_name)

        # Return the simple result with just the text
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file
        if os.path.exists(temp_file):
            os.remove(temp_file)

@app.post("/interview-feedback")
async def get_interview_feedback(request: InterviewFeedbackRequest):
    """
    Endpoint to generate feedback on interview responses using Llama3.

    Takes:
    - question: The interview question that was asked
    - response: The text transcription of the interviewee's response
    - model_name: (Optional) The name of the Llama model to use

    Returns:
    - Structured feedback including strengths, areas for improvement, suggestions, and a grade
    """
    try:
        # Call the Llama service to generate feedback
        feedback = feedback_service.generate_interview_feedback(
            question=request.question,
            response=request.response,
            model_name=request.model_name
        )

        return feedback
    except Exception as e:
        # Return a more user-friendly error response instead of throwing an HTTP exception
        return {
            "question": request.question,
            "response": request.response,
            "error": f"Failed to generate feedback: {str(e)}"
        }

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/predict")
def predict():
    try:
        prediction = predict_model()
        return {"prediction": prediction}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/scrape")
def scrape(url: str):
    try:
        data = scrape_website(url)
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# @app.get("/data")
# def get_data():
#     try:
#         data = db.get_data()
#         return {"data": data}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))