import React, { Component } from "react";
import "./DocumentSet.css";
import { LinkContainer } from "react-router-bootstrap";
import classnames from "classnames";
import { API } from "aws-amplify";
import { Row, Col, Nav, TabContent, TabPane } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import ImageUploader from "../components/uploaders/ImageUploader";
import DocumentScanList from "../components/DocumentScanList";
import Phase1 from "../components/Phase1";
import Phase2 from "../components/Phase2";
import Phase3 from "../components/Phase3";
import Phase4 from "../components/Phase4";
import Phase5 from "../components/Phase5";
import RunProject from "../components/RunProject";
import {
  calculateOrientation,
  calculatePhase2,
  calculatePhase3,
  calculatePhase4,
  calculatePhase5,
} from "../libs/runPhases";
import TrainNetwork from "../components/TrainNetwork";

import { updateRows } from "../libs/awsLib";

export default class DocumentSet extends Component {
  constructor(props) {
    super(props);
    this.running = false;

    this.state = {
      isLoading: true,
      entityId: this.props.match.params.id,
      imageUploaderVisible: false,
      visiblePhase: "1",
      documentImages: [],
      documentSetName: "",
      selectedImage: "",
      running: false,
      progress: {
        phase1: 0,
      },
    };

    this.closeImageUploader = this.closeImageUploader.bind(this);
    this.setVisiblePhase = this.setVisiblePhase.bind(this);
    this.showImageUploader = this.showImageUploader.bind(this);
    this.selectImage = this.selectImage.bind(this);
    this.getDocumentImages = this.getDocumentImages.bind(this);
    this.reloadDocumentImages = this.reloadDocumentImages.bind(this);
    this.deleteImage = this.deleteImage.bind(this);
    this.run = this.run.bind(this);
    this.reset = this.reset.bind(this);
    this.stop = this.stop.bind(this);
    this.setSelectedImageAttribute = this.setSelectedImageAttribute.bind(this);
  }

  deleteImage(e, item) {
    e.stopPropagation();
    var r = window.confirm("are you sure you want to delete this image?");
    if (r === true) {
      var array = [...this.state.documentImages]; // make a separate copy of the array
      var index = array.indexOf(item);
      array.splice(index, 1);
      this.setState({ documentImages: array, selectedImage: "" });
      API.post("music-ocr-app-api", "/delete", {
        body: {
          entityId: item.entityId,
          type: item.type,
        },
      });
    }
  }

  selectImage(id) {
    var index = this.state.documentImages.indexOf(id);
    if (index >= 0) {
      this.setState({
        selectedImage: id,
      });
    }
  }

  async getDocumentImages() {
    let output = {
      images: [],
      name: null,
    };

    let startKey = null;
    const id = this.state.entityId;

    do {
      var serverOutput = await API.post(
        "music-ocr-app-api",
        "/list_document_set_images",
        {
          body: {
            id: id,
            startKey: startKey,
          },
        }
      );
      output.name = serverOutput.name;
      output.images = output.images.concat(serverOutput.images);
      startKey = serverOutput.lastEvaluatedKey;
    } while (startKey);

    return output;
  }

  async reloadDocumentImages() {
    const documentImageList = await this.getDocumentImages();
    this.setState({
      documentImages: documentImageList.images,
      documentSetName: documentImageList.name,
    });
  }

  async componentDidMount() {
    try {
      // lets load the details
      const documentImageList = await this.getDocumentImages();
      this.setState({
        documentImages: documentImageList.images,
        documentSetName: documentImageList.name,
      });
    } catch (e) {
      alert(e);
    }
    this.setState({
      isLoading: false,
    });
  }

  setVisiblePhase(p) {
    this.setState({
      visiblePhase: p,
    });
  }

  showImageUploader() {
    this.setState({
      imageUploaderVisible: true,
    });
  }

  closeImageUploader() {
    this.setState({
      imageUploaderVisible: false,
    });
    this.reloadDocumentImages();
  }

  stop() {
    this.running = false;
    this.setState({
      running: false,
    });
  }

  reset() {
    this.setState({
      progress: {
        phase1: 0,
      },
    });
    var array = [...this.state.documentImages]; // make a separate copy of the array
    for (var i = 0; i < array.length; i++) {
      var item = array[i];
      delete item.phase1;
      delete item.phase2;
    }
    this.setState({
      documentImages: array,
    });
  }

