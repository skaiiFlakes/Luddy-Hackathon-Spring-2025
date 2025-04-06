import cv2
import mediapipe as mp
import numpy as np
import math
import time

# Initialize MediaPipe solutions
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles
mp_hands = mp.solutions.hands
mp_face_mesh = mp.solutions.face_mesh
mp_pose = mp.solutions.pose

mp_hands.model_complexity = 0
mp_pose.model_complexity = 0

# Drawing specifications
drawing_spec = mp_drawing.DrawingSpec(thickness=1, circle_radius=1)

# History tracking for smoothing
gesture_history = []
eye_contact_history = []
posture_history = []
MAX_HISTORY = 15

# Analytics for interview feedback
class InterviewAnalytics:
    def __init__(self):
        self.session_start_time = time.time()
        self.eye_contact_duration = 0
        self.last_eye_contact_time = None
        self.hand_gesture_counts = {
            "open_palm": 0,
            "closed_fist": 0,
            "pointing": 0,
            "hand_near_face": 0,
            "excessive_movement": 0,
            "neutral": 0,
            "thumbs_up": 0
        }
        self.poor_posture_duration = 0
        self.last_poor_posture_time = None
        
    def update_eye_contact(self, has_contact):
        current_time = time.time()
        if has_contact:
            if self.last_eye_contact_time is not None:
                self.eye_contact_duration += (current_time - self.last_eye_contact_time)
            self.last_eye_contact_time = current_time
        else:
            self.last_eye_contact_time = None
            
    def update_gesture(self, gesture_type):
        if gesture_type in self.hand_gesture_counts:
            self.hand_gesture_counts[gesture_type] += 1
    
    def update_posture(self, is_good_posture):
        current_time = time.time()
        if not is_good_posture:
            if self.last_poor_posture_time is not None:
                self.poor_posture_duration += (current_time - self.last_poor_posture_time)
            self.last_poor_posture_time = current_time
        else:
            self.last_poor_posture_time = None
            
    def get_session_duration(self):
        return time.time() - self.session_start_time
    
    def get_eye_contact_percentage(self):
        session_duration = self.get_session_duration()
        if session_duration > 0:
            return (self.eye_contact_duration / session_duration) * 100
        return 0
    
    def get_poor_posture_percentage(self):
        session_duration = self.get_session_duration()
        if session_duration > 0:
            return (self.poor_posture_duration / session_duration) * 100
        return 0
        
    def get_dominant_gesture(self):
        if sum(self.hand_gesture_counts.values()) == 0:
            return "neutral"
        return max(self.hand_gesture_counts, key=self.hand_gesture_counts.get)

# Initialize analytics
analytics = InterviewAnalytics()

def analyze_hand_gestures(hand_landmarks, image_shape, previous_hand_positions=None):
    """
    Analyze hand landmarks for interview-relevant gestures
    Returns gesture type and interview-specific feedback
    """
    # Get image dimensions
    h, w, _ = image_shape
    
    # Extract key landmarks
    wrist = hand_landmarks.landmark[mp_hands.HandLandmark.WRIST]
    thumb_tip = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]
    index_tip = hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_TIP]
    middle_tip = hand_landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_TIP]
    ring_tip = hand_landmarks.landmark[mp_hands.HandLandmark.RING_FINGER_TIP]
    pinky_tip = hand_landmarks.landmark[mp_hands.HandLandmark.PINKY_TIP]
    
    # Check for excessive movement (if we have previous positions)
    # This can indicate nervousness in an interview
    excessive_movement = False
    if previous_hand_positions is not None:
        movement_distance = math.sqrt(
            (wrist.x - previous_hand_positions[0])**2 + 
            (wrist.y - previous_hand_positions[1])**2
        )
        excessive_movement = movement_distance > 0.05  # Threshold for rapid movement
    
    # Check for closed fist (often indicates tension)
    all_fingers_bent = (
        index_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_PIP].y and
        middle_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_PIP].y and
        ring_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.RING_FINGER_PIP].y and
        pinky_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.PINKY_TIP].y
    )
    
    # Check for open palm (positive gesture in interviews)
    fingers_extended = (
        thumb_tip.x > hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_IP].x and
        index_tip.y < hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_PIP].y and
        middle_tip.y < hand_landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_PIP].y and
        ring_tip.y < hand_landmarks.landmark[mp_hands.HandLandmark.RING_FINGER_PIP].y and
        pinky_tip.y < hand_landmarks.landmark[mp_hands.HandLandmark.PINKY_TIP].y
    )
    
    # Check for pointing gesture (can be assertive but overuse is negative)
    pointing = (
        index_tip.y < hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_PIP].y and
        middle_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_PIP].y and
        ring_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.RING_FINGER_PIP].y and
        pinky_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.PINKY_TIP].y
    )
    
    # Check for hand near face (nervous habit in interviews)
    hand_near_face = wrist.y < 0.3  # Assuming top 30% of frame is face region
    
    # Check for thumbs up (positive affirmation)
    thumbs_up = (
        thumb_tip.y < wrist.y and  # Thumb is above wrist
        thumb_tip.x > hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_IP].x and
        index_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.INDEX_FINGER_PIP].y and
        middle_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.MIDDLE_FINGER_PIP].y and
        ring_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.RING_FINGER_PIP].y and
        pinky_tip.y > hand_landmarks.landmark[mp_hands.HandLandmark.PINKY_TIP].y
    )
    
    # Determine the primary gesture and interview-specific feedback
    if excessive_movement:
        return "excessive_movement", "Try to keep hands more still - reduces appearance of nervousness"
    elif hand_near_face:
        return "hand_near_face", "Avoid touching face during interview - shows more confidence"
    elif thumbs_up:
        return "thumbs_up", "Thumbs up is positive but use sparingly in professional interviews"
    elif all_fingers_bent:
        return "closed_fist", "Relax your hands - clenched fists may signal tension to interviewer"
    elif pointing:
        return "pointing", "Pointing can emphasize key points, but use judiciously"
    elif fingers_extended:
        return "open_palm", "Good open palm gesture - conveys honesty and openness"
    else:
        return "neutral", "Neutral hand position is appropriate"

