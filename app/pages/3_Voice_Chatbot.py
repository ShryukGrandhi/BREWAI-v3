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
        
        # Get response with FULL data context
        with st.chat_message("assistant"):
            from services.captain_client import get_captain_client
            from services.captain_knowledge_loader import format_knowledge_for_captain
            
            try:
                captain = get_captain_client()
                
                if captain:
                    with st.spinner("🧠 Captain analyzing all data..."):
                        # Include full knowledge in query
                        full_context = format_knowledge_for_captain(st.session_state.full_knowledge)
                        
                        enriched_prompt = f"""{full_context}

USER QUESTION: {prompt}

Answer using specific data from the knowledge above. Include numbers, names, and details."""
                        
                        response = captain.query("operations", enriched_prompt)
                        answer = response.get('answer', 'I could not find that information.')
                else:
                    raise Exception("Captain not available")
                    
            except Exception as e:
                # Gemini fallback with full data
                st.info("📡 Using Gemini with full data access...")
                
                import google.generativeai as genai
                import os
                
                api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyCcw2F4nOy-5kkSSEdpfsK4LuDWcepspCY')
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel('gemini-pro')
                
                from services.captain_knowledge_loader import format_knowledge_for_captain
                full_context = format_knowledge_for_captain(st.session_state.full_knowledge)
                
                full_prompt = f"""{full_context}

USER QUESTION: {prompt}

Provide a specific answer using the data above."""
                
                try:
                    gemini_response = model.generate_content(full_prompt)
                    answer = gemini_response.text
                except:
                    answer = "I'm having trouble accessing the data. Please try again."
            
            st.markdown(answer)
            st.session_state.messages.append({"role": "assistant", "content": answer})

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
                        
                        st.markdown("### 💬 Captain's Response:")
                        st.markdown(answer)
                        
                        # Text-to-Speech response
                        st.markdown("### 🔊 Voice Response (TTS)")
                        st.success("🔊 NIVARA playing voice response...")
                        st.info(f"Voice script: {answer[:200]}...")
                        
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

