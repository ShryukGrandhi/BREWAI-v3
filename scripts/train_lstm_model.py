"""
Train LSTM Model with Current CSV Data
Uses architecture from LSTM Model.ipynb
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from services.lstm_forecaster import get_lstm_forecaster


def main():
    """Train LSTM model with CSV data."""
    
    print("=" * 60)
    print("LSTM MODEL TRAINING")
    print("Architecture from LSTM Model.ipynb")
    print("=" * 60)
    print()
    
    # Get forecaster
    forecaster = get_lstm_forecaster()
    
    # Load and prepare data
    print("[1/3] Loading CSV data...")
    data = forecaster.prepare_data_from_csv("data/orders_realtime.csv")
    print(f"      Loaded {len(data)} hourly records")
    print()
    
    # Train model
    print("[2/3] Training LSTM model...")
    print("      Architecture:")
    print("        - LSTM(64) + Dropout(0.3)")
    print("        - LSTM(32)")
    print("        - Dense(16, relu)")
    print("        - Dense(1)")
    print()
    
    result = forecaster.train(data, epochs=40, batch_size=32)
    
    if result['success']:
        print()
        print("[SUCCESS] Model trained successfully!")
        print(f"      MAE: {result['mae']:.3f}")
        print(f"      RMSE: {result['rmse']:.3f}")
        print(f"      Epochs: {result['epochs_run']}")
        print(f"      Samples: {result['samples_trained']}")
        print()
        
        # Test prediction
        print("[3/3] Testing predictions...")
        pred_result = forecaster.predict(data, hours_ahead=24)
        
        if pred_result['success']:
            future_preds = pred_result['future_predictions']
            peak_hour = future_preds.index(max(future_preds))
            total_orders = sum(future_preds)
            
            print(f"      Next 24 hours forecast:")
            print(f"        - Total orders: {int(total_orders)}")
            print(f"        - Peak hour: {peak_hour}:00 with {int(future_preds[peak_hour])} orders")
            print(f"        - Revenue forecast: ${total_orders * 18.50:,.2f}")
            print()
            
            print("=" * 60)
            print("[SUCCESS] LSTM model ready for production!")
            print("=" * 60)
            return 0
        else:
            print(f"[ERROR] Prediction test failed: {pred_result.get('error')}")
            return 1
    else:
        print(f"[ERROR] Training failed: {result.get('error')}")
        return 1


if __name__ == "__main__":
    sys.exit(main())