def analyze_eye_contact(face_landmarks, image_shape):
    """
    Analyze face landmarks to determine if making eye contact
    Returns boolean and interview-specific feedback
    """
    h, w, _ = image_shape
    
    # Get relevant landmarks (nose and eyes)
    nose_tip = face_landmarks.landmark[1]
    left_eye = face_landmarks.landmark[159]  # Left eye center
    right_eye = face_landmarks.landmark[386]  # Right eye center
    
    # Convert to pixel coordinates
    nose_x, nose_y = int(nose_tip.x * w), int(nose_tip.y * h)
    
    # Define center region (where the camera is)
    center_x, center_y = w // 2, h // 2
    
    # For interviews, eye contact should be maintained but not constant staring
    # Check if looking generally forward (towards camera)
    looking_forward = abs(nose_x - center_x) < (w // 8)
    
    # Check if eyes are level (not looking up/down too much)
    eyes_level = abs(left_eye.y - right_eye.y) < 0.02
    
    # Combined check for good interview eye contact
    good_eye_contact = looking_forward and eyes_level
    
    if good_eye_contact:
        feedback = "Good eye contact - shows confidence and engagement"
    elif not looking_forward:
        feedback = "Try to face the interviewer directly"
    elif not eyes_level:
        feedback = "Keep your gaze level - avoid looking up or down too much"
    else:
        feedback = "Improve eye contact to build rapport"
        
    return good_eye_contact, feedback

def analyze_interview_posture(pose_landmarks):
    """
    Analyze pose landmarks for interview-appropriate posture
    Returns boolean and interview-specific feedback
    """
    # Get shoulder landmarks
    left_shoulder = pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_SHOULDER]
    right_shoulder = pose_landmarks.landmark[mp_pose.PoseLandmark.RIGHT_SHOULDER]
    
    # Get hip landmarks
    left_hip = pose_landmarks.landmark[mp_pose.PoseLandmark.LEFT_HIP]
    right_hip = pose_landmarks.landmark[mp_pose.PoseLandmark.RIGHT_HIP]
    
    # Check for shoulder slumping (bad in interviews)
    shoulder_slope = abs(left_shoulder.y - right_shoulder.y)
    
    # Check for leaning (should sit straight in interviews)
    hip_slope = abs(left_hip.y - right_hip.y)
    
    # Check for spine straightness (important for interview posture)
    left_alignment = abs(left_shoulder.x - left_hip.x)
    right_alignment = abs(right_shoulder.x - right_hip.x)
    
    # Check for forward lean (slight forward lean is good for engagement)
    shoulders_forward = (left_shoulder.z < -0.05) and (right_shoulder.z < -0.05)
    
    # Interview-specific posture metrics
    straight_shoulders = shoulder_slope < 0.05
    straight_hips = hip_slope < 0.05
    straight_spine = (left_alignment < 0.1 and right_alignment < 0.1)
    
    # Combined check for good interview posture
    good_posture = straight_shoulders and straight_hips and straight_spine
    
    # Generate interview-specific feedback
    if not straight_shoulders:
        feedback = "Keep shoulders level to project confidence"
    elif not straight_spine:
        feedback = "Sit up straight - shows engagement and professionalism"
    elif not shoulders_forward:
        feedback = "Lean slightly forward to show interest"
    elif good_posture:
        feedback = "Good interview posture - projects professionalism"
    else:
        feedback = "Adjust posture to appear more confident"
        
    return good_posture, feedback

def apply_smoothing(current, history, history_list, confidence_threshold=0.6):
    """Apply temporal smoothing to reduce flickering feedback"""
    # Add current to history
    history_list.append(current)
    
    # Keep only recent history
    if len(history_list) > MAX_HISTORY:
        history_list.pop(0)
    
    # Count occurrences
    counts = {}
    for item in history_list:
        if item[0] not in counts:
            counts[item[0]] = 0
        counts[item[0]] += 1
    
    # Find most common
    if not counts:
        return current  # Return current if no history
    
    most_common = max(counts.items(), key=lambda x: x[1])
    confidence = most_common[1] / len(history_list)
    
    # Only return if confidence is high enough
    if confidence >= confidence_threshold:
        for item in history_list:
            if item[0] == most_common[0]:
                return item
    
    return current

