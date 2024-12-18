from flask import Flask, render_template, redirect, url_for
import uuid

app = Flask(__name__)

@app.route('/')
def index():
    link = str(uuid.uuid4())  # Generate a unique link
    return f"Send this link to the remote user: {url_for('call', link=link, _external=True)}"

@app.route('/call/<link>')
def call(link):
    return render_template('video_call.html')  # Display the video call UI

if __name__ == '__main__':
    app.run(debug=True)
#testing integration with jira
