import React from "react";
import { Button } from "react-bootstrap";
import "./DocumentScanList.css";
import classnames from "classnames";
import config from "../config";

var Thumbnail = ({ data, isSelected, select, deleteItem }) => (
  <div
    onClick={select}
    className={classnames({
      Thumbnail: true,
      ImageListItem: !isSelected,
      SelectedImageListItem: isSelected
    })}
  >
    <img src={config.s3.IMAGEURL + data.rawImages.small} />
    <div>{data.name}</div>
    <div class="DeleteImage" onClick={e => deleteItem(e, data)}>
      X
    </div>
  </div>
);

class DocumentScanList extends React.Component {
  render() {
    const imageList = this.props.imageList;
    const showImageUploader = this.props.showImageUploader;
    const selectImage = this.props.selectImage;
    const selectedImage = this.props.selectedImage;
    const deleteItem = this.props.deleteImage;

    return (
      <div className="DocumentScanList">
        <h3>Document Scans</h3>
        {imageList.length === 0 && (
          <p>
            You currently have no images in this list, please click on the below
            button to upload scans.
          </p>
        )}
        <div className="ScanItems">
          {imageList.map(item => (
            <Thumbnail
              key={item.type}
              data={item}
              isSelected={item.type === selectedImage.type}
              select={() => selectImage(item)}
              deleteItem={deleteItem}
            />
          ))}
        </div>
        <p>
          <Button color="primary" onClick={e => showImageUploader(e)}>
            + Upload Images
          </Button>
        </p>
      </div>
    );
  }
}

export default DocumentScanList;
