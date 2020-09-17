import React from "react";
import filename from "./hello.mei";
import axios from "axios";
//import verovio from "./verovio-toolkit.js";

//var tk = new verovio.toolkit();
//let zoom = 30;
//let divWidth = 700;

//tk.setOptions({
//  pageWidth: (divWidth * 100) / zoom,
//  adjustPageHeight: true,
//  scale: zoom
//});

class MEIEditor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      //data: "<p>loading...</p>"
      data:""
    };
  }

  componentDidMount() {
    //import("./verovio-toolkit.js").then(verovio => {
    //  alert("verovio is loaded");
    //});
    //axios.get(filename).then(response => {
    // this.setState({ data: tk.renderData(response.data, {}) });
    //});
  }

  renderContent() {
    return <div dangerouslySetInnerHTML={{ __html: this.state.data }} />;
  }

  render = () => {
    return this.renderContent();
  };
}

export default MEIEditor;
