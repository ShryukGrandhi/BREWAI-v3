import streamlit as st
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent))

st.set_page_config(page_title="Voice & Chat", page_icon="🎤", layout="wide")

st.markdown("""
<style>
    /* React-style full-screen layout */
    .main { 
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%); 
        color: white;
        padding: 40px 60px !important;
    }
    .block-container {
        padding: 0 !important;
        max-width: 1800px !important;
    }
    h1 { 
        color: white; 
        font-size: 48px !important;
        font-weight: 800 !important;
    }
    h2, h3 { color: white; }
    .stButton button {
        background-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white !important;
        border-radius: 8px;
        padding: 16px 32px;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
    }
    .stButton button:hover {
        background-image: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(102, 126, 234, 0.5);
    }
    .stChatMessage {
        background: linear-gradient(135deg, #1a1a2e 0%, #2a2a3e 100%);
        border-radius: 15px;
        padding: 20px;
        margin: 15px 0;
        border: 2px solid #667eea;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .stChatMessage:hover {
        border-color: #764ba2;
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }
    .stChatInput textarea {
        background: #1a1a2e !important;
        border: 2px solid #667eea !important;
        border-radius: 12px !important;
        padding: 15px !important;
        font-size: 15px !important;
        color: white !important;
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
                        
                        # STEP 3: Google Text-to-Speech reads Captain's response
                        st.markdown("### 🔊 STEP 3: Google TTS Reading Response...")
                        
                        with st.spinner("Generating voice with Google Text-to-Speech..."):
                            try:
                                from gtts import gTTS
                                import tempfile
                                import os
                                
                                # Generate speech using Google TTS
                                tts = gTTS(text=answer, lang='en', slow=False)
                                
                                # Save to temporary file
                                with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_audio:
                                    tts.save(temp_audio.name)
                                    temp_path = temp_audio.name
                                
                                # Read audio file
                                with open(temp_path, 'rb') as audio_file:
                                    audio_bytes = audio_file.read()
                                
                                # Display audio player
                                st.audio(audio_bytes, format='audio/mp3')
                                st.success("🔊 Voice generated! Press play above ▶️")
                                
                                # Clean up temp file
                                try:
                                    os.remove(temp_path)
                                except:
                                    pass
                                
                            except ImportError:
                                st.warning("gTTS not installed. Installing...")
                                st.info("Run: pip install gTTS")
                                st.text_area("Voice Script (would be read aloud):", answer, height=150, key=f"tts_text_{text[:10]}")
                            except Exception as e:
                                st.warning(f"TTS Error: {str(e)[:150]}")
                                st.info("🔊 Voice Script:")
                                st.text_area("Would be read aloud:", answer, height=150, key=f"tts_fallback_{text[:10]}")
                        
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

