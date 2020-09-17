import { graphqlOperation, API } from "aws-amplify";
import * as mutations from "../graphql/mutations";

import { UPDATE_IMAGE_DATA } from "./actions/types";

async function uploadStaffs(staffs) {
  for (var id in staffs) {
    let staff = JSON.parse(JSON.stringify(staffs[id]));
    staff.pointsOfInterest = JSON.stringify(staff.pointsOfInterest);
    staff.guides = JSON.stringify(staff.guides);
    staff.symbols = JSON.stringify(staff.symbols);
    try {
      await API.graphql(
        graphqlOperation(mutations.createDocumentStaff, {
          input: staff
        })
      );
    } catch (e) {
      alert(
        "error in upload staff " +
          JSON.stringify(e) +
          " - Something went wrong... perhaps refresh the page and try again"
      );
    }
  }
}

export async function updateImageData(dispatch, uploadData) {
  dispatch({
    type: UPDATE_IMAGE_DATA,
    payload: uploadData
  });

  // upload individual staffs if they exist
  if (uploadData.staffs) {
    await uploadStaffs(uploadData.staffs);
  }

  delete uploadData.staffs;
  uploadData = JSON.parse(JSON.stringify(uploadData));
  if (uploadData.pageBoundaries)
    uploadData.pageBoundaries = JSON.stringify(uploadData.pageBoundaries);
  if (uploadData.pageStaffLocations)
    uploadData.pageStaffLocations = JSON.stringify(
      uploadData.pageStaffLocations
    );

  try {
    await API.graphql(
      graphqlOperation(mutations.updateDocumentImage, {
        input: uploadData
      })
    );
  } catch (e) {
    alert(
      "error in updateImage " +
        JSON.stringify(e) +
        " - Something went wrong... perhaps refresh the page and try again"
    );
  }
}
