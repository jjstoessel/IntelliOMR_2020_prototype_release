import React from "react";
import { graphqlOperation, API } from "aws-amplify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { loadImage } from "../../libs/awsLib";
import * as tf from "@tensorflow/tfjs";
import { Chart } from "react-charts";
import Network from "../../libs/network";
import * as myqueries from "../../graphql/myqueries";
import { ProgressBar } from "react-bootstrap";
import TrainingExamples from "./TrainingExamples";

let epochs = 10; // typically 50
let running = false;
let experiments = [
  {
    description: "k=3 l=2 f=8 ",
    kernelSize: 5,
    layers: 2,
    filters: 8,
    hidden: 128,
  },
  {
    description: "k=3 l=2 f=8 ",
    kernelSize: 3,
    layers: 2,
    filters: 8,
    hidden: 0,
  },
  {
    description: "k=5 l=2 f=8 ",
    kernelSize: 5,
    layers: 2,
    filters: 8,
    hidden: 0,
  },
  {
    description: "k=7 l=2 f=8 ",
    kernelSize: 7,
    layers: 2,
    filters: 8,
    hidden: 0,
  },
  {
    description: "k=9 l=2 f=8 ",
    kernelSize: 9,
    layers: 2,
    filters: 8,
    hidden: 0,
  },
  {
    description: "k=11 l=2 f=8 ",
    kernelSize: 11,
    layers: 2,
    filters: 8,
    hidden: 0,
  },
  {
    description: "k=5 l=2 f=4 ",
    kernelSize: 5,
    layers: 2,
    filters: 4,
    hidden: 0,
  },
  {
    description: "k=5 l=2 f=8 ",
    kernelSize: 5,
    layers: 2,
    filters: 8,
    hidden: 0,
  },
  {
    description: "k=5 l=2 f=16 ",
    kernelSize: 5,
    layers: 2,
    filters: 16,
    hidden: 0,
  },
  {
    description: "k=5 l=2 f=32 ",
    kernelSize: 5,
    layers: 2,
    filters: 32,
    hidden: 0,
  },
  {
    description: "k=5 l=2 f=64 ",
    kernelSize: 5,
    layers: 2,
    filters: 64,
    hidden: 0,
  },
  /*{
    description: "k=7 l=1 f=1 ",
    kernelSize: 7,
    layers: 1,
    filters: 1,
  },
  {
    description: "k=7 l=1 f=2 ",
    kernelSize: 7,
    layers: 1,
    filters: 2,
  },
  {
    description: "k=7 l=1 f=4 ",
    kernelSize: 7,
    layers: 1,
    filters: 4,
  },
  {
    description: "k=7 l=1 f=8 ",
    kernelSize: 7,
    layers: 1,
    filters: 8,
  },
  {
    description: "k=7 l=1 f=16 ",
    kernelSize: 7,
    layers: 1,
    filters: 16,
  },
  {
    description: "k=7 l=1 f=32 ",
    kernelSize: 7,
    layers: 1,
    filters: 32,
  },*/

  /*{ description: "k=3", kernelSize: 3 },
  { description: "k=5", kernelSize: 5 },
  { description: "k=7", kernelSize: 7 },
  { description: "k=9", kernelSize: 9 },
  { description: "k=11", kernelSize: 11 },*/
  /*{
    description: "k=7 l=1 f=8 h=16",
    kernelSize: 7,
    layers: 1,
    filters: 4,
    hidden: 16,
  },
  {
    description: "k=7 l=1 f=8 h=16",
    kernelSize: 7,
    layers: 1,
    filters: 8,
    hidden: 16,
  },
  {
    description: "k=7 l=1 f=16 h=16",
    kernelSize: 7,
    layers: 1,
    filters: 16,
    hidden: 16,
  },
  {
    description: "k=7 l=2 f=8 h=16",
    kernelSize: 7,
    layers: 2,
    filters: 4,
    hidden: 16,
  },
  {
    description: "k=7 l=2 f=8 h=16",
    kernelSize: 7,
    layers: 2,
    filters: 8,
    hidden: 16,
  },
  {
    description: "k=7 l=2 f=16 h=16",
    kernelSize: 7,
    layers: 2,
    filters: 16,
    hidden: 16,
  },
  {
    description: "k=7 l=2 f=8 h=16",
    kernelSize: 7,
    layers: 3,
    filters: 4,
    hidden: 16,
  },
  {
    description: "k=7 l=2 f=16 h=16",
    kernelSize: 7,
    layers: 3,
    filters: 8,
    hidden: 16,
  },
  {
    description: "k=7 l=2 f=24 h=16",
    kernelSize: 7,
    layers: 3,
    filters: 16,
    hidden: 16,
  },
  {
    description: "k=7 l=1 f=8 h=32",
    kernelSize: 7,
    layers: 1,
    filters: 4,
    hidden: 32,
  },
  {
    description: "k=7 l=1 f= h=32",
    kernelSize: 7,
    layers: 1,
    filters: 8,
    hidden: 32,
  },
  {
    description: "k=7 l=1 f=16 h=32",
    kernelSize: 7,
    layers: 1,
    filters: 16,
    hidden: 32,
  },
  {
    description: "k=7 l=2 f=8 h=32",
    kernelSize: 7,
    layers: 2,
    filters: 4,
    hidden: 32,
  },
  {
    description: "k=7 l=2 f=8 h=32",
    kernelSize: 7,
    layers: 2,
    filters: 8,
    hidden: 32,
  },
  {
    description: "k=7 l=2 f=16 h=32",
    kernelSize: 7,
    layers: 2,
    filters: 16,
    hidden: 32,
  },
  {
    description: "k=7 l=2 f=8 h=32",
    kernelSize: 7,
    layers: 3,
    filters: 4,
    hidden: 32,
  },
  {
    description: "k=7 l=2 f=16 h=32",
    kernelSize: 7,
    layers: 3,
    filters: 8,
    hidden: 32,
  },
  {
    description: "k=7 l=2 f=24 h=32",
    kernelSize: 7,
    layers: 3,
    filters: 16,
    hidden: 32,
  },
  {
    description: "k=7 l=1 f=8 h=64",
    kernelSize: 7,
    layers: 1,
    filters: 4,
    hidden: 64,
  },
  {
    description: "k=7 l=1 f=8 h=64",
    kernelSize: 7,
    layers: 1,
    filters: 8,
    hidden: 64,
  },
  {
    description: "k=7 l=1 f=16 h=64",
    kernelSize: 7,
    layers: 1,
    filters: 16,
    hidden: 64,
  },
  {
    description: "k=7 l=2 f=8 h=64",
    kernelSize: 7,
    layers: 2,
    filters: 4,
    hidden: 64,
  },
  {
    description: "k=7 l=2 f=8 h=64",
    kernelSize: 7,
    layers: 2,
    filters: 8,
    hidden: 64,
  },
  {
    description: "k=7 l=2 f=16 h=64",
    kernelSize: 7,
    layers: 2,
    filters: 16,
    hidden: 64,
  },
  {
    description: "k=7 l=2 f=8 h=64",
    kernelSize: 7,
    layers: 3,
    filters: 4,
    hidden: 64,
  },
  {
    description: "k=7 l=2 f=16 h=64",
    kernelSize: 7,
    layers: 3,
    filters: 8,
    hidden: 64,
  },
  {
    description: "k=7 l=2 f=24 h=64",
    kernelSize: 7,
    layers: 3,
    filters: 16,
    hidden: 64,
  },*/
];

