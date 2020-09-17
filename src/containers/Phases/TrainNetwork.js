import React from "react";
import { graphqlOperation, API } from "aws-amplify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { loadImage, uploadFile } from "../../libs/awsLib";
import * as tf from "@tensorflow/tfjs";
import Chart from "react-google-charts";
import Network from "../../libs/network";
import * as myqueries from "../../graphql/myqueries";
import { ProgressBar } from "react-bootstrap";
import TrainingExamples from "./TrainingExamples";
import "./trainNetwork.css";
import LoaderButton from "../../components/buttons/LoaderButton";

let epochs = 20; // typically 50
let running = false;

export default class TrainNetwork extends React.Component {
  constructor(props) {
    super(props);
    this.run = this.run.bind(this);
    this.stop = this.stop.bind(this);
    this.state = {
      currentPhase: "",
      trainingState: "untrained",
      uploadingModel: false,
    };
    this.modeljson = React.createRef();
    this.modelweightsbin = React.createRef();
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
    if (!loss || loss.length === 0) return <div />;
    let len = loss[0].loss.length;
    if (len < 1) return <div />;
    if (loss) {
      let data = [];
      for (let i = 0; i < loss.length; i++) {
        data.push(["epoch", "loss", "val_loss", "acc", "val_acc"]);
        let itemSet = loss[i];
        for (let x = 0; x < itemSet.loss.length; x++) {
          data.push([
            x,
            itemSet.loss[x],
            itemSet.val_loss[x],
            itemSet.acc[x],
            itemSet.val_acc[x],
          ]);
        }
      }

      this.printCSV();

      //return null;
      return (
        <div
          style={{
            height: "600px",
          }}
        >
          <h1>Network Error vs Training Epoch</h1>
          <Chart
            width={"100%"}
            height={"400px"}
            chartType="AreaChart"
            data={data}
            options={{
              hAxis: {
                title: "epoch",
              },
              vAxis: {
                title: "performance",
              },
            }}
            rootProps={{ "data-testid": "3" }}
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
        filters: 16,
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
        filters: 32, // was 16
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

    //model.compile({ optimizer: "sgd", loss: "binaryCrossentropy", lr: 0.1 });
    model.compile({
      optimizer: "sgd",
      loss: "binaryCrossentropy",
      lr: 0.1,
      metrics: ["accuracy"],
    });
    return model;
  }

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
    //alert("counts = " + blankCounts + " " + maxAlts + " prop=" + prob);

    let rowData2 = [];
    for (let i = 0; i < rowData.length; i++) {
      let row = rowData[i];
      let output = JSON.parse(row.value);
      let concept = output[0];
      if (concept !== "blank") rowData2.push(row);
      else if (Math.random() < prob * 3) rowData2.push(row);
    }
    /*rowData = rowData2; // use a subset of the data

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

    //console.log("training data = " + JSON.stringify(rowData));
    */
    //rowData2 = [];
    //for (var i = 0; i < 100; i++) rowData2.push(rowData[i]);

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
        if (symbol !== "blank") if (value.indexOf(symbol) >= 0) o = 1.0;
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
      lastBatch.loss.push(loss);
      lastBatch.val_loss.push(val_loss);
      lastBatch.acc.push(acc);
      lastBatch.val_acc.push(val_acc);
      _this.forceUpdate();
    }

    // train
    await model.fit(input, target, {
      batchSize: 1,
      epochs: epochs,
      callbacks: { onEpochEnd },
      validationSplit: 0.1,
    });

    //
    if (saveNetwork) {
      this.setState({ trainingState: "trained" });
      Network.setNetwork(model, symbols);
    }
  }

  async run() {
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
    this.setState({ trainingState: "trained" });
    running = false;
    this.forceUpdate();
  }

  stop() {
    running = false;
    this.forceUpdate();
  }

  //saveNetwork() {
  //  Network.saveCurrentModel();
  //}

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
        <p>
          This software uses TensorFlow.js and uses your graphics card to
          perform mathematical operations. You will need to keep this tab open
          and visible while running.
        </p>
      </div>
    );
  }

  downloadModelFiles() {
    Network.saveCurrentModel();
  }

  async uploadModel() {
    this.setState({ uploadingModel: true });
    // lets check to see if the files are valid
    let modeljson = this.modeljson.current.files;
    if (modeljson.length !== 1) {
      alert("please select a model.json file to upload");
      return;
    }
    modeljson = modeljson[0];
    if (modeljson.name.indexOf(".json") < 0) {
      alert("incorrect upload file... please try again");
      return;
    }
    let modelweightsbin = this.modelweightsbin.current.files;
    if (modelweightsbin.length !== 1) {
      alert("please select a model.weights.bin file to upload");
      return;
    }
    modelweightsbin = modelweightsbin[0];
    if (modelweightsbin.name.indexOf(".bin") < 0) {
      alert("incorrect upload file... please try again");
      return;
    }

    await uploadFile(modeljson, "intelliomrmodel.json");
    await uploadFile(modelweightsbin, "intelliomrmodel.weights.bin");
    Network.saveCurrentSymbols();
    this.setState({ uploadingModel: false, trainingState: "saved" });
  }

  renderUploadPanelSaved() {
    return (
      <div className="uploadPanel">
        <h2>Upload Model to Server</h2>
        <p>The model was successfully uploaded.</p>
      </div>
    );
  }

  renderUploadPanel() {
    return (
      <div className="uploadPanel">
        <h2>Upload Model to Server</h2>
        <p>
          Now, that you have trained the model locally, we need to upload the
          model to the server;
        </p>
        <h4>Step 1</h4>
        <p>
          Click on the button below to download the model files to your computer
          (generally to your downloads folder):
        </p>
        <p>
          <button onClick={() => this.downloadModelFiles()}>
            Download Model Files
          </button>
        </p>
        <h4>Step 2</h4>
        <p>
          Now, please use the below buttons to select the given two files you
          have just downloaded:
        </p>

        <p>
          <table>
            <tr>
              <td>
                <b>intelliomrmodel.json</b>
              </td>
              <td>
                <input
                  ref={this.modeljson}
                  id="modeljson"
                  type="file"
                  name="modeljson"
                />
              </td>
            </tr>
            <tr>
              <td>
                <b>intelliomrmodel.weights.bin</b>
              </td>
              <td>
                <input
                  ref={this.modelweightsbin}
                  id="modelweightsbin"
                  type="file"
                  name="modelweightsbin"
                />
              </td>
            </tr>
          </table>
        </p>
        <h4>Step 3</h4>
        <p>
          Click on the upload button below to upload the files to the server!
        </p>
        <LoaderButton
          className="btn-success"
          color="success"
          onClick={() => this.uploadModel()}
          isLoading={this.state.uploadingModel}
          text="Upload Files"
          loadingText="Uploading"
        >
          Upload FIles
        </LoaderButton>
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
            </div>
          )}
          {!running &&
            this.state.trainingState === "trained" &&
            this.renderUploadPanel()}
          {!running &&
            this.state.trainingState === "saved" &&
            this.renderUploadPanelSaved()}

          {this.drawLoss()}
        </div>
        <TrainingExamples />
      </div>
    );
  }
}