def process_frame(image, prev_hand_pos=None):
    """Process a single frame for interview-specific feedback"""
    
    # Convert the BGR image to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Process with MediaPipe
    with mp_hands.Hands(static_image_mode=False, 
                       max_num_hands=2, 
                       min_detection_confidence=0.5) as hands, \
         mp_face_mesh.FaceMesh(static_image_mode=False,
                              max_num_faces=1,
                              min_detection_confidence=0.5) as face_mesh, \
         mp_pose.Pose(static_image_mode=False,
                     min_detection_confidence=0.5) as pose:
        
        # Process for all landmarks
        hand_results = hands.process(image_rgb)
        face_results = face_mesh.process(image_rgb)
        pose_results = pose.process(image_rgb)
        
        # Track current hand position for movement analysis
        current_hand_pos = prev_hand_pos
        
        # Interview-focused hand gesture analysis
        if hand_results.multi_hand_landmarks:
            for hand_landmarks in hand_results.multi_hand_landmarks:
                
                # Track wrist position for movement analysis
                wrist = hand_landmarks.landmark[mp_hands.HandLandmark.WRIST]
                current_hand_pos = (wrist.x, wrist.y)
                
                # Interview-specific gesture analysis
                gesture, feedback = analyze_hand_gestures(
                    hand_landmarks, 
                    image.shape, 
                    prev_hand_pos
                )
                
                # Apply smoothing
                global gesture_history
                gesture, feedback = apply_smoothing(
                    (gesture, feedback), 
                    gesture_history, 
                    gesture_history
                )
                
                # Update analytics
                analytics.update_gesture(gesture)
                
        
        # Interview-focused eye contact analysis
        if face_results.multi_face_landmarks:
            for face_landmarks in face_results.multi_face_landmarks:
                
                # Interview-specific eye contact analysis
                has_eye_contact, eye_feedback = analyze_eye_contact(
                    face_landmarks, 
                    image.shape
                )
                
                # Apply smoothing
                global eye_contact_history
                has_eye_contact, eye_feedback = apply_smoothing(
                    (has_eye_contact, eye_feedback), 
                    eye_contact_history, 
                    eye_contact_history
                )
                
                # Update analytics
                analytics.update_eye_contact(has_eye_contact)
                
                # Display feedback
                status_color = (0, 255, 0) if has_eye_contact else (0, 0, 255)

        
        # Interview-focused posture analysis
        if pose_results.pose_landmarks:

            
            # Interview-specific posture analysis
            good_posture, posture_feedback = analyze_interview_posture(
                pose_results.pose_landmarks
            )
            
            # Apply smoothing
            global posture_history
            good_posture, posture_feedback = apply_smoothing(
                (good_posture, posture_feedback), 
                posture_history, 
                posture_history
            )
            
            # Update analytics
            analytics.update_posture(good_posture)
            
            # Display feedback
            status_color = (0, 255, 0) if good_posture else (0, 0, 255)
    
    return current_hand_pos

def coach_video_file(path):
    # Open video source
    cap = cv2.VideoCapture(path)
    
    # For tracking hand movement
    prev_hand_pos = None

    count = 0

    while cap.isOpened():
        count += 1

        success, image = cap.read()

        if not success or count > 10:
            break

        image = cv2.resize(image, (0 , 0), fx=0.25, fy=0.25) 
        prev_hand_pos = process_frame(image, prev_hand_pos)

    # Clean up
    cap.release()
    
    analysis = {
        "duration"    : int( analytics.get_session_duration() ),
        "eye_contact" : int( analytics.get_eye_contact_percentage() ),
        "posture"     : 100 - int( analytics.get_poor_posture_percentage() ),
    }

    gestures = []

    for gesture, count in analytics.hand_gesture_counts.items():
        if count > 0:
            gestures.append(f"{gesture}: {count} times")

    recommendations = []

    if analytics.get_eye_contact_percentage() < 60:
        recommendations.append("Work on maintaining more consistent eye contact")
    if analytics.get_poor_posture_percentage() > 30:
        recommendations.append("Focus on improving your seated posture during interviews")
    if analytics.hand_gesture_counts["hand_near_face"] > 5:
        recommendations.append("Try to avoid touching your face during interviews")
    if analytics.hand_gesture_counts["excessive_movement"] > 10:
        recommendations.append("Work on keeping your hands more still to appear confident")
    
    most_used = analytics.get_dominant_gesture()
    if most_used == "closed_fist":
        recommendations.append("Try to relax your hands more, open palms appear more honest")
    elif most_used == "pointing" and analytics.hand_gesture_counts["pointing"] > 10:
        recommendations.append("Reduce pointing gestures, they can appear too assertive")

    analysis['gestures']        = gestures
    analysis['recommendations'] = recommendations

    return analysis