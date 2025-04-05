import { SourceTextModule } from "vm";

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
            const response = await fetch('http://localhost:5000/api/start_interview', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    interviewer,
                    interview_type: interviewType,
                    focus_areas: focusAreas,
                    job_link: jobLink,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to start interview: ${response.statusText}`);
            }

            const data = await response.json();
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
    public async processUserResponse(audioBlob: Blob, transcript: string): Promise<{text: string, isFinished: boolean}> {
        if (!this.sessionId) {
            throw new Error('No active interview session');
        }

        // Add user response to the responses array
        this.responses.push({
            text: transcript,
            type: 'user',
            timestamp: Date.now(),
            videoBlob: audioBlob,
            audioBlob: audioBlob
        });

        // Call the API to get the next response
        try {
            const responseApiUrl = `http://localhost:5000/api/interview/${this.sessionId}/next_response`;
            const responseResult = await fetch(responseApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    transcription: transcript
                }),
            });

            if (!responseResult.ok) {
                throw new Error(`Failed to get next response: ${responseResult.statusText}`);
            }

            const responseData = await responseResult.json();

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
            const questionApiUrl = `http://localhost:5000/api/interview/${this.sessionId}/next_question`;
            const questionResult = await fetch(questionApiUrl);

            if (!questionResult.ok) {
                throw new Error(`Failed to get next question: ${questionResult.statusText}`);
            }

            const questionData = await questionResult.json();

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
                rate: 0.9,
                pitch: 1,
                elevenlabsVoiceId: '5Q0t7uMcjvnagumLfvZi' // Liam voice (friendly male)
            },
            'jeff': {
                voice: 'en-US-DavisNeural',
                rate: 1,
                pitch: -1,
                elevenlabsVoiceId: 'ZQe5CZNOzWyzPSCn5a3c' // Jeremy voice (deep, professional)
            },
            'karen': {
                voice: 'en-US-JennyNeural',
                rate: 1.1,
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

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': this.elevenlabsApiKey!
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.9,
                    speed: config.rate,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
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
