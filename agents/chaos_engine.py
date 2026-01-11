"""
CHAOS ENGINE - Generates Random Restaurant Problems
Then AUTO-SOLVES them with visible automations
"""
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List


class ChaosEngine:
    """Generates realistic restaurant crisis scenarios with 17 different types."""
    
    SCENARIOS = [
        {
            'id': 'chef_quit',
            'title': 'HEAD CHEF QUIT',
            'description': 'Bobby Maguire just called - he quit effective immediately. Friday dinner rush in 2 hours.',
            'severity': 'CRITICAL',
            'automations': ['emergency_hiring', 'staff_reassignment', 'menu_adjustment']
        },
        {
            'id': 'fryer_breakdown',
            'title': 'FRYER BREAKDOWN',
            'description': 'Main fryer stopped working. 40% of menu items (all fried items) unavailable.',
            'severity': 'CRITICAL',
            'automations': ['equipment_repair_request', 'menu_adjustment', 'customer_communication']
        },
        {
            'id': 'beef_shortage',
            'title': 'BEEF SHORTAGE',
            'description': 'Supplier cant deliver beef. Only 20% inventory left. Peak dinner tonight.',
            'severity': 'HIGH',
            'automations': ['emergency_supplier_order', 'menu_adjustment', 'marketing_campaign']
        },
        {
            'id': 'health_inspection',
            'title': 'SURPRISE HEALTH INSPECTION',
            'description': 'Health inspector arriving in 30 minutes. Need immediate compliance prep.',
            'severity': 'CRITICAL',
            'automations': ['compliance_audit', 'staff_briefing', 'documentation_prep']
        },
        {
            'id': 'review_attack',
            'title': 'NEGATIVE REVIEW BOMB',
            'description': '12 negative reviews in last hour. Rating dropped from 4.7 to 3.2 stars.',
            'severity': 'HIGH',
            'automations': ['customer_apology_email', 'social_media_response', 'promo_campaign']
        },
        {
            'id': 'mass_callout',
            'title': 'MASS STAFF CALLOUT',
            'description': '3 staff called in sick. Only 2 people on shift during lunch rush.',
            'severity': 'CRITICAL',
            'automations': ['emergency_staff_sms', 'staff_reassignment', 'overtime_approval']
        },
        {
            'id': 'kitchen_flood',
            'title': 'KITCHEN FLOOD',
            'description': 'Pipe burst. Water flooding kitchen. Must close immediately.',
            'severity': 'CRITICAL',
            'automations': ['insurance_claim', 'emergency_repair', 'temporary_closure_notice']
        },
        {
            'id': 'power_outage',
            'title': 'POWER OUTAGE',
            'description': 'Electrical outage. Fridges down. Food safety risk in 2 hours.',
            'severity': 'CRITICAL',
            'automations': ['equipment_repair_request', 'food_safety_log', 'customer_communication']
        },
        {
            'id': 'competitor_promo',
            'title': 'COMPETITOR 50% OFF',
            'description': 'Restaurant next door launched 50% off. Our traffic down 60%.',
            'severity': 'HIGH',
            'automations': ['flash_sale_campaign', 'social_media_response', 'menu_highlight']
        },
        {
            'id': 'driver_accident',
            'title': 'DELIVERY DRIVER ACCIDENT',
            'description': 'Driver had minor accident. 15 orders delayed. Customers angry.',
            'severity': 'MEDIUM',
            'automations': ['customer_apology_email', 'emergency_staff_sms']
        },
        {
            'id': 'food_poisoning',
            'title': 'FOOD POISONING CLAIM',
            'description': 'Customer claims food poisoning. Legal and PR risk.',
            'severity': 'CRITICAL',
            'automations': ['incident_report', 'health_department_notification', 'legal_review', 'customer_apology_email']
        },
        {
            'id': 'pos_crash',
            'title': 'POS SYSTEM CRASH',
            'description': 'Point-of-sale system crashed. Cannot process orders.',
            'severity': 'HIGH',
            'automations': ['tech_support_call', 'manual_order_system', 'customer_communication']
        },
        {
            'id': 'supplier_late',
            'title': 'SUPPLIER 4 HOURS LATE',
            'description': 'Delivery is 4 hours late. Running out of chicken and rice.',
            'severity': 'HIGH',
            'automations': ['emergency_supplier_order', 'menu_adjustment', 'customer_communication']
        },
        {
            'id': 'unexpected_rush',
            'title': 'MASSIVE UNEXPECTED RUSH',
            'description': 'Event nearby. 3x normal customer volume. Staff overwhelmed.',
            'severity': 'HIGH',
            'automations': ['emergency_hiring', 'emergency_staff_sms', 'overtime_approval', 'menu_adjustment']
        },
        {
            'id': 'allergen_incident',
            'title': 'FOOD ALLERGEN INCIDENT',
            'description': 'Customer had allergic reaction. Cross-contamination suspected.',
            'severity': 'CRITICAL',
            'automations': ['incident_report', 'health_department_notification', 'legal_review', 'customer_apology_email', 'staff_briefing']
        },
        {
            'id': 'social_crisis',
            'title': 'VIRAL NEGATIVE VIDEO',
            'description': 'Customer posted video of dirty table. 50K views in 2 hours.',
            'severity': 'HIGH',
            'automations': ['social_media_response', 'customer_apology_email', 'promo_campaign']
        },
        {
            'id': 'equipment_fire',
            'title': 'SMALL KITCHEN FIRE',
            'description': 'Grill caught fire. Fire suppressed. Equipment damaged.',
            'severity': 'CRITICAL',
            'automations': ['incident_report', 'equipment_repair_request', 'insurance_claim', 'temporary_closure_notice']
        }
    ]
    
    @staticmethod
    def generate_random_crisis() -> Dict[str, Any]:
        """Generate a random crisis scenario from 17 types."""
        scenario = random.choice(ChaosEngine.SCENARIOS)
        
        return {
            **scenario,
            'timestamp': datetime.now().isoformat(),
            'status': 'ACTIVE'
        }
    
    @staticmethod
    def get_all_scenarios() -> List[Dict[str, Any]]:
        """Get all possible scenarios."""
        return ChaosEngine.SCENARIOS


