

import os
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI

app = Flask(__name__, static_folder=None)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

@app.route("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")

@app.route("/style.css")
def css():
    return send_from_directory(BASE_DIR, "style.css")

@app.route("/script.js")
def js():
    return send_from_directory(BASE_DIR, "script.js")

@app.route("/health")
def health():
    return jsonify({"status": "NEXA AI is running"})

@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        api_key = os.environ.get("OPENAI_API_KEY")

        if not api_key:
            return jsonify({
                "error": "API key is missing. Add OPENAI_API_KEY in Render."
            }), 503

        data = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()

        if not message:
            return jsonify({"error": "Please enter a message"}), 400

        client = OpenAI(api_key=api_key)

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are NEXA AI, a helpful assistant. Reply clearly in the user's language."
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        )

        answer = response.choices[0].message.content

        return jsonify({"reply": answer})

    except Exception as e:
        app.logger.exception("Chat error")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