  setItemProperty(index, property, value) {
    var array = [...this.state.documentImages]; // make a separate copy of the array
    array[index][property] = value;
    this.setState({
      documentImages: array,
    });
  }

  setSelectedImageAttribute(property, value) {
    var index = this.state.documentImages.indexOf(this.state.selectedImage);
    this.setItemProperty(index, property, value);
  }

  async runPhase1(array) {
    // phase 1

    for (let i = 0; i < array.length; i++) {
      if (!this.running) return; // someone hit stop
      const item = array[i];
      const file =
        "https://s3.amazonaws.com/music-ocr-images/public/" +
        item.rawImages.medium;

      if (!item.phase1) {
        const orientation = await calculateOrientation(file);
        item.phase1 = {
          orientation: orientation.bestAngle,
        };
        this.setState({
          documentImages: array,
        });
        await updateRows([item]);
      }
      const prog = Math.round(((i + 1) * 100) / array.length);
      await this.setState({
        progress: {
          phase1: prog,
        },
      });
    }
  }

  async runPhase2(array) {
    // phase 2
    for (let i = 0; i < array.length; i++) {
      if (!this.running) return; // someone hit stop
      const item = array[i];
      const file =
        "https://s3.amazonaws.com/music-ocr-images/public/" +
        item.rawImages.medium;

      const orientation = item.phase1.orientation;

      if (!item.phase2) {
        const boundaries = await calculatePhase2(file, orientation);
        item.phase2 = {
          pageBoundaries: boundaries.pageBoundaries,
        };
        this.setState({
          documentImages: array,
        });
        await updateRows([item]);
      }
      const prog = Math.round(((i + 1) * 100) / array.length);
      await this.setState({
        progress: {
          phase1: 100,
          phase2: prog,
        },
      });
    }
  }

  async runPhase3(array) {
    // phase 2
    for (let i = 0; i < array.length; i++) {
      if (!this.running) return; // someone hit stop
      const item = array[i];

      const file =
        "https://s3.amazonaws.com/music-ocr-images/public/" +
        item.rawImages.medium;

      if (!item.phase3) {
        const phase3Output = await calculatePhase3(item);
        item.phase3 = phase3Output;
        delete item.phase4;
        this.setState({
          documentImages: array,
        });
        await updateRows([item]);
      }
      const prog = Math.round(((i + 1) * 100) / array.length);
      await this.setState({
        progress: {
          phase1: 100,
          phase2: 100,
          phase3: prog,
        },
      });
    }
  }

  async runPhase4(array) {
    // phase 2
    for (let i = 0; i < array.length; i++) {
      if (!this.running) return; // someone hit stop
      const item = array[i];

      if (!item.phase4) {
        const phase4Output = await calculatePhase4(item);
        item.phase4 = phase4Output;
        this.setState({
          documentImages: array,
        });
        await updateRows([item]);
      }
      const prog = Math.round(((i + 1) * 100) / array.length);
      await this.setState({
        progress: {
          phase1: 100,
          phase2: 100,
          phase3: 100,
          phase4: prog,
        },
      });
    }
  }

  async runPhase5(array) {
    for (let i = 0; i < array.length; i++) {
      if (!this.running) return; // someone hit stop
      const item = array[i];

      //if (!item.phase4) {
      const phase5Output = await calculatePhase5(item);
      item.phase5 = phase5Output;

      this.setState({
        documentImages: array,
      });
      await updateRows([item]);
      //}
      const prog = Math.round(((i + 1) * 100) / array.length);
      await this.setState({
        progress: {
          phase1: 100,
          phase2: 100,
          phase3: 100,
          phase4: 100,
          phase5: prog,
        },
      });
    }
  }

  async run() {
    var array = [...this.state.documentImages]; // make a separate copy of the array
    this.running = true;
    this.setState({
      running: true,
    });

    await this.runPhase1(array);
    await this.runPhase2(array);
    await this.runPhase3(array);
    await this.runPhase4(array);
    await this.runPhase5(array);

    this.running = false;
    this.stop();
  }

  updateSelectedImage(newData) {
    var index = this.state.documentImages.indexOf(this.state.selectedImage);
    if (index >= 0) {
      this.setState({
        selectedImage: newData,
      });
    }

    var array = [...this.state.documentImages]; // make a separate copy of the array
    array[index] = newData;
    this.setState({
      documentImages: array,
    });

    updateRows([newData]);
  }

