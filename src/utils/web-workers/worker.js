//import * as Comlink from "comlink";
importScripts("https://unpkg.com/comlink/dist/umd/comlink.js");

const imageStore = new Map();

const obj = {
  counter: 0,
  inc() {
    this.counter++;
    console.log("inside worker" + this.counter);
  },

  storeImage(images) {
    images.forEach(({ id, data }) => {
      imageStore.set(id, data);
      console.log("data is" + id);
    });

    console.log("size" + imageStore.size);
  },

  getImage(id) {
    return imageStore.get(id) || null;
  },
};
//Comlink.expose(obj);

onconnect = function (event) {
  const port = event.ports[0];
  console.log("port is" + port);
  Comlink.expose(obj, port);
};
