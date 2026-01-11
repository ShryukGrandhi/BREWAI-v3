"""
ForecastAgent - Predicts order volume using XGBoost with weather features.
"""
import os
import json
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import seaborn as sns
from agents.trace_agent import get_trace_agent

# Conditional import for XGBoost
try:
    from xgboost import XGBRegressor
    HAS_XGBOOST = True
except ImportError:
    HAS_XGBOOST = False


class ForecastAgent:
    """Forecast order volume using ML."""
    
    def __init__(self):
        self.trace = get_trace_agent()
        self.model = None
    
    def run(self) -> Dict[str, Any]:
        """Execute forecast workflow."""
        results = {
            "success": False,
            "artifacts": []
        }
        
        try:
            # Step 1: Load or generate orders data
            self.trace.log(
                agent="ForecastAgent",
                action="Loading historical orders data"
            )
            
            orders_file = "data/orders.csv"
            if os.path.exists(orders_file):
                df_orders = pd.read_csv(orders_file)
                df_orders['timestamp'] = pd.to_datetime(df_orders['timestamp'])
            else:
                # Generate synthetic data
                self.trace.log(
                    agent="ForecastAgent",
                    action="Generating synthetic orders data (60 days)",
                    result="No historical data found"
                )
                df_orders = self._generate_synthetic_orders()
                df_orders.to_csv(orders_file, index=False)
            
            # Step 2: Load weather features
            weather_file = "artifacts/weather_features.csv"
            if os.path.exists(weather_file):
                df_weather = pd.read_csv(weather_file)
                df_weather['time'] = pd.to_datetime(df_weather['time'])
            else:
                # Fallback: no weather features
                df_weather = None
                self.trace.log(
                    agent="ForecastAgent",
                    action="Weather features not available",
                    result="Proceeding without weather data"
                )
            
            # Step 3: Feature engineering
            self.trace.log(
                agent="ForecastAgent",
                action="Engineering features"
            )
            
            df_features = self._create_features(df_orders, df_weather)
            
            # Step 4: Train model
            self.trace.log(
                agent="ForecastAgent",
                action=f"Training {'XGBoost' if HAS_XGBOOST else 'rolling baseline'} model"
            )
            
            self._train_model(df_features)
            
            # Step 5: Predict tomorrow 10:00-22:00
            tomorrow = datetime.now() + timedelta(days=1)
            hours = range(10, 23)  # 10 AM to 10 PM
            
            predictions = []
            for hour in hours:
                pred_time = tomorrow.replace(hour=hour, minute=0, second=0)
                
                # Create feature row
                feature_row = self._create_prediction_features(
                    pred_time,
                    df_orders,
                    df_weather
                )
                
                # Predict
                if self.model:
                    pred = self.model.predict([feature_row])[0]
                else:
                    # Fallback: rolling average
                    pred = df_features['orders'].mean()
                
                predictions.append({
                    "hour": hour,
                    "datetime": pred_time.isoformat(),
                    "predicted_orders": round(pred, 1)
                })
            
            df_predictions = pd.DataFrame(predictions)
            
            # Step 6: Save forecast CSV
            forecast_file = "artifacts/forecast.csv"
            df_predictions.to_csv(forecast_file, index=False)
            results["artifacts"].append(forecast_file)
            
            # Step 7: Create forecast plot
            self.trace.log(
                agent="ForecastAgent",
                action="Generating forecast visualization"
            )
            
            plot_file = "artifacts/forecast_plot.png"
            self._create_forecast_plot(df_predictions, plot_file)
            results["artifacts"].append(plot_file)
            
            # Identify peak hour
            peak_hour = df_predictions.loc[df_predictions['predicted_orders'].idxmax()]
            results["peak_hour"] = int(peak_hour['hour'])
            results["peak_orders"] = float(peak_hour['predicted_orders'])
            results["predictions"] = predictions
            
            self.trace.log(
                agent="ForecastAgent",
                action="Forecast complete",
                result=f"Peak: {results['peak_hour']}:00 with {results['peak_orders']:.0f} orders",
                artifacts=results["artifacts"],
                metadata={
                    "peak_hour": results["peak_hour"],
                    "peak_orders": results["peak_orders"]
                }
            )
            
            results["success"] = True
            return results
            
        except Exception as e:
            self.trace.log(
                agent="ForecastAgent",
                action="Error in forecast workflow",
                result=f"Error: {str(e)}"
            )
            results["error"] = str(e)
            return results
    
    def _generate_synthetic_orders(self, days: int = 60) -> pd.DataFrame:
        """Generate synthetic POS data with weekday/lunch patterns."""
        np.random.seed(42)
        
        data = []
        start_date = datetime.now() - timedelta(days=days)
        
        for day in range(days):
            current_date = start_date + timedelta(days=day)
            day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday
            
            for hour in range(10, 23):  # 10 AM to 10 PM
                # Base pattern
                base = 20
                
                # Lunch spike (12-2 PM)
                if 12 <= hour <= 14:
                    base += 15
                
                # Dinner spike (6-8 PM)
                if 18 <= hour <= 20:
                    base += 20
                
                # Weekend boost
                if day_of_week >= 5:  # Sat/Sun
                    base *= 1.3
                
                # Weekday lunch boost
                if day_of_week < 5 and 12 <= hour <= 13:
                    base *= 1.2
                
                # Random noise
                orders = int(base + np.random.normal(0, 5))
                orders = max(5, orders)  # Minimum 5 orders
                
                data.append({
                    "timestamp": current_date.replace(hour=hour, minute=0, second=0),
                    "orders": orders
                })
        
        return pd.DataFrame(data)
    
    def _create_features(
        self,
        df_orders: pd.DataFrame,
        df_weather: pd.DataFrame = None
    ) -> pd.DataFrame:
        """Create ML features from orders and weather."""
        df = df_orders.copy()
        
        # Time features
        df['hour_of_day'] = df['timestamp'].dt.hour
        df['day_of_week'] = df['timestamp'].dt.dayofweek
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        df['is_lunch'] = ((df['hour_of_day'] >= 12) & (df['hour_of_day'] <= 14)).astype(int)
        df['is_dinner'] = ((df['hour_of_day'] >= 18) & (df['hour_of_day'] <= 20)).astype(int)
        
        # Rolling features
        df = df.sort_values('timestamp')
        df['rolling_7d_avg'] = df['orders'].rolling(window=7*13, min_periods=1).mean()
        df['rolling_24h_avg'] = df['orders'].rolling(window=13, min_periods=1).mean()
        
        # Weather features (if available)
        if df_weather is not None:
            df_weather['hour'] = pd.to_datetime(df_weather['time']).dt.hour
            # Simple merge on hour (in production, would use proper datetime matching)
            df = df.merge(
                df_weather[['hour', 'precip_prob', 'is_rain']],
                left_on='hour_of_day',
                right_on='hour',
                how='left'
            )
            df['precip_prob'] = df['precip_prob'].fillna(0)
            df['is_rain'] = df['is_rain'].fillna(0)
        else:
            df['precip_prob'] = 0
            df['is_rain'] = 0
        
        return df
    
    def _train_model(self, df: pd.DataFrame):
        """Train XGBoost model or fallback to baseline."""
        feature_cols = [
            'hour_of_day', 'day_of_week', 'is_weekend',
            'is_lunch', 'is_dinner', 'rolling_7d_avg',
            'rolling_24h_avg', 'precip_prob', 'is_rain'
        ]
        
        # Remove rows with NaN
        df_clean = df.dropna(subset=feature_cols + ['orders'])
        
        if HAS_XGBOOST and len(df_clean) > 50:
            X = df_clean[feature_cols].values
            y = df_clean['orders'].values
            
            self.model = XGBRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                random_state=42
            )
            self.model.fit(X, y)
        else:
            # Fallback: no model, use rolling average
            self.model = None
    
    def _create_prediction_features(
        self,
        pred_time: datetime,
        df_orders: pd.DataFrame,
        df_weather: pd.DataFrame = None
    ) -> list:
        """Create feature vector for a prediction time."""
        hour_of_day = pred_time.hour
        day_of_week = pred_time.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        is_lunch = 1 if 12 <= hour_of_day <= 14 else 0
        is_dinner = 1 if 18 <= hour_of_day <= 20 else 0
        
        # Rolling averages from historical data
        rolling_7d_avg = df_orders['orders'].tail(7*13).mean()
        rolling_24h_avg = df_orders['orders'].tail(13).mean()
        
        # Weather features
        precip_prob = 0
        is_rain = 0
        if df_weather is not None:
            weather_row = df_weather[df_weather['hour'] == hour_of_day]
            if not weather_row.empty:
                precip_prob = weather_row.iloc[0]['precip_prob']
                is_rain = weather_row.iloc[0]['is_rain']
        
        return [
            hour_of_day, day_of_week, is_weekend,
            is_lunch, is_dinner, rolling_7d_avg,
            rolling_24h_avg, precip_prob, is_rain
        ]
    
    def _create_forecast_plot(self, df_predictions: pd.DataFrame, output_file: str):
        """Create visualization of forecast."""
        plt.figure(figsize=(12, 6))
        sns.set_style("whitegrid")
        
        plt.plot(
            df_predictions['hour'],
            df_predictions['predicted_orders'],
            marker='o',
            linewidth=2,
            markersize=8,
            color='#FF6B35'
        )
        
        # Highlight peak
        peak_idx = df_predictions['predicted_orders'].idxmax()
        peak_row = df_predictions.iloc[peak_idx]
        plt.scatter(
            peak_row['hour'],
            peak_row['predicted_orders'],
            s=200,
            color='#FFD700',
            edgecolors='black',
            linewidths=2,
            zorder=5,
            label='Peak Hour'
        )
        
        plt.xlabel('Hour of Day', fontsize=12, fontweight='bold')
        plt.ylabel('Predicted Orders', fontsize=12, fontweight='bold')
        plt.title('Tomorrow\'s Order Volume Forecast', fontsize=14, fontweight='bold')
        plt.xticks(df_predictions['hour'])
        plt.grid(True, alpha=0.3)
        plt.legend()
        
        plt.tight_layout()
        plt.savefig(output_file, dpi=150, bbox_inches='tight')
        plt.close()


def run_forecast_agent() -> Dict[str, Any]:
    """Run forecast agent."""
    agent = ForecastAgent()
    return agent.run()

