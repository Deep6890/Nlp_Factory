from pipeline import process_text_pipeline
import json

if __name__ == "__main__":
    texts = [
        "Rahul asked me to send ₹5000 by tomorrow urgently",
        "I need to buy some groceries later.",
        "Hey, are we still meeting for lunch?", 
        "Please transfer 100 dollars to the joint account for rent",
        "The weather is really nice today."
    ]
    
    print("Initializing Intelligence Engine...\n")
    
    for text in texts:
        print(f"--- Processing: '{text}' ---")
        result = process_text_pipeline(text)
        
        if result:
            print("💰 Finance Potential Detected! Insights:")
            print(json.dumps(result, indent=2))
        else:
            print("🛑 No Finance Potential. Ignored.")
        print()
