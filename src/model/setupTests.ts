import { configure, EnzymeAdapter } from "enzyme";
import Adapter from "enzyme-adapter-react-16";
import "jest-enzyme";

type Options = {
  adapter: EnzymeAdapter;
};

const options: Options = {
  adapter: new Adapter(),
};

configure(options);
