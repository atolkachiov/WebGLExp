import React from "react";
import _ from "lodash";

const resolutionOptions = {
  qvga: {
    title: "320x240 qvga",
    video: { width: { exact: 320 }, height: { exact: 240 } }
  },
  vga: {
    title: "640x480 vga",
    video: { width: { exact: 640 }, height: { exact: 480 } }
  },
  hd: {
    title: "1280x720 HD",
    video: { width: { exact: 1280 }, height: { exact: 720 } }
  },
  fullHd: {
    title: "1920x1080 FullHd",
    video: { width: { exact: 1920 }, height: { exact: 1080 } }
  },
  k4: {
    title: "4096x2160 4K",
    video: { width: { exact: 4096 }, height: { exact: 2160 } }
  },
  k8: {
    title: "7680x4320 8K",
    video: { width: { exact: 7680 }, height: { exact: 4320 } }
  }
};

class Capture extends React.Component {
  state = {
    audioOptions: [],
    videoOptions: [],
    resolutionOptions: resolutionOptions,
    audio: null,
    video: null,
    resolution: "hd",
    active: false
  };
  video = null;
  canvas = null;

  createVideoRef = element => (this.video = element);
  createCanvasRef = element => (this.canvas = element);

  gotDevices = deviceInfos => {
    const audioOptions = [];
    const videoOptions = [];
    let audio = null,
      video = null;
    for (const deviceInfo of deviceInfos) {
      if (deviceInfo.kind === "audioinput") {
        audioOptions[deviceInfo.deviceId] =
          deviceInfo.label || "microphone " + (_.keys(audioOptions).length + 1);
        if (!audio) audio = deviceInfo.deviceId;
      } else if (deviceInfo.kind === "videoinput") {
        videoOptions[deviceInfo.deviceId] =
          deviceInfo.label || "camera " + (_.keys(videoOptions).length + 1);
        if (!video) video = deviceInfo.deviceId;
      } else {
        console.log("Found another kind of device: ", deviceInfo);
      }
    }
    this.setState({ audioOptions, videoOptions, audio, video });
  };

  getStream = () => {
    this.stopStream();
    const constraints = {
      // audio: { deviceId: { exact: this.state.audio } },
      video: {
        ...this.state.resolutionOptions[this.state.resolution].video,
        deviceId: { exact: this.state.video }
      }
    };
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then(this.gotStream)
      .catch(this.handleError);
  };

  gotStream = stream => {
    this.setState({ active: true });
    window.stream = stream;
    this.video.srcObject = stream;
    this.videoFrameToCanvas();
  };

  videoFrameToCanvas = () => {
    this.canvas.getContext("2d").drawImage(this.video, 0, 0);
    if (this.state.active) {
      window.requestAnimationFrame(this.videoFrameToCanvas);
    }
  };

  stopStream = () => {
    if (window.stream) {
      window.stream.getTracks().forEach(track => track.stop());
    }
    this.setState({ active: false });
  };

  handleError = error => {
    console.error("Error: ", error);
  };

  init = () => {
    navigator.mediaDevices
      .enumerateDevices()
      .then(this.gotDevices)
      //.then(this.getStream)
      .catch(this.handleError);
  };

  componentDidMount = () => {
    this.init();
  };

  componentWillUnmount = () => {};

  onSelected = what => event => {
    this.setState({ [what]: event.target.value }, this.getStream);
  };

  select = what => {
    const opts = this.state[`${what}Options`];
    const value = this.state[what];
    return (
      <select defaultValue={value} onChange={this.onSelected(what)}>
        {_.keys(opts).map(opt => (
          <option value={opt} key={opt}>
            {_.isString(opts[opt]) ? opts[opt] : opts[opt].title}
          </option>
        ))}
      </select>
    );
  };

  render = () => {
    const { active } = this.state;
    const videoOptions = this.state.resolutionOptions[this.state.resolution]
      .video;
    const r = videoOptions.height.exact / videoOptions.width.exact;
    const w = 400;
    const style = {
      width: w,
      height: w * r,
      border: "solid 1px #a0a0a0"
    };

    return (
      <React.Fragment>
        {this.select("resolution")}
        {this.select("audio")}
        {this.select("video")}
        <button onClick={() => _.defer(this.getStream)}>Capture</button>
        <button onClick={() => _.defer(this.stopStream)}>Stop</button>
        <div style={{ display: active ? "block" : "none" }}>
          <video
            style={style}
            autoPlay
            muted
            playsInline
            ref={this.createVideoRef}
          />
          <canvas
            width={videoOptions.width.exact}
            height={videoOptions.height.exact}
            style={style}
            ref={this.createCanvasRef}
          />
        </div>
      </React.Fragment>
    );
  };
}

export default Capture;
