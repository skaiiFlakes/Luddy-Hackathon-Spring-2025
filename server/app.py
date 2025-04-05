from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from utils.database import Database
from utils.scraper import scrape_website
from models.model_inference import predict_model
import uvicorn #keep for pipreqs --force command to include
import os
import shutil
from typing import Optional
import whisper_service


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


@app.post("/convert-audio")
async def convert_audio(file: UploadFile = File(...), model_name: Optional[str] = "base"):
    # Save the uploaded file temporarily
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Use the imported service to transcribe with speakers
    result = whisper_service.transcribe_with_speakers(temp_file, model_name)

    # Clean up the temporary file
    os.remove(temp_file)

    # Return the full result with timestamps and speakers
    return result

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
