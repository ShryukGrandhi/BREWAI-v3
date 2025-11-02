import streamlit as st
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(page_title="Voice & Chat", page_icon="🎤", layout="wide")

st.markdown("""
<style>
    .main { background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); color: white; }
    h1, h2, h3 { color: white; }
    .stButton button {
        background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        padding: 12px 24px;
        font-weight: 600;
        border: none;
        transition: all 0.3s ease;
    }
    .stButton button:hover {
        background-image: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        transform: translateY(-2px);
        box-shadow: 0 6px 12px rgba(102, 126, 234, 0.4);
    }
    .chat-card {
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
        padding: 25px;
        border-radius: 15px;
        border: 2px solid #667eea;
        margin: 15px 0;
    }
    .stChatMessage {
        background: #2a2a3e;
        border-radius: 12px;
        padding: 15px;
        margin: 10px 0;
        border: 1px solid #667eea;
    }
    .voice-btn {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        color: white;
        padding: 20px;
        border-radius: 50%;
        width: 100px;
        height: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 20px auto;
        cursor: pointer;
        font-size: 40px;
    }
</style>
""", unsafe_allow_html=True)

st.title("🎤 Voice & Chat Assistant")
st.caption("Powered by NIVARA (Voice) + CAPTAIN (Knowledge)")

# Initialize
if 'messages' not in st.session_state:
    st.session_state.messages = []
if 'voice_active' not in st.session_state:
    st.session_state.voice_active = False

# Tabs
tab1, tab2 = st.tabs(["💬 Text Chat", "🎤 Voice Chat"])

with tab1:
    st.markdown("### 💬 Captain AI Chat with Full Data Access")
    st.info("🧠 Captain has access to: Orders, Inventory, Staff, Reviews, Menu - ALL CSV data loaded!")
    
    # Load all data on first load
    if 'data_loaded' not in st.session_state:
        with st.spinner("Loading ALL project data into Captain..."):
            from services.captain_knowledge_loader import load_all_data_for_captain
            st.session_state.full_knowledge = load_all_data_for_captain()
            st.session_state.data_loaded = True
            st.success(f"✅ Loaded: {', '.join(st.session_state.full_knowledge['data_loaded'])}")
    
    # Display chat
    for msg in st.session_state.messages:
        with st.chat_message(msg["role"]):
            st.markdown(msg["content"])
    
    # Chat input
    if prompt := st.chat_input("Ask about orders, inventory, staff, reviews, menu, anything..."):
        st.session_state.messages.append({"role": "user", "content": prompt})
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # STEP 1: CAPTAIN analyzes and answers
        with st.chat_message("assistant"):
            from services.captain_client import get_captain_client
            from services.captain_knowledge_loader import format_knowledge_for_captain
            import google.generativeai as genai
            import os
            import plotly.graph_objects as go
            import json
            
            captain_answer = None
            
            try:
                captain = get_captain_client()
                
                if captain:
                    with st.spinner("🧠 CAPTAIN analyzing all data..."):
                        full_context = format_knowledge_for_captain(st.session_state.full_knowledge)
                        
                        enriched_prompt = f"""{full_context}

USER QUESTION: {prompt}

Answer using specific data from the knowledge above. Include numbers, names, and details."""
                        
                        response = captain.query("operations", enriched_prompt)
                        captain_answer = response.get('answer', 'I could not find that information.')
                        
                        st.markdown("### 🧠 CAPTAIN's Analysis:")
                        st.markdown(captain_answer)
                else:
                    raise Exception("Captain not available")
                    
            except Exception as e:
                st.warning(f"Captain unavailable: {e}")
                captain_answer = f"Unable to analyze: {prompt}"
                st.markdown(captain_answer)
            
            # STEP 2: GEMINI reads Captain's output and generates a graph
            if captain_answer and "could not find" not in captain_answer.lower():
                with st.spinner("📊 GEMINI generating visualization from Captain's analysis..."):
                    try:
                        api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyCcw2F4nOy-5kkSSEdpfsK4LuDWcepspCY')
                        genai.configure(api_key=api_key)
                        model = genai.GenerativeModel('gemini-pro')
                        
                        graph_prompt = f"""Based on this question and Captain's answer, determine what graph would visualize this best.

USER QUESTION: {prompt}
CAPTAIN'S ANSWER: {captain_answer}

Respond with ONLY a JSON object:
{{
    "graph_type": "bar|line|pie|none",
    "x_data": ["label1", "label2"],
    "y_data": [10, 20],
    "title": "Graph Title",
    "x_label": "X Axis",
    "y_label": "Y Axis"
}}

If no graph needed, use graph_type: "none"."""
                        
                        gemini_response = model.generate_content(graph_prompt)
                        gemini_text = gemini_response.text
                        
                        if "```json" in gemini_text:
                            json_str = gemini_text.split("```json")[1].split("```")[0].strip()
                        elif "```" in gemini_text:
                            json_str = gemini_text.split("```")[1].split("```")[0].strip()
                        else:
                            json_str = gemini_text.strip()
                        
                        graph_spec = json.loads(json_str)
                        graph_type = graph_spec.get('graph_type', 'none')
                        
                        if graph_type != 'none':
                            st.markdown("---")
                            st.markdown("### 📊 GEMINI's Auto-Generated Visualization:")
                            
                            if graph_type == 'bar':
                                fig = go.Figure(data=[go.Bar(
                                    x=graph_spec['x_data'],
                                    y=graph_spec['y_data'],
                                    marker_color='#667eea'
                                )])
                            elif graph_type == 'line':
                                fig = go.Figure(data=[go.Scatter(
                                    x=graph_spec['x_data'],
                                    y=graph_spec['y_data'],
                                    mode='lines+markers',
                                    line=dict(color='#00ff88', width=3)
                                )])
                            elif graph_type == 'pie':
                                fig = go.Figure(data=[go.Pie(
                                    labels=graph_spec['x_data'],
                                    values=graph_spec['y_data'],
                                    hole=0.4
                                )])
                            
                            if graph_type in ['bar', 'line', 'pie']:
                                fig.update_layout(
                                    title=graph_spec.get('title', 'Analysis'),
                                    template='plotly_dark',
                                    paper_bgcolor='rgba(0,0,0,0)',
                                    height=400,
                                    font=dict(color='white')
                                )
                                st.plotly_chart(fig, use_container_width=True, key=f"gemini_{len(st.session_state.messages)}")
                    
                    except Exception as e:
                        st.info(f"Gemini visualization: {str(e)[:100]}")
            
            st.session_state.messages.append({"role": "assistant", "content": captain_answer})

