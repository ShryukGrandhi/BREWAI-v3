"""
AnalystAgent with Captain RAG - ONLY uses Captain API, no embeddings fallback.
"""
import os
import json
from typing import Dict, Any, List

# Import Captain without triggering any embedding imports
try:
    from services.captain_client import get_captain_client, connect_captain_to_database
    CAPTAIN_AVAILABLE = True
except Exception as e:
    print(f"Captain import failed: {e}")
    CAPTAIN_AVAILABLE = False

from agents.trace_agent import get_trace_agent


class AnalystAgentCaptain:
    """Analyst agent powered by Captain RAG."""
    
    def __init__(self, tenant_id: str):
        self.tenant_id = tenant_id
        self.trace = get_trace_agent()
        self.collection_id = None
        
        # Get Captain client - will raise error if not available
        if not CAPTAIN_AVAILABLE:
            raise Exception("Captain client not available. Check installation.")
        
        try:
            self.captain = get_captain_client()
        except Exception as e:
            print(f"❌ Captain initialization failed: {e}")
            self.captain = None
    
    def run(
        self, 
        question: str,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Execute analyst workflow with Captain."""
        results = {
            "success": False,
            "artifacts": []
        }
        
        try:
            if not self.captain:
                error_msg = "Captain API not configured. Check CAPTAIN_API_KEY and CAPTAIN_ORG_ID in .env"
                self.trace.log(
                    agent="AnalystAgentCaptain",
                    action="Captain configuration error",
                    result=error_msg
                )
                raise Exception(error_msg)
            
            # Step 1: Connect to database / get collection
            self.trace.log(
                agent="AnalystAgentCaptain",
                action="Connecting Captain to database",
                metadata={"tenant_id": self.tenant_id}
            )
            
            db_result = connect_captain_to_database(self.tenant_id)
            
            if "error" in db_result:
                raise Exception(f"Captain connection failed: {db_result['error']}")
            
            self.collection_id = db_result["collection_id"]
            
            self.trace.log(
                agent="AnalystAgentCaptain",
                action="Connected to Captain collection",
                result=f"Collection: {db_result['name']} ({db_result['status']})",
                metadata=db_result
            )
            
            # Step 2: Load and upload tenant knowledge base
            self.trace.log(
                agent="AnalystAgentCaptain",
                action="Loading tenant knowledge base for Captain"
            )
            
            documents = self._load_tenant_documents()
            if documents:
                upload_result = self.captain.upload_documents(
                    self.collection_id,
                    documents
                )
                
                self.trace.log(
                    agent="AnalystAgentCaptain",
                    action="Documents ready for Captain context",
                    result=f"Loaded {len(documents)} documents",
                    metadata=upload_result
                )
            
            # Step 3: Query Captain with context
            self.trace.log(
                agent="AnalystAgentCaptain",
                action="Querying Captain RAG",
                metadata={"question": question}
            )
            
            # Build context from current state
            query_context = context or {}
            
            # Add current forecast/weather if available
            try:
                if os.path.exists("artifacts/forecast.csv"):
                    import pandas as pd
                    forecast_df = pd.read_csv("artifacts/forecast.csv")
                    peak = forecast_df.loc[forecast_df["predicted_orders"].idxmax()]
                    query_context["forecast_data"] = {
                        "peak_hour": int(peak["hour"]),
                        "peak_orders": float(peak["predicted_orders"])
                    }
            except Exception as e:
                print(f"[WARN] Could not load forecast data: {e}")
            
            try:
                if os.path.exists("artifacts/weather_features.csv"):
                    import pandas as pd
                    weather_df = pd.read_csv("artifacts/weather_features.csv")
                    query_context["weather_data"] = {
                        "rain_hours": int(weather_df["is_rain"].sum()),
                        "avg_temp": float(weather_df["temp"].mean())
                    }
            except Exception as e:
                print(f"[WARN] Could not load weather data: {e}")
            
            # Use Captain chat for conversational response
            print(f"[CAPTAIN] Sending query to Captain API...")
            
            captain_response = self.captain.chat(
                collection_id=self.collection_id,
                message=question,
                context=query_context
            )
            
            print(f"[CAPTAIN] Response received from Captain!")
            
            # Extract answer and citations
            results["answer"] = captain_response.get("response", "No answer provided")
            results["sources"] = captain_response.get("sources", [])
            results["conversation_id"] = captain_response.get("conversation_id")
            
            # Format citations
            citations = []
            try:
                for i, source in enumerate(results["sources"], 1):
                    excerpt_text = source.get("excerpt", source.get("content", ""))
                    if isinstance(excerpt_text, str) and len(excerpt_text) > 200:
                        excerpt_text = excerpt_text[:200] + "..."
                    
                    citations.append({
                        "source": source.get("title", "Unknown"),
                        "excerpt": excerpt_text or "No excerpt available",
                        "score": float(source.get("score", 0.0)),
                        "url": source.get("url")
                    })
            except Exception as e:
                print(f"[WARN] Error formatting citations: {e}")
                # Continue anyway
            
            results["citations"] = citations
            results["num_sources"] = len(citations)
            
            print(f"[CAPTAIN] Formatted {len(citations)} citations")
            
            # Save answer
            try:
                answer_file = "artifacts/analyst_answer_captain.json"
                with open(answer_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        "question": question,
                        "answer": results["answer"],
                        "citations": citations,
                        "context": query_context,
                        "conversation_id": results.get("conversation_id"),
                        "powered_by": "Captain RAG (OpenAI SDK)"
                    }, f, indent=2, ensure_ascii=False)
                results["artifacts"].append(answer_file)
                
                # Also save index summary
                summary_file = "artifacts/rag_index_summary.json"
                with open(summary_file, 'w', encoding='utf-8') as f:
                    json.dump({
                        "backend": "Captain (OpenAI SDK)",
                        "endpoint": "https://api.runcaptain.com/v1",
                        "model": "captain-voyager-latest",
                        "collection_id": self.collection_id,
                        "collection_name": db_result.get("name"),
                        "org_id": self.captain.org_id,
                        "status": "operational"
                    }, f, indent=2)
                results["artifacts"].append(summary_file)
            except Exception as e:
                print(f"[WARN] Error saving artifacts: {e}")
                # Continue anyway
            
            self.trace.log(
                agent="AnalystAgentCaptain",
                action="Captain query complete",
                result=f"Answer with {len(citations)} citations",
                artifacts=results["artifacts"],
                metadata={
                    "question": question,
                    "num_citations": len(citations),
                    "conversation_id": results.get("conversation_id"),
                    "answer_length": len(results.get("answer", ""))
                }
            )
            
            print(f"[SUCCESS] Captain analysis complete!")
            print(f"          Answer: {len(results.get('answer', ''))} chars")
            print(f"          Citations: {len(citations)}")
            
            results["success"] = True
            return results
            
        except Exception as e:
            error_msg = str(e)
            
            # Log the error but don't fail the entire workflow
            self.trace.log(
                agent="AnalystAgentCaptain",
                action="Error during analysis",
                result=f"Error: {error_msg[:200]}"
            )
            
            print(f"[ERROR] Analyst workflow error: {error_msg[:200]}")
            
            # Return whatever we have
            results["success"] = False
            results["error"] = error_msg
            
            return results
    
    def _load_tenant_documents(self) -> List[Dict[str, Any]]:
        """Load tenant documents for Captain upload INCLUDING REAL CSV DATA."""
        documents = []
        base_path = "data/tenant_demo"
        
        if not os.path.exists(base_path):
            return documents
        
        file_map = {
            "menu.md": "Restaurant Menu",
            "prep.md": "Prep Guidelines",
            "ops.md": "Operations Manual",
            "weather_rules.md": "Weather Planning Rules",
            "realtime_operations.md": "Real-Time Operations Guide"
        }
        
        for filename, title in file_map.items():
            filepath = os.path.join(base_path, filename)
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    documents.append({
                        "content": content,
                        "title": title,
                        "metadata": {
                            "source": title,
                            "filename": filename,
                            "tenant_id": self.tenant_id,
                            "type": "knowledge_base"
                        }
                    })
        
        # LOAD REAL CSV DATA for real-time operations
        import pandas as pd
        from datetime import datetime
        
        csv_files = {
            "orders_realtime.csv": "Real-Time Orders",
            "customer_reviews.csv": "Customer Reviews",
            "inventory.csv": "Inventory Status",
            "staff_schedule.csv": "Staff Schedule"
        }
        
        for csv_filename, csv_title in csv_files.items():
            csv_path = os.path.join("data", csv_filename)
            if os.path.exists(csv_path):
                try:
                    df = pd.read_csv(csv_path)
                    
                    # Convert DataFrame to readable text
                    csv_content = f"=== {csv_title} (CSV Data) ===\n\n"
                    csv_content += f"Total Records: {len(df)}\n"
                    csv_content += f"Columns: {', '.join(df.columns)}\n\n"
                    
                    # Add key statistics
                    if 'price' in df.columns:
                        csv_content += f"REVENUE METRICS:\n"
                        csv_content += f"- Total Revenue: ${df['price'].sum():,.2f}\n"
                        csv_content += f"- Average Order: ${df['price'].mean():.2f}\n"
                        csv_content += f"- Min Order: ${df['price'].min():.2f}\n"
                        csv_content += f"- Max Order: ${df['price'].max():.2f}\n\n"
                    
                    if 'rating' in df.columns:
                        csv_content += f"CUSTOMER SATISFACTION:\n"
                        csv_content += f"- Average Rating: {df['rating'].mean():.2f}/5.0\n"
                        csv_content += f"- Total Reviews: {len(df)}\n"
                        csv_content += f"- 5-Star: {len(df[df['rating']==5])} ({len(df[df['rating']==5])/len(df)*100:.1f}%)\n"
                        csv_content += f"- 1-Star: {len(df[df['rating']==1])} ({len(df[df['rating']==1])/len(df)*100:.1f}%)\n"
                        if 'sentiment' in df.columns:
                            csv_content += f"\nSENTIMENT BREAKDOWN:\n"
                            sentiment_counts = df['sentiment'].value_counts()
                            for sent, count in sentiment_counts.items():
                                csv_content += f"- {sent.capitalize()}: {count} ({count/len(df)*100:.1f}%)\n"
                        csv_content += "\n"
                    
                    if 'current_stock' in df.columns and 'par_level' in df.columns:
                        csv_content += f"INVENTORY STATUS:\n"
                        csv_content += f"- Total Items: {len(df)}\n"
                        low_stock = df[df['current_stock'] < df['par_level']]
                        csv_content += f"- Low Stock: {len(low_stock)} items\n"
                        if len(low_stock) > 0:
                            csv_content += f"- REORDER NEEDED: {', '.join(low_stock['item'].tolist())}\n"
                        csv_content += "\n"
                    
                    # Add sample data (first 5 and last 5 rows)
                    csv_content += f"SAMPLE DATA (First 5 rows):\n{df.head(5).to_string(index=False)}\n\n"
                    csv_content += f"RECENT DATA (Last 5 rows):\n{df.tail(5).to_string(index=False)}\n"
                    
                    documents.append({
                        "content": csv_content,
                        "title": csv_title,
                        "metadata": {
                            "source": csv_title,
                            "filename": csv_filename,
                            "tenant_id": self.tenant_id,
                            "type": "realtime_data",
                            "record_count": len(df),
                            "updated_at": datetime.now().isoformat()
                        }
                    })
                    
                    print(f"[OK] Loaded CSV: {csv_filename} ({len(df)} records)")
                    
                except Exception as e:
                    print(f"[WARN] Could not load CSV {csv_filename}: {e}")
        
        # Add reviews if available
        reviews_file = "artifacts/reviews.json"
        if os.path.exists(reviews_file):
            with open(reviews_file, 'r') as f:
                reviews_data = json.load(f)
                
                # Combine reviews into a document
                gmaps_reviews = reviews_data.get("gmaps_reviews", [])
                if gmaps_reviews:
                    reviews_text = "\n\n".join([
                        f"Rating: {r.get('rating', 'N/A')} stars\n{r.get('text', '')}"
                        for r in gmaps_reviews if isinstance(r, dict)
                    ])
                    
                    documents.append({
                        "content": reviews_text,
                        "title": "Customer Reviews (Google Maps)",
                        "metadata": {
                            "source": "Google Maps Reviews",
                            "tenant_id": self.tenant_id,
                            "type": "customer_feedback",
                            "count": len(gmaps_reviews)
                        }
                    })
        
        return documents


def run_analyst_agent_captain(
    tenant_id: str, 
    question: str,
    context: Dict[str, Any] = None
) -> Dict[str, Any]:
    """Run analyst agent with Captain RAG."""
    agent = AnalystAgentCaptain(tenant_id)
    return agent.run(question, context)