  render() {
    const documentImages = this.state.documentImages;
    const isLoading = this.state.isLoading;

    const runObject = {
      progress: this.state.progress,
      run: this.run,
      running: this.running,
      reset: this.reset,
      stop: this.stop,
    };

    return (
      <div>
        {isLoading && <p>loading...</p>}
        {!isLoading && (
          <div className="DocumentSet">
            <LinkContainer to={`/`}>
              <div className="btn-secondary">
                <a>
                  <FontAwesomeIcon icon="arrow-left" /> Back to Document Sets
                </a>
              </div>
            </LinkContainer>
            <Row>
              <Col xs="4" className="bg-light">
                <div className="leftColumn">
                  <DocumentScanList
                    imageList={documentImages}
                    showImageUploader={this.showImageUploader}
                    selectedImage={this.state.selectedImage}
                    selectImage={this.selectImage}
                    deleteImage={this.deleteImage}
                  />
                </div>
              </Col>
              <Col xs="8">
                <div>
                  <Nav pills id="myTab" role="tablist">
                    <Nav.Item>
                      <Nav.Link
                        className={classnames({
                          active: this.state.visiblePhase === "1",
                        })}
                        href="#"
                        onClick={() => {
                          this.setVisiblePhase("1");
                        }}
                      >
                        Phase 1
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={classnames({
                          active: this.state.visiblePhase === "2",
                        })}
                        href="#"
                        onClick={() => {
                          this.setVisiblePhase("2");
                        }}
                      >
                        Phase 2
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={classnames({
                          active: this.state.visiblePhase === "3",
                        })}
                        href="#"
                        onClick={() => {
                          this.setVisiblePhase("3");
                        }}
                      >
                        Phase 3
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={classnames({
                          active: this.state.visiblePhase === "4",
                        })}
                        href="#"
                        onClick={() => {
                          this.setVisiblePhase("4");
                        }}
                      >
                        Phase 4
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={classnames({
                          active: this.state.visiblePhase === "5",
                        })}
                        href="#"
                        onClick={() => {
                          this.setVisiblePhase("5");
                        }}
                      >
                        Phase 5
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={classnames({
                          active: this.state.visiblePhase === "run",
                        })}
                        href="#"
                        onClick={() => {
                          this.setVisiblePhase("run");
                        }}
                      >
                        Run
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link
                        className={classnames({
                          active: this.state.visiblePhase === "train",
                        })}
                        href="#"
                        onClick={() => {
                          this.setVisiblePhase("train");
                        }}
                      >
                        Train Network
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </div>

                <TabContent activeTab={this.state.visiblePhase}>
                  <TabPane tabId="1">
                    {this.state.visiblePhase === "1" && (
                      <Phase1
                        image={this.state.selectedImage}
                        setAttribute={this.setSelectedImageAttribute}
                      />
                    )}
                  </TabPane>
                  <TabPane tabId="2">
                    {this.state.visiblePhase === "2" && (
                      <Phase2
                        selectedImage={this.state.selectedImage}
                        saveSelectedImage={(img) =>
                          this.updateSelectedImage(img)
                        }
                      />
                    )}
                  </TabPane>
                  <TabPane tabId="3">
                    {this.state.visiblePhase === "3" && (
                      <Phase3
                        imageData={this.state.selectedImage}
                        saveSelectedImage={(img) =>
                          this.updateSelectedImage(img)
                        }
                      />
                    )}
                  </TabPane>
                  <TabPane tabId="4">
                    {this.state.visiblePhase === "4" && (
                      <Phase4
                        imageData={this.state.selectedImage}
                        saveSelectedImage={(img) =>
                          this.updateSelectedImage(img)
                        }
                      />
                    )}
                  </TabPane>
                  <TabPane tabId="5">
                    {this.state.visiblePhase === "5" && (
                      <Phase5
                        imageData={this.state.selectedImage}
                        saveSelectedImage={(img) =>
                          this.updateSelectedImage(img)
                        }
                      />
                    )}
                  </TabPane>
                  <TabPane tabId="run">
                    <RunProject runObject={runObject} />
                  </TabPane>
                  <TabPane tabId="train">
                    <TrainNetwork />
                  </TabPane>
                </TabContent>
              </Col>
            </Row>
            <ImageUploader
              isVisible={this.state.imageUploaderVisible}
              closeImageUploader={this.closeImageUploader}
              documentSet={this.state.entityId}
            />
          </div>
        )}
      </div>
    );
  }
}
