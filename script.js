if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  alert("Your browser does not support video calls. Please use a compatible browser.");
} else {
  // Proceed with setting up the video call
  console.log("Browser supports video calls.");
}

