import React from "react";
import { API } from "aws-amplify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { loadImage } from "../libs/awsLib";
import * as tf from "@tensorflow/tfjs";
import { Chart } from "react-charts";
import Network from "../libs/network";

let running = false;
export default class TrainNetwork extends React.Component {
  constructor(props) {
    super(props);
    this.run = this.run.bind(this);
    this.stop = this.stop.bind(this);
    this.state = {
      currentPhase: "",
    };
  }

  drawLoss() {
    const loss = this.state.loss;
    if (!loss) return <div />;
    if (loss)
      return (
        <div
          style={{
            width: "600px",
            height: "300px",
          }}
        >
          <h1>Network Error vs Training Epoch</h1>
          <Chart
            data={[
              {
                label: "Loss",
                data: loss,
              },
            ]}
            axes={[
              { primary: true, type: "linear", position: "bottom" },
              { type: "linear", position: "left" },
            ]}
          />
        </div>
      );
  }

  createModel(numSymbols) {
    const model = tf.sequential();
    model.add(
      tf.layers.conv2d({
        inputShape: [100, 50, 1],
        kernelSize: 5,
        filters: 20,
        strides: 1,
        activation: "relu",
        kernelInitializer: "VarianceScaling",
      })
    );
    model.add(
      tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2],
      })
    );
    model.add(
      tf.layers.conv2d({
        kernelSize: 5,
        filters: 20,
        strides: 1,
        activation: "relu",
        kernelInitializer: "VarianceScaling",
      })
    );

    model.add(
      tf.layers.maxPooling2d({
        poolSize: [2, 2],
        strides: [2, 2],
      })
    );
    model.add(tf.layers.flatten());
    model.add(
      tf.layers.dense({
        units: numSymbols,
        activation: "sigmoid",
      })
    );
    model.compile({ optimizer: "sgd", loss: "binaryCrossentropy", lr: 0.1 });
    return model;
  }

  async loadAllRows() {
    let startKey = null;
    var rowData = [];

    do {
      var serverOutput = await API.post(
        "music-ocr-app-api",
        "/get_training_data",
        {
          body: {
            startKey: startKey,
          },
        }
      );

      startKey = serverOutput.lastEvaluatedKey;
      rowData = rowData.concat(serverOutput.items);
    } while (startKey);

    let rowData2 = [];
    for (var i = 0; i < 10; i++) rowData2.push(rowData[i]);

    alert("rowData2 = " + JSON.stringify(rowData2));
    return rowData2;
  }

  async loadAllImages(trainingItems) {
    for (var i = 0; i < trainingItems.length; i++) {
      var item = trainingItems[i];
      let loaded = false;
      while (loaded === false) {
        try {
          item.imageData = await loadImage(item.filename);
          loaded = true;
        } catch (e) {
          console.warning("error loading " + item.filename);
          console.warning("trying again...");
        }
      }
    }
  }

  async convertImagesToTensor(trainingItems) {
    for (var i = 0; i < trainingItems.length; i++) {
      var image = trainingItems[i].imageData;

      var pixels = tf.browser.fromPixels(image);
      pixels = pixels.slice([0, 0, 0], [100, 50, 1]);
      //pixels = pixels.squeeze();
      // convert to scalar
      // divide by 255
      const b = tf.scalar(1.0 / 255.0);
      pixels = pixels.mul(b);

      trainingItems[i].inputTensor = pixels;
    }
  }

  async generateSymbolSet(trainingItems) {
    var symbols = [];
    for (var i = 0; i < trainingItems.length; i++) {
      var value = trainingItems[i].value;
      value = JSON.parse(value);
      for (let s = 0; s < value.length; s++) {
        let symbol = value[s];
        if (symbol) if (symbols.indexOf(symbol) < 0) symbols.push(symbol);
      }
    }
    return symbols;
  }

  async convertSymbolsToVector(trainingItems, symbolSet) {
    // iterate through the list and itentify unique symbols
    // then convert to vector of 0 and 1s

    for (let i = 0; i < trainingItems.length; i++) {
      var value = trainingItems[i].value;
      value = JSON.parse(value); // what symbols
      let output = [];
      for (let p = 0; p < symbolSet.length; p++) {
        let o = 0.0;
        let symbol = symbolSet[p];
        if (value.indexOf(symbol) >= 0) o = 1.0;
        output.push(o);
      }

      trainingItems[i].target = output;
    }
  }

  async train(model, trainingExamples, symbols) {
    // create target values
    let targets = [];
    for (let i = 0; i < trainingExamples.length; i++) {
      targets.push(trainingExamples[i].target);
    }
    let target = tf.tensor(targets);
    target.print();

    // create input values
    let inputs = [];
    for (let i = 0; i < trainingExamples.length; i++) {
      inputs.push(trainingExamples[i].inputTensor);
    }
    let input = tf.stack(inputs);
    input.print();

    function onEpochEnd(batch, logs) {
      console.log(batch, ": Accuracy", logs.acc);
    }

    // train
    let loss = await model.fit(input, target, {
      batchSize: 10,
      epochs: 100,
      callbacks: { onEpochEnd },
    });

    var lossData = [];
    loss = loss.history.loss;
    for (let i = 0; i < loss.length; i++) {
      lossData.push([i, loss[i]]);
    }

    Network.saveNetwork(model, symbols);

    this.setState({
      loss: lossData,
    });
    //model.predict(input).print();
  }

  async run() {
    running = true;
    this.forceUpdate();

    // step 1, load all row data
    this.setState({ currentPhase: "loading training data table" });
    var trainingItems = await this.loadAllRows();

    // step 2, load all images
    this.setState({ currentPhase: "loading individual training images" });
    await this.loadAllImages(trainingItems);

    // step 3, convert data to tensor data
    this.setState({ currentPhase: "converting data" });
    await this.convertImagesToTensor(trainingItems);
    let symbolSet = await this.generateSymbolSet(trainingItems);
    await this.convertSymbolsToVector(trainingItems, symbolSet);

    // step 4, create model
    this.setState({ currentPhase: "creating the model" });
    let numSymbols = symbolSet.length;
    const model = this.createModel(numSymbols);

    // step 5, traing
    this.setState({ currentPhase: "training the model... please wait!" });
    await this.train(model, trainingItems, symbolSet);

    running = false;
    this.forceUpdate();
  }

  stop() {
    running = false;
    this.forceUpdate();
  }

  render() {
    return (
      <div>
        {running && (
          <div>
            <div>
              <button onClick={() => this.stop()}>stop</button>
            </div>
            <div>
              <FontAwesomeIcon icon="spinner" className="fa-spin" />{" "}
              {this.state.currentPhase}
            </div>
          </div>
        )}
        {!running && (
          <div>
            <button onClick={() => this.run()}>start training</button>
          </div>
        )}
        {this.drawLoss()}
      </div>
    );
  }
}