with tab2:
    st.markdown("### 🎤 Voice Assistant (Speech-to-Text)")
    st.info("🎙️ Speak your question → Captain answers with full data access")
    
    # Voice recording using audio_input
    audio_value = st.audio_input("🎤 Click to record your voice question", key="voice_input")
    
    if audio_value is not None:
        st.success("✅ Audio received!")
        
        # Convert audio to text (STT)
        st.markdown("### 🔄 Converting speech to text...")
        
        try:
            # Use Google Speech-to-Text API
            import speech_recognition as sr
            import io
            
            recognizer = sr.Recognizer()
            audio_bytes = audio_value.read()
            
            with sr.AudioFile(io.BytesIO(audio_bytes)) as source:
                audio_data = recognizer.record(source)
                
                with st.spinner("🧠 Processing speech..."):
                    # Try Google Speech Recognition
                    try:
                        text = recognizer.recognize_google(audio_data)
                        st.success(f"✅ You said: **{text}**")
                        
                        # Get Captain response
                        st.markdown("### 🧠 Captain Analyzing...")
                        
                        from services.captain_client import get_captain_client
                        from services.captain_knowledge_loader import format_knowledge_for_captain
                        
                        try:
                            captain = get_captain_client()
                            
                            if captain:
                                full_context = format_knowledge_for_captain(st.session_state.get('full_knowledge', {}))
                                enriched_prompt = f"""{full_context}

USER QUESTION (via voice): {text}

Answer with specific data and details."""
                                
                                response = captain.query("operations", enriched_prompt)
                                answer = response.get('answer', 'I could not find that information.')
                            else:
                                raise Exception("Captain not available")
                        
                        except:
                            # Gemini fallback
                            import google.generativeai as genai
                            import os
                            
                            api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyCcw2F4nOy-5kkSSEdpfsK4LuDWcepspCY')
                            genai.configure(api_key=api_key)
                            model = genai.GenerativeModel('gemini-pro')
                            
                            gemini_response = model.generate_content(f"Restaurant operations question: {text}")
                            answer = gemini_response.text
                        
                        st.markdown("### 💬 CAPTAIN's Response:")
                        st.markdown(answer)
                        
                        # STEP 3: Gemini TTS reads Captain's response out loud
                        st.markdown("### 🔊 STEP 3: GEMINI TTS Reading Response...")
                        
                        with st.spinner("Generating voice with Gemini 2.5 Flash Preview TTS..."):
                            try:
                                import google.generativeai as genai
                                import os
                                import base64
                                
                                # Use the TTS-specific API key
                                tts_api_key = os.getenv('GEMINI_TTS_API_KEY', 'AIzaSyBESaysiC5ZMNaZrLQcyuzAMefX40NBqUI')
                                genai.configure(api_key=tts_api_key)
                                
                                # Correct TTS API call for Gemini 2.5 Flash TTS
                                # Must explicitly request AUDIO response modality
                                tts_model = genai.GenerativeModel(
                                    'gemini-2.5-flash-preview-tts',
                                    generation_config={
                                        'response_modalities': ['AUDIO']
                                    }
                                )
                                
                                # Generate audio from text (no TEXT modality!)
                                tts_response = tts_model.generate_content(answer)
                                
                                # Extract Base64 audio data from response
                                audio_generated = False
                                
                                # Check if response has audio data
                                if hasattr(tts_response, 'parts'):
                                    for part in tts_response.parts:
                                        # Look for inline_data with audio
                                        if hasattr(part, 'inline_data'):
                                            audio_base64 = part.inline_data.data
                                            mime_type = part.inline_data.mime_type
                                            
                                            # Decode Base64 audio
                                            audio_bytes = base64.b64decode(audio_base64)
                                            
                                            # Determine format from mime_type
                                            audio_format = 'audio/wav' if 'wav' in mime_type else 'audio/mp3'
                                            
                                            # Display audio player
                                            st.audio(audio_bytes, format=audio_format)
                                            st.success(f"🔊 Voice generated by Gemini TTS! Press play above ▶️")
                                            audio_generated = True
                                            break
                                
                                if not audio_generated:
                                    # Fallback: Show text that would be spoken
                                    st.info("🔊 Gemini TTS (Text-to-Speech mode):")
                                    st.text_area("Voice Script", answer, height=150, key=f"tts_text_{text[:10]}")
                                    st.caption("*Audio generation in progress - may require TTS API activation*")
                                
                            except Exception as e:
                                st.warning(f"Gemini TTS: {str(e)[:150]}")
                                st.info("🔊 Voice simulation (TTS unavailable):")
                                st.text_area("Would be read aloud:", answer, height=150, key=f"tts_fallback_{text[:10]}")
                                st.caption("*Tip: Ensure GEMINI_TTS_API_KEY is set with TTS access*")
                        
                    except sr.UnknownValueError:
                        st.error("Could not understand audio. Please speak clearly and try again.")
                    except sr.RequestError:
                        st.error("STT service unavailable. Please type your question in Text Chat tab.")
        
        except Exception as e:
            st.error(f"Voice processing error: {e}")
            st.warning("💡 **Alternative:** Type your question in the Text Chat tab above")
    
    else:
        st.markdown("""
        ### 🎙️ How to Use Voice Chat:
        
        1. **Click** the microphone button above
        2. **Allow** microphone permissions in your browser
        3. **Speak** your question clearly
        4. **Wait** for Captain to process and respond
        5. **Hear** the voice response
        
        **Example questions:**
        - "How many orders did we have today?"
        - "What items are low in inventory?"
        - "Who's working tomorrow?"
        - "What's our most popular menu item?"
        
        **Powered by:**
        - 🎤 Google Speech-to-Text (STT)
        - 🧠 CAPTAIN RAG (Answer generation)
        - 🔊 NIVARA Voice (TTS)
        - 🔄 Gemini (Fallback)
        """)

st.caption("🎤 Voice: NIVARA TTS/STT • Knowledge: CAPTAIN RAG • Fallback: Gemini")

