//import * as Comlink from "comlink";
importScripts("https://unpkg.com/comlink/dist/umd/comlink.js");

const obj = {
  counter: 0,
  inc() {
    this.counter++;
    console.log(this.counter);
  },
};
//Comlink.expose(obj);

onconnect = function (event) {
  const port = event.ports[0];
  console.log("port is" + port);
  debugger;
  Comlink.expose(obj, port);
};
