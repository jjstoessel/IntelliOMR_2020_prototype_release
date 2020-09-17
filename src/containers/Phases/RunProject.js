import React from "react";
import { Button, ProgressBar, Container } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
//import RunPhasesModel from "../../libs/RunPhasesModel";
import "./RunProject.css";
import { connect } from "react-redux";
//import { fetchThumbnails } from "../../store/actions/thumbnailActions";
import { runPhases, stopRunning } from "../../store/actions/documentSetActions";
import {
  RUNNING_STATE_RUNNING,
  LOADING_STATE_LOADED,
} from "../../store/actions/types";

class RunProject extends React.Component {
  onDone() {
    this.props.fetchThumbnails(this.props.documentSetId);
  }

  run() {
    this.props.runPhases();
  }

  stop() {
    this.props.stopRunning();
  }

  renderInstructions() {
    return (
      <div className="instructions">
        <h1>Instructions</h1>
        <p>To run IntelliOMR:</p>
        <ol>
          <li>Upload the document scans using the panel to the left.</li>
          <li>Click on RUN below to run the automatic processing phases.</li>
          <li>
            Check Phase 2 to see if all the individual pages have been
            identified correctly.
          </li>
          <li>
            Check Phase 3 to see if all the individual staffs have been
            identifed correctly.
          </li>
          <li>
            Go to Phase 4 to automatically identify individual music symbols ..
            and correct any innaccuracies.
          </li>
          <li>Use "MEI export" to export the final results to MEI.</li>
        </ol>
        <p>
          Please note: if you make an adjustment at a specific phase, the
          following phases will need to be rerun.
        </p>
      </div>
    );
  }

  renderProgress() {
    let isRunning = this.props.runningState === RUNNING_STATE_RUNNING;
    //let progress = RunPhasesModel._getProgress();
    let progress = this.props.progress;

    return (
      <div className="RunProject">
        {this.renderInstructions()}
        <Container>
          <h2>Phase 1</h2>

          <ProgressBar
            striped
            now={progress.phase1}
            label={`${progress.phase1}%`}
          />
          <br />

          <h2>Phase 2</h2>

          <ProgressBar
            striped
            now={progress.phase2}
            label={`${progress.phase2}%`}
          />
          <br />

          <h2>Phase 3</h2>

          <ProgressBar
            striped
            now={progress.phase3}
            label={`${progress.phase3}%`}
          />
          <br />

          <h2>Phase 4</h2>

          <ProgressBar
            striped
            now={progress.phase4}
            label={`${progress.phase4}%`}
          />
          <br />

          {!isRunning && (
            <div className="text-left bg-secondary topMargin">
              <Button
                className="btn-block"
                onClick={() => this.run()}
                variant="success"
              >
                Run
              </Button>
            </div>
          )}
          {isRunning && (
            <div>
              <Button
                className="btn-block"
                variant="danger"
                onClick={() => this.stop()}
              >
                Stop
              </Button>
              <FontAwesomeIcon icon="spinner" className="fa-spin" /> running{" "}
            </div>
          )}
        </Container>
      </div>
    );
  }

  render() {
    let isLoaded = this.props.loadingState === LOADING_STATE_LOADED;
    return <div>{isLoaded && this.renderProgress()}</div>;
  }
}

const mapStateToProps = (state) => ({
  progress: state.documentSet.progress,
  loadingState: state.documentSet.loadingState,
  runningState: state.documentSet.runningState,
});

export default connect(mapStateToProps, { runPhases, stopRunning })(RunProject);
