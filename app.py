from flask import Flask, render_template, redirect, url_for
from flask_socketio import SocketIO, emit
import uuid

app = Flask(__name__)
socketio = SocketIO(app)

@app.route('/')
def index():
    link = str(uuid.uuid4())  # Generate a unique link
    return f"Send this link to the remote user: {url_for('call', link=link, _external=True)}"

@app.route('/call/<link>')
def call(link):
    return render_template('index.html')  # Display the video call UI

@socketio.on('offer')
def handle_offer(data):
    emit('offer', data, broadcast=True)

@socketio.on('answer')
def handle_answer(data):
    emit('answer', data, broadcast=True)

@socketio.on('candidate')
def handle_candidate(data):
    emit('candidate', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)

