import whisper
import os
import torch
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

    # Load diarization model if needed
    if diarization_model is None:
        print("Loading speaker diarization model...")
        # You need to get a HuggingFace access token for this
        # and set it as an environment variable
        access_token = os.environ.get("HF_TOKEN")
        if access_token:
            diarization_model = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.0",
                use_auth_token=access_token
            )
            print("Diarization model loaded successfully")
        else:
            print("WARNING: No HuggingFace token provided. Speaker diarization will not be available.")

    return whisper_model, diarization_model


def transcribe_with_speakers(file_path, whisper_model_name="base"):
    """Transcribe an audio file with speaker diarization"""
    global whisper_model, diarization_model

    # Load models
    load_models(whisper_model_name)

    # Get timestamps from Whisper
    whisper_result = whisper_model.transcribe(
        file_path,
        verbose=False,
        word_timestamps=True  # Enable word-level timestamps
    )

    result = {
        "text": whisper_result["text"],
        "segments": []
    }

    # Add timestamps from Whisper
    for segment in whisper_result["segments"]:
        result["segments"].append({
            "start": segment["start"],
            "end": segment["end"],
            "text": segment["text"],
            "speaker": "unknown"  # Will be filled in later
        })

    # Add speaker diarization if available
    if diarization_model is not None:
        try:
            # Process the audio for speaker diarization with EXACTLY 2 speakers
            diarization = diarization_model(
                file_path,
                num_speakers=2  # Force exactly 2 speakers
                # Alternatively, you can use min_speakers=2, max_speakers=2
            )

            # Extract speaker turns
            speaker_map = {}
            speaker_idx = 0

            # Process diarization output and match with transcription segments
            for turn, _, speaker in diarization.itertracks(yield_label=True):
                if speaker not in speaker_map:
                    speaker_map[speaker] = f"SPEAKER_{speaker_idx}"
                    speaker_idx += 1

                # Find segments that overlap with this speaker turn
                for i, segment in enumerate(result["segments"]):
                    # If the segment overlaps with this speaker turn
                    if (segment["start"] <= turn.end and segment["end"] >= turn.start):
                        # Calculate overlap percentage
                        overlap_start = max(segment["start"], turn.start)
                        overlap_end = min(segment["end"], turn.end)
                        overlap_duration = overlap_end - overlap_start
                        segment_duration = segment["end"] - segment["start"]

                        # If significant overlap, assign the speaker
                        if overlap_duration / segment_duration > 0.5:
                            result["segments"][i]["speaker"] = speaker_map[speaker]

        except Exception as e:
            print(f"Error during speaker diarization: {e}")
            # Continue without speaker diarization

    return result