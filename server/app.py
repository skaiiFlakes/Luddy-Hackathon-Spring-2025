from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from utils.database import Database
from utils.scraper import scrape_website
from models.model_inference import predict_model
import uvicorn #keep for pipreqs --force command to include

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize database connection
db = Database()

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

@app.get("/data")
def get_data():
    try:
        data = db.get_data()
        return {"data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
