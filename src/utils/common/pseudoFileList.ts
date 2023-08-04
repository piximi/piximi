export class PseudoFileList {
  private _files: File[];

  constructor(files: File[]) {
    let self = this;
    this._files = files;

    return new Proxy(this, {
      get(target, prop) {
        if (!isNaN(Number(prop)) && !(prop in target)) {
          return self._files[Number(prop)];
        } else {
          return Reflect.get(target, prop);
        }
      },
    }) satisfies FileList;
  }

  public item(elem: number) {
    return this._files[elem];
  }

  public get length() {
    return this._files.length;
  }

  [key: number]: File;

  [Symbol.iterator](): IterableIterator<File> {
    return this._files[Symbol.iterator]();
  }
}
