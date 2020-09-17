class NeuralNetworkWorker {
  init() {
    postMessage({
      type: "loadingStatus",
      value: "loading"
    });
    postMessage({
      type: "loadingStatus",
      value: "loaded"
    });
  }
}

let network = new NeuralNetworkWorker();
network.init();
