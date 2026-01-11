"""
Voice Narration Service
=======================
Generates voice summaries using Google TTS or Coval/Nivara.
"""

import os
from pathlib import Path
from datetime import datetime

def generate_voice_summary(execution_results):
    """
    Generate a voice summary of execution results.
    
    Args:
        execution_results: Dictionary of all agent results
        
    Returns:
        dict with audio file path and transcript
    """
    try:
        # Build narrative from results
        narrative = build_narrative(execution_results)
        
        # Try Google TTS first
        audio_path = generate_audio_gtts(narrative)
        
        if audio_path:
            return {
                "success": True,
                "audio_file": str(audio_path),
                "transcript": narrative,
                "method": "google_tts"
            }
        else:
            return {
                "success": True,
                "transcript": narrative,
                "audio_file": None,
                "method": "text_only"
            }
            
    except Exception as e:
        print(f"ERROR generating voice: {e}")
        return {
            "success": False,
            "error": str(e)
        }


def build_narrative(results):
    """
    Build a natural language narrative from execution results.
    
    Args:
        results: Dictionary of agent results
        
    Returns:
        str narrative
    """
    narrative_parts = []
    
    # Introduction
    narrative_parts.append("Brew AI operations summary for Charcoal Eats US.")
    
    # Data analysis
    if 'data' in results:
        data_result = results['data']
        review_count = len(data_result.get('google_reviews', [])) + len(data_result.get('csv_reviews', []))
        narrative_parts.append(f"Analyzed {review_count} customer reviews.")
    
    # Demand forecast
    if 'demand' in results:
        demand_result = results['demand']
        if demand_result.get('weather'):
            weather = demand_result['weather']
            if weather.get('daily_forecast'):
                temp = weather['daily_forecast'][0].get('temp_max', 70)
                narrative_parts.append(f"Weather forecast shows {temp} degrees tomorrow.")
    
    # Staffing
    if 'staffing' in results:
        staffing_result = results['staffing']
        shifts = staffing_result.get('shifts_generated', 0)
        tasks = staffing_result.get('tasks_created', 0)
        if shifts > 0:
            narrative_parts.append(f"Generated {shifts} optimized work shifts and created {tasks} Asana tasks.")
    
    # Inventory
    if 'inventory' in results:
        inventory_result = results['inventory']
        forms = inventory_result.get('forms_filled', 0)
        if forms > 0:
            value = inventory_result.get('total_order_value', 0)
            narrative_parts.append(f"Auto-filled {forms} supplier order forms totaling ${value:.2f}.")
    
    # Margins
    if 'margin' in results:
        margin_result = results['margin']
        items = len(margin_result.get('items', []))
        if items > 0:
            narrative_parts.append(f"Calculated profitability for {items} menu items.")
    
    # Conclusion
    narrative_parts.append("All systems operational. Brew AI continues monitoring.")
    
    return " ".join(narrative_parts)


def generate_audio_gtts(text):
    """
    Generate audio using Google Text-to-Speech.
    
    Args:
        text: Text to convert to speech
        
    Returns:
        Path to audio file or None
    """
    try:
        from gtts import gTTS
        
        # Create output directory
        output_dir = Path("artifacts/voice")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate audio
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = output_dir / f"summary_{timestamp}.mp3"
        
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(str(output_file))
        
        print(f"✅ Generated voice summary: {output_file}")
        return output_file
        
    except ImportError:
        print("WARNING: gTTS not installed, voice generation skipped")
        return None
    except Exception as e:
        print(f"ERROR generating audio: {e}")
        return None


def play_audio_in_browser(audio_path):
    """
    Generate HTML audio player for Streamlit.
    
    Args:
        audio_path: Path to audio file
        
    Returns:
        HTML string for audio player
    """
    if not audio_path or not Path(audio_path).exists():
        return None
    
    import base64
    
    # Read audio file
    with open(audio_path, 'rb') as f:
        audio_bytes = f.read()
    
    # Encode to base64
    audio_base64 = base64.b64encode(audio_bytes).decode()
    
    # Create HTML audio player
    html = f"""
    <audio controls autoplay style="width: 100%;">
        <source src="data:audio/mp3;base64,{audio_base64}" type="audio/mp3">
        Your browser does not support the audio element.
    </audio>
    """
    
    return html

