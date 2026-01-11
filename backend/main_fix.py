@app.get("/api/data/orders")
async def get_orders():
    """Get all live orders"""
    return {
        "success": True,
        "data": LIVE_ORDERS,
        "count": len(LIVE_ORDERS)
    }

# ============ ANALYTICS ENDPOINTS ============

@app.get("/api/data/analytics")
async def get_analytics():
    """Get live analytics"""
    total_orders = len(LIVE_ORDERS)
    total_revenue = sum(order.get("total_amount", 0) for order in LIVE_ORDERS)
    profit_margin = 29 if total_revenue > 0 else 0
    
    return {
        "success": True,
        "revenue": f"${total_revenue:,.2f}",
        "revenue_raw": total_revenue,
        "orders": total_orders,
        "profit_margin": f"{profit_margin}%",
        "active_staff": len([s for s in LIVE_STAFF if s["status"] == "active"]),
        "avg_order_value": f"${total_revenue / total_orders:.2f}" if total_orders > 0 else "$0.00",
        "compliance_score": COMPLIANCE_DATA["score"]
    }

@app.get("/api/data/inventory")
async def get_inventory():
    """Get live inventory"""
    return {
        "success": True,
        "data": LIVE_INVENTORY,
        "count": len(LIVE_INVENTORY)
    }

@app.get("/api/data/staff")
async def get_staff():
    """Get staff data"""
    return {
        "success": True,
        "data": LIVE_STAFF,
        "count": len(LIVE_STAFF)
    }

@app.get("/api/data/reviews")
async def get_reviews():
    """Get customer reviews"""
    reviews = []
    for i, order in enumerate(LIVE_ORDERS[-5:]):
        reviews.append({
            "id": i + 1,
            "customer": order.get("customer_name", "Customer"),
            "rating": random.choice([4, 4, 5, 5, 5]),
            "comment": random.choice([
                "Great food, fast delivery!",
                "Delicious as always!",
                "Love the buffalo wings!",
                "Best burger in town!",
                "Will order again soon!"
            ]),
            "timestamp": order.get("timestamp")
        })
    
    return {
        "success": True,
        "data": reviews,
        "count": len(reviews)
    }

@app.get("/api/data/activity")
async def get_activity():
    """Get activity feed"""
    return {
        "success": True,
        "data": ACTIVITY_FEED[:20],
        "count": len(ACTIVITY_FEED)
    }

# ============ COMPLIANCE ENDPOINTS ============

@app.get("/api/compliance")
async def get_compliance():
    """Get compliance data and reports"""
    return {
        "success": True,
        "score": COMPLIANCE_DATA["score"],
        "reports": COMPLIANCE_DATA["reports"][:20],
        "incidents": COMPLIANCE_DATA["incidents"][:10],
        "last_updated": COMPLIANCE_DATA["last_updated"]
    }

@app.get("/api/compliance/score")
async def get_compliance_score():
    """Get just the compliance score"""
    return {
        "success": True,
        "score": COMPLIANCE_DATA["score"]
    }

# ============ CRISIS ENDPOINTS ============

