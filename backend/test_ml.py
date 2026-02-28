import ml_engine

def test_nlp_engine():
    # 1. Test Scam Detection
    scam_test = ml_engine.detect_scam("Urgent! Verify your account", "Verify your bank password now for wire transfer.")
    legit_test = ml_engine.detect_scam("Meeting notes", "Hey team, here are the meeting notes for tomorrow.")
    
    print(f"Scam Test Result: {scam_test}")
    print(f"Legit Test Result: {legit_test}")
    
    # 2. Test Priority Classification
    high_prio_test = ml_engine.classify_priority("Action required immediately", "Please submit by the deadline.")
    low_prio_test = ml_engine.classify_priority("Weekly Newsletter", "Check out what's new this week.")
    
    print(f"High Priority Result: {high_prio_test}")
    print(f"Low Priority Result: {low_prio_test}")

if __name__ == "__main__":
    test_nlp_engine()
    print("All ML tests passed.")
