from flask import Flask, request, jsonify
from deepface import DeepFace
import numpy as np
import traceback

app = Flask(__name__)

def cosine_similarity(v1, v2):
    try:
        v1 = np.array(v1, dtype=np.float32)
        v2 = np.array(v2, dtype=np.float32)
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        return float(dot_product / (norm_v1 * norm_v2))
    except Exception as e:
        print(f"Error calculating similarity: {e}")
        return 0.0

@app.route('/')
def home():
    return jsonify({
        "status": "AI Service Running",
        "model": "Facenet"
    })

@app.route('/process-photo', methods=['POST'])
def process_photo():
    try:
        data = request.get_json()
        if not data or 'imageUrl' not in data:
            return jsonify({"success": False, "error": "imageUrl is required"}), 400
        
        image_url = data['imageUrl']
        
        # Call DeepFace represent to detect faces and extract embeddings
        # enforce_detection=False will prevent throwing error if no face is detected
        representations = DeepFace.represent(
            img_path=image_url,
            model_name="Facenet",
            enforce_detection=False
        )
        
        faces = []
        for rep in representations:
            # If enforce_detection=False, DeepFace might return a dummy representation 
            # if no face is actually found. Let's filter out faces with extremely low confidence
            # or if the whole image was treated as a face when no face was found.
            # In Facenet, a real face representation is returned
            confidence = rep.get("face_confidence", 0.0)
            if confidence > 0.0:
                faces.append({
                    "embedding": rep["embedding"],
                    "confidence": confidence,
                    "facial_area": rep.get("facial_area", {})
                })
        
        return jsonify({
            "success": True,
            "faces": faces
        })
        
    except Exception as e:
        print(traceback.format_exc())
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/search-face', methods=['POST'])
def search_face():
    try:
        data = request.get_json()
        if not data or 'selfieUrl' not in data or 'candidates' not in data:
            return jsonify({"success": False, "error": "selfieUrl and candidates are required"}), 400
        
        selfie_url = data['selfieUrl']
        candidates = data['candidates'] # List of { "photoId": str, "vector": list }
        threshold = float(data.get('threshold', 0.55)) # Default threshold for Facenet Cosine similarity is ~0.60
        
        # 1. Get selfie embedding
        selfie_reps = DeepFace.represent(
            img_path=selfie_url,
            model_name="Facenet",
            enforce_detection=True # We want to make sure a face is actually detected in a selfie!
        )
        
        if not selfie_reps or len(selfie_reps) == 0:
            return jsonify({"success": False, "error": "No face detected in the selfie image"}), 400
            
        # Take the most prominent face in the selfie
        selfie_embedding = selfie_reps[0]["embedding"]
        
        # 2. Compare with candidates
        matched_photo_ids = set()
        for cand in candidates:
            cand_vector = cand.get('vector')
            photo_id = cand.get('photoId')
            
            if not cand_vector or not photo_id:
                continue
                
            # If the vector is stored as a list of lists or needs flattening
            # Handle standard 1D list
            similarity = cosine_similarity(selfie_embedding, cand_vector)
            
            if similarity >= threshold:
                matched_photo_ids.add(photo_id)
                
        return jsonify({
            "success": True,
            "matches": list(matched_photo_ids)
        })
        
    except Exception as e:
        print(traceback.format_exc())
        # If no face is detected in selfie, let's catch it nicely
        if "Face could not be detected" in str(e):
            return jsonify({
                "success": False,
                "error": "Could not detect face in the selfie. Please upload a clear photo of your face."
            }), 400
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
