"""
LSTM Deep Learning Forecaster Service
ALL forecasting and predictions flow through this LSTM model
"""
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from scipy import stats
import os
from typing import Dict, Any, Tuple
import pickle
from datetime import datetime, timedelta

# TensorFlow imports
try:
    from tensorflow.keras.models import Sequential, load_model
    from tensorflow.keras.layers import LSTM, Dense, Dropout
    from tensorflow.keras.callbacks import EarlyStopping
    TENSORFLOW_AVAILABLE = True
except ImportError:
    TENSORFLOW_AVAILABLE = False
    print("WARNING: TensorFlow not available. LSTM predictions will use fallback.")


class LSTMForecaster:
    """LSTM Deep Learning Model for Restaurant Sales Forecasting."""
    
    def __init__(self, lookback: int = 24):
        """Initialize LSTM forecaster."""
        self.lookback = lookback
        self.model = None
        self.scaler = MinMaxScaler()
        self.feature_columns = ['sales', 'price', 'weather', 'traffic', 'is_weekend', 
                                'hour_sin', 'hour_cos', 'dow_sin', 'dow_cos']
        self.model_path = "models/lstm_sales_model.h5"
        self.scaler_path = "models/scaler.pkl"
        
        # Create models directory
        os.makedirs("models", exist_ok=True)
        
        # Load or create model
        if TENSORFLOW_AVAILABLE:
            self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load existing model or create new one."""
        if os.path.exists(self.model_path) and os.path.exists(self.scaler_path):
            try:
                self.model = load_model(self.model_path)
                with open(self.scaler_path, 'rb') as f:
                    self.scaler = pickle.load(f)
                print(f"[LSTM] Loaded existing model from {self.model_path}")
            except Exception as e:
                print(f"[LSTM] Failed to load model: {e}. Creating new model.")
                self._create_model()
        else:
            self._create_model()
    
    def _create_model(self):
        """Create new LSTM model architecture."""
        if not TENSORFLOW_AVAILABLE:
            return
        
        # Model architecture from LSTM Model.ipynb
        self.model = Sequential([
            LSTM(64, return_sequences=True, input_shape=(self.lookback, len(self.feature_columns))),
            Dropout(0.3),
            LSTM(32, return_sequences=False),
            Dense(16, activation='relu'),
            Dense(1)  # Fixed typo from Dense(1Let)
        ])
        self.model.compile(optimizer='adam', loss='mse')
        print("[LSTM] Created new model with architecture from LSTM Model.ipynb")
    
    def prepare_data_from_csv(self, orders_csv: str = "data/orders_realtime.csv") -> pd.DataFrame:
        """
        Load and prepare data from CSV for LSTM processing.
        
        Args:
            orders_csv: Path to orders CSV file
            
        Returns:
            Prepared dataframe with features
        """
        # Load orders data
        data = pd.read_csv(orders_csv)
        data['timestamp'] = pd.to_datetime(data['timestamp'])
        
        # Feature engineering (from LSTM Model.ipynb)
        data['day_of_week'] = data['timestamp'].dt.dayofweek
        data['hour'] = data['timestamp'].dt.hour
        data['is_weekend'] = data['day_of_week'].isin([5, 6]).astype(int)
        
        # Cyclical encoding
        data['hour_sin'] = np.sin(2 * np.pi * data['hour'] / 24)
        data['hour_cos'] = np.cos(2 * np.pi * data['hour'] / 24)
        data['dow_sin'] = np.sin(2 * np.pi * data['day_of_week'] / 7)
        data['dow_cos'] = np.cos(2 * np.pi * data['day_of_week'] / 7)
        
        # Add weather and traffic (from weather CSV or defaults)
        weather_file = "data/weather_forecast.csv"
        if os.path.exists(weather_file):
            weather_df = pd.read_csv(weather_file)
            weather_df['date'] = pd.to_datetime(weather_df['date']).dt.date
            data['date_only'] = data['timestamp'].dt.date
            data = data.merge(
                weather_df[['date', 'weather_factor']], 
                left_on='date_only', 
                right_on='date', 
                how='left'
            )
            data['weather'] = data['weather_factor'].fillna(1.0)
            data = data.drop(columns=['date', 'date_only', 'weather_factor'], errors='ignore')
        else:
            data['weather'] = 1.0
        
        # Traffic from events or defaults
        events_file = "data/events_calendar.csv"
        if os.path.exists(events_file):
            events_df = pd.read_csv(events_file)
            events_df['date'] = pd.to_datetime(events_df['date']).dt.date
            data['date_only'] = data['timestamp'].dt.date
            data = data.merge(
                events_df[['date', 'traffic_factor']], 
                left_on='date_only', 
                right_on='date', 
                how='left'
            )
            data['traffic'] = data['traffic_factor'].fillna(1.0)
            data = data.drop(columns=['date', 'date_only', 'traffic_factor'], errors='ignore')
        else:
            data['traffic'] = 1.0
        
        # Aggregate to hourly (from LSTM Model.ipynb)
        agg = data.groupby(pd.Grouper(key='timestamp', freq='1H')).agg({
            'price': 'mean',
            'quantity': 'sum',  # This is our 'sales'
            'weather': 'mean',
            'traffic': 'mean',
            'is_weekend': 'max',
            'hour_sin': 'mean',
            'hour_cos': 'mean',
            'dow_sin': 'mean',
            'dow_cos': 'mean'
        }).rename(columns={'quantity': 'sales'})
        
        agg = agg.fillna(method='ffill').fillna(0)
        
        return agg
    
    def create_sequences(self, data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Create sequences for LSTM training (from LSTM Model.ipynb).
        
        Args:
            data: Scaled feature array
            
        Returns:
            Tuple of (X, y) sequences
        """
        X, y = [], []
        for i in range(self.lookback, len(data)):
            X.append(data[i - self.lookback:i, :])
            y.append(data[i, 0])  # Target: sales (first column)
        return np.array(X), np.array(y)
    
    def train(self, data: pd.DataFrame, epochs: int = 40, batch_size: int = 32) -> Dict[str, Any]:
        """
        Train LSTM model with data.
        
        Args:
            data: Prepared dataframe with features
            epochs: Number of training epochs
            batch_size: Batch size for training
            
        Returns:
            Training results dictionary
        """
        if not TENSORFLOW_AVAILABLE:
            return {'success': False, 'error': 'TensorFlow not available'}
        
        try:
            # Ensure all required columns exist
            for col in self.feature_columns:
                if col not in data.columns:
                    data[col] = 0
            
            # Select and order features
            feature_data = data[self.feature_columns].values
            
            # Normalize (from LSTM Model.ipynb)
            scaled = self.scaler.fit_transform(feature_data)
            
            # Create sequences
            X, y = self.create_sequences(scaled)
            
            if len(X) < 10:
                return {'success': False, 'error': 'Not enough data for training'}
            
            # Train/test split (80/20)
            split = int(0.8 * len(X))
            X_train, X_test = X[:split], X[split:]
            y_train, y_test = y[:split], y[split:]
            
            # Train model with early stopping
            early_stop = EarlyStopping(monitor='val_loss', patience=5, restore_best_weights=True)
            history = self.model.fit(
                X_train, y_train,
                validation_split=0.1,
                epochs=epochs,
                batch_size=batch_size,
                callbacks=[early_stop],
                verbose=0
            )
            
            # Evaluate
            predictions = self.model.predict(X_test, verbose=0).flatten()
            mae = np.mean(np.abs(y_test - predictions))
            rmse = np.sqrt(np.mean((y_test - predictions) ** 2))
            
            # Save model and scaler
            self.model.save(self.model_path)
            with open(self.scaler_path, 'wb') as f:
                pickle.dump(self.scaler, f)
            
            print(f"[LSTM] Training complete. MAE: {mae:.3f}, RMSE: {rmse:.3f}")
            print(f"[LSTM] Model saved to {self.model_path}")
            
            return {
                'success': True,
                'mae': float(mae),
                'rmse': float(rmse),
                'epochs_run': len(history.history['loss']),
                'samples_trained': len(X_train)
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def predict(self, data: pd.DataFrame, hours_ahead: int = 24) -> Dict[str, Any]:
        """
        Make predictions using LSTM model.
        
        Args:
            data: Prepared dataframe with features
            hours_ahead: Number of hours to forecast
            
        Returns:
            Prediction results with confidence intervals
        """
        if not TENSORFLOW_AVAILABLE or self.model is None:
            return self._fallback_prediction(data, hours_ahead)
        
        try:
            # Prepare data
            feature_data = data[self.feature_columns].values
            scaled = self.scaler.transform(feature_data)
            
            # Create sequences
            X, y = self.create_sequences(scaled)
            
            if len(X) == 0:
                return self._fallback_prediction(data, hours_ahead)
            
            # Predict
            predictions = self.model.predict(X, verbose=0).flatten()
            
            # Calculate confidence intervals (from LSTM Model.ipynb)
            residuals = y - predictions
            mean_resid = np.mean(residuals)
            se_resid = stats.sem(residuals)
            n = len(residuals)
            t_crit = stats.t.ppf(0.95, df=n - 1)  # 90% confidence
            margin = t_crit * se_resid
            
            lower_bound = predictions - margin
            upper_bound = predictions + margin
            
            # Forecast future hours
            last_sequence = X[-1]
            future_predictions = []
            
            for _ in range(hours_ahead):
                next_pred = self.model.predict(last_sequence.reshape(1, self.lookback, -1), verbose=0)[0, 0]
                future_predictions.append(next_pred)
                
                # Update sequence (rolling window)
                new_row = last_sequence[-1].copy()
                new_row[0] = next_pred  # Update sales prediction
                last_sequence = np.vstack([last_sequence[1:], new_row])
            
            future_predictions = np.array(future_predictions)
            future_lower = future_predictions - margin
            future_upper = future_predictions + margin
            
            return {
                'success': True,
                'predictions': predictions.tolist(),
                'lower_bound': lower_bound.tolist(),
                'upper_bound': upper_bound.tolist(),
                'future_predictions': future_predictions.tolist(),
                'future_lower': future_lower.tolist(),
                'future_upper': future_upper.tolist(),
                'confidence_level': 0.90,
                'hours_ahead': hours_ahead
            }
            
        except Exception as e:
            print(f"[LSTM] Prediction error: {e}")
            return self._fallback_prediction(data, hours_ahead)
    
    def _fallback_prediction(self, data: pd.DataFrame, hours_ahead: int) -> Dict[str, Any]:
        """Fallback prediction when LSTM is not available."""
        # Simple moving average as fallback
        if 'sales' in data.columns:
            recent_sales = data['sales'].tail(24).mean()
        else:
            recent_sales = 15.0
        
        predictions = [recent_sales] * hours_ahead
        lower = [p * 0.85 for p in predictions]
        upper = [p * 1.15 for p in predictions]
        
        return {
            'success': True,
            'predictions': predictions,
            'lower_bound': lower,
            'upper_bound': upper,
            'future_predictions': predictions,
            'future_lower': lower,
            'future_upper': upper,
            'confidence_level': 0.90,
            'hours_ahead': hours_ahead,
            'note': 'Using fallback prediction (TensorFlow not available)'
        }
    
    def update_model(self, new_data: pd.DataFrame):
        """
        Continuous retraining with new data (from LSTM Model.ipynb Cell 9).
        
        Args:
            new_data: New prepared dataframe
        """
        if not TENSORFLOW_AVAILABLE or self.model is None:
            return
        
        try:
            feature_data = new_data[self.feature_columns].values
            new_scaled = self.scaler.transform(feature_data)
            X_new, y_new = self.create_sequences(new_scaled)
            
            if len(X_new) > 0:
                self.model.fit(X_new, y_new, epochs=3, batch_size=32, verbose=0)
                self.model.save(self.model_path)
                print(f"[LSTM] Model updated with {len(X_new)} new samples")
        except Exception as e:
            print(f"[LSTM] Update error: {e}")


# Singleton instance
_lstm_forecaster = None


def get_lstm_forecaster() -> LSTMForecaster:
    """Get or create LSTM forecaster singleton."""
    global _lstm_forecaster
    if _lstm_forecaster is None:
        _lstm_forecaster = LSTMForecaster()
    return _lstm_forecaster