export default class TrainNetwork extends React.Component {
  constructor(props) {
    super(props);
    this.run = this.run.bind(this);
    this.runExperiment = this.runExperiment.bind(this);
    this.stop = this.stop.bind(this);
    this.state = {
      currentPhase: "",
    };
  }

  printCSV() {
    function print(cat, type, values) {
      let st = cat + "," + type;
      for (let i = 0; i < values.length; i++) {
        let val = values[i];
        st += "," + val[1];
      }
    }

    let loss = this.state.calculated_loss;
    if (!loss) return;
    for (let i = 0; i < loss.length; i++) {
      let item = loss[i];
      print(item.description, "loss", item.loss);
      print(item.description, "val_loss", item.val_loss);
      print(item.description, "acc", item.acc);
      print(item.description, "val_acc", item.val_acc);
    }
  }

  drawLoss() {
    const loss = this.state.calculated_loss;
    if (!loss) return <div />;
    if (loss) {
      let data = [];
      for (let i = 0; i < loss.length; i++) {
        let item = loss[i];
        data.push({
          label: item.description + " loss",
          data: item.loss,
        });
        data.push({
          label: item.description + " val_loss",
          data: item.val_loss,
        });
        data.push({
          label: item.description + " acc",
          data: item.acc,
        });
        data.push({
          label: item.description + " val_acc",
          data: item.val_acc,
        });
      }

      this.printCSV();

      return (
        <div
          style={{
            width: "600px",
            height: "600px",
          }}
        >
          <h1>Network Error vs Training Epoch</h1>
          <Chart
            data={data}
            axes={[
              { primary: true, type: "linear", position: "bottom" },
              { type: "linear", position: "left" },
            ]}
          />
        </div>
      );
    }
  }

