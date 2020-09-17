import React from "react";
import { Tab, Tabs } from "react-bootstrap";
import { graphqlOperation, API } from "aws-amplify";
import * as myqueries from "../../graphql/myqueries";
import * as mutations from "../../graphql/mutations";
import config from "../../config";
import overlaygrid from "./overlaygrid.png";
import "./TrainingExamples.css";

class TrainingExampleThumbnail extends React.Component {
  render() {
    let showOverlay = true;

    return (
      <div class="examplethumbnail">
        <img alt="img" src={config.s3.IMAGEURL + this.props.item.filename} />
        {showOverlay && (
          <img class="examplethumbnailoverlay" alt="img" src={overlaygrid} />
        )}
        {showOverlay && (
          <div
            class="deleteExample"
            onClick={(e) =>
              this.props.deleteItem(e, this.props.item, this.props.set)
            }
          >
            X
          </div>
        )}
        {this.props.saveItem && (
          <div
            class="saveExample"
            onClick={(e) => this.props.saveItem(this.props.item)}
          >
            &larr;
          </div>
        )}
      </div>
    );
  }
}

export default class TrainNetwork extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loadingState: "loading",
      selectedConcept: null,
      selectedPage: 0,
    };
    this.loadAllRows = this.loadAllRows.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.saveToTrainingSet = this.saveToTrainingSet.bind(this);
  }

  async saveToTrainingSet(item) {
    // step 1... delete from current state

    let selectedItem = this.state.selectedUnclassifiedConcept;
    let images = this.state.unclassifiedImages[selectedItem];

    for (var i = 0; i < images.length; i++) {
      if (images[i].id === item.id) {
        images.splice(i, 1);
        break;
      }
    }

    if (!this.state.trainingImages[selectedItem]) {
      this.state.trainingImages[selectedItem] = [];
    }
    this.state.trainingImages[selectedItem].push(item);

    // step 2... delete from dynamo database
    await API.graphql(
      graphqlOperation(mutations.updateTrainingImage, {
        input: {
          id: item.id,
          hidden: false,
        },
      })
    );

    // step 3... delete from image server
    this.setState({
      trainingImages: this.state.trainingImages,
      unclassifiedImages: this.state.unclassifiedImages,
    });
  }

  async componentDidMount() {
    await this.loadAllRows();
  }

  async deleteItem(e, item, set) {
    // step 1... delete from current state
    let selectedItem = this.state.selectedConcept;
    let images = this.state.trainingImages[selectedItem];

    if (set !== "trainingImages") {
      selectedItem = this.state.selectedUnclassifiedConcept;
      images = this.state.unclassifiedImages[selectedItem];
    }

    for (var i = 0; i < images.length; i++) {
      if (images[i].id === item.id) {
        images.splice(i, 1);
        break;
      }
    }

    // step 2... delete from dynamo database
    await API.graphql(
      graphqlOperation(mutations.deleteTrainingImage, {
        input: {
          id: item.id,
        },
      })
    );

    // step 3... delete from image server
    this.setState({
      trainingImages: this.state.trainingImages,
      unclassifiedImages: this.state.unclassifiedImages,
    });
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

    function sortIntoCategories(data, type) {
      let categories = {};

      for (var i = 0; i < data.length; i++) {
        let item = data[i];
        let id = item.id;
        let filename = item.filename;
        let concepts = JSON.parse(item.value);
        let concept = "blank";
        if (concepts.length > 0) concept = concepts[0];
        let hidden = false;
        if (item.hidden && item.hidden === "true") hidden = true;
        if (type === "visible" && hidden) continue;
        if (type === "hidden" && !hidden) continue;

        if (!categories[concept]) categories[concept] = [];

        categories[concept].push({
          id: id,
          filename: filename,
          hidden: hidden,
        });
      }
      return categories;
    }

    this.setState({
      loadingState: "loaded",
      trainingImages: sortIntoCategories(rowData, "visible"),
      unclassifiedImages: sortIntoCategories(rowData, "hidden"),
    });
  }

  renderLabel(item, set, selectedItem, type) {
    let _this = this;
    function onclick(item) {
      if (type === "trainingImages") _this.setState({ selectedConcept: item });
      else _this.setState({ selectedUnclassifiedConcept: item });
    }

    let length = set[item].length;
    if (item === selectedItem)
      return <div class="selectedItem">{item + "(" + length + ")"}</div>;
    return (
      <div class="unselectedItem" onClick={() => onclick(item)}>
        {item + "(" + length + ")"}
      </div>
    );
  }

  selectPage(key) {
    let page = parseInt(key.key);
    this.setState({
      selectedPage: page,
    });
  }

  renderThumbnails(imageSet, set) {
    let saveItem = null;

    let images = [];
    let start = this.state.selectedPage * 50;
    let end = Math.min(imageSet.length, start + 50);
    if (start < imageSet.length) {
      for (let i = start; i < end; i++) images.push(imageSet[i]);
    }

    function createTabs() {
      let tabs = [];
      for (let i = 0; i < imageSet.length / 50; i++) {
        tabs.push(<Tab eventKey={"" + i} title={i + 1}></Tab>);
      }
      return tabs;
    }

    if (set === "unclassifiedImages") saveItem = this.saveToTrainingSet;
    return (
      <div>
        <Tabs
          variant="pills"
          defaultActiveKey="0"
          id="batchSelector"
          onSelect={(key) => this.selectPage({ key })}
        >
          {createTabs()}
        </Tabs>
        <div className="text-left" style={{ minHeight: "440px" }}>
          {images.map((item) => (
            <TrainingExampleThumbnail
              item={item}
              deleteItem={this.deleteItem}
              set={set}
              saveItem={saveItem}
            />
          ))}
        </div>
      </div>
    );
  }

  renderTrainingData() {
    let trainingImages = [];
    if (this.state.selectedConcept)
      trainingImages = this.state.trainingImages[this.state.selectedConcept];
    let unclassifiedImages = [];
    if (this.state.selectedUnclassifiedConcept) {
      unclassifiedImages = this.state.unclassifiedImages[
        this.state.selectedUnclassifiedConcept
      ];
    }

    let trainingKeys = [];
    for (let k in this.state.trainingImages) trainingKeys.push(k);
    let unclassifiedKeys = [];
    for (let k in this.state.unclassifiedImages) unclassifiedKeys.push(k);

    return (
      <div>
        <Tabs defaultActiveKey="home" transition={false} id="training-tabs">
          <Tab eventKey="home" title="training data">
            <div>
              {trainingKeys.map((item) =>
                this.renderLabel(
                  item,
                  this.state.trainingImages,
                  this.state.selectedConcept,
                  "trainingImages"
                )
              )}
            </div>
            {this.renderThumbnails(trainingImages, "trainingImages")}
          </Tab>
          <Tab eventKey="profile" title="unclassified data">
            <div>
              {unclassifiedKeys.map((item) =>
                this.renderLabel(
                  item,
                  this.state.unclassifiedImages,
                  this.state.selectedUnclassifiedConcept,
                  "unclassifiedImages"
                )
              )}
            </div>
            {this.renderThumbnails(unclassifiedImages, "unclassifiedImages")}
          </Tab>
        </Tabs>
      </div>
    );
  }

  renderInstructions() {
    return (
      <div className="instructions">
        <h1>Instructions</h1>
        <p>Below is the current training set for the neural network.</p>
        <p>
          Training examples that are added by users are automatically added to
          the "unclassified data" and are not used in the training data. To add
          items to the training set, click on the category below and click on
          the green &#8592; above an item to add it, or the X to delete the
          item.
        </p>
      </div>
    );
  }

  render() {
    let loaded = this.state.loadingState === "loaded";
    return (
      <div>
        <h2>Training Data</h2>
        {!loaded && <div>loading...</div>}
        {loaded && (
          <div>
            {this.renderInstructions()}
            {this.renderTrainingData()}
          </div>
        )}
      </div>
    );
  }
}
