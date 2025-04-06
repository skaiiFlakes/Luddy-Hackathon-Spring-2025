import { SourceTextModule } from "vm";
import axios from 'axios';

export interface InterviewResponse {
    text: string;
    type: 'ai' | 'user';
    timestamp: number;
    startTimestamp?: number;
    endTimestamp?: number;
    videoBlob?: Blob;
    audioBlob?: Blob;
}

export interface AudioConfig {
    voice: string;
    rate: number;
    pitch: number;
    elevenlabsVoiceId?: string;
}

class AIInterviewService {
    private responses: InterviewResponse[] = [];
    private sessionId: string | null = null;
    private audioContext: AudioContext | null = null;
    private elevenlabsApiKey: string | null = null;
    private useElevenlabs: boolean = false;
    private interviewerName: string = 'todd';
    private interviewFinished: boolean = false;
    private host = "http://localhost:5000";

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    // Start a new interview session
    public async startInterview(
        interviewer: string,
        interviewType: string,
        focusAreas: string[] = [],
        jobLink: string = ''
    ): Promise<string> {
        this.interviewerName = interviewer;
        this.responses = [];
        this.interviewFinished = false;

        // Call the API to start a new interview
        try {
            console.log(`Starting interview with ${interviewer}...`);

            // Create FormData to handle file upload
            const formData = new FormData();

            // Add form fields directly
            formData.append('interviewer', interviewer);
            formData.append('interview_type', interviewType);
            formData.append('focus_areas', JSON.stringify(focusAreas));
            formData.append('job_link', jobLink);

            // Check for resume from different sources
            let resumeData = null;

            // First check sessionStorage for a special resume (from the modal)
            const specialResume = localStorage.getItem('specialResume');
            if (specialResume) {
                resumeData = JSON.parse(specialResume);
                console.log('Using special resume from session storage');

                // Clear the session storage after use
                localStorage.removeItem('specialResume');
            }

            // If no special resume, check localStorage for general resume
            if (!resumeData) {
                const generalResume = localStorage.getItem('generalResume');
                if (generalResume) {
                    resumeData = JSON.parse(generalResume);
                    console.log('Using general resume from local storage');
                }
            }

            // If we have resume data with content, add it to the form
            if (resumeData && resumeData.content) {
                // The content should be a base64 string
                const contentStr = resumeData.content.toString();
                // Check if it's a data URL (starts with data:)
                if (contentStr.startsWith('data:')) {
                    // Convert base64 to blob
                    const byteString = atob(contentStr.split(',')[1]);
                    const mimeString = contentStr.split(',')[0].split(':')[1].split(';')[0];
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);

                    for (let i = 0; i < byteString.length; i++) {
                        ia[i] = byteString.charCodeAt(i);
                    }

                    const blob = new Blob([ab], { type: mimeString });
                    formData.append('file', blob, 'resume.pdf');
                    console.log('Resume added to form data');
                } else {
                    console.error('Resume content is not in expected format');
                }
            } else {
                console.log('No resume found to include in the request');
            }

            const response = await axios.post(`${this.host}/api/start_interview`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                withCredentials: true, // Include cookies if authentication is cookie-based
            });

            const data = response.data;
            console.log(data)
            this.sessionId = data.session_id;

            // Store the introduction as the first AI response
            const introductionResponse: InterviewResponse = {
                text: data.introduction,
                type: 'ai',
                timestamp: Date.now(),
                startTimestamp: Date.now()
            };

            this.responses.push(introductionResponse);