  createModel_new(numSymbols) {
    const model = tf.sequential();
    model.add(
      tf.layers.conv2d({
        inputShape: [100, 50, 1],
        kernelSize: 5,
        filters: 30,
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
      tf.layers.dropout({
        rate: 0.2,
      })
    );
    model.add(tf.layers.flatten());
    model.add(
      tf.layers.dense({
        units: 128,
        activation: "relu",
      })
    );

    model.add(
      tf.layers.dense({
        units: numSymbols,
        activation: "sigmoid",
      })
    );
    model.compile({ optimizer: "sgd", loss: "binaryCrossentropy", lr: 0.1 });
    return model;
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
        filters: 16, // was 16
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
        units: 128,
        activation: "relu",
      })
    );
    model.add(
      tf.layers.dense({
        units: numSymbols,
        activation: "sigmoid",
      })
    );

    model.compile({ optimizer: "sgd", loss: "binaryCrossentropy", lr: 0.1 });
    return model;
  }

  createModelFromParameters(numSymbols, parameters) {
    const model = tf.sequential();
    const filters = parameters.filters;
    const layers = parameters.layers;

    model.add(
      tf.layers.conv2d({
        inputShape: [100, 50, 1],
        kernelSize: parameters.kernelSize,
        filters: filters, // was 20
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
    if (layers > 1) {
      model.add(
        tf.layers.conv2d({
          kernelSize: parameters.kernelSize,
          filters: filters * 2, // was 16
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
    }
    model.add(tf.layers.flatten());
    if (parameters.hidden > 0)
      model.add(
        tf.layers.dense({
          units: parameters.hidden, // usually 128
          activation: "relu",
        })
      );
    model.add(
      tf.layers.dense({
        units: numSymbols,
        //activation: "sigmoid",

        kernelInitializer: "varianceScaling",
        activation: "softmax",
      })
    );

    model.compile({
      optimizer: "sgd",
      loss: "binaryCrossentropy",
      lr: 0.1,
      metrics: ["accuracy"],
    });
    /*const optimizer = tf.train.adam();
    model.compile({
      optimizer: optimizer,
      loss: "categoricalCrossentropy",
      metrics: ["accuracy"],
      lr: 0.1,
    });*/

    return model;
  }

  /*createModelFromParameters(numSymbols, parameters) {
    const model = tf.sequential();
    const filters = parameters.filters;
    const layers = parameters.layers;

    model.add(
      tf.layers.conv2d({
        inputShape: [100, 50, 1],
        kernelSize: parameters.kernelSize,
        filters: filters, // was 20
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
    if (layers > 2) {
      model.add(
        tf.layers.conv2d({
          kernelSize: parameters.kernelSize,
          filters: filters * 2, // was 16
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
    }
    model.add(tf.layers.flatten());
    if (layers > 1)
      model.add(
        tf.layers.dense({
          units: parameters.hidden, // usually 128
          activation: "relu",
        })
      );
    model.add(
      tf.layers.dense({
        units: numSymbols,
        activation: "sigmoid",
      })
    );

    model.compile({
      optimizer: "sgd",
      loss: "binaryCrossentropy",
      lr: 0.1,
      metrics: ["accuracy"],
    });
    return model;
  }*/

  async loadAllRows() {
    let startKey = null;
    var rowData = [];

    do {
      var serverOutput = await API.graphql(
        graphqlOperation(myqueries.listTrainingImages, {
          nextToken: startKey,
          limit: 5000,
        })
      );

      rowData = rowData.concat(serverOutput.data.listTrainingImages.items);

      startKey = serverOutput.data.listTrainingImages.nextToken;
    } while (startKey);

    // remove anything that is "hidden"
    let rowDataClean = [];
    for (let i = 0; i < rowData.length; i++) {
      let row = rowData[i];
      if (!row.hidden || row.hidden === "false") rowDataClean.push(row);
    }
    rowData = rowDataClean;

    // lets add "blank" symbol!!!
    // and let us remove too much blank data!
    let counts = {};
    for (let i = 0; i < rowData.length; i++) {
      let row = rowData[i];
      let output = JSON.parse(row.value);
      if (output.length === 0) {
        output.push("blank");
        row.value = JSON.stringify(output);
      }
      let concept = output[0];
      if (!counts[concept]) counts[concept] = 1;
      else counts[concept] += 1;
    }

    let blankCounts = counts["blank"];
    let maxAlts = 0;
    for (let i in counts) {
      if (i !== "blank") maxAlts = Math.max(maxAlts, counts[i]);
    }
    let prob = maxAlts / blankCounts;
    alert("counts = " + blankCounts + " " + maxAlts + " prop=" + prob);

    let rowData2 = [];
    for (let i = 0; i < rowData.length; i++) {
      let row = rowData[i];
      let output = JSON.parse(row.value);
      let concept = output[0];
      if (concept !== "blank") rowData2.push(row);
      else if (Math.random() < prob * 3) rowData2.push(row);
    }
    rowData = rowData2; // use a subset of the data

    counts = {};
    for (let i = 0; i < rowData.length; i++) {
      let row = rowData[i];
      let output = JSON.parse(row.value);
      let concept = output[0];
      if (!counts[concept]) counts[concept] = 1;
      else counts[concept] += 1;
    }

    blankCounts = counts["blank"];
    maxAlts = 0;
    for (let i in counts) {
      if (i !== "blank") maxAlts = Math.max(maxAlts, counts[i]);
    }
    prob = maxAlts / blankCounts;
    alert("counts = " + blankCounts + " " + maxAlts + " prop=" + prob);

    rowData2 = [];
    for (var i = 0; i < 100; i++) rowData2.push(rowData[i]);

    //alert("rowData2 = " + JSON.stringify(rowData2));
    //return rowData2;

    return rowData;
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
      let progress = Math.round((100.0 * i) / trainingItems.length);
      this.setState({ progress: progress });
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

      //const values = pixels.dataSync();
      //const arr = Array.from(values);

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

  async train(model, trainingExamples, symbols, saveNetwork) {
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

    let _this = this;
    function onEpochEnd(batch, logs) {
      _this.setState({ progress: 100 * (batch / epochs) });
      let loss = logs.loss; //.loss
      let acc = logs.acc;
      let val_loss = logs.val_loss; // .val_loss
      let val_acc = logs.val_acc;
      let cl = _this.state.calculated_loss;
      let lastBatch = cl[cl.length - 1];
      let sz = lastBatch.loss.length;
      lastBatch.loss.push([sz, loss]);
      lastBatch.val_loss.push([sz, val_loss]);
      lastBatch.acc.push([sz, acc]);
      lastBatch.val_acc.push([sz, val_acc]);
      _this.forceUpdate();
    }

    // train
    let loss = await model.fit(input, target, {
      batchSize: 1,
      epochs: epochs,
      callbacks: { onEpochEnd },
      validationSplit: 0.1,
    });
  }

  async run() {
    alert("saving model");
    this.saveNetwork();
    alert("saved");
  }

  async run2() {
    running = true;
    this.forceUpdate();

    this.setState({
      calculated_loss: [
        {
          description: "standard network",
          loss: [],
          val_loss: [],
          acc: [],
          val_acc: [],
        },
      ],
    });

    // step 1, load all row data
    this.setState({ currentPhase: "loading training data table", progress: 0 });
    var trainingItems = await this.loadAllRows();
    let symbolSet = await this.generateSymbolSet(trainingItems);

    // step 2, load all images
    this.setState({
      currentPhase: "loading individual training images",
      progress: 0,
    });
    await this.loadAllImages(trainingItems);

    // step 3, convert data to tensor data
    this.setState({ currentPhase: "converting data", progress: 0 });
    await this.convertImagesToTensor(trainingItems);

    await this.convertSymbolsToVector(trainingItems, symbolSet);

    // step 4, create model
    this.setState({ currentPhase: "creating the model", progress: 0 });
    let numSymbols = symbolSet.length;
    const model = this.createModel(numSymbols);

    // step 5, traing
    this.setState({
      currentPhase: "training the model... please wait!",
      progress: 0,
    });
    await this.train(model, trainingItems, symbolSet, true);

    running = false;
    this.forceUpdate();
  }

  async runExperiment() {
    running = true;
    this.forceUpdate();

    // step 1, load all row data
    this.setState({ currentPhase: "loading training data table", progress: 0 });
    var trainingItems = await this.loadAllRows();
    let symbolSet = await this.generateSymbolSet(trainingItems);

    // step 2, load all images
    this.setState({
      currentPhase: "loading individual training images",
      progress: 0,
    });
    await this.loadAllImages(trainingItems);

    // step 3, convert data to tensor data
    this.setState({ currentPhase: "converting data", progress: 0 });
    await this.convertImagesToTensor(trainingItems);

    await this.convertSymbolsToVector(trainingItems, symbolSet);

    // step 4, create model
    this.setState({ currentPhase: "creating the model", progress: 0 });
    let numSymbols = symbolSet.length;

    this.setState({
      calculated_loss: [],
    });

    for (let i = 0; i < experiments.length; i++) {
      let parameters = experiments[i];
      this.state.calculated_loss.push({
        description: parameters.description,
        loss: [],
        val_loss: [],
        acc: [],
        val_acc: [],
      });

      const model = this.createModelFromParameters(numSymbols, parameters);

      // step 5, traing
      this.setState({
        currentPhase: "training the model... please wait!",
        progress: 0,
      });
      await this.train(model, trainingItems, symbolSet, false);
    }

    running = false;
    this.forceUpdate();
  }

  stop() {
    running = false;
    this.forceUpdate();
  }

  saveNetwork() {
    Network.saveCurrentModel();
  }

  renderInstructions() {
    return (
      <div className="instructions">
        <h1>Instructions</h1>
        <p>
          This section will retrain the network using the current training set.
          You will need to use the interface under "Training Data" to extend the
          training set to include your latest corrections from phase 4.
        </p>
        <p>
          As network training takes some time, only use this after you have made
          a large number of corrections to phase 4.
        </p>
      </div>
    );
  }

  render() {
    return (
      <div>
        <h2>Train the Network</h2>
        {this.renderInstructions()}

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
              <ProgressBar
                striped
                now={this.state.progress}
                label={`${this.state.progress}%`}
              />
            </div>
          )}
          {!running && (
            <div>
              <button onClick={() => this.run()}>start training</button>
              <button onClick={() => this.runExperiment()}>
                explore parameters
              </button>
            </div>
          )}
          {this.drawLoss()}
        </div>
        <TrainingExamples />
      </div>
    );
  }
}
