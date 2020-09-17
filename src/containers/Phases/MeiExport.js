import React from "react";
import "./Phase3.css";
import { Button, Table } from "react-bootstrap";

import MeiTaggerAndExporter from "../../components/MeiTaggerAndExporter";

import { Tabs, Tab } from "react-bootstrap";
import { connect } from "react-redux";
import { tagVoice, tagBookend } from "../../store/actions/documentSetActions";
import DocumentImageLoader from "../DocumentImageLoader";
import MeiDocumentRenderer from "../../libs/meiDocumentRenderer";
import { s3UploadText } from "../../libs/awsLib";
import validFilename from "valid-filename";
import config from "../../config";

class MeiExport extends React.Component {
  constructor(props) {
    super(props);
    this.redraw = this.redraw.bind(this);
    this.state = {
      selectedPage: 0,
    };
    this.exportFromCurrentPage = this.exportFromCurrentPage.bind(this);
  }

  redraw() {
    this.forceUpdate();
  }

  selectPage(key) {
    let page = parseInt(key.key);
    this.setState({
      selectedPage: page,
    });
  }

  updateGUI() {
    this.forceUpdate();
  }

  renderPointOfInterestSelector(pageStaffLocations, staffs) {
    return (
      <DocumentImageLoader
        imageUrl={pageStaffLocations[this.state.selectedPage].url}
      >
        <MeiTaggerAndExporter
          staffLocations={
            pageStaffLocations[this.state.selectedPage].staffLocations
          }
          pageNumber={this.state.selectedPage}
          staffs={staffs}
          orientation={pageStaffLocations[this.state.selectedPage].orientation}
          updateDocumentStaff={this.props.updateDocumentStaff}
          tagVoice={this.props.tagVoice}
          tagBookend={this.props.tagBookend}
          selectedImageId={this.props.selectedImageId}
          updateParentGui={() => this.updateGUI()}
        />
      </DocumentImageLoader>
    );
  }

  printPageInfo() {
    let image = this.props.imageData;
    let pageStaffLocations = JSON.parse(image.pageStaffLocations);
    for (let page = 0; page < pageStaffLocations.length; page++) {
      let pageData = pageStaffLocations[page];
      let url = pageData.url;
      let orientation = pageData.orientation;
      let staffLocations = pageData.staffLocations;
      let info = {
        imageUrl: url,
        staffLocations: staffLocations,
        orientation: orientation,
      };
    }
  }

  async exportFromCurrentPage(documentId) {
    let documentInfo = await MeiDocumentRenderer.processDocument(
      this.props.selectedImageId,
      this.state.selectedPage,
      this.props.documentItems,
      documentId
    );
    if (documentInfo.error) {
      alert(documentInfo.error);
    } else {
      // step 2 ... upload the txt file to s3
      let filename = documentInfo.documentId;
      documentInfo.xml = documentInfo.xml.replace(
        "Example Render",
        "document id: " + filename
      );

      await s3UploadText(documentInfo.xml, filename + ".mei");
      let src = config.path.meiViewer + "?score=" + filename;
      //alert("opening page: " + src);
      window.open(src);
    }
  }

  changeDocumentName(index, pos, oldId) {
    var newName = prompt("Please enter the new filename", oldId);

    if (newName == null || newName === "") {
    } else {
      // is it valid?
      if (!validFilename(newName)) {
        alert("please enter a valid filename!");
        return;
      }

      // change it!
      let image = this.props.imageData;
      let pageNumber = this.state.selectedPage;

      let pageId = pageNumber + "_" + index;
      let staff = image.staffs[pageId];
      let bookend = staff.bookend;
      let bookends = JSON.parse(bookend);
      bookends[pos].id = newName;

      bookend = JSON.stringify(bookends);
      staff.bookend = bookend;
      this.props.tagBookend(staff.id, bookend);
      this.forceUpdate();
    }
  }

  renderDocumentList() {
    let image = this.props.imageData;
    let pageNumber = this.state.selectedPage;
    if (!image.pageStaffLocations[pageNumber]) return;
    const regions = image.pageStaffLocations[pageNumber].staffLocations;
    let items = [];

    for (var i = 0; i < regions.length; i++) {
      let pageId = pageNumber + "_" + i;
      let bookend = image.staffs[pageId].bookend;
      if (bookend) {
        try {
          let bookends = JSON.parse(bookend);
          for (let pos in bookends) {
            let bookendInfo = bookends[pos];
            if (bookendInfo.type === "start") {
              let documentId = bookendInfo.id;
              items.push({ id: documentId, index: i, pos: pos });
            }
          }
        } catch (e) {}
      }
    }

    if (items.length === 0) return <div></div>;
    function compare(a, b) {
      if (a.index > b.index) return 1;
      if (b.index > a.index) return -1;

      if (a.pos > b.pos) return 1;
      if (b.pos > a.pos) return -1;

      return 0;
    }

    // lets sort in terms of index and position
    items.sort(compare);

    return (
      <div>
        <Table striped bordered>
          <thead>
            <tr>
              <th>Document Name</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((data) => (
              <tr>
                <td>{data.id}.mei</td>
                <td>
                  <Button
                    variant="primary"
                    onClick={() =>
                      this.changeDocumentName(data.index, data.pos, data.id)
                    }
                  >
                    Edit Name
                  </Button>
                </td>
                <td>
                  <Button
                    variant="success"
                    onClick={() => this.exportFromCurrentPage(data.id)}
                  >
                    Export Document
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <hr></hr>
      </div>
    );
  }

  renderInstructions() {
    return (
      <div className="instructions">
        <h1>Instructions</h1>
        <p>
          Use the below tools for tagging the voice (1-10) of each staff, and
          marking the start or the end of each piece. You will then be able to
          export to MEI.
        </p>
      </div>
    );
  }

  render() {
    let image = this.props.imageData;
    let pageStaffLocations = [];

    let state = "";
    let staffs = null;

    if (image) {
      if (image.lastPhaseRun < 4) {
        state = "not run";
      } else {
        state = "ok";
        pageStaffLocations = image.pageStaffLocations;
        staffs = image.staffs;
        if (!staffs) state = "image loading";
      }
    } else {
      image = null;
      state = "not selected";
    }

    return (
      <div className="Phase4">
        <h2>MEI EXPORT</h2>

        {state === "not selected" && (
          <div>Please select an image from the left panel.</div>
        )}
        {state === "not run" && (
          <div>Please click on "run" to calculate the image orientation.</div>
        )}
        {state === "image loading" && <div>loading image</div>}
        {(state === "ok" || state === "image loading") && (
          <div>
            {this.renderInstructions()}
            {this.renderDocumentList()}
            <Tabs
              variant="pills"
              defaultActiveKey="0"
              id="pageSelectorPhase3"
              onSelect={(key) => this.selectPage({ key })}
            >
              {pageStaffLocations.map((page, index) => (
                <Tab
                  key={index}
                  eventKey={"" + index}
                  title={"page " + (index + 1)}
                >
                  {this.state.selectedPage === index && (
                    <div>
                      {state === "ok" &&
                        this.renderPointOfInterestSelector(
                          pageStaffLocations,
                          staffs
                        )}
                    </div>
                  )}
                </Tab>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  selectedImageId: state.documentSet.currentImageId,
  imageData: state.documentSet.currentImageData,
  documentItems: state.documentSet.documentItems,
});

export default connect(mapStateToProps, { tagVoice, tagBookend })(MeiExport);
