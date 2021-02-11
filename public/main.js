var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");

var roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;

var iceServers = {
  // iceServers: [
  // { urls: "stun:stun.services.mozilla.com" },
  // { urls: "stun:stun.l.google.com:19302" },
  // { urls: "stun:stun2.l.google.com:19305" },
  // { urls: "stun:relay.backups.cz" },
  // {
  //   urls: "stun:numb.viagenie.ca",
  //   username: "sultan1640@gmail.com",
  //   credential: "98376683",
  // },
  // {
  //   urls: "turn:numb.viagenie.ca",
  //   username: "sultan1640@gmail.com",
  //   credential: "98376683",
  // },
  // {
  //   url: "turn:relay.backups.cz",
  //   credential: "webrtc",
  //   username: "webrtc",
  // },
  // {
  //   url: "turn:relay.backups.cz?transport=tcp",
  //   credential: "webrtc",
  //   username: "webrtc",
  // },

  //   { urls: "stun:stun.stunprotocol.org" },
  //   {
  //     urls: "turn:numb.viagenie.ca",
  //     credential: "muazkh",
  //     username: "webrtc@live.com",
  //   },
  // ],
  iceServers: [
    { urls: ["stun:numb.viagenie.ca"], username: "", credential: "" },
    {
      urls: ["turn:numb.viagenie.ca"],
      username: "mdyou002@gmail.com",
      credential: "yousufpassword",
    },
  ],
  iceTransportPolicy: "all",
};
// config = {
//   iceServers: [
//     { urls: ["stun:numb.viagenie.ca"], username: "", credential: "" },
//     {
//       urls: ["turn:numb.viagenie.ca"],
//       username: "mdyou002@gmail.com",
//       credential: "yousufpassword",
//     },
//   ],
//   iceTransportPolicy: "all",
// };

var streamConstraints = {
  audio: true,
  video: true,
};

var socket = io();

btnGoRoom.onclick = async function () {
  if (inputRoomNumber.value === "") {
    alert("Please type a room name");
  } else {
    roomNumber = inputRoomNumber.value;
    socket.emit("create or join", roomNumber);
    divSelectRoom.style = "display:none;";
    divConsultingRoom.style = "display:block;";
  }
};

socket.on("created", async function (room) {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then(function (stream) {
      localStream = stream;
      localVideo.srcObject = stream;
      isCaller = true;
    })
    .catch(function (err) {
      console.log(err, "error in capturing media from your device");
    });
});

socket.on("joined", (room) => {
  navigator.mediaDevices
    .getUserMedia(streamConstraints)
    .then((stream) => {
      localStream = stream;
      localVideo.srcObject = stream;
      socket.emit("ready", roomNumber);
    })
    .catch((err) => {
      console.log(err, "error in capturing media from your device");
    });
});

socket.on("ready", () => {
  if (isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection
      .createOffer()
      .then(async (sessionDescription) => {
        await rtcPeerConnection.setLocalDescription(sessionDescription);
        socket.emit("offer", {
          type: "offer",
          sdp: sessionDescription,
          room: roomNumber,
        });
      })
      .catch((err) => {
        console.log(err, "error while emiiting offer to socketIO");
      });
  }
});

socket.on("offer", (event) => {
  if (!isCaller) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = onIceCandidate;
    rtcPeerConnection.ontrack = onAddStream;
    rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
    rtcPeerConnection.addTrack(localStream.getTracks()[1], localStream);
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
    rtcPeerConnection.createAnswer().then(async (sessionDescription) => {
      await rtcPeerConnection.setLocalDescription(sessionDescription);
      socket
        .emit("answer", {
          type: "answer",
          sdp: sessionDescription,
          room: roomNumber,
        })
        .catch((err) => {
          console.log(err, "error while emiiting offer to socketIO");
        });
    });
  }
});

socket.on("answer", (event) => {
  rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on("candidate", (event) => {
  var candidate = new RTCIceCandidate({
    sdpMLineIndex: event.label,
    candidate: event.candidate.candidate,
    sdpMid: event.id,
  });
  rtcPeerConnection.addIceCandidate(candidate);
});

function onAddStream(event) {
  remoteVideo.srcObject = event.streams[0];
  remoteStream = event.streams[0];
}

function onIceCandidate(event) {
  if (event.candidate) {
    console.log("sending ice candidate", event.candidate);
    socket.emit("candidate", {
      type: "candidate",
      label: event.candidate.sdpMLineIndex,
      id: event.candidate.sdpMid,
      candidate: event.candidate,
      room: roomNumber,
    });
  }
}

/*Project - TOGETHER :status

-Create User Screen : completed with both UI & functionality(API calls)
-List of Events Screen : completed with UI, pending integration of API calls
-Signup screens(3) : completed with UI, pending integration of API calls
-Main Video streaming screen : pending functionality
-working on UI & API calls for login, reserve box, add participants and payment screen
*/
