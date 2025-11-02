"""
Voice Agent - Speech-to-Text (STT) and Text-to-Speech (TTS) integration.
Integrates with Captain chatbot for voice conversations.
"""
import os
from typing import Dict, Any, Optional
import requests


class VoiceAgent:
    """Voice agent for STT and TTS with Captain integration."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("COVAL_API_KEY")
        
        # Coval API endpoint (if available)
        self.coval_base_url = os.getenv("COVAL_API_URL", "https://api.coval.dev/v1")
        
        # Fallback to browser's built-in Web Speech API
        self.use_web_speech = not self.api_key
        
        if self.use_web_speech:
            print("[INFO] Using browser Web Speech API for voice")
        else:
            print(f"[OK] Coval voice agent initialized")
    
    def speech_to_text_web(self) -> str:
        """
        Use browser's Web Speech API for STT.
        Returns JavaScript code to enable voice input.
        """
        return """
        <script>
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        function startVoiceInput() {
            recognition.start();
            console.log('Voice recognition started');
        }
        
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log('Recognized:', transcript);
            
            // Send to Streamlit (via custom component)
            window.parent.postMessage({
                type: 'voice_input',
                text: transcript
            }, '*');
        };
        
        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
        };
        </script>
        """
    
    def text_to_speech_web(self, text: str) -> str:
        """
        Use browser's Web Speech API for TTS.
        Returns JavaScript code to speak text.
        """
        # Escape text for JavaScript
        safe_text = text.replace('"', '\\"').replace('\n', ' ')
        
        return f"""
        <script>
        const utterance = new SpeechSynthesisUtterance("{safe_text}");
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        
        // Try to use a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') ||
            voice.lang.includes('en-US')
        );
        
        if (preferredVoice) {{
            utterance.voice = preferredVoice;
        }}
        
        window.speechSynthesis.speak(utterance);
        console.log('Speaking:', "{safe_text[:50]}...");
        </script>
        """
    
    def coval_text_to_speech(self, text: str, voice: str = "default") -> Dict[str, Any]:
        """
        Use Coval API for TTS.
        
        Args:
            text: Text to convert to speech
            voice: Voice ID to use
            
        Returns:
            Dict with audio_url or error
        """
        if not self.api_key:
            return {"error": "Coval API key not configured"}
        
        url = f"{self.coval_base_url}/tts"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "text": text,
            "voice": voice,
            "format": "mp3"
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[ERROR] Coval TTS failed: {e}")
            return {"error": str(e)}
    
    def coval_speech_to_text(self, audio_data: bytes) -> Dict[str, Any]:
        """
        Use Coval API for STT.
        
        Args:
            audio_data: Audio bytes
            
        Returns:
            Dict with transcript or error
        """
        if not self.api_key:
            return {"error": "Coval API key not configured"}
        
        url = f"{self.coval_base_url}/stt"
        
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
        
        files = {
            "audio": audio_data
        }
        
        try:
            response = requests.post(url, files=files, headers=headers, timeout=30)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"[ERROR] Coval STT failed: {e}")
            return {"error": str(e)}


def get_voice_agent() -> VoiceAgent:
    """Get configured voice agent."""
    return VoiceAgent()

