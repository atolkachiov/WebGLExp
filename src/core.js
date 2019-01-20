import React from "react";
import _ from "lodash";
import styled from "styled-components";
import GPU from "gpu.js";
import fps from "./fps";

const dim = 512;

function createData(size, rand) {
  const ret = [];
  for (let a = 0; a < size; ++a) {
    ret[a] = [];
    for (var i = 0; i < size; ++i) {
      ret[a][i] = rand() * 100;
    }
  }
  return ret;
}

const View = styled.div`
  width: ${dim}px;
  height: ${dim}px;
  background-color: #a0a0a0;
`;

class Core extends React.Component {
  state = { fps: null };
  canvas = null;
  showFps = fps => this.setState({ fps });
  fps = new fps({ show: this.showFps });
  createCanvas = element => (this.canvas = element);

  dump = data => {
    //console.log(JSON.stringify(data, null, 2));
    //console.log(data);
  };

  time = usDiff => {
    console.log(`Time: ${usDiff / 1000} sec`);
  };

  componentWillUnmount() {
    this.fps.stop();
  }

  getGPU = () =>
    new GPU({
      canvas: this.canvas
      //webGl: false,
      //mode: 'cpu',
    });

  drawKernel = null;
  drawX = 0;

  getDrawKernel = () =>
    this.getGPU()
      .createKernel(function(x) {
        this.color(
          (x * (this.thread.y + this.thread.x)) / 1024.0,
          (x * (this.thread.y * this.thread.x)) / (1024.0 * 1024.0),
          (x * (this.thread.y * 2 * this.thread.x)) / (1024.0 * 2),
          1
        );
      })
      .setOutput([dim, dim])
      .setGraphical(true);

  doDraw = () => {
    for (let i = 0; i < 150; i++) {
      this.fps.add();
      this.drawKernel(this.drawX);
      this.drawX += 0.001;
    }
    window.requestAnimationFrame(this.doDraw);
  };

  draw = () => {
    this.fps.start();
    this.drawKernel = this.getDrawKernel();
    window.requestAnimationFrame(this.doDraw);
  };

  render() {
    return (
      <React.Fragment>
        {this.state.fps !== null && <div>fps: {this.state.fps}</div>}
        <button value="draw" onClick={() => _.defer(this.draw)}>
          Draw
        </button>
        <View>
          <canvas ref={this.createCanvas} />
        </View>
      </React.Fragment>
    );
  }
}

export default Core;