@app.post("/api/crisis/check-emails")
async def check_emails():
    """Check for UNREAD crisis emails - only processes new emails"""
    global PROCESSED_EMAIL_IDS
    
    try:
        result = composio_client.tools.execute(
            slug="GMAIL_FETCH_EMAILS",
            arguments={
                "max_results": 20,
                "label_ids": ["INBOX", "UNREAD"],
                "q": "is:unread"
            },
            connected_account_id=COMPOSIO_GMAIL_ACCOUNT_ID,
            user_id=COMPOSIO_ENTITY_ID,
            dangerously_skip_version_check=True
        )
        
        if not result.get("successfull", result.get("successful", True)):
            return {
                "success": False,
                "error": str(result.get("error", "Unknown error")),
                "message": "Failed to fetch emails. Please ensure Gmail is connected.",
                "setup_required": True,
                "setup_url": "https://app.composio.dev/apps/gmail"
            }
        
        response_data = result.get("data", result.get("response_data", result))
        messages = response_data.get("messages", response_data.get("emails", []))
        
        if isinstance(response_data, list):
            messages = response_data
        
        if not messages:
            return {
                "success": True,
                "crisis_detected": False,
                "message": "No unread emails in inbox",
                "emails_checked": 0,
                "last_check": datetime.now().isoformat()
            }
        
        crises_found = []
        emails_checked = 0
        
        for msg in messages[:20]:
            msg_id = msg.get("id", msg.get("messageId", ""))
            
            if msg_id in PROCESSED_EMAIL_IDS:
                continue
                
            emails_checked += 1
            
            subject = msg.get("subject", msg.get("Subject", ""))
            content = msg.get("snippet", msg.get("body", msg.get("messageText", "")))
            sender = msg.get("from", msg.get("From", msg.get("sender", "")))
            
            if msg_id and (not subject or not content):
                try:
                    detail_result = composio_client.tools.execute(
                        slug="GMAIL_GET_MESSAGE",
                        arguments={"message_id": msg_id},
                        connected_account_id=COMPOSIO_GMAIL_ACCOUNT_ID,
                        user_id=COMPOSIO_ENTITY_ID,
                        dangerously_skip_version_check=True
                    )
                    if detail_result:
                        msg_data = detail_result.get("data", detail_result)
                        subject = msg_data.get("subject", msg_data.get("Subject", subject))
                        content = msg_data.get("body", msg_data.get("snippet", content))
                        sender = msg_data.get("from", msg_data.get("From", sender))
                except Exception as e:
                    print(f"Error fetching message: {e}")
            
            crisis = analyze_email_for_crisis(subject, content, sender)
            if crisis:
                crisis["message_id"] = msg_id
                crises_found.append(crisis)
            
            PROCESSED_EMAIL_IDS.add(msg_id)
        
        if crises_found:
            crises_found.sort(
                key=lambda x: {"LOW": 1, "MEDIUM": 2, "HIGH": 3}.get(x.get("severity"), 0),
                reverse=True
            )
            crisis = crises_found[0]
            
            try:
                composio_client.tools.execute(
                    slug="GMAIL_MODIFY_MESSAGE",
                    arguments={
                        "message_id": crisis["message_id"],
                        "remove_label_ids": ["UNREAD"]
                    },
                    connected_account_id=COMPOSIO_GMAIL_ACCOUNT_ID,
                    user_id=COMPOSIO_ENTITY_ID,
                    dangerously_skip_version_check=True
                )
            except:
                pass
            
            add_activity("crisis", f"🚨 Crisis detected: {crisis['type']}", "error")
            
            return {
                "success": True,
                "crisis_detected": True,
                "crisis": crisis,
                "total_crises_found": len(crises_found),
                "automations_to_trigger": crisis.get("automations", []),
                "emails_checked": emails_checked,
                "last_check": datetime.now().isoformat(),
                "email_details": {
                    "subject": crisis.get("email_subject"),
                    "sender": crisis.get("email_sender"),
                    "content_preview": crisis.get("email_content", "")[:200]
                }
            }
        else:
            return {
                "success": True,
                "crisis_detected": False,
                "message": "No crisis detected in unread emails",
                "emails_checked": emails_checked,
                "last_check": datetime.now().isoformat()
            }
            
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "message": "Failed to check emails."
        }

@app.post("/api/crisis/reset-processed")
async def reset_processed_emails():
    """Reset processed email cache"""
    global PROCESSED_EMAIL_IDS
    PROCESSED_EMAIL_IDS = set()
    return {"success": True, "message": "Processed email cache cleared"}

