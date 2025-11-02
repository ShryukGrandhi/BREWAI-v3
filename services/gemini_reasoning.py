"""
Gemini AI Reasoning Engine - Shows Full Thinking Process
"""
import os
import google.generativeai as genai
from typing import Dict, Any


class GeminiReasoningEngine:
    """Uses Gemini to show full AI thinking process."""
    
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyCcw2F4nOy-5kkSSEdpfsK4LuDWcepspCY')
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-pro')
    
    def generate_with_reasoning(self, prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate content with full visible reasoning chain.
        
        Returns:
            - thinking_process: Step-by-step reasoning
            - evaluations: What it considered
            - final_output: The actual generated content
        """
        
        full_prompt = f"""You are an AI automation engine for a restaurant crisis.

CONTEXT:
{context}

TASK:
{prompt}

RESPONSE FORMAT (REQUIRED):
Provide your response in this exact structure:

THINKING PROCESS:
[Show your step-by-step thought process here - what you're considering, why]

EVALUATIONS:
[List what factors you're evaluating - urgency, tone, legal requirements, etc.]

DECISION CHAIN:
[Show how you arrived at your decisions - if X then Y reasoning]

FINAL OUTPUT:
[The actual document/email/contract you're generating]

Be extremely detailed in showing your reasoning.
"""
        
        try:
            response = self.model.generate_content(full_prompt)
            text = response.text
            
            # Parse response
            sections = {}
            current_section = None
            current_content = []
            
            for line in text.split('\n'):
                if 'THINKING PROCESS:' in line:
                    if current_section:
                        sections[current_section] = '\n'.join(current_content)
                    current_section = 'thinking'
                    current_content = []
                elif 'EVALUATIONS:' in line:
                    if current_section:
                        sections[current_section] = '\n'.join(current_content)
                    current_section = 'evaluations'
                    current_content = []
                elif 'DECISION CHAIN:' in line:
                    if current_section:
                        sections[current_section] = '\n'.join(current_content)
                    current_section = 'decisions'
                    current_content = []
                elif 'FINAL OUTPUT:' in line:
                    if current_section:
                        sections[current_section] = '\n'.join(current_content)
                    current_section = 'output'
                    current_content = []
                else:
                    current_content.append(line)
            
            if current_section:
                sections[current_section] = '\n'.join(current_content)
            
            return {
                'success': True,
                'thinking_process': sections.get('thinking', '').strip(),
                'evaluations': sections.get('evaluations', '').strip(),
                'decision_chain': sections.get('decisions', '').strip(),
                'final_output': sections.get('output', '').strip(),
                'raw_response': text
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'thinking_process': 'Error occurred',
                'evaluations': 'Could not evaluate',
                'decision_chain': 'Could not process',
                'final_output': 'Generation failed'
            }


def get_gemini_engine():
    """Get Gemini reasoning engine."""
    return GeminiReasoningEngine()

