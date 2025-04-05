import whisper
import os
import subprocess
import tempfile
from pyannote.audio import Pipeline
from typing import Optional, Dict, List, Any

# Global variables
whisper_model = None
current_whisper_model = None
diarization_model = None


def load_models(whisper_model_name="base"):
    """Load the Whisper and diarization models"""
    global whisper_model, current_whisper_model, diarization_model

    # Load Whisper model if needed
    if whisper_model is None or current_whisper_model != whisper_model_name:
        print(f"Loading Whisper model: {whisper_model_name}...")
        whisper_model = whisper.load_model(whisper_model_name)
        current_whisper_model = whisper_model_name
        print("Whisper model loaded successfully")

    return whisper_model

def convert_webm_to_mp3(webm_file_path):
    """Convert WebM file to MP3 format using FFmpeg"""
    try:
        # Create a temporary file for the MP3
        fd, mp3_file_path = tempfile.mkstemp(suffix='.mp3')
        os.close(fd)  # Close the file descriptor

        # Convert WebM to MP3 using FFmpeg
        command = [
            'ffmpeg',
            '-i', webm_file_path,  # Input file
            '-vn',  # No video
            '-acodec', 'libmp3lame',  # MP3 codec
            '-ar', '44100',  # Sample rate
            '-ac', '2',  # Stereo
            '-b:a', '192k',  # Bitrate
            '-y',  # Overwrite output file
            mp3_file_path  # Output file
        ]

        # Run FFmpeg command
        process = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True
        )

        print(f"Converted {webm_file_path} to {mp3_file_path}")
        return mp3_file_path
    except subprocess.CalledProcessError as e:
        print(f"FFmpeg error: {e.stderr.decode()}")
        raise Exception(f"Failed to convert WebM to MP3: {e}")
    except Exception as e:
        print(f"Error converting WebM to MP3: {e}")
        raise

def transcribe_webm(file_path, whisper_model_name="base"):
    """
    Transcribe a WebM file by first converting it to MP3, without speaker diarization.
    Returns a simple JSON with just the text.
    """
    # Convert WebM to MP3
    mp3_file_path = convert_webm_to_mp3(file_path)

    try:
        # Load models (just Whisper, no diarization)
        load_models(whisper_model_name)

        # Transcribe using just Whisper
        whisper_result = whisper_model.transcribe(
            mp3_file_path,
            verbose=False
        )

        # Return simple JSON with just the text
        result = {
            "text": whisper_result["text"]
        }

        return result
    finally:
        # Clean up the temporary MP3 file
        if os.path.exists(mp3_file_path):
            os.remove(mp3_file_path)
            print(f"Removed temporary MP3 file: {mp3_file_path}")