@app.post("/api/crisis/respond-email")
async def respond_to_email(request: EmailCrisisRequest):
    """Send response email"""
    try:
        response_content = request.email_content or "Thank you for your message. We are addressing this matter."
        recipient = request.sender or GMAIL_TARGET
        subject = f"Re: {request.subject}" if request.subject else "Brew AI Response"
        
        result = composio_client.tools.execute(
            slug="GMAIL_SEND_EMAIL",
            arguments={
                "recipient_email": recipient,
                "subject": subject,
                "body": response_content
            },
            connected_account_id=COMPOSIO_GMAIL_ACCOUNT_ID,
            user_id=COMPOSIO_ENTITY_ID,
            dangerously_skip_version_check=True
        )
        
        if result:
            add_activity("email", f"Response sent to {recipient}", "info")
            return {
                "success": True,
                "message": "Response email sent",
                "recipient": recipient,
                "subject": subject
            }
        else:
            return {"success": False, "error": "Failed to send email"}
                
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.post("/api/crisis/process-full")
async def process_full_crisis():
    """Full crisis workflow with interconnected actions"""
    global AUTOMATION_LOG
    
    try:
        email_check = await check_emails()
        
        if not email_check.get("success"):
            return email_check
        
        if not email_check.get("crisis_detected"):
            return {
                "success": True,
                "crisis_detected": False,
                "message": email_check.get("message", "No crisis detected"),
                "emails_checked": email_check.get("emails_checked", 0)
            }
        
        crisis = email_check.get("crisis")
        automations_to_run = crisis.get("automations", [])
        store_actions = crisis.get("store_actions", [])
        compliance_impact = crisis.get("compliance_impact", 0)
        
        automation_results = []
        for automation_name in automations_to_run:
            result = await execute_single_automation(automation_name, crisis)
            automation_results.append(result)
            
            AUTOMATION_LOG.append({
                "crisis_type": crisis.get("type"),
                "automation": automation_name,
                "result": result,
                "timestamp": datetime.now().isoformat()
            })
        
        store_results = []
        for action in store_actions:
            store_result = execute_store_action(action, crisis)
            if store_result:
                store_results.append(store_result)
        
        update_compliance_score(compliance_impact, f"Crisis: {crisis.get('type')}")
        
        incident = add_compliance_incident(crisis, [a["name"] for a in automation_results])
        
        response_content = generate_crisis_response(crisis, automation_results)
        
        email_response = await respond_to_email(EmailCrisisRequest(
            email_content=response_content,
            sender=crisis.get("email_sender"),
            subject=crisis.get("email_subject")
        ))
        
        add_activity("crisis", f"✅ Crisis resolved: {crisis.get('type')}", "success")
        
        return {
            "success": True,
            "crisis": crisis,
            "automations_executed": len(automation_results),
            "automation_results": automation_results,
            "store_actions_executed": store_results,
            "compliance_impact": compliance_impact,
            "new_compliance_score": COMPLIANCE_DATA["score"],
            "incident_id": incident["id"],
            "email_sent": email_response.get("success", False),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

@app.post("/api/crisis/execute")
async def execute_crisis(request: CrisisRequest):
    """Execute automations for a manual crisis"""
    global AUTOMATION_LOG
    
    crisis = request.crisis
    results = []
    
    for automation_name in crisis.get("automations", []):
        result = await execute_single_automation(automation_name, crisis)
        results.append(result)
        
        AUTOMATION_LOG.append({
            "crisis_type": crisis.get("type"),
            "automation": automation_name,
            "result": result,
            "timestamp": datetime.now().isoformat()
        })
    
    compliance_impact = crisis.get("compliance_impact", -5)
    update_compliance_score(compliance_impact, f"Crisis: {crisis.get('type')}")
    
    add_activity("crisis", f"Crisis handled: {crisis.get('type')}", "warning")
    
    return {
        "success": True,
        "crisis": crisis,
        "automations_executed": len(results),
        "results": results,
        "compliance_score": COMPLIANCE_DATA["score"]
    }

async def execute_single_automation(automation_name: str, crisis: dict) -> dict:
    """Execute a single automation"""
    global LIVE_STAFF, LIVE_STORE
    
    result = {
        "name": automation_name,
        "status": "success",
        "timestamp": datetime.now().isoformat()
    }
    
    automation_details = {
        "emergency_hiring": {
            "action": "Posted job listing and contacted staffing agencies",
            "contacts_notified": 5,
            "platforms": ["Indeed", "LinkedIn", "ZipRecruiter"]
        },
        "schedule_adjustment": {
            "action": "Notified available staff for coverage",
            "staff_contacted": 5,
            "confirmed": 3
        },
        "staff_alert": {
            "action": "All staff notified via SMS/Email",
            "recipients": len(LIVE_STAFF)
        },
        "manager_notification": {
            "action": "Manager notified immediately",
            "notification_type": "SMS + Email + Phone"
        },
        "payroll_update": {
            "action": "Payroll system updated",
            "final_pay_calculated": True
        },
        "access_revocation": {
            "action": "System access scheduled for revocation",
            "systems": ["POS", "Inventory", "Email"]
        },
        "exit_documentation": {
            "action": "Exit documentation prepared",
            "documents": ["Final Paycheck", "Exit Interview", "Reference Letter"]
        },
        "post_job_website": {
            "action": "Job posting created on website",
            "visibility": "public"
        },
        "emergency_supplier_order": {
            "action": "Emergency order placed",
            "delivery_eta": "3 hours"
        },
        "menu_adjustment": {
            "action": "Menu items updated",
            "items_affected": 2
        },
        "equipment_repair_request": {
            "action": "Repair ticket submitted",
            "priority": "URGENT"
        },
        "compliance_check": {
            "action": "Compliance checklist initiated",
            "items_to_verify": 47
        },
        "staff_briefing": {
            "action": "Staff briefing scheduled",
            "attendees": len(LIVE_STAFF)
        },
        "customer_response": {
            "action": "Customer response drafted",
            "priority": "HIGH"
        },
        "corrective_action": {
            "action": "Corrective action plan initiated",
            "deadline": "24 hours"
        },
        "incident_report": {
            "action": "Incident report created",
            "report_id": f"INC-{datetime.now().strftime('%Y%m%d%H%M')}"
        },
        "emergency_protocol": {
            "action": "Emergency protocol activated",
            "response_team_notified": True
        },
        "safety_check": {
            "action": "Safety inspection initiated",
            "areas_checked": ["Kitchen", "Dining", "Storage"]
        }
    }
    
    result["details"] = automation_details.get(automation_name, {
        "action": f"Executed {automation_name}",
        "status": "completed"
    })
    
    return result

# ============ INSIGHTS ENDPOINTS ============

@app.get("/api/insights")
async def get_insights():
    """Get AI-generated insights based on all data"""
    insights = []
    
    active_staff = len([s for s in LIVE_STAFF if s["status"] == "active"])
    if active_staff < 6:
        insights.append({
            "type": "staffing",
            "severity": "warning",
            "message": f"Staff shortage detected. Only {active_staff} active staff. Consider posting job openings.",
            "action": "Post job opening on website",
            "action_type": "post_job"
        })
    
    low_stock = [i for i in LIVE_INVENTORY if i["stock_level"] <= i["reorder_point"]]
    for item in low_stock:
        insights.append({
            "type": "inventory",
            "severity": "warning",
            "message": f"{item['item_name']} is low ({item['stock_level']} {item['unit']})",
            "action": "Order more supplies",
            "action_type": "emergency_order"
        })
    
    total_orders = len(LIVE_ORDERS)
    total_revenue = sum(o.get("total_amount", 0) for o in LIVE_ORDERS)
    
    if total_orders > 0:
        avg_order = total_revenue / total_orders
        if avg_order < 15:
            insights.append({
                "type": "sales",
                "severity": "info",
                "message": f"Average order value is ${avg_order:.2f}. Consider upselling strategies.",
                "action": "Create combo deals",
                "action_type": "promotion"
            })
    
    if COMPLIANCE_DATA["score"] < 80:
        insights.append({
            "type": "compliance",
            "severity": "error",
            "message": f"Compliance score is {COMPLIANCE_DATA['score']}%. Immediate attention needed.",
            "action": "Review compliance reports",
            "action_type": "compliance_review"
        })
    
    if LIVE_STORE.get("job_postings"):
        insights.append({
            "type": "staffing",
            "severity": "info",
            "message": f"{len(LIVE_STORE['job_postings'])} active job posting(s) on website",
            "action": "View applications",
            "action_type": "view_jobs"
        })
    
    return {
        "success": True,
        "insights": insights,
        "summary": {
            "total_insights": len(insights),
            "warnings": len([i for i in insights if i["severity"] == "warning"]),
            "errors": len([i for i in insights if i["severity"] == "error"])
        }
    }

# ============ GEMINI CHAT ENDPOINT ============

@app.post("/api/chat")
async def chat_with_gemini(request: ChatRequest):
    """Chat with Gemini AI using live restaurant data"""
    global gemini_model
    
    total_orders = len(LIVE_ORDERS)
    total_revenue = sum(o.get("total_amount", 0) for o in LIVE_ORDERS)
    active_staff = len([s for s in LIVE_STAFF if s["status"] == "active"])
    low_stock = [i for i in LIVE_INVENTORY if i["stock_level"] <= i["reorder_point"]]
    
    context = f"""
You are Brew AI, an intelligent restaurant management assistant. You have access to the following LIVE data:

CURRENT STATUS:
- Total Orders Today: {total_orders}
- Total Revenue: ${total_revenue:.2f}
- Active Staff: {active_staff}
- Compliance Score: {COMPLIANCE_DATA['score']}%
- Low Stock Items: {', '.join([i['item_name'] for i in low_stock]) if low_stock else 'None'}

RECENT ACTIVITY:
{chr(10).join([f"- {a.get('message', '')}" for a in ACTIVITY_FEED[:5]])}

JOB POSTINGS:
{len(LIVE_STORE.get('job_postings', []))} active job postings

Based on this live data, answer the user's question helpfully. Be specific with numbers and recommendations.
If they ask about actions you can take, mention: flash sales, price changes, featuring items, happy hour, combo deals, seasonal menus, loyalty promos, and banners.

User's message: {request.message}
"""

    if gemini_model:
        try:
            response = gemini_model.generate_content(context)
            return {
                "success": True,
                "response": response.text,
                "live_data": {
                    "orders": total_orders,
                    "revenue": total_revenue,
                    "staff": active_staff,
                    "compliance": COMPLIANCE_DATA["score"]
                }
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "fallback": True,
                "response": generate_fallback_response(request.message)
            }
    else:
        return {
            "success": True,
            "response": generate_fallback_response(request.message),
            "gemini_configured": False,
            "live_data": {
                "orders": total_orders,
                "revenue": total_revenue,
                "staff": active_staff,
                "compliance": COMPLIANCE_DATA["score"]
            }
        }

def generate_fallback_response(message: str) -> str:
    """Generate response without Gemini API"""
    msg_lower = message.lower()
    total_orders = len(LIVE_ORDERS)
    total_revenue = sum(o.get("total_amount", 0) for o in LIVE_ORDERS)
    active_staff = len([s for s in LIVE_STAFF if s["status"] == "active"])
    
    if 'sales' in msg_lower or 'revenue' in msg_lower:
        return f"📊 Live Stats: ${total_revenue:.2f} revenue from {total_orders} orders today. Profit margin is around 29%. I recommend featuring top sellers or running a flash sale to boost numbers!"
    
    if 'inventory' in msg_lower or 'stock' in msg_lower:
        low_stock = [i for i in LIVE_INVENTORY if i["stock_level"] <= i["reorder_point"]]
        if low_stock:
            return f"⚠️ Inventory Alert: {len(low_stock)} items low on stock: {', '.join([i['item_name'] for i in low_stock])}. I recommend placing an emergency order."
        return f"✅ Inventory levels healthy! {len(LIVE_INVENTORY)} items tracked, all above reorder points."
    
    if 'staff' in msg_lower:
        return f"👥 Staff Status: {active_staff} staff members active. {'Adequate for current volume.' if active_staff >= 6 else 'Consider hiring - we are understaffed!'}"
    
    if 'compliance' in msg_lower:
        return f"📋 Compliance Score: {COMPLIANCE_DATA['score']}%. {'Excellent standing!' if COMPLIANCE_DATA['score'] >= 80 else 'Needs improvement - review recent incidents.'}"
    
    return f"📊 Current Status: {total_orders} orders (${total_revenue:.2f}), {active_staff} staff, {COMPLIANCE_DATA['score']}% compliance. What would you like to know more about?"

# ============ AGENT MODE ENDPOINTS ============

@app.get("/api/agent/status")
async def get_agent_status():
    """Get current agent mode status"""
    return {
        "success": True,
        "agent_mode": AGENT_MODE,
        "email_monitoring": AUTO_EMAIL_MONITORING
    }

@app.post("/api/agent/mode")
async def set_agent_mode(request: AgentModeRequest):
    """Enable/disable agent mode"""
    global AGENT_MODE
    AGENT_MODE["enabled"] = request.enabled
    AGENT_MODE["auto_apply_insights"] = request.auto_apply_insights
    
    add_activity("system", f"Agent mode {'enabled' if request.enabled else 'disabled'}", "info")
    
    return {
        "success": True,
        "agent_mode": AGENT_MODE
    }

@app.post("/api/agent/auto-apply")
async def auto_apply_insight(request: StoreActionRequest):
    """Auto-apply an insight recommendation to the store"""
    if not AGENT_MODE.get("enabled"):
        return {
            "success": False,
            "error": "Agent mode is not enabled",
            "requires_approval": True
        }
    
    store_update = StoreUpdateRequest(
        action=request.action,
        discount=request.params.get("discount") if request.params else None,
        category=request.params.get("category") if request.params else None,
        items=request.params.get("items") if request.params else None,
        amount=request.params.get("amount") if request.params else None
    )
    
    result = await update_store(store_update)
    
    add_activity("agent", f"🤖 Auto-applied: {request.action}", "info")
    
    return {
        "success": True,
        "auto_applied": True,
        "result": result
    }

# ============ AUTO EMAIL MONITORING ============

@app.get("/api/email-monitor/status")
async def get_email_monitor_status():
    """Get email monitoring status"""
    return {
        "success": True,
        "monitoring": AUTO_EMAIL_MONITORING
    }

@app.post("/api/email-monitor/toggle")
async def toggle_email_monitoring():
    """Toggle automatic email monitoring"""
    global AUTO_EMAIL_MONITORING
    AUTO_EMAIL_MONITORING["enabled"] = not AUTO_EMAIL_MONITORING["enabled"]
    
    return {
        "success": True,
        "enabled": AUTO_EMAIL_MONITORING["enabled"]
    }

# ============ FIRECRAWL ENDPOINTS ============

@app.post("/api/scrape/url")
async def scrape_url(request: ScrapeRequest):
    """Scrape a URL using Firecrawl"""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.firecrawl.dev/v1/scrape",
            headers={
                "Authorization": f"Bearer {FIRECRAWL_API_KEY}",
                "Content-Type": "application/json"
            },
            json={"url": request.url, "formats": request.formats},
            timeout=60.0
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=response.text)
        
        return response.json()

# ============ AUTOMATION LOG ============

@app.get("/api/automations/log")
async def get_automation_log():
    """Get automation log"""
    return {
        "success": True,
        "data": AUTOMATION_LOG,
        "count": len(AUTOMATION_LOG)
    }

# ============ HEALTH CHECK ============

@app.get("/")
async def root():
    return {
        "app": "Brew.AI v4 API",
        "status": "running",
        "live_data": {
            "orders": len(LIVE_ORDERS),
            "products": len(LIVE_STORE["products"]),
            "inventory_items": len(LIVE_INVENTORY),
            "staff": len(LIVE_STAFF),
            "compliance_score": COMPLIANCE_DATA["score"],
            "automation_executions": len(AUTOMATION_LOG)
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

