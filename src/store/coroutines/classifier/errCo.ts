import { classifierSlice } from "store/slices";
import { productionStore } from "store/stores/productionStore";

export const errCo = () => {
  console.log("in coroutine");
  console.log(productionStore);
  productionStore.dispatch(
    classifierSlice.actions.doLog({ message: "dispatching from errCo" })
  );
};
