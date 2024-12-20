const socket = io.connect(window.location.href);

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const startButton = document.getElementById('startButton');
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');

startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

let localStream;
let peerConnection;

const servers = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302'
    }
  ]
};

function start() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        console.log('Local stream obtained');
        localVideo.srcObject = stream;
        localStream = stream;
      })
      .catch(error => {
        console.error('Error accessing media devices:', error);
        alert('Error accessing media devices: ' + error.message);
      });
  } else {
    console.error('getUserMedia not supported in this browser');
    alert('Your browser does not support getUserMedia API');
  }
}

function createPeerConnection() {
  peerConnection = new RTCPeerConnection(servers);
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      console.log('Sending ICE candidate');
      socket.emit('candidate', event.candidate);
    }
  };
  peerConnection.ontrack = event => {
    console.log('Received remote stream');
    remoteVideo.srcObject = event.streams[0];
  };
  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE Connection State:', peerConnection.iceConnectionState);
  };
  peerConnection.onsignalingstatechange = () => {
    console.log('Signaling State:', peerConnection.signalingState);
  };
}

function call() {
  createPeerConnection();
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  peerConnection.createOffer()
    .then(offer => peerConnection.setLocalDescription(offer))
    .then(() => {
      console.log('Sending offer');
      socket.emit('offer', peerConnection.localDescription);
    })
    .catch(error => console.error('Error creating offer:', error));
}

socket.on('offer', offer => {
  console.log('Received offer');
  if (!peerConnection || peerConnection.signalingState === 'closed') {
    createPeerConnection();
  }
  if (peerConnection.signalingState === 'stable') {
    peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        console.log('Setting remote description for offer');
        return navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      })
      .then(stream => {
        console.log('Local stream obtained');
        localVideo.srcObject = stream;
        localStream = stream;
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        return peerConnection.createAnswer();
      })
      .then(answer => peerConnection.setLocalDescription(answer))
      .then(() => {
        console.log('Sending answer');
        socket.emit('answer', peerConnection.localDescription);
      })
      .catch(error => console.error('Error handling offer:', error));
  } else {
    console.error('PeerConnection is not in the correct state to set remote offer');
  }
});

socket.on('answer', answer => {
  console.log('Received answer');
  if (peerConnection.signalingState === 'have-local-offer') {
    peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      .then(() => console.log('Remote description set for answer'))
      .catch(error => console.error('Error setting remote description:', error));
  } else {
    console.error('PeerConnection is not in the correct state to set remote answer');
  }
});

socket.on('candidate', candidate => {
  console.log('Received ICE candidate');
  if (peerConnection.signalingState !== 'closed') {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      .catch(error => console.error('Error adding ICE candidate:', error));
  } else {
    console.error('Cannot add ICE candidate, PeerConnection is closed');
  }
});

function hangup() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
    console.log('Call ended');
  }
}