            return data.introduction;
        } catch (error) {
            console.error('Error starting interview:', error);
            throw error;
        }
    }

    // Process user response and get the next AI step
    public async processUserResponse(audioData: string): Promise<{text: string, isFinished: boolean}> {
        if (!this.sessionId) {
            throw new Error('No active interview session');
        }

        // Add user response to the responses array
        this.responses.push({
            text: '', // Empty text since we don't have transcription
            type: 'user',
            timestamp: Date.now()
        });

        // Call the API to get the next response
        try {
            const responseApiUrl = `${this.host}/api/interview/${this.sessionId}/next_response`;

            const responseResult = await axios.post(responseApiUrl, {
                data: audioData
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true, // Include cookies if authentication is cookie-based
            });

            const responseData = responseResult.data;

            // Add AI response to the responses array
            const aiResponse: InterviewResponse = {
                text: responseData.interviewer_reply,
                type: 'ai',
                timestamp: Date.now(),
                startTimestamp: Date.now()
            };

            this.responses.push(aiResponse);

            // If it's a follow-up, return the reply directly
            if (responseData.is_follow_up) {
                return {
                    text: responseData.interviewer_reply,
                    isFinished: false
                };
            }

            // If it's not a follow-up, get the next question
            const questionApiUrl = `${this.host}/api/interview/${this.sessionId}/next_question`;
            const questionResult = await axios.get(questionApiUrl, {
                withCredentials: true, // Include cookies if authentication is cookie-based
            });

            const questionData = questionResult.data;

            let nextText: string;
            let isFinished: boolean = questionData.finished;

            if (questionData.finished) {
                nextText = questionData.closer;
                this.interviewFinished = true;
            } else {
                nextText = questionData.question;
            }

            // Add the question or closer as an AI response
            const questionResponse: InterviewResponse = {
                text: nextText,
                type: 'ai',
                timestamp: Date.now(),
                startTimestamp: Date.now()
            };

            this.responses.push(questionResponse);

            return {
                text: nextText,
                isFinished: isFinished
            };
        } catch (error) {
            console.error('Error processing user response:', error);
            throw error;
        }
    }

    // Update the timestamp for the last AI response (marks when it finished speaking)
    public updateLastAIResponseEndTime(endTimestamp: number): void {
        const lastAIResponse = [...this.responses].reverse().find(r => r.type === 'ai');
        if (lastAIResponse) {
            lastAIResponse.endTimestamp = endTimestamp;
        }
    }

    // Check if the interview is complete
    public isInterviewComplete(): boolean {
        return this.interviewFinished;
    }

    // Set ElevenLabs API key
    public setElevenlabsApiKey(apiKey: string): void {
        this.elevenlabsApiKey = apiKey;
        this.useElevenlabs = true;
    }

    // Get audio configuration based on interviewer
    public getAudioConfig(): AudioConfig {
        const voiceConfigs: Record<string, AudioConfig> = {
            'todd': {
                voice: 'en-US-BryanNeural',
                rate: 1,
                pitch: 1,
                elevenlabsVoiceId: '5Q0t7uMcjvnagumLfvZi' // Liam voice (friendly male)
            },
            'jeff': {
                voice: 'en-US-DavisNeural',
                rate: 1.1,
                pitch: -1,
                elevenlabsVoiceId: 'ZQe5CZNOzWyzPSCn5a3c' // Jeremy voice (deep, professional)
            },
            'karen': {
                voice: 'en-US-JennyNeural',
                rate: 1.2,
                pitch: 2,
                elevenlabsVoiceId: '5PWbsfogbLtky5sxqtBz'//'jsCqWAovK2LkecY7zXl4'  // Freya voice (female)
            },
            'creep': {
                voice: 'en-US-JennyNeural',
                rate: 0.8,
                pitch: 1,
                elevenlabsVoiceId: 'g5CIjZEefAph4nQFvHAz' // Ethan voice (male)
            }
        };

        return voiceConfigs[this.interviewerName] || voiceConfigs.todd;
    }

    // Play text as speech using ElevenLabs or Web Speech API
    public async speakText(text: string): Promise<void> {
        const config = this.getAudioConfig();

        // Try ElevenLabs if enabled and API key is available
        if (this.useElevenlabs && this.elevenlabsApiKey && config.elevenlabsVoiceId) {
            try {
                await this.speakWithElevenlabs(text, config.elevenlabsVoiceId);
                return;
            } catch (error) {
                console.error("Error with ElevenLabs TTS, falling back to Web Speech API:", error);
                // Fall back to Web Speech API
            }
        }

        // Use the Web Speech API as fallback
        return this.speakWithWebSpeechAPI(text, config);
    }

    // Speak text using ElevenLabs API
    private async speakWithElevenlabs(text: string, voiceId: string): Promise<void> {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const config = this.getAudioConfig();

        try {
            const response = await axios.post(url, {
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.9,
                    speed: config.rate,
                }
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': this.elevenlabsApiKey!
                },
                responseType: 'blob'
            });

            const audioBlob = response.data;
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);

            return new Promise((resolve) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    // Update the end timestamp for the last AI response
                    this.updateLastAIResponseEndTime(Date.now());
                    resolve();
                };
                audio.play();
            });
        } catch (error) {
            console.error('Error with ElevenLabs TTS:', error);
            throw error;
        }
    }

    // Enhanced Web Speech API implementation
    private speakWithWebSpeechAPI(text: string, config: AudioConfig): Promise<void> {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                console.error("Browser doesn't support speech synthesis");
                resolve();
                return;
            }

            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            let sentenceIndex = 0;

            const speakNextSentence = () => {
                if (sentenceIndex >= sentences.length) {
                    // Update the end timestamp for the last AI response
                    this.updateLastAIResponseEndTime(Date.now());
                    resolve();
                    return;
                }

                const sentence = sentences[sentenceIndex].trim();
                sentenceIndex++;

                const utterance = new SpeechSynthesisUtterance(sentence);

                // Load voices if not already loaded
                let voices = window.speechSynthesis.getVoices();
                if (!voices.length) {
                    window.speechSynthesis.onvoiceschanged = () => {
                        voices = window.speechSynthesis.getVoices();
                        setVoiceAndSpeak();
                    };
                } else {
                    setVoiceAndSpeak();
                }

                function setVoiceAndSpeak() {
                    // Find a matching voice or use the first available one
                    const voiceName = config.voice.split('-')[2].replace('Neural', '');
                    utterance.voice = voices.find(voice =>
                        voice.name.includes(voiceName) ||
                        voice.name.toLowerCase().includes(voiceName.toLowerCase())
                    ) || voices[0];

                    utterance.rate = config.rate;
                    utterance.pitch = config.pitch;
                    // Add natural pauses between sentences
                    utterance.onend = () => {
                        setTimeout(speakNextSentence, 250); // Add a small pause between sentences
                    };

                    window.speechSynthesis.speak(utterance);
                }
            };

            speakNextSentence();
        });
    }

    // Get all interview responses
    public getResponses(): InterviewResponse[] {
        return this.responses;
    }

    // Get the session ID
    public getSessionId(): string | null {
        return this.sessionId;
    }
}

export const aiInterviewService = new AIInterviewService();
export default aiInterviewService;
